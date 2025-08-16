/**
 * 错误处理管理器
 * 负责处理网络错误、游戏加载错误等各种异常情况
 */

import { ERROR_MESSAGES, RETRY_CONFIG } from '../utils/constants.js';
import { showNotification, storage } from '../utils/helpers.js';

class ErrorHandler {
    constructor() {
        this.retryAttempts = new Map(); // 记录重试次数
        this.errorLog = []; // 错误日志
        this.isOnline = navigator.onLine; // 网络状态
        this.offlineQueue = []; // 离线时的请求队列
        
        this._setupNetworkMonitoring();
    }

    /**
     * 设置网络状态监控
     * @private
     */
    _setupNetworkMonitoring() {
        // 监听网络状态变化
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('网络已连接');
            this._showNetworkStatus('网络已恢复连接', 'success');
            this._processOfflineQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('网络已断开');
            this._showNetworkStatus('网络连接已断开，部分功能可能无法使用', 'warning');
        });
    }

    /**
     * 显示网络状态提示
     * @private
     * @param {string} message - 提示消息
     * @param {string} type - 消息类型
     */
    _showNetworkStatus(message, type) {
        showNotification(message, type, { duration: 3000 });
    }

    /**
     * 处理网络请求错误
     * @param {Error} error - 错误对象
     * @param {string} url - 请求URL
     * @param {Object} options - 选项
     * @returns {Promise} 处理结果
     */
    async handleNetworkError(error, url, options = {}) {
        const errorInfo = {
            type: 'network',
            error: error.message,
            url,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };

        this._logError(errorInfo);

        // 检查网络状态
        if (!this.isOnline) {
            return this._handleOfflineError(url, options);
        }

        // 检查是否是超时错误
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
            return this._handleTimeoutError(url, options);
        }

        // 检查HTTP状态码错误
        if (error.message.includes('HTTP error')) {
            return this._handleHttpError(error, url, options);
        }

        // 通用网络错误处理
        return this._handleGenericNetworkError(error, url, options);
    }

    /**
     * 处理离线错误
     * @private
     * @param {string} url - 请求URL
     * @param {Object} options - 选项
     * @returns {Promise} 处理结果
     */
    async _handleOfflineError(url, options) {
        console.log('离线状态，将请求加入队列:', url);

        // 将请求加入离线队列
        this.offlineQueue.push({ url, options, timestamp: Date.now() });

        // 尝试从缓存获取数据
        const cachedData = this._getCachedData(url);
        if (cachedData) {
            showNotification('正在使用缓存数据', 'info');
            return cachedData;
        }

        // 显示离线提示
        this._showOfflineDialog();
        throw new Error(ERROR_MESSAGES.OFFLINE_ERROR);
    }

    /**
     * 处理超时错误
     * @private
     * @param {string} url - 请求URL
     * @param {Object} options - 选项
     * @returns {Promise} 处理结果
     */
    async _handleTimeoutError(url, options) {
        console.log('请求超时:', url);

        const retryKey = `timeout_${url}`;
        const attempts = this.retryAttempts.get(retryKey) || 0;

        if (attempts < RETRY_CONFIG.MAX_RETRIES) {
            this.retryAttempts.set(retryKey, attempts + 1);
            
            showNotification(`请求超时，正在重试 (${attempts + 1}/${RETRY_CONFIG.MAX_RETRIES})`, 'warning');
            
            // 延迟后重试
            await this._delay(RETRY_CONFIG.RETRY_DELAY * (attempts + 1));
            return this._retryRequest(url, options);
        }

        // 超过最大重试次数
        this.retryAttempts.delete(retryKey);
        this._showTimeoutDialog(url);
        throw new Error(ERROR_MESSAGES.TIMEOUT_ERROR);
    }

    /**
     * 处理HTTP错误
     * @private
     * @param {Error} error - 错误对象
     * @param {string} url - 请求URL
     * @param {Object} options - 选项
     * @returns {Promise} 处理结果
     */
    async _handleHttpError(error, url, options) {
        const statusMatch = error.message.match(/status: (\d+)/);
        const status = statusMatch ? parseInt(statusMatch[1]) : 0;

        console.log(`HTTP错误 ${status}:`, url);

        switch (status) {
            case 404:
                this._showNotFoundDialog(url);
                throw new Error(ERROR_MESSAGES.NOT_FOUND_ERROR);
            
            case 500:
            case 502:
            case 503:
            case 504:
                return this._handleServerError(url, options, status);
            
            default:
                this._showGenericErrorDialog(error.message);
                throw new Error(ERROR_MESSAGES.SERVER_ERROR);
        }
    }

    /**
     * 处理服务器错误
     * @private
     * @param {string} url - 请求URL
     * @param {Object} options - 选项
     * @param {number} status - HTTP状态码
     * @returns {Promise} 处理结果
     */
    async _handleServerError(url, options, status) {
        const retryKey = `server_${url}`;
        const attempts = this.retryAttempts.get(retryKey) || 0;

        if (attempts < RETRY_CONFIG.MAX_RETRIES) {
            this.retryAttempts.set(retryKey, attempts + 1);
            
            showNotification(`服务器错误 ${status}，正在重试 (${attempts + 1}/${RETRY_CONFIG.MAX_RETRIES})`, 'warning');
            
            // 指数退避重试
            const delay = RETRY_CONFIG.RETRY_DELAY * Math.pow(2, attempts);
            await this._delay(delay);
            return this._retryRequest(url, options);
        }

        // 超过最大重试次数
        this.retryAttempts.delete(retryKey);
        this._showServerErrorDialog(status);
        throw new Error(ERROR_MESSAGES.SERVER_ERROR);
    }

    /**
     * 处理通用网络错误
     * @private
     * @param {Error} error - 错误对象
     * @param {string} url - 请求URL
     * @param {Object} options - 选项
     * @returns {Promise} 处理结果
     */
    async _handleGenericNetworkError(error, url, options) {
        console.log('通用网络错误:', error.message);

        // 尝试从缓存获取数据
        const cachedData = this._getCachedData(url);
        if (cachedData) {
            showNotification('网络异常，正在使用缓存数据', 'warning');
            return cachedData;
        }

        // 显示错误对话框
        this._showNetworkErrorDialog(error.message, url, options);
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }

    /**
     * 重试请求
     * @private
     * @param {string} url - 请求URL
     * @param {Object} options - 选项
     * @returns {Promise} 请求结果
     */
    async _retryRequest(url, options) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), RETRY_CONFIG.TIMEOUT);

            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    /**
     * 处理离线队列
     * @private
     */
    async _processOfflineQueue() {
        if (this.offlineQueue.length === 0) return;

        console.log(`处理离线队列，共 ${this.offlineQueue.length} 个请求`);

        const queue = [...this.offlineQueue];
        this.offlineQueue = [];

        for (const item of queue) {
            try {
                await this._retryRequest(item.url, item.options);
                console.log('离线请求重试成功:', item.url);
            } catch (error) {
                console.log('离线请求重试失败:', item.url, error.message);
                // 如果重试失败，重新加入队列（但有时间限制）
                if (Date.now() - item.timestamp < 300000) { // 5分钟内的请求
                    this.offlineQueue.push(item);
                }
            }
        }
    }

    /**
     * 获取缓存数据
     * @private
     * @param {string} url - 请求URL
     * @returns {Object|null} 缓存数据
     */
    _getCachedData(url) {
        try {
            const cacheKey = `cache_${url}`;
            const cached = storage.get(cacheKey);
            
            if (cached && cached.timestamp) {
                const age = Date.now() - cached.timestamp;
                // 缓存有效期24小时
                if (age < 24 * 60 * 60 * 1000) {
                    return cached.data;
                }
            }
        } catch (error) {
            console.log('获取缓存数据失败:', error);
        }
        
        return null;
    }

    /**
     * 缓存数据
     * @param {string} url - 请求URL
     * @param {Object} data - 数据
     */
    cacheData(url, data) {
        try {
            const cacheKey = `cache_${url}`;
            storage.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
        } catch (error) {
            console.log('缓存数据失败:', error);
        }
    }

    /**
     * 显示离线对话框
     * @private
     */
    _showOfflineDialog() {
        this._showErrorDialog({
            title: '网络连接异常',
            message: '当前网络不可用，请检查您的网络连接后重试。',
            type: 'warning',
            actions: [
                {
                    text: '重试',
                    action: () => window.location.reload()
                },
                {
                    text: '稍后再试',
                    action: () => {}
                }
            ]
        });
    }

    /**
     * 显示超时对话框
     * @private
     * @param {string} url - 请求URL
     */
    _showTimeoutDialog(url) {
        this._showErrorDialog({
            title: '请求超时',
            message: '网络响应缓慢，请求已超时。请检查网络连接或稍后重试。',
            type: 'warning',
            actions: [
                {
                    text: '重试',
                    action: () => window.location.reload()
                },
                {
                    text: '取消',
                    action: () => {}
                }
            ]
        });
    }

    /**
     * 显示404错误对话框
     * @private
     * @param {string} url - 请求URL
     */
    _showNotFoundDialog(url) {
        this._showErrorDialog({
            title: '资源未找到',
            message: '请求的资源不存在，可能已被移动或删除。',
            type: 'error',
            actions: [
                {
                    text: '返回首页',
                    action: () => window.location.href = 'index.html'
                },
                {
                    text: '刷新页面',
                    action: () => window.location.reload()
                }
            ]
        });
    }

    /**
     * 显示服务器错误对话框
     * @private
     * @param {number} status - HTTP状态码
     */
    _showServerErrorDialog(status) {
        this._showErrorDialog({
            title: '服务器错误',
            message: `服务器暂时无法处理请求 (错误代码: ${status})。请稍后重试。`,
            type: 'error',
            actions: [
                {
                    text: '重试',
                    action: () => window.location.reload()
                },
                {
                    text: '稍后再试',
                    action: () => {}
                }
            ]
        });
    }

    /**
     * 显示网络错误对话框
     * @private
     * @param {string} errorMessage - 错误消息
     * @param {string} url - 请求URL
     * @param {Object} options - 选项
     */
    _showNetworkErrorDialog(errorMessage, url, options) {
        this._showErrorDialog({
            title: '网络错误',
            message: '网络连接出现问题，无法加载数据。请检查网络连接后重试。',
            type: 'error',
            actions: [
                {
                    text: '重试',
                    action: () => window.location.reload()
                },
                {
                    text: '使用离线模式',
                    action: () => this._enableOfflineMode()
                }
            ]
        });
    }

    /**
     * 显示通用错误对话框
     * @private
     * @param {string} message - 错误消息
     */
    _showGenericErrorDialog(message) {
        this._showErrorDialog({
            title: '发生错误',
            message: message || '发生未知错误，请稍后重试。',
            type: 'error',
            actions: [
                {
                    text: '重试',
                    action: () => window.location.reload()
                },
                {
                    text: '确定',
                    action: () => {}
                }
            ]
        });
    }

    /**
     * 显示错误对话框
     * @private
     * @param {Object} config - 对话框配置
     */
    _showErrorDialog(config) {
        // 创建错误对话框
        const dialog = document.createElement('div');
        dialog.className = 'error-dialog-overlay';
        dialog.innerHTML = `
            <div class="error-dialog">
                <div class="error-dialog-header ${config.type}">
                    <div class="error-icon">
                        ${this._getErrorIcon(config.type)}
                    </div>
                    <h3 class="error-title">${config.title}</h3>
                </div>
                <div class="error-dialog-body">
                    <p class="error-message">${config.message}</p>
                </div>
                <div class="error-dialog-actions">
                    ${config.actions.map(action => 
                        `<button class="error-btn ${action.primary ? 'primary' : 'secondary'}" 
                                data-action="${config.actions.indexOf(action)}">
                            ${action.text}
                        </button>`
                    ).join('')}
                </div>
            </div>
        `;

        // 添加事件监听器
        dialog.addEventListener('click', (e) => {
            if (e.target.classList.contains('error-dialog-overlay')) {
                document.body.removeChild(dialog);
            }
        });

        dialog.querySelectorAll('.error-btn').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                config.actions[index].action();
                document.body.removeChild(dialog);
            });
        });

        // 显示对话框
        document.body.appendChild(dialog);
        document.body.style.overflow = 'hidden';

        // 自动关闭（可选）
        if (config.autoClose) {
            setTimeout(() => {
                if (document.body.contains(dialog)) {
                    document.body.removeChild(dialog);
                    document.body.style.overflow = '';
                }
            }, config.autoClose);
        }
    }

    /**
     * 获取错误图标
     * @private
     * @param {string} type - 错误类型
     * @returns {string} 图标HTML
     */
    _getErrorIcon(type) {
        const icons = {
            error: '⚠️',
            warning: '⚠️',
            info: 'ℹ️',
            success: '✅'
        };
        return icons[type] || icons.error;
    }

    /**
     * 启用离线模式
     * @private
     */
    _enableOfflineMode() {
        console.log('启用离线模式');
        showNotification('已切换到离线模式，部分功能可能受限', 'info');
        
        // 可以在这里实现离线模式的特殊逻辑
        // 比如隐藏需要网络的功能，显示缓存的内容等
    }

    /**
     * 记录错误
     * @private
     * @param {Object} errorInfo - 错误信息
     */
    _logError(errorInfo) {
        this.errorLog.push(errorInfo);
        
        // 限制错误日志数量
        if (this.errorLog.length > 100) {
            this.errorLog = this.errorLog.slice(-50);
        }

        // 在开发环境下输出详细错误信息
        if (process.env.NODE_ENV === 'development') {
            console.error('错误详情:', errorInfo);
        }
    }

    /**
     * 延迟函数
     * @private
     * @param {number} ms - 延迟毫秒数
     * @returns {Promise} Promise对象
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 获取错误统计
     * @returns {Object} 错误统计信息
     */
    getErrorStats() {
        const stats = {
            total: this.errorLog.length,
            byType: {},
            recent: this.errorLog.slice(-10)
        };

        this.errorLog.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
        });

        return stats;
    }

    /**
     * 清除错误日志
     */
    clearErrorLog() {
        this.errorLog = [];
        this.retryAttempts.clear();
        console.log('错误日志已清除');
    }

    /**
     * 检查网络连接
     * @returns {Promise<boolean>} 网络连接状态
     */
    async checkNetworkConnection() {
        try {
            const response = await fetch('/favicon.ico', {
                method: 'HEAD',
                cache: 'no-cache'
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// 创建单例实例
const errorHandler = new ErrorHandler();

export default errorHandler;