/**
 * 分析工具管理器
 * 集成Google Analytics和其他分析工具
 */

class AnalyticsManager {
    constructor() {
        this.isEnabled = false;
        this.trackingId = null;
        this.debugMode = false;
        this.events = [];
        
        this.init();
    }

    /**
     * 初始化分析工具
     */
    init() {
        // 检查是否在本地开发环境
        this.debugMode = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
        
        // 从配置中获取跟踪ID
        this.trackingId = this.getTrackingId();
        
        if (this.trackingId && !this.debugMode) {
            this.initGoogleAnalytics();
        } else if (this.debugMode) {
            console.log('🔍 Analytics Debug Mode: 事件将在控制台显示');
        }
    }

    /**
     * 获取跟踪ID
     */
    getTrackingId() {
        // 从meta标签获取
        const metaTag = document.querySelector('meta[name="google-analytics"]');
        if (metaTag) {
            return metaTag.getAttribute('content');
        }
        
        // 从配置文件获取（如果有）
        if (window.ANALYTICS_CONFIG && window.ANALYTICS_CONFIG.googleAnalytics) {
            return window.ANALYTICS_CONFIG.googleAnalytics;
        }
        
        return null;
    }

    /**
     * 初始化Google Analytics
     */
    initGoogleAnalytics() {
        try {
            // 加载gtag脚本
            const script1 = document.createElement('script');
            script1.async = true;
            script1.src = `https://www.googletagmanager.com/gtag/js?id=${this.trackingId}`;
            document.head.appendChild(script1);

            // 初始化gtag
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            
            gtag('js', new Date());
            gtag('config', this.trackingId, {
                // 隐私设置
                anonymize_ip: true,
                allow_google_signals: false,
                allow_ad_personalization_signals: false,
                // 性能设置
                send_page_view: true,
                // 自定义参数
                custom_map: {
                    'custom_parameter_1': 'game_category',
                    'custom_parameter_2': 'user_language'
                }
            });

            this.isEnabled = true;
            console.log('✅ Google Analytics 已初始化');
            
            // 发送初始页面视图
            this.trackPageView();
            
        } catch (error) {
            console.error('❌ Google Analytics 初始化失败:', error);
        }
    }

    /**
     * 跟踪页面浏览
     */
    trackPageView(page = null) {
        const pageData = {
            page_title: document.title,
            page_location: window.location.href,
            page_path: page || window.location.pathname,
            language: document.documentElement.lang || 'en',
            user_agent: navigator.userAgent
        };

        if (this.isEnabled && window.gtag) {
            gtag('event', 'page_view', pageData);
        }

        if (this.debugMode) {
            console.log('📊 Page View:', pageData);
        }

        this.logEvent('page_view', pageData);
    }

    /**
     * 跟踪游戏相关事件
     */
    trackGameEvent(action, gameId, gameTitle = '', category = '') {
        const eventData = {
            event_category: 'game',
            event_label: gameId,
            game_title: gameTitle,
            game_category: category,
            timestamp: new Date().toISOString()
        };

        if (this.isEnabled && window.gtag) {
            gtag('event', action, eventData);
        }

        if (this.debugMode) {
            console.log(`🎮 Game Event [${action}]:`, eventData);
        }

        this.logEvent(`game_${action}`, eventData);
    }

    /**
     * 跟踪用户交互事件
     */
    trackUserInteraction(action, element = '', value = null) {
        const eventData = {
            event_category: 'user_interaction',
            event_label: element,
            value: value,
            timestamp: new Date().toISOString()
        };

        if (this.isEnabled && window.gtag) {
            gtag('event', action, eventData);
        }

        if (this.debugMode) {
            console.log(`👆 User Interaction [${action}]:`, eventData);
        }

        this.logEvent(`interaction_${action}`, eventData);
    }

    /**
     * 跟踪搜索事件
     */
    trackSearch(searchTerm, resultsCount = 0) {
        const eventData = {
            event_category: 'search',
            search_term: searchTerm,
            results_count: resultsCount,
            timestamp: new Date().toISOString()
        };

        if (this.isEnabled && window.gtag) {
            gtag('event', 'search', eventData);
        }

        if (this.debugMode) {
            console.log('🔍 Search Event:', eventData);
        }

        this.logEvent('search', eventData);
    }

    /**
     * 跟踪语言切换
     */
    trackLanguageChange(fromLang, toLang) {
        const eventData = {
            event_category: 'language',
            from_language: fromLang,
            to_language: toLang,
            timestamp: new Date().toISOString()
        };

        if (this.isEnabled && window.gtag) {
            gtag('event', 'language_change', eventData);
        }

        if (this.debugMode) {
            console.log('🌍 Language Change:', eventData);
        }

        this.logEvent('language_change', eventData);
    }

    /**
     * 跟踪错误事件
     */
    trackError(errorType, errorMessage, errorStack = '') {
        const eventData = {
            event_category: 'error',
            error_type: errorType,
            error_message: errorMessage,
            error_stack: errorStack,
            page_url: window.location.href,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };

        if (this.isEnabled && window.gtag) {
            gtag('event', 'exception', {
                description: `${errorType}: ${errorMessage}`,
                fatal: false
            });
        }

        if (this.debugMode) {
            console.log('❌ Error Event:', eventData);
        }

        this.logEvent('error', eventData);
    }

    /**
     * 跟踪性能指标
     */
    trackPerformance() {
        if (!window.performance || !window.performance.timing) {
            return;
        }

        const timing = window.performance.timing;
        const navigation = window.performance.navigation;

        const performanceData = {
            // 页面加载时间
            page_load_time: timing.loadEventEnd - timing.navigationStart,
            // DNS查询时间
            dns_time: timing.domainLookupEnd - timing.domainLookupStart,
            // TCP连接时间
            tcp_time: timing.connectEnd - timing.connectStart,
            // 首字节时间
            ttfb: timing.responseStart - timing.navigationStart,
            // DOM解析时间
            dom_parse_time: timing.domContentLoadedEventEnd - timing.domLoading,
            // 导航类型
            navigation_type: navigation.type,
            // 重定向次数
            redirect_count: navigation.redirectCount
        };

        if (this.isEnabled && window.gtag) {
            // 发送自定义指标
            Object.keys(performanceData).forEach(key => {
                if (typeof performanceData[key] === 'number' && performanceData[key] > 0) {
                    gtag('event', 'timing_complete', {
                        name: key,
                        value: performanceData[key]
                    });
                }
            });
        }

        if (this.debugMode) {
            console.log('⚡ Performance Metrics:', performanceData);
        }

        this.logEvent('performance', performanceData);
    }

    /**
     * 设置用户属性
     */
    setUserProperties(properties) {
        if (this.isEnabled && window.gtag) {
            gtag('config', this.trackingId, {
                user_properties: properties
            });
        }

        if (this.debugMode) {
            console.log('👤 User Properties:', properties);
        }
    }

    /**
     * 本地事件日志
     */
    logEvent(eventType, eventData) {
        this.events.push({
            type: eventType,
            data: eventData,
            timestamp: Date.now()
        });

        // 保持最近1000个事件
        if (this.events.length > 1000) {
            this.events = this.events.slice(-1000);
        }

        // 存储到localStorage（用于调试）
        if (this.debugMode) {
            try {
                localStorage.setItem('analytics_events', JSON.stringify(this.events.slice(-100)));
            } catch (error) {
                // 忽略存储错误
            }
        }
    }

    /**
     * 获取事件历史
     */
    getEventHistory(limit = 50) {
        return this.events.slice(-limit);
    }

    /**
     * 清除事件历史
     */
    clearEventHistory() {
        this.events = [];
        if (this.debugMode) {
            localStorage.removeItem('analytics_events');
        }
    }

    /**
     * 启用/禁用分析
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        
        if (window.gtag) {
            gtag('config', this.trackingId, {
                send_page_view: enabled
            });
        }
    }

    /**
     * 获取分析状态
     */
    getStatus() {
        return {
            enabled: this.isEnabled,
            trackingId: this.trackingId,
            debugMode: this.debugMode,
            eventCount: this.events.length,
            lastEvent: this.events.length > 0 ? this.events[this.events.length - 1] : null
        };
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsManager;
} else {
    window.AnalyticsManager = AnalyticsManager;
}