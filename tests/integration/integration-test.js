/**
 * 集成测试脚本
 * 测试完整的用户使用流程和系统集成
 */

class IntegrationTestRunner {
    constructor() {
        this.tests = new Map();
        this.results = new Map();
        this.isRunning = false;
        this.currentTest = null;
        
        this.initializeTests();
        this.setupEventListeners();
    }

    /**
     * 初始化测试用例
     */
    initializeTests() {
        // 用户流程测试
        this.tests.set('userFlow', {
            name: '用户流程测试',
            description: '测试完整的用户使用流程',
            tests: [
                {
                    name: '页面加载测试',
                    description: '测试首页是否能正常加载',
                    test: this.testPageLoad.bind(this)
                },
                {
                    name: '导航功能测试',
                    description: '测试导航菜单是否正常工作',
                    test: this.testNavigation.bind(this)
                },
                {
                    name: '搜索功能测试',
                    description: '测试搜索功能是否正常',
                    test: this.testSearch.bind(this)
                },
                {
                    name: '语言切换测试',
                    description: '测试多语言切换功能',
                    test: this.testLanguageSwitch.bind(this)
                },
                {
                    name: '游戏卡片交互测试',
                    description: '测试游戏卡片的交互功能',
                    test: this.testGameCardInteraction.bind(this)
                },
                {
                    name: '响应式布局测试',
                    description: '测试不同屏幕尺寸的布局',
                    test: this.testResponsiveLayout.bind(this)
                }
            ]
        });

        // 兼容性测试
        this.tests.set('compatibility', {
            name: '跨浏览器兼容性测试',
            description: '测试在不同浏览器中的兼容性',
            tests: [
                {
                    name: '浏览器特性检测',
                    description: '检测浏览器支持的特性',
                    test: this.testBrowserFeatures.bind(this)
                },
                {
                    name: 'CSS特性支持测试',
                    description: '测试CSS特性的支持情况',
                    test: this.testCSSFeatures.bind(this)
                },
                {
                    name: 'JavaScript API测试',
                    description: '测试JavaScript API的兼容性',
                    test: this.testJavaScriptAPIs.bind(this)
                },
                {
                    name: '本地存储测试',
                    description: '测试localStorage的兼容性',
                    test: this.testLocalStorage.bind(this)
                },
                {
                    name: '网络请求测试',
                    description: '测试fetch API的兼容性',
                    test: this.testNetworkRequests.bind(this)
                }
            ]
        });

        // 性能测试
        this.tests.set('performance', {
            name: '性能测试',
            description: '测试页面性能和优化效果',
            tests: [
                {
                    name: '页面加载性能',
                    description: '测试页面加载时间',
                    test: this.testPageLoadPerformance.bind(this)
                },
                {
                    name: '图片懒加载测试',
                    description: '测试图片懒加载功能',
                    test: this.testImageLazyLoading.bind(this)
                },
                {
                    name: '内存使用测试',
                    description: '测试内存使用情况',
                    test: this.testMemoryUsage.bind(this)
                },
                {
                    name: '缓存机制测试',
                    description: '测试缓存机制的有效性',
                    test: this.testCaching.bind(this)
                },
                {
                    name: '动画性能测试',
                    description: '测试动画的流畅性',
                    test: this.testAnimationPerformance.bind(this)
                }
            ]
        });
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        document.getElementById('run-all-btn').addEventListener('click', () => {
            this.runAllTests();
        });

        document.getElementById('run-user-flow-btn').addEventListener('click', () => {
            this.runTestSuite('userFlow');
        });

        document.getElementById('run-compatibility-btn').addEventListener('click', () => {
            this.runTestSuite('compatibility');
        });

        document.getElementById('run-performance-btn').addEventListener('click', () => {
            this.runTestSuite('performance');
        });

        document.getElementById('clear-results-btn').addEventListener('click', () => {
            this.clearResults();
        });
    }

    /**
     * 运行所有测试
     */
    async runAllTests() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.clearResults();
        this.showLoading('运行所有集成测试...');

        try {
            for (const [suiteKey, suite] of this.tests) {
                await this.runTestSuite(suiteKey, false);
            }
        } catch (error) {
            console.error('运行测试时出错:', error);
        } finally {
            this.isRunning = false;
            this.hideLoading();
            this.showSummary();
        }
    }

    /**
     * 运行测试套件
     */
    async runTestSuite(suiteKey, showSummary = true) {
        const suite = this.tests.get(suiteKey);
        if (!suite) return;

        if (!this.isRunning) {
            this.isRunning = true;
            this.showLoading(`运行${suite.name}...`);
        }

        const suiteResults = [];

        try {
            for (const test of suite.tests) {
                this.currentTest = test;
                this.updateTestStatus(suiteKey, test.name, 'running');

                try {
                    const result = await test.test();
                    suiteResults.push({
                        name: test.name,
                        status: 'pass',
                        result: result,
                        error: null
                    });
                    this.updateTestStatus(suiteKey, test.name, 'pass', result);
                } catch (error) {
                    suiteResults.push({
                        name: test.name,
                        status: 'fail',
                        result: null,
                        error: error
                    });
                    this.updateTestStatus(suiteKey, test.name, 'fail', null, error);
                }

                // 小延迟以显示进度
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            this.results.set(suiteKey, suiteResults);

        } catch (error) {
            console.error(`运行测试套件 ${suiteKey} 时出错:`, error);
        } finally {
            if (showSummary) {
                this.isRunning = false;
                this.hideLoading();
                this.showSummary();
            }
        }
    }

    /**
     * 页面加载测试
     */
    async testPageLoad() {
        const startTime = performance.now();
        
        // 检查页面基本元素是否存在
        const requiredElements = [
            'header',
            '.games-grid',
            '#search-input',
            '.language-selector'
        ];

        const missingElements = [];
        for (const selector of requiredElements) {
            if (!document.querySelector(selector)) {
                missingElements.push(selector);
            }
        }

        if (missingElements.length > 0) {
            throw new Error(`缺少必要元素: ${missingElements.join(', ')}`);
        }

        const loadTime = performance.now() - startTime;
        
        return {
            loadTime: Math.round(loadTime),
            elementsFound: requiredElements.length,
            message: `页面加载成功，耗时 ${Math.round(loadTime)}ms`
        };
    }

    /**
     * 导航功能测试
     */
    async testNavigation() {
        const navLinks = document.querySelectorAll('.category-link');
        
        if (navLinks.length === 0) {
            throw new Error('未找到导航链接');
        }

        let clickableLinks = 0;
        for (const link of navLinks) {
            if (link.getAttribute('data-category')) {
                clickableLinks++;
            }
        }

        if (clickableLinks === 0) {
            throw new Error('没有可点击的导航链接');
        }

        // 模拟点击第一个导航链接
        const firstLink = navLinks[0];
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true
        });
        
        firstLink.dispatchEvent(clickEvent);

        return {
            totalLinks: navLinks.length,
            clickableLinks: clickableLinks,
            message: `导航功能正常，共 ${clickableLinks} 个可用链接`
        };
    }

    /**
     * 搜索功能测试
     */
    async testSearch() {
        const searchInput = document.getElementById('search-input');
        
        if (!searchInput) {
            throw new Error('未找到搜索输入框');
        }

        // 模拟输入搜索关键词
        searchInput.value = 'test';
        const inputEvent = new Event('input', {
            bubbles: true,
            cancelable: true
        });
        
        searchInput.dispatchEvent(inputEvent);

        // 等待搜索结果
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            searchInputFound: true,
            testQuery: 'test',
            message: '搜索功能可用'
        };
    }

    /**
     * 语言切换测试
     */
    async testLanguageSwitch() {
        const languageSelector = document.querySelector('.language-selector');
        
        if (!languageSelector) {
            throw new Error('未找到语言选择器');
        }

        const languageOptions = languageSelector.querySelectorAll('.language-option');
        
        if (languageOptions.length === 0) {
            throw new Error('未找到语言选项');
        }

        // 检查是否有多种语言选项
        const languages = Array.from(languageOptions).map(option => 
            option.getAttribute('data-lang')
        ).filter(lang => lang);

        if (languages.length < 2) {
            throw new Error('语言选项不足');
        }

        return {
            languagesFound: languages.length,
            languages: languages,
            message: `支持 ${languages.length} 种语言: ${languages.join(', ')}`
        };
    }

    /**
     * 游戏卡片交互测试
     */
    async testGameCardInteraction() {
        const gameCards = document.querySelectorAll('.game-card');
        
        if (gameCards.length === 0) {
            throw new Error('未找到游戏卡片');
        }

        let interactiveCards = 0;
        for (const card of gameCards) {
            // 检查是否有点击事件或链接
            if (card.onclick || card.querySelector('a') || card.getAttribute('data-game-id')) {
                interactiveCards++;
            }
        }

        // 模拟鼠标悬停
        const firstCard = gameCards[0];
        const mouseEnterEvent = new MouseEvent('mouseenter', {
            bubbles: true,
            cancelable: true
        });
        
        firstCard.dispatchEvent(mouseEnterEvent);

        return {
            totalCards: gameCards.length,
            interactiveCards: interactiveCards,
            message: `找到 ${gameCards.length} 个游戏卡片，${interactiveCards} 个可交互`
        };
    }

    /**
     * 响应式布局测试
     */
    async testResponsiveLayout() {
        const originalWidth = window.innerWidth;
        const testSizes = [
            { width: 320, name: '移动端' },
            { width: 768, name: '平板端' },
            { width: 1024, name: '桌面端' }
        ];

        const results = [];

        for (const size of testSizes) {
            // 模拟窗口大小改变
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: size.width
            });

            // 触发resize事件
            window.dispatchEvent(new Event('resize'));

            // 等待布局调整
            await new Promise(resolve => setTimeout(resolve, 100));

            // 检查布局是否适应
            const gamesGrid = document.querySelector('.games-grid');
            const computedStyle = window.getComputedStyle(gamesGrid);
            
            results.push({
                size: size.name,
                width: size.width,
                gridColumns: computedStyle.gridTemplateColumns || 'auto'
            });
        }

        // 恢复原始窗口大小
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: originalWidth
        });

        return {
            testedSizes: results.length,
            results: results,
            message: `响应式布局测试完成，测试了 ${results.length} 种屏幕尺寸`
        };
    }

    /**
     * 浏览器特性检测
     */
    async testBrowserFeatures() {
        const features = {
            localStorage: typeof Storage !== 'undefined',
            fetch: typeof fetch !== 'undefined',
            promises: typeof Promise !== 'undefined',
            es6Classes: typeof class {} === 'function',
            arrow: (() => true)() === true,
            templateLiterals: `test` === 'test',
            destructuring: (() => {
                try {
                    const [a] = [1];
                    return a === 1;
                } catch (e) {
                    return false;
                }
            })(),
            modules: typeof import !== 'undefined',
            serviceWorker: 'serviceWorker' in navigator,
            webGL: (() => {
                try {
                    const canvas = document.createElement('canvas');
                    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
                } catch (e) {
                    return false;
                }
            })()
        };

        const supportedFeatures = Object.values(features).filter(Boolean).length;
        const totalFeatures = Object.keys(features).length;

        if (supportedFeatures < totalFeatures * 0.8) {
            throw new Error(`浏览器兼容性不足，仅支持 ${supportedFeatures}/${totalFeatures} 个特性`);
        }

        return {
            supportedFeatures,
            totalFeatures,
            features,
            message: `浏览器支持 ${supportedFeatures}/${totalFeatures} 个特性`
        };
    }

    /**
     * CSS特性支持测试
     */
    async testCSSFeatures() {
        const testElement = document.createElement('div');
        document.body.appendChild(testElement);

        const cssFeatures = {
            flexbox: (() => {
                testElement.style.display = 'flex';
                return testElement.style.display === 'flex';
            })(),
            grid: (() => {
                testElement.style.display = 'grid';
                return testElement.style.display === 'grid';
            })(),
            transforms: (() => {
                testElement.style.transform = 'translateX(10px)';
                return testElement.style.transform !== '';
            })(),
            transitions: (() => {
                testElement.style.transition = 'all 0.3s';
                return testElement.style.transition !== '';
            })(),
            animations: (() => {
                testElement.style.animation = 'test 1s';
                return testElement.style.animation !== '';
            })(),
            customProperties: CSS.supports && CSS.supports('--test', '0')
        };

        document.body.removeChild(testElement);

        const supportedFeatures = Object.values(cssFeatures).filter(Boolean).length;
        const totalFeatures = Object.keys(cssFeatures).length;

        return {
            supportedFeatures,
            totalFeatures,
            features: cssFeatures,
            message: `CSS支持 ${supportedFeatures}/${totalFeatures} 个特性`
        };
    }

    /**
     * JavaScript API测试
     */
    async testJavaScriptAPIs() {
        const apis = {
            fetch: typeof fetch !== 'undefined',
            intersectionObserver: typeof IntersectionObserver !== 'undefined',
            mutationObserver: typeof MutationObserver !== 'undefined',
            requestAnimationFrame: typeof requestAnimationFrame !== 'undefined',
            performance: typeof performance !== 'undefined',
            history: typeof history !== 'undefined' && typeof history.pushState !== 'undefined',
            geolocation: 'geolocation' in navigator,
            webWorkers: typeof Worker !== 'undefined',
            webSockets: typeof WebSocket !== 'undefined',
            fileAPI: typeof FileReader !== 'undefined'
        };

        const supportedAPIs = Object.values(apis).filter(Boolean).length;
        const totalAPIs = Object.keys(apis).length;

        return {
            supportedAPIs,
            totalAPIs,
            apis,
            message: `JavaScript API支持 ${supportedAPIs}/${totalAPIs} 个`
        };
    }

    /**
     * 本地存储测试
     */
    async testLocalStorage() {
        if (typeof Storage === 'undefined') {
            throw new Error('浏览器不支持localStorage');
        }

        const testKey = 'integration-test-key';
        const testValue = { test: 'data', timestamp: Date.now() };

        try {
            // 测试存储
            localStorage.setItem(testKey, JSON.stringify(testValue));
            
            // 测试读取
            const retrieved = JSON.parse(localStorage.getItem(testKey));
            
            if (retrieved.test !== testValue.test) {
                throw new Error('localStorage数据不匹配');
            }

            // 测试删除
            localStorage.removeItem(testKey);
            
            if (localStorage.getItem(testKey) !== null) {
                throw new Error('localStorage删除失败');
            }

            return {
                storageAvailable: true,
                testPassed: true,
                message: 'localStorage功能正常'
            };

        } catch (error) {
            throw new Error(`localStorage测试失败: ${error.message}`);
        }
    }

    /**
     * 网络请求测试
     */
    async testNetworkRequests() {
        if (typeof fetch === 'undefined') {
            throw new Error('浏览器不支持fetch API');
        }

        try {
            // 测试获取游戏数据
            const response = await fetch('data/games.json');
            
            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data || !Array.isArray(data.games)) {
                throw new Error('游戏数据格式错误');
            }

            return {
                fetchAvailable: true,
                dataLoaded: true,
                gamesCount: data.games.length,
                message: `成功加载 ${data.games.length} 个游戏数据`
            };

        } catch (error) {
            throw new Error(`网络请求测试失败: ${error.message}`);
        }
    }

    /**
     * 页面加载性能测试
     */
    async testPageLoadPerformance() {
        if (typeof performance === 'undefined') {
            throw new Error('浏览器不支持Performance API');
        }

        const navigation = performance.getEntriesByType('navigation')[0];
        const paintEntries = performance.getEntriesByType('paint');

        const metrics = {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0,
            firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
        };

        // 检查性能指标是否在合理范围内
        if (metrics.domContentLoaded > 3000) {
            throw new Error(`DOM加载时间过长: ${metrics.domContentLoaded}ms`);
        }

        return {
            metrics,
            message: `页面性能良好，DOM加载耗时 ${Math.round(metrics.domContentLoaded)}ms`
        };
    }

    /**
     * 图片懒加载测试
     */
    async testImageLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        
        if (images.length === 0) {
            return {
                lazyImagesFound: 0,
                message: '未找到懒加载图片'
            };
        }

        let loadedImages = 0;
        for (const img of images) {
            if (img.src && img.src !== img.getAttribute('data-src')) {
                loadedImages++;
            }
        }

        return {
            lazyImagesFound: images.length,
            loadedImages,
            message: `找到 ${images.length} 个懒加载图片，${loadedImages} 个已加载`
        };
    }

    /**
     * 内存使用测试
     */
    async testMemoryUsage() {
        if (!performance.memory) {
            return {
                memoryAPIAvailable: false,
                message: '浏览器不支持内存监控API'
            };
        }

        const memory = performance.memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
        const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);

        return {
            memoryAPIAvailable: true,
            usedMB,
            totalMB,
            limitMB,
            message: `内存使用: ${usedMB}MB / ${totalMB}MB (限制: ${limitMB}MB)`
        };
    }

    /**
     * 缓存机制测试
     */
    async testCaching() {
        // 测试Service Worker缓存
        const swSupported = 'serviceWorker' in navigator;
        let swRegistered = false;

        if (swSupported) {
            try {
                const registration = await navigator.serviceWorker.getRegistration();
                swRegistered = !!registration;
            } catch (error) {
                // 忽略错误
            }
        }

        return {
            serviceWorkerSupported: swSupported,
            serviceWorkerRegistered: swRegistered,
            message: swRegistered ? 'Service Worker缓存已启用' : 'Service Worker缓存未启用'
        };
    }

    /**
     * 动画性能测试
     */
    async testAnimationPerformance() {
        return new Promise((resolve) => {
            const testElement = document.createElement('div');
            testElement.style.cssText = `
                position: fixed;
                top: -100px;
                left: -100px;
                width: 50px;
                height: 50px;
                background: red;
                transition: transform 0.3s;
            `;
            
            document.body.appendChild(testElement);

            let frameCount = 0;
            const startTime = performance.now();

            const countFrames = () => {
                frameCount++;
                if (performance.now() - startTime < 1000) {
                    requestAnimationFrame(countFrames);
                } else {
                    document.body.removeChild(testElement);
                    
                    const fps = frameCount;
                    resolve({
                        fps,
                        smooth: fps >= 30,
                        message: `动画帧率: ${fps} FPS ${fps >= 30 ? '(流畅)' : '(不流畅)'}`
                    });
                }
            };

            // 触发动画
            testElement.style.transform = 'translateX(100px)';
            requestAnimationFrame(countFrames);
        });
    }

    /**
     * 更新测试状态
     */
    updateTestStatus(suiteKey, testName, status, result = null, error = null) {
        const suite = this.tests.get(suiteKey);
        if (!suite) return;

        let suiteElement = document.getElementById(`suite-${suiteKey}`);
        if (!suiteElement) {
            suiteElement = this.createSuiteElement(suiteKey, suite);
        }

        const testElement = suiteElement.querySelector(`[data-test="${testName}"]`);
        if (testElement) {
            const statusElement = testElement.querySelector('.test-status');
            const detailsElement = testElement.querySelector('.test-details');

            statusElement.className = `test-status status-${status}`;
            statusElement.textContent = this.getStatusText(status);

            if (result || error) {
                detailsElement.className = `test-details ${error ? 'error-details' : 'success-details'} show`;
                detailsElement.textContent = error ? error.message : JSON.stringify(result, null, 2);
            }
        }
    }

    /**
     * 创建测试套件元素
     */
    createSuiteElement(suiteKey, suite) {
        const resultsContainer = document.getElementById('test-results');
        
        const suiteElement = document.createElement('div');
        suiteElement.className = 'test-section';
        suiteElement.id = `suite-${suiteKey}`;

        suiteElement.innerHTML = `
            <div class="section-header">${suite.name}</div>
            ${suite.tests.map(test => `
                <div class="test-item" data-test="${test.name}">
                    <div>
                        <div class="test-name">${test.name}</div>
                        <div class="test-description">${test.description}</div>
                        <div class="test-details"></div>
                    </div>
                    <div class="test-status status-pending">等待</div>
                </div>
            `).join('')}
        `;

        resultsContainer.appendChild(suiteElement);
        return suiteElement;
    }

    /**
     * 获取状态文本
     */
    getStatusText(status) {
        const statusTexts = {
            pending: '等待',
            running: '运行中',
            pass: '通过',
            fail: '失败'
        };
        return statusTexts[status] || status;
    }

    /**
     * 显示加载状态
     */
    showLoading(message) {
        const resultsContainer = document.getElementById('test-results');
        resultsContainer.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                ${message}
            </div>
        `;
    }

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        const loadingElement = document.querySelector('.loading');
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    /**
     * 显示测试摘要
     */
    showSummary() {
        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;

        for (const [suiteKey, results] of this.results) {
            totalTests += results.length;
            passedTests += results.filter(r => r.status === 'pass').length;
            failedTests += results.filter(r => r.status === 'fail').length;
        }

        const summaryElement = document.createElement('div');
        summaryElement.className = 'summary';
        summaryElement.innerHTML = `
            <div>
                <strong>测试完成</strong>
                <div style="margin-top: 5px; color: #666;">
                    总计 ${totalTests} 个测试，${passedTests} 个通过，${failedTests} 个失败
                </div>
            </div>
            <div class="summary-stats">
                <div class="stat-item">
                    <div class="stat-number">${totalTests}</div>
                    <div class="stat-label">总测试</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number" style="color: #28a745;">${passedTests}</div>
                    <div class="stat-label">通过</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number" style="color: #dc3545;">${failedTests}</div>
                    <div class="stat-label">失败</div>
                </div>
            </div>
        `;

        const resultsContainer = document.getElementById('test-results');
        resultsContainer.insertBefore(summaryElement, resultsContainer.firstChild);
    }

    /**
     * 清空测试结果
     */
    clearResults() {
        const resultsContainer = document.getElementById('test-results');
        resultsContainer.innerHTML = '';
        this.results.clear();
    }
}

// 初始化测试运行器
document.addEventListener('DOMContentLoaded', () => {
    new IntegrationTestRunner();
});