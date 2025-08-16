/**
 * 游戏加载错误处理模块
 * 专门处理游戏iframe加载失败、游戏不可用等情况
 */

import { ERROR_MESSAGES, RETRY_CONFIG } from '../utils/constants.js';
import { showNotification, delay } from '../utils/helpers.js';
import errorHandler from './ErrorHandler.js';

class GameErrorHandler {
    constructor() {
        this.gameLoadAttempts = new Map(); // 记录游戏加载尝试次数
        this.failedGames = new Set(); // 记录加载失败的游戏
        this.gameTimeouts = new Map(); // 记录游戏加载超时定时器
    }

    /**
     * 处理游戏iframe加载错误
     * @param {string} gameUrl - 游戏URL
     * @param {string} gameTitle - 游戏标题
     * @param {HTMLElement} container - 游戏容器元素
     * @returns {Promise} 处理结果
     */
    async handleGameLoadError(gameUrl, gameTitle, container) {
        console.error('游戏加载失败:', gameTitle, gameUrl);

        const gameKey = `${gameUrl}_${gameTitle}`;
        const attempts = this.gameLoadAttempts.get(gameKey) || 0;

        // 记录失败的游戏
        this.failedGames.add(gameKey);

        // 清除可能存在的超时定时器
        this._clearGameTimeout(gameKey);

        if (attempts < RETRY_CONFIG.MAX_RETRIES) {
            // 尝试重新加载
            this.gameLoadAttempts.set(gameKey, attempts + 1);
            return this._retryGameLoad(gameUrl, gameTitle, container, attempts + 1);
        } else {
            // 超过最大重试次数，显示错误界面
            this.gameLoadAttempts.delete(gameKey);
            this._showGameErrorInterface(gameTitle, container, gameUrl);
        }
    }

    /**
     * 处理游戏加载超时
     * @param {string} gameUrl - 游戏URL
     * @param {string} gameTitle - 游戏标题
     * @param {HTMLElement} container - 游戏容器元素
     * @param {number} timeout - 超时时间（毫秒）
     */
    handleGameTimeout(gameUrl, gameTitle, container, timeout = 15000) {
        const gameKey = `${gameUrl}_${gameTitle}`;
        
        // 清除之前的超时定时器
        this._clearGameTimeout(gameKey);

        // 设置新的超时定时器
        const timeoutId = setTimeout(() => {
            console.warn('游戏加载超时:', gameTitle);
            this._showGameTimeoutInterface(gameTitle, container, gameUrl);
        }, timeout);

        this.gameTimeouts.set(gameKey, timeoutId);
    }

    /**
     * 验证游戏URL是否可访问
     * @param {string} gameUrl - 游戏URL
     * @returns {Promise<boolean>} 是否可访问
     */
    async validateGameUrl(gameUrl) {
        try {
            // 检查URL格式
            const url = new URL(gameUrl, window.location.origin);
            
            // 尝试获取资源
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(url.href, {
                method: 'HEAD',
                signal: controller.signal,
                cache: 'no-cache'
            });

            clearTimeout(timeoutId);
            return response.ok;

        } catch (error) {
            console.warn('游戏URL验证失败:', gameUrl, error.message);
            return false;
        }
    }

    /**
     * 创建安全的游戏iframe
     * @param {string} gameUrl - 游戏URL
     * @param {string} gameTitle - 游戏标题
     * @param {HTMLElement} container - 容器元素
     * @returns {HTMLIFrameElement} iframe元素
     */
    createSafeGameIframe(gameUrl, gameTitle, container) {
        const iframe = document.createElement('iframe');
        const gameKey = `${gameUrl}_${gameTitle}`;

        // 设置iframe属性
        iframe.src = gameUrl;
        iframe.title = gameTitle;
        iframe.frameBorder = '0';
        iframe.allowFullscreen = true;
        iframe.loading = 'lazy';
        
        // 安全属性
        iframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups allow-presentation';
        
        // 样式
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '8px';

        // 错误处理
        iframe.onerror = () => {
            this.handleGameLoadError(gameUrl, gameTitle, container);
        };

        // 加载完成处理
        iframe.onload = () => {
            console.log('游戏加载成功:', gameTitle);
            this._clearGameTimeout(gameKey);
            this.gameLoadAttempts.delete(gameKey);
            this.failedGames.delete(gameKey);
            
            // 隐藏加载动画
            this._hideGameLoading(container);
        };

        // 设置加载超时
        this.handleGameTimeout(gameUrl, gameTitle, container);

        return iframe;
    }

    /**
     * 重试游戏加载
     * @private
     * @param {string} gameUrl - 游戏URL
     * @param {string} gameTitle - 游戏标题
     * @param {HTMLElement} container - 容器元素
     * @param {number} attempt - 当前尝试次数
     */
    async _retryGameLoad(gameUrl, gameTitle, container, attempt) {
        console.log(`重试加载游戏 "${gameTitle}" (第${attempt}次)`);

        // 显示重试提示
        this._showRetryMessage(container, gameTitle, attempt);

        // 延迟后重试
        const delay = RETRY_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
        await this._delay(delay);

        // 验证URL是否可访问
        const isValid = await this.validateGameUrl(gameUrl);
        if (!isValid) {
            console.warn('游戏URL无法访问，跳过重试');
            this._showGameErrorInterface(gameTitle, container, gameUrl);
            return;
        }

        // 创建新的iframe
        const iframe = this.createSafeGameIframe(gameUrl, gameTitle, container);
        
        // 清空容器并添加新iframe
        container.innerHTML = '';
        container.appendChild(iframe);
    }

    /**
     * 显示游戏错误界面
     * @private
     * @param {string} gameTitle - 游戏标题
     * @param {HTMLElement} container - 容器元素
     * @param {string} gameUrl - 游戏URL
     */
    _showGameErrorInterface(gameTitle, container, gameUrl) {
        container.innerHTML = `
            <div class="game-error-interface">
                <div class="error-content">
                    <div class="error-icon">⚠️</div>
                    <h3 class="error-title">游戏加载失败</h3>
                    <p class="error-message">
                        很抱歉，游戏 "${gameTitle}" 暂时无法加载。<br>
                        这可能是由于网络问题或游戏文件损坏导致的。
                    </p>
                    <div class="error-actions">
                        <button class="btn btn-primary" onclick="window.location.reload()">
                            <span>🔄</span>
                            <span>刷新页面</span>
                        </button>
                        <button class="btn btn-secondary" onclick="this._tryAlternativeGame('${gameTitle}')">
                            <span>🎮</span>
                            <span>尝试其他游戏</span>
                        </button>
                        <button class="btn btn-ghost" onclick="window.location.href='index.html'">
                            <span>🏠</span>
                            <span>返回首页</span>
                        </button>
                    </div>
                    <div class="error-details">
                        <details>
                            <summary>技术详情</summary>
                            <div class="tech-details">
                                <p><strong>游戏URL:</strong> ${gameUrl}</p>
                                <p><strong>错误时间:</strong> ${new Date().toLocaleString()}</p>
                                <p><strong>浏览器:</strong> ${navigator.userAgent}</p>
                            </div>
                        </details>
                    </div>
                </div>
            </div>
        `;

        // 记录错误
        this._logGameError(gameTitle, gameUrl, 'LOAD_FAILED');
    }

    /**
     * 显示游戏超时界面
     * @private
     * @param {string} gameTitle - 游戏标题
     * @param {HTMLElement} container - 容器元素
     * @param {string} gameUrl - 游戏URL
     */
    _showGameTimeoutInterface(gameTitle, container, gameUrl) {
        container.innerHTML = `
            <div class="game-timeout-interface">
                <div class="timeout-content">
                    <div class="timeout-icon">⏱️</div>
                    <h3 class="timeout-title">游戏加载超时</h3>
                    <p class="timeout-message">
                        游戏 "${gameTitle}" 加载时间过长。<br>
                        这可能是由于网络连接缓慢或游戏文件较大导致的。
                    </p>
                    <div class="timeout-actions">
                        <button class="btn btn-primary" onclick="this._retryGameLoad('${gameUrl}', '${gameTitle}', this.closest('.game-container'))">
                            <span>🔄</span>
                            <span>重新加载</span>
                        </button>
                        <button class="btn btn-secondary" onclick="this._continueWaiting('${gameUrl}', '${gameTitle}', this.closest('.game-container'))">
                            <span>⏳</span>
                            <span>继续等待</span>
                        </button>
                        <button class="btn btn-ghost" onclick="window.location.href='index.html'">
                            <span>🏠</span>
                            <span>返回首页</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // 记录错误
        this._logGameError(gameTitle, gameUrl, 'LOAD_TIMEOUT');
    }

    /**
     * 显示重试消息
     * @private
     * @param {HTMLElement} container - 容器元素
     * @param {string} gameTitle - 游戏标题
     * @param {number} attempt - 尝试次数
     */
    _showRetryMessage(container, gameTitle, attempt) {
        container.innerHTML = `
            <div class="game-retry-interface">
                <div class="retry-content">
                    <div class="retry-spinner"></div>
                    <h3 class="retry-title">正在重试加载游戏</h3>
                    <p class="retry-message">
                        正在尝试重新加载 "${gameTitle}"...<br>
                        第 ${attempt} 次尝试，共 ${RETRY_CONFIG.MAX_RETRIES} 次
                    </p>
                    <div class="retry-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(attempt / RETRY_CONFIG.MAX_RETRIES) * 100}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 隐藏游戏加载动画
     * @private
     * @param {HTMLElement} container - 容器元素
     */
    _hideGameLoading(container) {
        const loadingElements = container.querySelectorAll('.game-loading, .game-retry-interface');
        loadingElements.forEach(element => {
            element.style.opacity = '0';
            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }, 300);
        });
    }

    /**
     * 清除游戏超时定时器
     * @private
     * @param {string} gameKey - 游戏键
     */
    _clearGameTimeout(gameKey) {
        const timeoutId = this.gameTimeouts.get(gameKey);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.gameTimeouts.delete(gameKey);
        }
    }

    /**
     * 记录游戏错误
     * @private
     * @param {string} gameTitle - 游戏标题
     * @param {string} gameUrl - 游戏URL
     * @param {string} errorType - 错误类型
     */
    _logGameError(gameTitle, gameUrl, errorType) {
        const errorInfo = {
            type: 'game_load',
            gameTitle,
            gameUrl,
            errorType,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        console.error('游戏加载错误:', errorInfo);

        // 可以发送到错误收集服务
        this._sendErrorReport(errorInfo);
    }

    /**
     * 发送错误报告
     * @private
     * @param {Object} errorInfo - 错误信息
     */
    _sendErrorReport(errorInfo) {
        // 这里可以实现发送错误报告到服务器的逻辑
        // 目前只是存储到本地
        try {
            const errorLog = JSON.parse(localStorage.getItem('game_error_log') || '[]');
            errorLog.push(errorInfo);
            
            // 限制错误日志数量
            if (errorLog.length > 50) {
                errorLog.splice(0, errorLog.length - 50);
            }
            
            localStorage.setItem('game_error_log', JSON.stringify(errorLog));
        } catch (error) {
            console.warn('保存错误日志失败:', error);
        }
    }

    /**
     * 尝试替代游戏
     * @param {string} originalGameTitle - 原游戏标题
     */
    _tryAlternativeGame(originalGameTitle) {
        // 这里可以实现推荐替代游戏的逻辑
        showNotification('正在为您寻找类似的游戏...', 'info');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    /**
     * 继续等待游戏加载
     * @param {string} gameUrl - 游戏URL
     * @param {string} gameTitle - 游戏标题
     * @param {HTMLElement} container - 容器元素
     */
    _continueWaiting(gameUrl, gameTitle, container) {
        console.log('用户选择继续等待游戏加载');
        
        // 显示加载界面
        container.innerHTML = `
            <div class="game-loading">
                <div class="loading-spinner"></div>
                <h3>继续加载游戏</h3>
                <p>正在加载 "${gameTitle}"，请耐心等待...</p>
            </div>
        `;

        // 创建新的iframe
        const iframe = this.createSafeGameIframe(gameUrl, gameTitle, container);
        container.appendChild(iframe);

        // 设置更长的超时时间
        this.handleGameTimeout(gameUrl, gameTitle, container, 30000);
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
     * 检查游戏是否已失败
     * @param {string} gameUrl - 游戏URL
     * @param {string} gameTitle - 游戏标题
     * @returns {boolean} 是否已失败
     */
    isGameFailed(gameUrl, gameTitle) {
        const gameKey = `${gameUrl}_${gameTitle}`;
        return this.failedGames.has(gameKey);
    }

    /**
     * 重置游戏状态
     * @param {string} gameUrl - 游戏URL
     * @param {string} gameTitle - 游戏标题
     */
    resetGameState(gameUrl, gameTitle) {
        const gameKey = `${gameUrl}_${gameTitle}`;
        this.gameLoadAttempts.delete(gameKey);
        this.failedGames.delete(gameKey);
        this._clearGameTimeout(gameKey);
    }

    /**
     * 获取错误统计
     * @returns {Object} 错误统计信息
     */
    getErrorStats() {
        return {
            failedGamesCount: this.failedGames.size,
            activeTimeouts: this.gameTimeouts.size,
            totalAttempts: Array.from(this.gameLoadAttempts.values()).reduce((sum, attempts) => sum + attempts, 0)
        };
    }

    /**
     * 清理资源
     */
    cleanup() {
        // 清除所有超时定时器
        this.gameTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this.gameTimeouts.clear();
        
        // 清除记录
        this.gameLoadAttempts.clear();
        this.failedGames.clear();
        
        console.log('游戏错误处理器资源已清理');
    }
}

// 创建单例实例
const gameErrorHandler = new GameErrorHandler();

export default gameErrorHandler;