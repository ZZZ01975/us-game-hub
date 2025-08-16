/**
 * 性能优化模块
 * 负责页面加载性能优化、资源预加载、缓存策略等
 */

class PerformanceOptimizer {
    constructor() {
        this.criticalResources = new Set();
        this.preloadedResources = new Set();
        this.performanceMetrics = {};
        this.resourceHints = [];
        this.isInitialized = false;
    }

    /**
     * 初始化性能优化器
     */
    async init() {
        if (this.isInitialized) return;

        console.log('初始化性能优化器...');

        // 记录页面加载开始时间
        this.recordPageLoadStart();

        // 设置资源预加载
        this.setupResourcePreloading();

        // 设置缓存策略
        this.setupCacheStrategy();

        // 优化首屏渲染
        this.optimizeFirstPaint();

        // 设置性能监控
        this.setupPerformanceMonitoring();

        this.isInitialized = true;
        console.log('性能优化器初始化完成');
    }

    /**
     * 记录页面加载开始时间
     */
    recordPageLoadStart() {
        this.performanceMetrics.navigationStart = performance.timing.navigationStart;
        this.performanceMetrics.loadStart = Date.now();
        
        // 使用Performance API记录关键时间点
        if ('performance' in window && 'mark' in performance) {
            performance.mark('app-init-start');
        }
    }

    /**
     * 设置资源预加载
     */
    setupResourcePreloading() {
        // 预加载关键CSS
        this.preloadResource('css/main.css', 'style');
        
        // 预加载关键JavaScript
        this.preloadResource('js/main.js', 'script');
        
        // 预加载关键字体（如果有）
        // this.preloadResource('fonts/main-font.woff2', 'font');
        
        // 预加载关键图片
        this.preloadCriticalImages();
        
        // DNS预解析（如果使用外部资源）
        this.setupDNSPrefetch();
    }

    /**
     * 预加载资源
     * @param {string} href - 资源URL
     * @param {string} as - 资源类型
     * @param {string} type - MIME类型（可选）
     */
    preloadResource(href, as, type = null) {
        if (this.preloadedResources.has(href)) {
            return;
        }

        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = as;
        
        if (type) {
            link.type = type;
        }
        
        // 添加跨域支持（如果需要）
        if (href.startsWith('http') && !href.startsWith(window.location.origin)) {
            link.crossOrigin = 'anonymous';
        }
        
        link.onload = () => {
            console.log(`资源预加载完成: ${href}`);
            this.preloadedResources.add(href);
        };
        
        link.onerror = () => {
            console.warn(`资源预加载失败: ${href}`);
        };
        
        document.head.appendChild(link);
        this.resourceHints.push(link);
    }

    /**
     * 预加载关键图片
     */
    async preloadCriticalImages() {
        const criticalImages = [
            'assets/images/placeholder-game.svg',
            // 可以添加更多关键图片
        ];

        const preloadPromises = criticalImages.map(src => this.preloadImage(src));
        
        try {
            await Promise.allSettled(preloadPromises);
            console.log('关键图片预加载完成');
        } catch (error) {
            console.warn('关键图片预加载失败:', error);
        }
    }

    /**
     * 预加载单张图片
     * @param {string} src - 图片URL
     * @returns {Promise}
     */
    preloadImage(src) {
        return new Promise((resolve, reject) => {
            if (this.preloadedResources.has(src)) {
                resolve();
                return;
            }

            const img = new Image();
            img.onload = () => {
                this.preloadedResources.add(src);
                resolve();
            };
            img.onerror = reject;
            img.src = src;
        });
    }

    /**
     * 设置DNS预解析
     */
    setupDNSPrefetch() {
        const externalDomains = [
            // 如果使用CDN或外部资源，在这里添加域名
            // 'cdn.example.com',
            // 'fonts.googleapis.com'
        ];

        externalDomains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'dns-prefetch';
            link.href = `//${domain}`;
            document.head.appendChild(link);
            this.resourceHints.push(link);
        });
    }

    /**
     * 设置缓存策略
     */
    setupCacheStrategy() {
        // 检查Service Worker支持
        if ('serviceWorker' in navigator) {
            this.registerServiceWorker();
        }

        // 设置本地存储缓存
        this.setupLocalStorageCache();

        // 设置HTTP缓存头提示
        this.setupCacheHeaders();
    }

    /**
     * 注册Service Worker（可选）
     */
    async registerServiceWorker() {
        try {
            // 这里可以注册Service Worker来实现更高级的缓存策略
            // const registration = await navigator.serviceWorker.register('/sw.js');
            // console.log('Service Worker注册成功:', registration);
        } catch (error) {
            console.warn('Service Worker注册失败:', error);
        }
    }

    /**
     * 设置本地存储缓存
     */
    setupLocalStorageCache() {
        // 缓存游戏数据
        this.setupGameDataCache();
        
        // 缓存语言文件
        this.setupLanguageCache();
        
        // 缓存用户设置
        this.setupSettingsCache();
    }

    /**
     * 设置游戏数据缓存
     */
    setupGameDataCache() {
        const CACHE_KEY = 'games_data_cache';
        const CACHE_DURATION = 30 * 60 * 1000; // 30分钟

        // 检查缓存是否有效
        const cachedData = this.getCachedData(CACHE_KEY);
        if (cachedData && this.isCacheValid(cachedData, CACHE_DURATION)) {
            console.log('使用缓存的游戏数据');
            return cachedData.data;
        }

        // 如果缓存无效，清除旧缓存
        localStorage.removeItem(CACHE_KEY);
        return null;
    }

    /**
     * 缓存数据
     * @param {string} key - 缓存键
     * @param {*} data - 要缓存的数据
     */
    cacheData(key, data) {
        try {
            const cacheItem = {
                data: data,
                timestamp: Date.now(),
                version: '1.0' // 可以用于缓存版本控制
            };
            localStorage.setItem(key, JSON.stringify(cacheItem));
        } catch (error) {
            console.warn('数据缓存失败:', error);
        }
    }

    /**
     * 获取缓存数据
     * @param {string} key - 缓存键
     * @returns {Object|null} 缓存的数据
     */
    getCachedData(key) {
        try {
            const cached = localStorage.getItem(key);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.warn('读取缓存失败:', error);
            return null;
        }
    }

    /**
     * 检查缓存是否有效
     * @param {Object} cachedItem - 缓存项
     * @param {number} duration - 缓存持续时间（毫秒）
     * @returns {boolean} 是否有效
     */
    isCacheValid(cachedItem, duration) {
        if (!cachedItem || !cachedItem.timestamp) {
            return false;
        }
        
        const now = Date.now();
        return (now - cachedItem.timestamp) < duration;
    }

    /**
     * 设置语言文件缓存
     */
    setupLanguageCache() {
        const CACHE_KEY = 'language_files_cache';
        const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时

        // 语言文件通常变化较少，可以缓存更长时间
        return this.getCachedData(CACHE_KEY);
    }

    /**
     * 设置用户设置缓存
     */
    setupSettingsCache() {
        // 用户设置通常实时更新，不需要特殊缓存策略
        // 但可以优化读写性能
    }

    /**
     * 设置HTTP缓存头提示
     */
    setupCacheHeaders() {
        // 这个方法主要是为了文档化推荐的HTTP缓存头设置
        // 实际的缓存头需要在服务器端设置
        
        const cacheRecommendations = {
            'text/css': 'public, max-age=31536000', // CSS文件缓存1年
            'application/javascript': 'public, max-age=31536000', // JS文件缓存1年
            'image/*': 'public, max-age=2592000', // 图片缓存30天
            'application/json': 'public, max-age=3600', // JSON数据缓存1小时
            'text/html': 'no-cache' // HTML文件不缓存
        };

        console.log('推荐的HTTP缓存头设置:', cacheRecommendations);
    }

    /**
     * 优化首屏渲染
     */
    optimizeFirstPaint() {
        // 延迟加载非关键资源
        this.deferNonCriticalResources();
        
        // 优化关键渲染路径
        this.optimizeCriticalRenderingPath();
        
        // 减少重排和重绘
        this.minimizeReflowRepaint();
    }

    /**
     * 延迟加载非关键资源
     */
    deferNonCriticalResources() {
        // 延迟加载非关键JavaScript
        const nonCriticalScripts = document.querySelectorAll('script[data-defer]');
        nonCriticalScripts.forEach(script => {
            script.defer = true;
        });

        // 延迟加载非关键CSS
        const nonCriticalStyles = document.querySelectorAll('link[data-defer]');
        nonCriticalStyles.forEach(link => {
            link.media = 'print';
            link.onload = function() {
                this.media = 'all';
            };
        });
    }

    /**
     * 优化关键渲染路径
     */
    optimizeCriticalRenderingPath() {
        // 内联关键CSS（如果CSS很小）
        this.inlineCriticalCSS();
        
        // 异步加载非关键CSS
        this.loadNonCriticalCSSAsync();
    }

    /**
     * 内联关键CSS
     */
    inlineCriticalCSS() {
        // 这个方法在构建时执行会更好
        // 这里只是示例代码
        console.log('建议在构建时内联关键CSS');
    }

    /**
     * 异步加载非关键CSS
     */
    loadNonCriticalCSSAsync() {
        const loadCSS = (href) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.media = 'print';
            link.onload = function() {
                this.media = 'all';
            };
            document.head.appendChild(link);
        };

        // 异步加载非关键CSS文件
        // loadCSS('css/non-critical.css');
    }

    /**
     * 减少重排和重绘
     */
    minimizeReflowRepaint() {
        // 批量DOM操作
        this.batchDOMOperations();
        
        // 使用CSS transform代替改变位置
        this.useTransformForAnimation();
        
        // 避免强制同步布局
        this.avoidForcedSyncLayout();
    }

    /**
     * 批量DOM操作
     */
    batchDOMOperations() {
        // 使用DocumentFragment进行批量DOM操作
        // 这个方法会在其他模块中实现
        console.log('建议使用DocumentFragment进行批量DOM操作');
    }

    /**
     * 使用transform进行动画
     */
    useTransformForAnimation() {
        // 确保动画使用transform和opacity属性
        // 这些属性不会触发重排
        console.log('建议动画使用transform和opacity属性');
    }

    /**
     * 避免强制同步布局
     */
    avoidForcedSyncLayout() {
        // 避免在循环中读取布局属性
        console.log('建议避免在循环中读取布局属性');
    }

    /**
     * 设置性能监控
     */
    setupPerformanceMonitoring() {
        // 监控页面加载性能
        this.monitorPageLoad();
        
        // 监控运行时性能
        this.monitorRuntimePerformance();
        
        // 监控资源加载
        this.monitorResourceLoading();
    }

    /**
     * 监控页面加载性能
     */
    monitorPageLoad() {
        window.addEventListener('load', () => {
            // 记录页面加载完成时间
            if ('performance' in window && 'mark' in performance) {
                performance.mark('app-load-complete');
                
                // 测量加载时间
                performance.measure('app-load-time', 'app-init-start', 'app-load-complete');
                
                const measures = performance.getEntriesByName('app-load-time');
                if (measures.length > 0) {
                    const loadTime = measures[0].duration;
                    console.log(`页面加载时间: ${loadTime.toFixed(2)}ms`);
                    this.performanceMetrics.loadTime = loadTime;
                }
            }

            // 获取Navigation Timing数据
            this.collectNavigationTiming();
        });
    }

    /**
     * 收集Navigation Timing数据
     */
    collectNavigationTiming() {
        if (!('performance' in window) || !performance.timing) {
            return;
        }

        const timing = performance.timing;
        const metrics = {
            // DNS查询时间
            dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
            // TCP连接时间
            tcpConnect: timing.connectEnd - timing.connectStart,
            // 请求响应时间
            request: timing.responseEnd - timing.requestStart,
            // DOM解析时间
            domParse: timing.domContentLoadedEventStart - timing.responseEnd,
            // 资源加载时间
            resourceLoad: timing.loadEventStart - timing.domContentLoadedEventEnd,
            // 总加载时间
            totalLoad: timing.loadEventEnd - timing.navigationStart
        };

        console.log('页面性能指标:', metrics);
        this.performanceMetrics = { ...this.performanceMetrics, ...metrics };
    }

    /**
     * 监控运行时性能
     */
    monitorRuntimePerformance() {
        // 监控长任务
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.duration > 50) { // 超过50ms的任务
                            console.warn(`检测到长任务: ${entry.duration.toFixed(2)}ms`);
                        }
                    });
                });
                
                observer.observe({ entryTypes: ['longtask'] });
            } catch (error) {
                console.warn('长任务监控不支持:', error);
            }
        }

        // 监控内存使用（如果支持）
        this.monitorMemoryUsage();
    }

    /**
     * 监控内存使用
     */
    monitorMemoryUsage() {
        if ('memory' in performance) {
            const logMemoryUsage = () => {
                const memory = performance.memory;
                console.log('内存使用情况:', {
                    used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
                    total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
                    limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
                });
            };

            // 定期记录内存使用情况
            setInterval(logMemoryUsage, 30000); // 每30秒记录一次
        }
    }

    /**
     * 监控资源加载
     */
    monitorResourceLoading() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.duration > 1000) { // 超过1秒的资源
                            console.warn(`慢资源加载: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
                        }
                    });
                });
                
                observer.observe({ entryTypes: ['resource'] });
            } catch (error) {
                console.warn('资源加载监控不支持:', error);
            }
        }
    }

    /**
     * 获取性能指标
     * @returns {Object} 性能指标对象
     */
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }

    /**
     * 清理资源
     */
    cleanup() {
        // 清理预加载的资源提示
        this.resourceHints.forEach(link => {
            if (link.parentNode) {
                link.parentNode.removeChild(link);
            }
        });
        
        this.resourceHints = [];
        this.preloadedResources.clear();
        this.criticalResources.clear();
        
        console.log('性能优化器资源已清理');
    }
}

// 创建单例实例
const performanceOptimizer = new PerformanceOptimizer();

export default performanceOptimizer;