/**
 * 性能测试脚本
 * 监控和分析网站性能指标
 */

class PerformanceTestRunner {
    constructor() {
        this.metrics = {};
        this.recommendations = [];
        this.isRunning = false;
        
        this.init();
    }

    /**
     * 初始化性能测试
     */
    init() {
        this.setupEventListeners();
        this.runInitialTests();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        document.getElementById('run-test-btn').addEventListener('click', () => {
            this.runPerformanceTest();
        });

        document.getElementById('clear-cache-btn').addEventListener('click', () => {
            this.clearCache();
        });

        document.getElementById('export-report-btn').addEventListener('click', () => {
            this.exportReport();
        });
    }

    /**
     * 运行初始测试
     */
    async runInitialTests() {
        await this.measurePageLoadMetrics();
        this.measureMemoryUsage();
        this.measureResourceCount();
        this.updateDisplay();
        this.generateRecommendations();
    }

    /**
     * 运行完整性能测试
     */
    async runPerformanceTest() {
        if (this.isRunning) return;

        this.isRunning = true;
        const button = document.getElementById('run-test-btn');
        button.textContent = '测试中...';
        button.disabled = true;

        try {
            // 清空之前的结果
            this.metrics = {};
            this.recommendations = [];

            // 运行各项测试
            await this.measurePageLoadMetrics();
            this.measureMemoryUsage();
            this.measureResourceCount();
            await this.measureRenderingPerformance();
            await this.measureNetworkPerformance();
            
            // 更新显示
            this.updateDisplay();
            this.generateRecommendations();
            
            console.log('性能测试完成:', this.metrics);

        } catch (error) {
            console.error('性能测试失败:', error);
        } finally {
            this.isRunning = false;
            button.textContent = '运行性能测试';
            button.disabled = false;
        }
    }

    /**
     * 测量页面加载指标
     */
    async measurePageLoadMetrics() {
        if (!performance || !performance.getEntriesByType) {
            console.warn('浏览器不支持Performance API');
            return;
        }

        // 获取导航时间
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            this.metrics.loadTime = Math.round(navigation.loadEventEnd - navigation.loadEventStart);
            this.metrics.domReady = Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
            this.metrics.totalLoadTime = Math.round(navigation.loadEventEnd - navigation.fetchStart);
        }

        // 获取绘制时间
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');

        if (firstPaint) {
            this.metrics.firstPaint = Math.round(firstPaint.startTime);
        }

        if (firstContentfulPaint) {
            this.metrics.firstContentfulPaint = Math.round(firstContentfulPaint.startTime);
        }

        // 获取最大内容绘制（如果支持）
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    if (lastEntry) {
                        this.metrics.largestContentfulPaint = Math.round(lastEntry.startTime);
                    }
                });
                observer.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (error) {
                console.warn('LCP测量不支持:', error);
            }
        }
    }

    /**
     * 测量内存使用
     */
    measureMemoryUsage() {
        if (performance.memory) {
            this.metrics.memoryUsed = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
            this.metrics.memoryTotal = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024);
            this.metrics.memoryLimit = Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024);
        } else {
            this.metrics.memoryUsed = 'N/A';
            this.metrics.memoryTotal = 'N/A';
            this.metrics.memoryLimit = 'N/A';
        }
    }

    /**
     * 测量资源数量
     */
    measureResourceCount() {
        const resources = performance.getEntriesByType('resource');
        this.metrics.resourceCount = resources.length;
        
        // 按类型分类资源
        const resourceTypes = {};
        let totalSize = 0;

        resources.forEach(resource => {
            const type = this.getResourceType(resource.name);
            resourceTypes[type] = (resourceTypes[type] || 0) + 1;
            
            if (resource.transferSize) {
                totalSize += resource.transferSize;
            }
        });

        this.metrics.resourceTypes = resourceTypes;
        this.metrics.totalTransferSize = Math.round(totalSize / 1024); // KB
    }

    /**
     * 获取资源类型
     */
    getResourceType(url) {
        if (url.includes('.js')) return 'JavaScript';
        if (url.includes('.css')) return 'CSS';
        if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'Image';
        if (url.includes('.json')) return 'JSON';
        if (url.includes('.html')) return 'HTML';
        return 'Other';
    }

    /**
     * 测量渲染性能
     */
    async measureRenderingPerformance() {
        return new Promise((resolve) => {
            let frameCount = 0;
            const startTime = performance.now();
            const duration = 1000; // 测量1秒

            const countFrames = () => {
                frameCount++;
                if (performance.now() - startTime < duration) {
                    requestAnimationFrame(countFrames);
                } else {
                    this.metrics.fps = frameCount;
                    resolve();
                }
            };

            requestAnimationFrame(countFrames);
        });
    }

    /**
     * 测量网络性能
     */
    async measureNetworkPerformance() {
        const resources = performance.getEntriesByType('resource');
        
        if (resources.length === 0) return;

        let totalDuration = 0;
        let slowestResource = null;
        let slowestDuration = 0;

        resources.forEach(resource => {
            const duration = resource.responseEnd - resource.requestStart;
            totalDuration += duration;

            if (duration > slowestDuration) {
                slowestDuration = duration;
                slowestResource = resource.name;
            }
        });

        this.metrics.averageResourceLoadTime = Math.round(totalDuration / resources.length);
        this.metrics.slowestResource = {
            url: slowestResource,
            duration: Math.round(slowestDuration)
        };
    }

    /**
     * 更新显示
     */
    updateDisplay() {
        // 更新加载时间
        this.updateMetric('load-time', this.metrics.totalLoadTime, 'ms', (value) => {
            if (value < 2000) return 'good';
            if (value < 4000) return 'warning';
            return 'poor';
        });

        // 更新DOM就绪时间
        this.updateMetric('dom-ready', this.metrics.domReady, 'ms', (value) => {
            if (value < 1000) return 'good';
            if (value < 2000) return 'warning';
            return 'poor';
        });

        // 更新首次绘制
        this.updateMetric('first-paint', this.metrics.firstPaint, 'ms', (value) => {
            if (value < 1000) return 'good';
            if (value < 2000) return 'warning';
            return 'poor';
        });

        // 更新首次内容绘制
        this.updateMetric('first-contentful-paint', this.metrics.firstContentfulPaint, 'ms', (value) => {
            if (value < 1500) return 'good';
            if (value < 3000) return 'warning';
            return 'poor';
        });

        // 更新内存使用
        this.updateMetric('memory-usage', this.metrics.memoryUsed, 'MB', (value) => {
            if (typeof value === 'number') {
                if (value < 50) return 'good';
                if (value < 100) return 'warning';
                return 'poor';
            }
            return 'warning';
        });

        // 更新资源数量
        this.updateMetric('resource-count', this.metrics.resourceCount, '个', (value) => {
            if (value < 50) return 'good';
            if (value < 100) return 'warning';
            return 'poor';
        });
    }

    /**
     * 更新单个指标显示
     */
    updateMetric(elementId, value, unit, statusFn) {
        const valueElement = document.getElementById(elementId);
        const statusElement = document.getElementById(elementId + '-status');

        if (valueElement) {
            valueElement.textContent = value !== undefined ? `${value}${unit}` : 'N/A';
        }

        if (statusElement && value !== undefined) {
            const status = statusFn(value);
            statusElement.className = `status status-${status}`;
            statusElement.textContent = this.getStatusText(status);
        }
    }

    /**
     * 获取状态文本
     */
    getStatusText(status) {
        const statusTexts = {
            good: '优秀',
            warning: '一般',
            poor: '需优化'
        };
        return statusTexts[status] || '未知';
    }

    /**
     * 生成优化建议
     */
    generateRecommendations() {
        this.recommendations = [];

        // 页面加载时间建议
        if (this.metrics.totalLoadTime > 3000) {
            this.recommendations.push({
                title: '页面加载时间过长',
                description: '考虑压缩资源文件、启用缓存、使用CDN等方式优化加载速度。',
                priority: 'high'
            });
        }

        // 首次内容绘制建议
        if (this.metrics.firstContentfulPaint > 2500) {
            this.recommendations.push({
                title: '首次内容绘制较慢',
                description: '优化关键渲染路径，减少阻塞渲染的资源，考虑内联关键CSS。',
                priority: 'high'
            });
        }

        // 内存使用建议
        if (typeof this.metrics.memoryUsed === 'number' && this.metrics.memoryUsed > 80) {
            this.recommendations.push({
                title: '内存使用过高',
                description: '检查是否存在内存泄漏，优化JavaScript代码，减少不必要的DOM操作。',
                priority: 'medium'
            });
        }

        // 资源数量建议
        if (this.metrics.resourceCount > 80) {
            this.recommendations.push({
                title: '资源文件过多',
                description: '考虑合并CSS和JavaScript文件，使用雪碧图减少图片请求数量。',
                priority: 'medium'
            });
        }

        // FPS建议
        if (this.metrics.fps && this.metrics.fps < 30) {
            this.recommendations.push({
                title: '动画性能不佳',
                description: '优化CSS动画，使用transform和opacity属性，避免频繁的重排和重绘。',
                priority: 'medium'
            });
        }

        // 网络性能建议
        if (this.metrics.averageResourceLoadTime > 500) {
            this.recommendations.push({
                title: '网络请求较慢',
                description: '优化服务器响应时间，启用HTTP/2，使用适当的缓存策略。',
                priority: 'medium'
            });
        }

        this.displayRecommendations();
    }

    /**
     * 显示优化建议
     */
    displayRecommendations() {
        const container = document.getElementById('recommendations-list');
        
        if (this.recommendations.length === 0) {
            container.innerHTML = '<p style="color: #28a745;">🎉 性能表现良好，暂无优化建议！</p>';
            return;
        }

        const html = this.recommendations.map(rec => `
            <div class="recommendation">
                <h4>${rec.title}</h4>
                <p>${rec.description}</p>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    /**
     * 清除缓存
     */
    async clearCache() {
        if ('caches' in window) {
            try {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
                alert('缓存已清除，请刷新页面重新测试');
            } catch (error) {
                console.error('清除缓存失败:', error);
                alert('清除缓存失败');
            }
        } else {
            alert('浏览器不支持Cache API');
        }
    }

    /**
     * 导出报告
     */
    exportReport() {
        const report = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            metrics: this.metrics,
            recommendations: this.recommendations,
            summary: this.generateSummary()
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 生成性能摘要
     */
    generateSummary() {
        let score = 100;
        const issues = [];

        // 评分逻辑
        if (this.metrics.totalLoadTime > 3000) {
            score -= 20;
            issues.push('页面加载时间过长');
        }

        if (this.metrics.firstContentfulPaint > 2500) {
            score -= 15;
            issues.push('首次内容绘制较慢');
        }

        if (typeof this.metrics.memoryUsed === 'number' && this.metrics.memoryUsed > 80) {
            score -= 10;
            issues.push('内存使用过高');
        }

        if (this.metrics.resourceCount > 80) {
            score -= 10;
            issues.push('资源文件过多');
        }

        if (this.metrics.fps && this.metrics.fps < 30) {
            score -= 15;
            issues.push('动画性能不佳');
        }

        return {
            score: Math.max(0, score),
            grade: this.getGrade(score),
            issues: issues,
            strengths: this.getStrengths()
        };
    }

    /**
     * 获取性能等级
     */
    getGrade(score) {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    /**
     * 获取性能优势
     */
    getStrengths() {
        const strengths = [];

        if (this.metrics.totalLoadTime <= 2000) {
            strengths.push('页面加载速度快');
        }

        if (this.metrics.firstContentfulPaint <= 1500) {
            strengths.push('首次内容绘制快');
        }

        if (typeof this.metrics.memoryUsed === 'number' && this.metrics.memoryUsed <= 50) {
            strengths.push('内存使用合理');
        }

        if (this.metrics.resourceCount <= 50) {
            strengths.push('资源数量适中');
        }

        if (this.metrics.fps && this.metrics.fps >= 50) {
            strengths.push('动画流畅');
        }

        return strengths;
    }
}

// 初始化性能测试
document.addEventListener('DOMContentLoaded', () => {
    new PerformanceTestRunner();
});