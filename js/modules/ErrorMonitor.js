/**
 * 错误监控系统
 * 收集和报告JavaScript错误、网络错误等
 */

class ErrorMonitor {
    constructor() {
        this.errors = [];
        this.maxErrors = 100;
        this.isEnabled = true;
        this.reportEndpoint = null;
        this.analyticsManager = null;
        
        this.init();
    }

    /**
     * 初始化错误监控
     */
    init() {
        // 监听全局JavaScript错误
        window.addEventListener('error', (event) => {
            this.handleJavaScriptError(event);
        });

        // 监听Promise拒绝错误
        window.addEventListener('unhandledrejection', (event) => {
            this.handlePromiseRejection(event);
        });

        // 监听资源加载错误
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleResourceError(event);
            }
        }, true);

        // 设置分析管理器引用
        if (window.analyticsManager) {
            this.analyticsManager = window.analyticsManager;
        }

        console.log('🛡️ 错误监控系统已启动');
    }

    /**
     * 处理JavaScript错误
     */
    handleJavaScriptError(event) {
        const error = {
            type: 'javascript_error',
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error ? event.error.stack : null,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            severity: this.getSeverity(event.message)
        };

        this.logError(error);
        this.reportError(error);
    }

    /**
     * 处理Promise拒绝错误
     */
    handlePromiseRejection(event) {
        const error = {
            type: 'promise_rejection',
            message: event.reason ? event.reason.toString() : 'Promise rejected',
            stack: event.reason && event.reason.stack ? event.reason.stack : null,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            severity: 'medium'
        };

        this.logError(error);
        this.reportError(error);
    }

    /**
     * 处理资源加载错误
     */
    handleResourceError(event) {
        const error = {
            type: 'resource_error',
            message: `Failed to load resource: ${event.target.src || event.target.href}`,
            resource: event.target.tagName.toLowerCase(),
            src: event.target.src || event.target.href,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            severity: 'low'
        };

        this.logError(error);
        this.reportError(error);
    }

    /**
     * 手动记录错误
     */
    recordError(message, details = {}) {
        const error = {
            type: 'manual_error',
            message: message,
            details: details,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            severity: details.severity || 'medium',
            stack: new Error().stack
        };

        this.logError(error);
        this.reportError(error);
    }

    /**
     * 记录网络错误
     */
    recordNetworkError(url, status, statusText, details = {}) {
        const error = {
            type: 'network_error',
            message: `Network request failed: ${status} ${statusText}`,
            url: url,
            status: status,
            statusText: statusText,
            details: details,
            userAgent: navigator.userAgent,
            pageUrl: window.location.href,
            timestamp: new Date().toISOString(),
            severity: status >= 500 ? 'high' : 'medium'
        };

        this.logError(error);
        this.reportError(error);
    }

    /**
     * 记录游戏加载错误
     */
    recordGameError(gameId, errorType, message, details = {}) {
        const error = {
            type: 'game_error',
            gameId: gameId,
            errorType: errorType,
            message: message,
            details: details,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            severity: 'medium'
        };

        this.logError(error);
        this.reportError(error);
    }

    /**
     * 获取错误严重程度
     */
    getSeverity(message) {
        const highSeverityKeywords = [
            'TypeError', 'ReferenceError', 'SyntaxError',
            'Cannot read property', 'is not defined',
            'Permission denied', 'Network error'
        ];

        const lowSeverityKeywords = [
            'ResizeObserver', 'Non-passive event listener',
            'Deprecated', 'Warning'
        ];

        const lowerMessage = message.toLowerCase();

        if (highSeverityKeywords.some(keyword => 
            lowerMessage.includes(keyword.toLowerCase()))) {
            return 'high';
        }

        if (lowSeverityKeywords.some(keyword => 
            lowerMessage.includes(keyword.toLowerCase()))) {
            return 'low';
        }

        return 'medium';
    }

    /**
     * 记录错误到本地存储
     */
    logError(error) {
        if (!this.isEnabled) return;

        // 添加到错误列表
        this.errors.push(error);

        // 保持错误数量限制
        if (this.errors.length > this.maxErrors) {
            this.errors = this.errors.slice(-this.maxErrors);
        }

        // 控制台输出
        const severity = error.severity || 'medium';
        const emoji = severity === 'high' ? '🚨' : severity === 'medium' ? '⚠️' : '💡';
        
        console.group(`${emoji} ${error.type.toUpperCase()}`);
        console.error('Message:', error.message);
        if (error.filename) console.log('File:', error.filename);
        if (error.lineno) console.log('Line:', error.lineno);
        if (error.stack) console.log('Stack:', error.stack);
        console.log('Timestamp:', error.timestamp);
        console.groupEnd();

        // 存储到localStorage（用于调试）
        try {
            const recentErrors = this.errors.slice(-20);
            localStorage.setItem('error_log', JSON.stringify(recentErrors));
        } catch (e) {
            // 忽略存储错误
        }
    }

    /**
     * 报告错误到分析系统
     */
    reportError(error) {
        // 发送到Google Analytics
        if (this.analyticsManager) {
            this.analyticsManager.trackError(
                error.type,
                error.message,
                error.stack
            );
        }

        // 发送到自定义端点（如果配置了）
        if (this.reportEndpoint) {
            this.sendToEndpoint(error);
        }

        // 严重错误的特殊处理
        if (error.severity === 'high') {
            this.handleCriticalError(error);
        }
    }

    /**
     * 发送错误到自定义端点
     */
    async sendToEndpoint(error) {
        try {
            await fetch(this.reportEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...error,
                    site: window.location.hostname,
                    userAgent: navigator.userAgent
                })
            });
        } catch (e) {
            console.warn('Failed to send error report:', e);
        }
    }

    /**
     * 处理严重错误
     */
    handleCriticalError(error) {
        // 可以在这里添加特殊处理逻辑
        // 例如：显示用户友好的错误消息、重新加载页面等
        
        console.error('🚨 Critical error detected:', error);
        
        // 如果是游戏相关的严重错误，可以尝试重新加载游戏
        if (error.type === 'game_error' && error.gameId) {
            this.handleGameCriticalError(error);
        }
    }

    /**
     * 处理游戏严重错误
     */
    handleGameCriticalError(error) {
        // 通知游戏管理器处理错误
        if (window.gameManager) {
            window.gameManager.handleGameError(error.gameId, error);
        }
    }

    /**
     * 获取错误统计
     */
    getErrorStats() {
        const stats = {
            total: this.errors.length,
            byType: {},
            bySeverity: {},
            recent: this.errors.slice(-10),
            timeRange: {
                oldest: this.errors.length > 0 ? this.errors[0].timestamp : null,
                newest: this.errors.length > 0 ? this.errors[this.errors.length - 1].timestamp : null
            }
        };

        // 按类型统计
        this.errors.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
        });

        return stats;
    }

    /**
     * 获取特定类型的错误
     */
    getErrorsByType(type) {
        return this.errors.filter(error => error.type === type);
    }

    /**
     * 获取特定严重程度的错误
     */
    getErrorsBySeverity(severity) {
        return this.errors.filter(error => error.severity === severity);
    }

    /**
     * 清除错误日志
     */
    clearErrors() {
        this.errors = [];
        localStorage.removeItem('error_log');
        console.log('🧹 错误日志已清除');
    }

    /**
     * 设置报告端点
     */
    setReportEndpoint(endpoint) {
        this.reportEndpoint = endpoint;
    }

    /**
     * 启用/禁用错误监控
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        console.log(`${enabled ? '✅' : '❌'} 错误监控已${enabled ? '启用' : '禁用'}`);
    }

    /**
     * 导出错误日志
     */
    exportErrors() {
        const data = {
            errors: this.errors,
            stats: this.getErrorStats(),
            exportTime: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `error-log-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 获取监控状态
     */
    getStatus() {
        return {
            enabled: this.isEnabled,
            errorCount: this.errors.length,
            reportEndpoint: this.reportEndpoint,
            stats: this.getErrorStats()
        };
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorMonitor;
} else {
    window.ErrorMonitor = ErrorMonitor;
}