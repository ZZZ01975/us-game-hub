/**
 * 跨设备兼容性管理器
 * 负责处理不同浏览器、设备和屏幕尺寸的兼容性问题
 */

import { debounce, throttle } from '../utils/helpers.js';

class CrossDeviceCompatibilityManager {
    constructor() {
        this.isInitialized = false;
        this.deviceInfo = {};
        this.browserInfo = {};
        this.supportInfo = {};
        this.viewportInfo = {};
        this.polyfills = new Map();
        
        // 绑定方法上下文
        this._handleResize = debounce(this._handleResize.bind(this), 250);
        this._handleOrientationChange = this._handleOrientationChange.bind(this);
        this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
    }

    /**
     * 初始化跨设备兼容性管理器
     */
    init() {
        if (this.isInitialized) return;

        this._detectDevice();
        this._detectBrowser();
        this._detectSupport();
        this._setupPolyfills();
        this._setupViewportHandling();
        this._setupEventListeners();
        this._applyCompatibilityFixes();
        this._setupPerformanceOptimizations();
        
        this.isInitialized = true;
        console.log('跨设备兼容性管理器已初始化', {
            device: this.deviceInfo,
            browser: this.browserInfo,
            support: this.supportInfo
        });
    }

    /**
     * 检测设备信息
     * @private
     */
    _detectDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const platform = navigator.platform.toLowerCase();
        
        this.deviceInfo = {
            // 设备类型
            isMobile: /mobile|android|iphone|ipod|blackberry|windows phone/i.test(userAgent),
            isTablet: /ipad|android(?!.*mobile)|tablet/i.test(userAgent),
            isDesktop: !/mobile|android|iphone|ipod|ipad|blackberry|windows phone|tablet/i.test(userAgent),
            
            // 操作系统
            isIOS: /iphone|ipad|ipod/i.test(userAgent),
            isAndroid: /android/i.test(userAgent),
            isWindows: /windows/i.test(userAgent),
            isMacOS: /mac/i.test(platform),
            isLinux: /linux/i.test(platform),
            
            // 具体设备
            isIPhone: /iphone/i.test(userAgent),
            isIPad: /ipad/i.test(userAgent),
            isIPod: /ipod/i.test(userAgent),
            
            // 屏幕信息
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            pixelRatio: window.devicePixelRatio || 1,
            
            // 触摸支持
            hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            maxTouchPoints: navigator.maxTouchPoints || 0,
            
            // 网络信息
            connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection,
            
            // 内存信息
            memory: navigator.deviceMemory,
            
            // 硬件并发
            hardwareConcurrency: navigator.hardwareConcurrency || 4
        };

        // 设备分类
        if (this.deviceInfo.isMobile) {
            this.deviceInfo.category = 'mobile';
        } else if (this.deviceInfo.isTablet) {
            this.deviceInfo.category = 'tablet';
        } else {
            this.deviceInfo.category = 'desktop';
        }
    }

    /**
     * 检测浏览器信息
     * @private
     */
    _detectBrowser() {
        const userAgent = navigator.userAgent;
        const vendor = navigator.vendor || '';
        
        this.browserInfo = {
            // 浏览器类型
            isChrome: /chrome/i.test(userAgent) && /google inc/i.test(vendor),
            isFirefox: /firefox/i.test(userAgent),
            isSafari: /safari/i.test(userAgent) && /apple computer/i.test(vendor),
            isEdge: /edg/i.test(userAgent),
            isIE: /msie|trident/i.test(userAgent),
            isOpera: /opera|opr/i.test(userAgent),
            
            // 移动浏览器
            isMobileSafari: /safari/i.test(userAgent) && this.deviceInfo.isIOS,
            isChromeAndroid: /chrome/i.test(userAgent) && this.deviceInfo.isAndroid,
            isWebView: /wv|webview/i.test(userAgent),
            
            // 版本信息
            version: this._getBrowserVersion(userAgent),
            
            // 引擎信息
            isWebKit: /webkit/i.test(userAgent),
            isBlink: /chrome/i.test(userAgent) && /webkit/i.test(userAgent),
            isGecko: /gecko/i.test(userAgent) && !/webkit/i.test(userAgent),
            isTrident: /trident/i.test(userAgent),
            
            // 用户代理字符串
            userAgent: userAgent,
            vendor: vendor,
            
            // 语言设置
            language: navigator.language || navigator.userLanguage,
            languages: navigator.languages || [navigator.language]
        };
    }

    /**
     * 获取浏览器版本
     * @private
     * @param {string} userAgent - 用户代理字符串
     * @returns {string} 浏览器版本
     */
    _getBrowserVersion(userAgent) {
        let version = 'unknown';
        
        if (this.browserInfo.isChrome) {
            const match = userAgent.match(/chrome\/(\d+)/i);
            version = match ? match[1] : version;
        } else if (this.browserInfo.isFirefox) {
            const match = userAgent.match(/firefox\/(\d+)/i);
            version = match ? match[1] : version;
        } else if (this.browserInfo.isSafari) {
            const match = userAgent.match(/version\/(\d+)/i);
            version = match ? match[1] : version;
        } else if (this.browserInfo.isEdge) {
            const match = userAgent.match(/edg\/(\d+)/i);
            version = match ? match[1] : version;
        }
        
        return version;
    }

    /**
     * 检测功能支持
     * @private
     */
    _detectSupport() {
        this.supportInfo = {
            // CSS 功能
            cssGrid: CSS.supports('display', 'grid'),
            cssFlexbox: CSS.supports('display', 'flex'),
            cssCustomProperties: CSS.supports('--test', 'value'),
            cssClipPath: CSS.supports('clip-path', 'circle()'),
            cssBackdropFilter: CSS.supports('backdrop-filter', 'blur(10px)'),
            cssAspectRatio: CSS.supports('aspect-ratio', '1/1'),
            
            // JavaScript 功能
            es6: typeof Symbol !== 'undefined',
            es2017: typeof Object.values === 'function',
            es2018: typeof Object.fromEntries === 'function',
            asyncAwait: (async () => {})().constructor === Promise,
            
            // Web APIs
            intersectionObserver: 'IntersectionObserver' in window,
            resizeObserver: 'ResizeObserver' in window,
            mutationObserver: 'MutationObserver' in window,
            serviceWorker: 'serviceWorker' in navigator,
            webWorker: typeof Worker !== 'undefined',
            
            // 存储
            localStorage: this._testLocalStorage(),
            sessionStorage: this._testSessionStorage(),
            indexedDB: 'indexedDB' in window,
            
            // 网络
            fetch: 'fetch' in window,
            webSocket: 'WebSocket' in window,
            
            // 媒体
            webP: this._testWebPSupport(),
            avif: this._testAVIFSupport(),
            
            // 输入
            pointerEvents: 'PointerEvent' in window,
            touchEvents: 'TouchEvent' in window,
            
            // 其他
            webGL: this._testWebGLSupport(),
            webGL2: this._testWebGL2Support(),
            webAssembly: 'WebAssembly' in window,
            
            // 权限API
            permissions: 'permissions' in navigator,
            geolocation: 'geolocation' in navigator,
            
            // 通知
            notifications: 'Notification' in window,
            
            // 剪贴板
            clipboard: navigator.clipboard && navigator.clipboard.writeText,
            
            // 分享
            webShare: navigator.share && navigator.canShare,
            
            // 振动
            vibration: 'vibrate' in navigator,
            
            // 全屏
            fullscreen: document.fullscreenEnabled || document.webkitFullscreenEnabled,
            
            // 画中画
            pictureInPicture: 'pictureInPictureEnabled' in document
        };
    }

    /**
     * 测试 localStorage 支持
     * @private
     * @returns {boolean} 是否支持
     */
    _testLocalStorage() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * 测试 sessionStorage 支持
     * @private
     * @returns {boolean} 是否支持
     */
    _testSessionStorage() {
        try {
            const test = '__test__';
            sessionStorage.setItem(test, test);
            sessionStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * 测试 WebP 支持
     * @private
     * @returns {Promise<boolean>} 是否支持
     */
    _testWebPSupport() {
        return new Promise((resolve) => {
            const webP = new Image();
            webP.onload = webP.onerror = () => {
                resolve(webP.height === 2);
            };
            webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        });
    }

    /**
     * 测试 AVIF 支持
     * @private
     * @returns {Promise<boolean>} 是否支持
     */
    _testAVIFSupport() {
        return new Promise((resolve) => {
            const avif = new Image();
            avif.onload = avif.onerror = () => {
                resolve(avif.height === 2);
            };
            avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
        });
    }

    /**
     * 测试 WebGL 支持
     * @private
     * @returns {boolean} 是否支持
     */
    _testWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    }

    /**
     * 测试 WebGL2 支持
     * @private
     * @returns {boolean} 是否支持
     */
    _testWebGL2Support() {
        try {
            const canvas = document.createElement('canvas');
            return !!canvas.getContext('webgl2');
        } catch (e) {
            return false;
        }
    }

    /**
     * 设置 Polyfills
     * @private
     */
    _setupPolyfills() {
        // IntersectionObserver polyfill
        if (!this.supportInfo.intersectionObserver) {
            this._loadPolyfill('intersection-observer', () => {
                // 简单的 IntersectionObserver polyfill
                window.IntersectionObserver = class {
                    constructor(callback, options = {}) {
                        this.callback = callback;
                        this.options = options;
                        this.elements = new Set();
                    }
                    
                    observe(element) {
                        this.elements.add(element);
                        // 简单实现：立即触发回调
                        setTimeout(() => {
                            this.callback([{
                                target: element,
                                isIntersecting: true,
                                intersectionRatio: 1
                            }]);
                        }, 100);
                    }
                    
                    unobserve(element) {
                        this.elements.delete(element);
                    }
                    
                    disconnect() {
                        this.elements.clear();
                    }
                };
            });
        }

        // ResizeObserver polyfill
        if (!this.supportInfo.resizeObserver) {
            this._loadPolyfill('resize-observer', () => {
                window.ResizeObserver = class {
                    constructor(callback) {
                        this.callback = callback;
                        this.elements = new Set();
                        this._handleResize = debounce(() => {
                            const entries = Array.from(this.elements).map(element => ({
                                target: element,
                                contentRect: element.getBoundingClientRect()
                            }));
                            this.callback(entries);
                        }, 100);
                        window.addEventListener('resize', this._handleResize);
                    }
                    
                    observe(element) {
                        this.elements.add(element);
                    }
                    
                    unobserve(element) {
                        this.elements.delete(element);
                    }
                    
                    disconnect() {
                        this.elements.clear();
                        window.removeEventListener('resize', this._handleResize);
                    }
                };
            });
        }

        // fetch polyfill
        if (!this.supportInfo.fetch) {
            this._loadPolyfill('fetch', () => {
                // 简单的 fetch polyfill 使用 XMLHttpRequest
                window.fetch = (url, options = {}) => {
                    return new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open(options.method || 'GET', url);
                        
                        if (options.headers) {
                            Object.keys(options.headers).forEach(key => {
                                xhr.setRequestHeader(key, options.headers[key]);
                            });
                        }
                        
                        xhr.onload = () => {
                            resolve({
                                ok: xhr.status >= 200 && xhr.status < 300,
                                status: xhr.status,
                                statusText: xhr.statusText,
                                json: () => Promise.resolve(JSON.parse(xhr.responseText)),
                                text: () => Promise.resolve(xhr.responseText)
                            });
                        };
                        
                        xhr.onerror = () => reject(new Error('Network error'));
                        xhr.send(options.body);
                    });
                };
            });
        }

        // CSS.supports polyfill
        if (!window.CSS || !window.CSS.supports) {
            window.CSS = window.CSS || {};
            window.CSS.supports = (property, value) => {
                const element = document.createElement('div');
                element.style.cssText = `${property}: ${value}`;
                return element.style.length > 0;
            };
        }

        // Object.fromEntries polyfill
        if (!this.supportInfo.es2018) {
            if (!Object.fromEntries) {
                Object.fromEntries = (entries) => {
                    const obj = {};
                    for (const [key, value] of entries) {
                        obj[key] = value;
                    }
                    return obj;
                };
            }
        }

        // Array.from polyfill
        if (!Array.from) {
            Array.from = (arrayLike, mapFn, thisArg) => {
                const result = [];
                for (let i = 0; i < arrayLike.length; i++) {
                    const value = mapFn ? mapFn.call(thisArg, arrayLike[i], i) : arrayLike[i];
                    result.push(value);
                }
                return result;
            };
        }
    }

    /**
     * 加载 polyfill
     * @private
     * @param {string} name - polyfill 名称
     * @param {Function} fallback - 备用实现
     */
    _loadPolyfill(name, fallback) {
        this.polyfills.set(name, fallback);
        if (fallback) {
            fallback();
        }
    }

    /**
     * 设置视口处理
     * @private
     */
    _setupViewportHandling() {
        this._updateViewportInfo();
        
        // iOS Safari 视口修复
        if (this.browserInfo.isMobileSafari) {
            this._fixIOSViewport();
        }
        
        // Android Chrome 视口修复
        if (this.browserInfo.isChromeAndroid) {
            this._fixAndroidViewport();
        }
        
        // 通用视口修复
        this._setupUniversalViewportFix();
    }

    /**
     * 更新视口信息
     * @private
     */
    _updateViewportInfo() {
        this.viewportInfo = {
            width: window.innerWidth,
            height: window.innerHeight,
            availWidth: window.screen.availWidth,
            availHeight: window.screen.availHeight,
            orientation: screen.orientation?.angle || window.orientation || 0,
            isLandscape: window.innerWidth > window.innerHeight,
            isPortrait: window.innerHeight > window.innerWidth,
            pixelRatio: window.devicePixelRatio || 1
        };
        
        // 设置 CSS 自定义属性
        document.documentElement.style.setProperty('--viewport-width', `${this.viewportInfo.width}px`);
        document.documentElement.style.setProperty('--viewport-height', `${this.viewportInfo.height}px`);
        document.documentElement.style.setProperty('--vh', `${this.viewportInfo.height * 0.01}px`);
        document.documentElement.style.setProperty('--vw', `${this.viewportInfo.width * 0.01}px`);
    }

    /**
     * 修复 iOS Safari 视口问题
     * @private
     */
    _fixIOSViewport() {
        // 修复 iOS Safari 100vh 问题
        const setIOSViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setIOSViewportHeight();
        window.addEventListener('resize', debounce(setIOSViewportHeight, 100));
        window.addEventListener('orientationchange', () => {
            setTimeout(setIOSViewportHeight, 500);
        });

        // 防止缩放
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        // 防止双击缩放
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
    }

    /**
     * 修复 Android Chrome 视口问题
     * @private
     */
    _fixAndroidViewport() {
        // Android Chrome 地址栏处理
        const setAndroidViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            
            // 处理软键盘
            if (window.visualViewport) {
                const handleVisualViewportChange = () => {
                    const visualVh = window.visualViewport.height * 0.01;
                    document.documentElement.style.setProperty('--visual-vh', `${visualVh}px`);
                };
                
                window.visualViewport.addEventListener('resize', handleVisualViewportChange);
                handleVisualViewportChange();
            }
        };

        setAndroidViewportHeight();
        window.addEventListener('resize', debounce(setAndroidViewportHeight, 100));
    }

    /**
     * 设置通用视口修复
     * @private
     */
    _setupUniversalViewportFix() {
        // 处理视口变化
        const handleViewportChange = () => {
            this._updateViewportInfo();
            
            // 触发自定义事件
            window.dispatchEvent(new CustomEvent('viewportChange', {
                detail: this.viewportInfo
            }));
        };

        window.addEventListener('resize', debounce(handleViewportChange, 100));
        window.addEventListener('orientationchange', () => {
            setTimeout(handleViewportChange, 300);
        });

        // 处理软键盘
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                const keyboardHeight = window.innerHeight - window.visualViewport.height;
                document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
                
                document.body.classList.toggle('keyboard-open', keyboardHeight > 0);
            });
        }
    }

    /**
     * 设置事件监听器
     * @private
     */
    _setupEventListeners() {
        window.addEventListener('resize', this._handleResize);
        window.addEventListener('orientationchange', this._handleOrientationChange);
        document.addEventListener('visibilitychange', this._handleVisibilityChange);
        
        // 网络状态变化
        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', this._handleConnectionChange.bind(this));
        }
        
        window.addEventListener('online', this._handleOnline.bind(this));
        window.addEventListener('offline', this._handleOffline.bind(this));
    }

    /**
     * 应用兼容性修复
     * @private
     */
    _applyCompatibilityFixes() {
        // 添加设备类型到 body 类名
        document.body.classList.add(`device-${this.deviceInfo.category}`);
        document.body.classList.add(`os-${this._getOSClass()}`);
        document.body.classList.add(`browser-${this._getBrowserClass()}`);
        
        // 添加功能支持类名
        Object.keys(this.supportInfo).forEach(feature => {
            if (this.supportInfo[feature]) {
                document.body.classList.add(`supports-${feature.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
            } else {
                document.body.classList.add(`no-${feature.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
            }
        });
        
        // 特定浏览器修复
        this._applyBrowserSpecificFixes();
        
        // 特定设备修复
        this._applyDeviceSpecificFixes();
    }

    /**
     * 获取操作系统类名
     * @private
     * @returns {string} 操作系统类名
     */
    _getOSClass() {
        if (this.deviceInfo.isIOS) return 'ios';
        if (this.deviceInfo.isAndroid) return 'android';
        if (this.deviceInfo.isWindows) return 'windows';
        if (this.deviceInfo.isMacOS) return 'macos';
        if (this.deviceInfo.isLinux) return 'linux';
        return 'unknown';
    }

    /**
     * 获取浏览器类名
     * @private
     * @returns {string} 浏览器类名
     */
    _getBrowserClass() {
        if (this.browserInfo.isChrome) return 'chrome';
        if (this.browserInfo.isFirefox) return 'firefox';
        if (this.browserInfo.isSafari) return 'safari';
        if (this.browserInfo.isEdge) return 'edge';
        if (this.browserInfo.isIE) return 'ie';
        if (this.browserInfo.isOpera) return 'opera';
        return 'unknown';
    }

    /**
     * 应用浏览器特定修复
     * @private
     */
    _applyBrowserSpecificFixes() {
        // Safari 修复
        if (this.browserInfo.isSafari) {
            // 修复 Safari 的 flexbox bug
            document.body.classList.add('safari-flexbox-fix');
            
            // 修复 Safari 的 position: sticky bug
            document.body.classList.add('safari-sticky-fix');
        }
        
        // Firefox 修复
        if (this.browserInfo.isFirefox) {
            // 修复 Firefox 的滚动条样式
            document.body.classList.add('firefox-scrollbar-fix');
        }
        
        // IE 修复
        if (this.browserInfo.isIE) {
            // IE 不支持很多现代功能，添加警告
            this._showIEWarning();
        }
        
        // Edge 修复
        if (this.browserInfo.isEdge) {
            // 旧版 Edge 的修复
            if (parseInt(this.browserInfo.version) < 79) {
                document.body.classList.add('edge-legacy-fix');
            }
        }
    }

    /**
     * 应用设备特定修复
     * @private
     */
    _applyDeviceSpecificFixes() {
        // iOS 设备修复
        if (this.deviceInfo.isIOS) {
            // 修复 iOS 的 -webkit-overflow-scrolling
            document.body.classList.add('ios-scroll-fix');
            
            // 修复 iOS 的输入框缩放
            this._fixIOSInputZoom();
        }
        
        // Android 设备修复
        if (this.deviceInfo.isAndroid) {
            // 修复 Android 的性能问题
            document.body.classList.add('android-performance-fix');
        }
        
        // 低性能设备优化
        if (this.deviceInfo.memory && this.deviceInfo.memory < 4) {
            document.body.classList.add('low-memory-device');
        }
        
        if (this.deviceInfo.hardwareConcurrency < 4) {
            document.body.classList.add('low-cpu-device');
        }
    }

    /**
     * 修复 iOS 输入框缩放问题
     * @private
     */
    _fixIOSInputZoom() {
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                const viewport = document.querySelector('meta[name="viewport"]');
                if (viewport) {
                    viewport.setAttribute('content', 
                        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
                    );
                }
            });
            
            input.addEventListener('blur', () => {
                const viewport = document.querySelector('meta[name="viewport"]');
                if (viewport) {
                    viewport.setAttribute('content', 
                        'width=device-width, initial-scale=1.0'
                    );
                }
            });
        });
    }

    /**
     * 显示 IE 警告
     * @private
     */
    _showIEWarning() {
        const warning = document.createElement('div');
        warning.className = 'ie-warning';
        warning.innerHTML = `
            <div class="ie-warning-content">
                <h3>浏览器兼容性提醒</h3>
                <p>您正在使用的浏览器版本较旧，可能无法正常显示网站内容。</p>
                <p>建议您升级到最新版本的 Chrome、Firefox、Safari 或 Edge 浏览器。</p>
                <button onclick="this.parentElement.parentElement.remove()">我知道了</button>
            </div>
        `;
        
        document.body.insertBefore(warning, document.body.firstChild);
    }

    /**
     * 设置性能优化
     * @private
     */
    _setupPerformanceOptimizations() {
        // 低性能设备优化
        if (this.deviceInfo.memory && this.deviceInfo.memory < 4) {
            this._applyLowMemoryOptimizations();
        }
        
        if (this.deviceInfo.hardwareConcurrency < 4) {
            this._applyLowCPUOptimizations();
        }
        
        // 慢网络优化
        if (this.deviceInfo.connection) {
            const connection = this.deviceInfo.connection;
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                this._applySlowNetworkOptimizations();
            }
        }
        
        // 节省数据模式
        if (navigator.connection && navigator.connection.saveData) {
            this._applySaveDataOptimizations();
        }
    }

    /**
     * 应用低内存优化
     * @private
     */
    _applyLowMemoryOptimizations() {
        // 减少动画
        document.body.classList.add('reduce-animations');
        
        // 减少图片质量
        document.body.classList.add('reduce-image-quality');
        
        // 延迟加载非关键资源
        document.body.classList.add('lazy-load-aggressive');
    }

    /**
     * 应用低CPU优化
     * @private
     */
    _applyLowCPUOptimizations() {
        // 减少复杂动画
        document.body.classList.add('reduce-complex-animations');
        
        // 减少并发请求
        document.body.classList.add('reduce-concurrent-requests');
    }

    /**
     * 应用慢网络优化
     * @private
     */
    _applySlowNetworkOptimizations() {
        // 优先加载关键资源
        document.body.classList.add('prioritize-critical-resources');
        
        // 压缩图片
        document.body.classList.add('compress-images');
        
        // 延迟加载非关键内容
        document.body.classList.add('defer-non-critical');
    }

    /**
     * 应用节省数据优化
     * @private
     */
    _applySaveDataOptimizations() {
        // 禁用自动播放
        document.body.classList.add('disable-autoplay');
        
        // 使用低质量图片
        document.body.classList.add('use-low-quality-images');
        
        // 减少预加载
        document.body.classList.add('reduce-preloading');
    }

    /**
     * 处理窗口大小变化
     * @private
     */
    _handleResize() {
        this._updateViewportInfo();
        
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('compatibilityResize', {
            detail: this.viewportInfo
        }));
    }

    /**
     * 处理屏幕方向变化
     * @private
     */
    _handleOrientationChange() {
        setTimeout(() => {
            this._updateViewportInfo();
            
            // 触发自定义事件
            window.dispatchEvent(new CustomEvent('compatibilityOrientationChange', {
                detail: this.viewportInfo
            }));
        }, 300);
    }

    /**
     * 处理页面可见性变化
     * @private
     */
    _handleVisibilityChange() {
        if (document.hidden) {
            // 页面隐藏时暂停非必要操作
            document.body.classList.add('page-hidden');
        } else {
            // 页面显示时恢复操作
            document.body.classList.remove('page-hidden');
        }
    }

    /**
     * 处理网络连接变化
     * @private
     */
    _handleConnectionChange() {
        const connection = navigator.connection;
        
        // 更新网络状态类名
        document.body.className = document.body.className.replace(/connection-\w+/g, '');
        document.body.classList.add(`connection-${connection.effectiveType}`);
        
        // 根据网络状态调整优化策略
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            this._applySlowNetworkOptimizations();
        }
    }

    /**
     * 处理在线状态
     * @private
     */
    _handleOnline() {
        document.body.classList.remove('offline');
        document.body.classList.add('online');
        
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('compatibilityOnline'));
    }

    /**
     * 处理离线状态
     * @private
     */
    _handleOffline() {
        document.body.classList.remove('online');
        document.body.classList.add('offline');
        
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('compatibilityOffline'));
    }

    /**
     * 获取设备信息
     * @returns {Object} 设备信息
     */
    getDeviceInfo() {
        return { ...this.deviceInfo };
    }

    /**
     * 获取浏览器信息
     * @returns {Object} 浏览器信息
     */
    getBrowserInfo() {
        return { ...this.browserInfo };
    }

    /**
     * 获取功能支持信息
     * @returns {Object} 功能支持信息
     */
    getSupportInfo() {
        return { ...this.supportInfo };
    }

    /**
     * 获取视口信息
     * @returns {Object} 视口信息
     */
    getViewportInfo() {
        return { ...this.viewportInfo };
    }

    /**
     * 检查功能是否支持
     * @param {string} feature - 功能名称
     * @returns {boolean} 是否支持
     */
    isSupported(feature) {
        return this.supportInfo[feature] || false;
    }

    /**
     * 检查是否为移动设备
     * @returns {boolean} 是否为移动设备
     */
    isMobile() {
        return this.deviceInfo.isMobile;
    }

    /**
     * 检查是否为平板设备
     * @returns {boolean} 是否为平板设备
     */
    isTablet() {
        return this.deviceInfo.isTablet;
    }

    /**
     * 检查是否为桌面设备
     * @returns {boolean} 是否为桌面设备
     */
    isDesktop() {
        return this.deviceInfo.isDesktop;
    }

    /**
     * 销毁兼容性管理器
     */
    destroy() {
        if (!this.isInitialized) return;
        
        // 移除事件监听器
        window.removeEventListener('resize', this._handleResize);
        window.removeEventListener('orientationchange', this._handleOrientationChange);
        document.removeEventListener('visibilitychange', this._handleVisibilityChange);
        
        if ('connection' in navigator) {
            navigator.connection.removeEventListener('change', this._handleConnectionChange);
        }
        
        window.removeEventListener('online', this._handleOnline);
        window.removeEventListener('offline', this._handleOffline);
        
        // 清理 polyfills
        this.polyfills.clear();
        
        this.isInitialized = false;
        console.log('跨设备兼容性管理器已销毁');
    }
}

// 创建单例实例
const crossDeviceCompatibilityManager = new CrossDeviceCompatibilityManager();

export default crossDeviceCompatibilityManager;