/**
 * 浏览器兼容性测试脚本
 * 检测浏览器对各种Web标准和API的支持情况
 */

class BrowserCompatibilityTester {
    constructor() {
        this.testResults = new Map();
        this.browserInfo = {};
        this.featureCategories = this.defineFeatureCategories();
        
        this.init();
    }

    /**
     * 初始化测试器
     */
    init() {
        this.detectBrowserInfo();
        this.runAllTests();
        this.displayResults();
        this.setupEventListeners();
    }

    /**
     * 定义功能测试分类
     */
    defineFeatureCategories() {
        return {
            'JavaScript ES6+': {
                'Arrow Functions': () => {
                    try {
                        const test = () => true;
                        return test() === true;
                    } catch (e) {
                        return false;
                    }
                },
                'Template Literals': () => {
                    try {
                        const test = `template`;
                        return test === 'template';
                    } catch (e) {
                        return false;
                    }
                },
                'Destructuring': () => {
                    try {
                        const [a] = [1];
                        const {b} = {b: 2};
                        return a === 1 && b === 2;
                    } catch (e) {
                        return false;
                    }
                },
                'Classes': () => {
                    try {
                        class Test {}
                        return typeof Test === 'function';
                    } catch (e) {
                        return false;
                    }
                },
                'Promises': () => typeof Promise !== 'undefined',
                'Async/Await': () => {
                    try {
                        eval('(async function() {})');
                        return true;
                    } catch (e) {
                        return false;
                    }
                },
                'Modules': () => typeof import !== 'undefined',
                'Map/Set': () => typeof Map !== 'undefined' && typeof Set !== 'undefined',
                'Symbol': () => typeof Symbol !== 'undefined',
                'Proxy': () => typeof Proxy !== 'undefined'
            },
            'Web APIs': {
                'Fetch API': () => typeof fetch !== 'undefined',
                'LocalStorage': () => typeof Storage !== 'undefined',
                'SessionStorage': () => typeof sessionStorage !== 'undefined',
                'IndexedDB': () => typeof indexedDB !== 'undefined',
                'WebSockets': () => typeof WebSocket !== 'undefined',
                'Geolocation': () => 'geolocation' in navigator,
                'Notifications': () => 'Notification' in window,
                'Service Workers': () => 'serviceWorker' in navigator,
                'Web Workers': () => typeof Worker !== 'undefined',
                'File API': () => typeof FileReader !== 'undefined',
                'Drag and Drop': () => 'draggable' in document.createElement('div'),
                'History API': () => typeof history !== 'undefined' && typeof history.pushState !== 'undefined'
            },
            'CSS Features': {
                'Flexbox': () => this.testCSSProperty('display', 'flex'),
                'Grid': () => this.testCSSProperty('display', 'grid'),
                'CSS Variables': () => CSS.supports && CSS.supports('--test', '0'),
                'CSS Transforms': () => this.testCSSProperty('transform', 'translateX(10px)'),
                'CSS Transitions': () => this.testCSSProperty('transition', 'all 0.3s'),
                'CSS Animations': () => this.testCSSProperty('animation', 'test 1s'),
                'CSS Filters': () => this.testCSSProperty('filter', 'blur(5px)'),
                'CSS Gradients': () => this.testCSSProperty('background', 'linear-gradient(red, blue)'),
                'CSS Border Radius': () => this.testCSSProperty('border-radius', '5px'),
                'CSS Box Shadow': () => this.testCSSProperty('box-shadow', '0 0 5px black')
            },
            'HTML5 Features': {
                'Canvas': () => {
                    const canvas = document.createElement('canvas');
                    return !!(canvas.getContext && canvas.getContext('2d'));
                },
                'WebGL': () => {
                    try {
                        const canvas = document.createElement('canvas');
                        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
                    } catch (e) {
                        return false;
                    }
                },
                'Audio': () => typeof Audio !== 'undefined',
                'Video': () => {
                    const video = document.createElement('video');
                    return typeof video.canPlayType !== 'undefined';
                },
                'SVG': () => typeof SVGElement !== 'undefined',
                'Input Types': () => {
                    const input = document.createElement('input');
                    input.type = 'email';
                    return input.type === 'email';
                },
                'Form Validation': () => {
                    const input = document.createElement('input');
                    return typeof input.checkValidity !== 'undefined';
                },
                'Semantic Elements': () => typeof HTMLElement !== 'undefined'
            },
            'Performance APIs': {
                'Performance API': () => typeof performance !== 'undefined',
                'Performance Observer': () => typeof PerformanceObserver !== 'undefined',
                'Navigation Timing': () => typeof performance !== 'undefined' && typeof performance.getEntriesByType !== 'undefined',
                'Resource Timing': () => typeof performance !== 'undefined' && performance.getEntriesByType('resource').length >= 0,
                'User Timing': () => typeof performance !== 'undefined' && typeof performance.mark !== 'undefined',
                'Memory Info': () => typeof performance !== 'undefined' && typeof performance.memory !== 'undefined',
                'RequestAnimationFrame': () => typeof requestAnimationFrame !== 'undefined',
                'RequestIdleCallback': () => typeof requestIdleCallback !== 'undefined'
            },
            'Security Features': {
                'HTTPS': () => location.protocol === 'https:',
                'Content Security Policy': () => typeof CSP !== 'undefined' || document.querySelector('meta[http-equiv="Content-Security-Policy"]') !== null,
                'Secure Context': () => typeof isSecureContext !== 'undefined' ? isSecureContext : location.protocol === 'https:',
                'Crypto API': () => typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined',
                'Permissions API': () => typeof navigator.permissions !== 'undefined'
            }
        };
    }

    /**
     * 检测浏览器信息
     */
    detectBrowserInfo() {
        const ua = navigator.userAgent;
        
        this.browserInfo = {
            'User Agent': ua,
            'Browser Name': this.getBrowserName(ua),
            'Browser Version': this.getBrowserVersion(ua),
            'Engine': this.getEngine(ua),
            'Platform': navigator.platform,
            'Language': navigator.language,
            'Languages': navigator.languages ? navigator.languages.join(', ') : 'N/A',
            'Cookie Enabled': navigator.cookieEnabled,
            'Online': navigator.onLine,
            'Screen Resolution': `${screen.width}x${screen.height}`,
            'Color Depth': `${screen.colorDepth} bits`,
            'Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
            'Hardware Concurrency': navigator.hardwareConcurrency || 'N/A'
        };
    }

    /**
     * 获取浏览器名称
     */
    getBrowserName(ua) {
        if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
        if (ua.includes('Edg')) return 'Edge';
        if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
        if (ua.includes('Trident')) return 'Internet Explorer';
        return 'Unknown';
    }

    /**
     * 获取浏览器版本
     */
    getBrowserVersion(ua) {
        const patterns = {
            'Chrome': /Chrome\/(\d+\.\d+)/,
            'Firefox': /Firefox\/(\d+\.\d+)/,
            'Safari': /Version\/(\d+\.\d+)/,
            'Edge': /Edg\/(\d+\.\d+)/,
            'Opera': /(?:Opera|OPR)\/(\d+\.\d+)/,
            'Internet Explorer': /(?:MSIE |Trident.*rv:)(\d+\.\d+)/
        };

        const browserName = this.getBrowserName(ua);
        const pattern = patterns[browserName];
        
        if (pattern) {
            const match = ua.match(pattern);
            return match ? match[1] : 'Unknown';
        }
        
        return 'Unknown';
    }

    /**
     * 获取浏览器引擎
     */
    getEngine(ua) {
        if (ua.includes('WebKit')) {
            if (ua.includes('Blink')) return 'Blink';
            return 'WebKit';
        }
        if (ua.includes('Gecko')) return 'Gecko';
        if (ua.includes('Trident')) return 'Trident';
        if (ua.includes('EdgeHTML')) return 'EdgeHTML';
        return 'Unknown';
    }

    /**
     * 测试CSS属性支持
     */
    testCSSProperty(property, value) {
        const element = document.createElement('div');
        const originalValue = element.style[property];
        
        try {
            element.style[property] = value;
            return element.style[property] !== originalValue;
        } catch (e) {
            return false;
        }
    }

    /**
     * 运行所有测试
     */
    runAllTests() {
        for (const [categoryName, tests] of Object.entries(this.featureCategories)) {
            const categoryResults = new Map();
            
            for (const [testName, testFunction] of Object.entries(tests)) {
                try {
                    const result = testFunction();
                    categoryResults.set(testName, {
                        supported: result,
                        status: result ? 'supported' : 'not-supported'
                    });
                } catch (error) {
                    categoryResults.set(testName, {
                        supported: false,
                        status: 'not-supported',
                        error: error.message
                    });
                }
            }
            
            this.testResults.set(categoryName, categoryResults);
        }
    }

    /**
     * 显示测试结果
     */
    displayResults() {
        this.displayBrowserInfo();
        this.displayFeatureTests();
        this.displaySummary();
    }

    /**
     * 显示浏览器信息
     */
    displayBrowserInfo() {
        const container = document.getElementById('browser-info-grid');
        
        const html = Object.entries(this.browserInfo).map(([key, value]) => `
            <div class="info-item">
                <div class="info-label">${key}</div>
                <div class="info-value">${value}</div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }

    /**
     * 显示功能测试结果
     */
    displayFeatureTests() {
        const container = document.getElementById('feature-tests');
        
        const html = Array.from(this.testResults.entries()).map(([categoryName, tests]) => `
            <div class="feature-category">
                <div class="category-header">${categoryName}</div>
                <div class="feature-grid">
                    ${Array.from(tests.entries()).map(([testName, result]) => `
                        <div class="feature-item">
                            <div>
                                <div class="feature-name">${testName}</div>
                                ${result.error ? `<div class="feature-description">错误: ${result.error}</div>` : ''}
                            </div>
                            <div class="feature-status status-${result.status}">
                                ${this.getStatusText(result.status)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }

    /**
     * 获取状态文本
     */
    getStatusText(status) {
        const statusTexts = {
            'supported': '支持',
            'not-supported': '不支持',
            'partial': '部分支持'
        };
        return statusTexts[status] || '未知';
    }

    /**
     * 显示摘要信息
     */
    displaySummary() {
        const stats = this.calculateStats();
        
        // 显示兼容性评分
        const scoreCircle = document.getElementById('score-circle');
        const scoreText = document.getElementById('score-text');
        const scoreDescription = document.getElementById('score-description');
        
        scoreText.textContent = stats.score;
        scoreDescription.textContent = stats.description;
        
        // 设置评分颜色
        scoreCircle.className = `score-circle ${stats.scoreClass}`;
        
        // 显示统计信息
        const statsContainer = document.getElementById('summary-stats');
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${stats.totalFeatures}</div>
                <div class="stat-label">总功能数</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.supportedFeatures}</div>
                <div class="stat-label">支持功能</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.unsupportedFeatures}</div>
                <div class="stat-label">不支持功能</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.supportPercentage}%</div>
                <div class="stat-label">支持率</div>
            </div>
        `;
    }

    /**
     * 计算统计信息
     */
    calculateStats() {
        let totalFeatures = 0;
        let supportedFeatures = 0;
        
        for (const tests of this.testResults.values()) {
            for (const result of tests.values()) {
                totalFeatures++;
                if (result.supported) {
                    supportedFeatures++;
                }
            }
        }
        
        const unsupportedFeatures = totalFeatures - supportedFeatures;
        const supportPercentage = totalFeatures > 0 ? Math.round((supportedFeatures / totalFeatures) * 100) : 0;
        
        let scoreClass, description;
        if (supportPercentage >= 90) {
            scoreClass = 'score-excellent';
            description = '优秀 - 浏览器兼容性极佳';
        } else if (supportPercentage >= 80) {
            scoreClass = 'score-good';
            description = '良好 - 浏览器兼容性较好';
        } else if (supportPercentage >= 60) {
            scoreClass = 'score-fair';
            description = '一般 - 部分功能可能不可用';
        } else {
            scoreClass = 'score-poor';
            description = '较差 - 建议升级浏览器';
        }
        
        return {
            totalFeatures,
            supportedFeatures,
            unsupportedFeatures,
            supportPercentage,
            score: supportPercentage,
            scoreClass,
            description
        };
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        document.getElementById('rerun-test-btn').addEventListener('click', () => {
            this.runAllTests();
            this.displayResults();
        });

        document.getElementById('export-report-btn').addEventListener('click', () => {
            this.exportReport();
        });

        document.getElementById('share-results-btn').addEventListener('click', () => {
            this.shareResults();
        });
    }

    /**
     * 导出报告
     */
    exportReport() {
        const stats = this.calculateStats();
        const report = {
            timestamp: new Date().toISOString(),
            browserInfo: this.browserInfo,
            testResults: this.convertMapToObject(this.testResults),
            summary: stats,
            recommendations: this.generateRecommendations(stats)
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `browser-compatibility-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 转换Map为普通对象
     */
    convertMapToObject(map) {
        const obj = {};
        for (const [key, value] of map.entries()) {
            if (value instanceof Map) {
                obj[key] = this.convertMapToObject(value);
            } else {
                obj[key] = value;
            }
        }
        return obj;
    }

    /**
     * 生成建议
     */
    generateRecommendations(stats) {
        const recommendations = [];
        
        if (stats.supportPercentage < 80) {
            recommendations.push({
                type: 'browser-upgrade',
                title: '建议升级浏览器',
                description: '当前浏览器对现代Web标准的支持不够完善，建议升级到最新版本。'
            });
        }

        // 检查关键功能支持
        const criticalFeatures = ['Fetch API', 'LocalStorage', 'Flexbox', 'CSS Variables'];
        const unsupportedCritical = [];
        
        for (const [categoryName, tests] of this.testResults.entries()) {
            for (const [testName, result] of tests.entries()) {
                if (criticalFeatures.includes(testName) && !result.supported) {
                    unsupportedCritical.push(testName);
                }
            }
        }

        if (unsupportedCritical.length > 0) {
            recommendations.push({
                type: 'critical-features',
                title: '关键功能不支持',
                description: `以下关键功能不被支持: ${unsupportedCritical.join(', ')}。这可能影响网站的正常使用。`
            });
        }

        return recommendations;
    }

    /**
     * 分享结果
     */
    shareResults() {
        const stats = this.calculateStats();
        const shareText = `我的浏览器兼容性测试结果：
浏览器：${this.browserInfo['Browser Name']} ${this.browserInfo['Browser Version']}
兼容性评分：${stats.score}分
支持功能：${stats.supportedFeatures}/${stats.totalFeatures} (${stats.supportPercentage}%)

测试地址：${window.location.href}`;

        if (navigator.share) {
            navigator.share({
                title: 'US Game Hub 浏览器兼容性测试结果',
                text: shareText,
                url: window.location.href
            }).catch(err => {
                console.log('分享失败:', err);
                this.fallbackShare(shareText);
            });
        } else {
            this.fallbackShare(shareText);
        }
    }

    /**
     * 备用分享方法
     */
    fallbackShare(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                alert('测试结果已复制到剪贴板');
            }).catch(() => {
                this.showShareDialog(text);
            });
        } else {
            this.showShareDialog(text);
        }
    }

    /**
     * 显示分享对话框
     */
    showShareDialog(text) {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        dialog.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; max-width: 500px; width: 90%;">
                <h3>分享测试结果</h3>
                <textarea readonly style="width: 100%; height: 150px; margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">${text}</textarea>
                <div style="text-align: right;">
                    <button onclick="this.closest('div').parentNode.remove()" style="padding: 8px 16px; border: none; background: #6c757d; color: white; border-radius: 4px; cursor: pointer;">关闭</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
    }
}

// 初始化兼容性测试器
document.addEventListener('DOMContentLoaded', () => {
    new BrowserCompatibilityTester();
});