/**
 * 简单的测试框架
 * 用于运行单元测试
 */

class TestFramework {
    constructor() {
        this.suites = new Map();
        this.currentSuite = null;
        this.stats = {
            total: 0,
            passed: 0,
            failed: 0,
            duration: 0
        };
        this.startTime = 0;
    }

    /**
     * 创建测试套件
     * @param {string} name - 套件名称
     * @param {Function} callback - 测试回调函数
     */
    describe(name, callback) {
        const suite = {
            name,
            tests: [],
            beforeEach: null,
            afterEach: null,
            beforeAll: null,
            afterAll: null
        };
        
        this.suites.set(name, suite);
        this.currentSuite = suite;
        
        // 执行测试定义
        callback();
        
        this.currentSuite = null;
    }

    /**
     * 定义测试用例
     * @param {string} name - 测试名称
     * @param {Function} callback - 测试函数
     */
    it(name, callback) {
        if (!this.currentSuite) {
            throw new Error('测试用例必须在describe块中定义');
        }
        
        this.currentSuite.tests.push({
            name,
            callback,
            status: 'pending',
            error: null,
            duration: 0
        });
    }

    /**
     * 设置每个测试前的钩子
     * @param {Function} callback - 钩子函数
     */
    beforeEach(callback) {
        if (this.currentSuite) {
            this.currentSuite.beforeEach = callback;
        }
    }

    /**
     * 设置每个测试后的钩子
     * @param {Function} callback - 钩子函数
     */
    afterEach(callback) {
        if (this.currentSuite) {
            this.currentSuite.afterEach = callback;
        }
    }

    /**
     * 设置套件开始前的钩子
     * @param {Function} callback - 钩子函数
     */
    beforeAll(callback) {
        if (this.currentSuite) {
            this.currentSuite.beforeAll = callback;
        }
    }

    /**
     * 设置套件结束后的钩子
     * @param {Function} callback - 钩子函数
     */
    afterAll(callback) {
        if (this.currentSuite) {
            this.currentSuite.afterAll = callback;
        }
    }

    /**
     * 运行所有测试
     */
    async runAll() {
        this.startTime = performance.now();
        this.stats = { total: 0, passed: 0, failed: 0, duration: 0 };
        
        // 计算总测试数
        for (const suite of this.suites.values()) {
            this.stats.total += suite.tests.length;
        }
        
        this.updateStats();
        this.showLoading('运行测试中...');
        
        // 运行所有套件
        for (const [suiteName, suite] of this.suites) {
            await this.runSuite(suiteName, suite);
        }
        
        this.stats.duration = Math.round(performance.now() - this.startTime);
        this.updateStats();
        this.hideLoading();
    }

    /**
     * 运行单个测试套件
     * @param {string} suiteName - 套件名称
     * @param {Object} suite - 套件对象
     */
    async runSuite(suiteName, suite) {
        console.log(`运行测试套件: ${suiteName}`);
        
        try {
            // 运行beforeAll钩子
            if (suite.beforeAll) {
                await suite.beforeAll();
            }
            
            // 运行所有测试
            for (const test of suite.tests) {
                await this.runTest(suite, test);
                this.updateTestDisplay(suiteName, test);
                this.updateStats();
                
                // 小延迟以显示进度
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            // 运行afterAll钩子
            if (suite.afterAll) {
                await suite.afterAll();
            }
            
        } catch (error) {
            console.error(`测试套件 ${suiteName} 运行失败:`, error);
        }
    }

    /**
     * 运行单个测试
     * @param {Object} suite - 测试套件
     * @param {Object} test - 测试对象
     */
    async runTest(suite, test) {
        const testStart = performance.now();
        
        try {
            // 运行beforeEach钩子
            if (suite.beforeEach) {
                await suite.beforeEach();
            }
            
            // 运行测试
            await test.callback();
            
            // 运行afterEach钩子
            if (suite.afterEach) {
                await suite.afterEach();
            }
            
            test.status = 'pass';
            test.error = null;
            this.stats.passed++;
            
        } catch (error) {
            test.status = 'fail';
            test.error = error;
            this.stats.failed++;
            console.error(`测试失败: ${test.name}`, error);
        }
        
        test.duration = Math.round(performance.now() - testStart);
    }

    /**
     * 更新统计信息显示
     */
    updateStats() {
        document.getElementById('total-tests').textContent = this.stats.total;
        document.getElementById('passed-tests').textContent = this.stats.passed;
        document.getElementById('failed-tests').textContent = this.stats.failed;
        document.getElementById('test-duration').textContent = this.stats.duration + 'ms';
        
        // 更新进度条
        const progress = this.stats.total > 0 ? 
            ((this.stats.passed + this.stats.failed) / this.stats.total) * 100 : 0;
        document.getElementById('progress-fill').style.width = progress + '%';
    }

    /**
     * 更新测试显示
     * @param {string} suiteName - 套件名称
     * @param {Object} test - 测试对象
     */
    updateTestDisplay(suiteName, test) {
        let suiteElement = document.getElementById(`suite-${this.sanitizeId(suiteName)}`);
        
        if (!suiteElement) {
            suiteElement = this.createSuiteElement(suiteName);
        }
        
        const testElement = this.createTestElement(test);
        const testsContainer = suiteElement.querySelector('.suite-tests');
        testsContainer.appendChild(testElement);
    }

    /**
     * 创建套件元素
     * @param {string} suiteName - 套件名称
     * @returns {HTMLElement} 套件元素
     */
    createSuiteElement(suiteName) {
        const suiteId = this.sanitizeId(suiteName);
        const suite = this.suites.get(suiteName);
        
        const suiteElement = document.createElement('div');
        suiteElement.className = 'test-suite';
        suiteElement.id = `suite-${suiteId}`;
        
        suiteElement.innerHTML = `
            <div class="suite-header" onclick="TestRunner.toggleSuite('${suiteId}')">
                <span>${suiteName} (${suite.tests.length} 测试)</span>
                <span class="suite-toggle" id="toggle-${suiteId}">▼</span>
            </div>
            <div class="suite-tests" id="tests-${suiteId}"></div>
        `;
        
        const resultsContainer = document.getElementById('test-results');
        resultsContainer.appendChild(suiteElement);
        
        return suiteElement;
    }

    /**
     * 创建测试元素
     * @param {Object} test - 测试对象
     * @returns {HTMLElement} 测试元素
     */
    createTestElement(test) {
        const testElement = document.createElement('div');
        testElement.className = 'test-case';
        
        const statusClass = test.status === 'pass' ? 'status-pass' : 
                           test.status === 'fail' ? 'status-fail' : 'status-pending';
        const statusText = test.status === 'pass' ? '通过' : 
                          test.status === 'fail' ? '失败' : '等待';
        
        testElement.innerHTML = `
            <div class="test-name">${test.name}</div>
            <div class="test-status ${statusClass}">${statusText} (${test.duration}ms)</div>
        `;
        
        if (test.error) {
            const errorElement = document.createElement('div');
            errorElement.className = 'test-error';
            errorElement.textContent = test.error.message || test.error.toString();
            testElement.appendChild(errorElement);
        }
        
        return testElement;
    }

    /**
     * 清理ID字符串
     * @param {string} str - 原始字符串
     * @returns {string} 清理后的字符串
     */
    sanitizeId(str) {
        return str.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    }

    /**
     * 显示加载状态
     * @param {string} message - 加载消息
     */
    showLoading(message = '加载中...') {
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
     * 切换套件显示
     * @param {string} suiteId - 套件ID
     */
    toggleSuite(suiteId) {
        const testsContainer = document.getElementById(`tests-${suiteId}`);
        const toggleIcon = document.getElementById(`toggle-${suiteId}`);
        
        if (testsContainer.style.display === 'none') {
            testsContainer.style.display = 'block';
            toggleIcon.textContent = '▼';
        } else {
            testsContainer.style.display = 'none';
            toggleIcon.textContent = '▶';
        }
    }

    /**
     * 清空测试结果
     */
    clearResults() {
        const resultsContainer = document.getElementById('test-results');
        resultsContainer.innerHTML = '';
        
        this.stats = { total: 0, passed: 0, failed: 0, duration: 0 };
        this.updateStats();
        
        // 重置所有测试状态
        for (const suite of this.suites.values()) {
            for (const test of suite.tests) {
                test.status = 'pending';
                test.error = null;
                test.duration = 0;
            }
        }
    }
}

// 断言函数
class Assertions {
    /**
     * 断言值为真
     * @param {*} value - 要检查的值
     * @param {string} message - 错误消息
     */
    static toBe(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `期望 ${actual} 等于 ${expected}`);
        }
    }

    /**
     * 断言值为真值
     * @param {*} value - 要检查的值
     * @param {string} message - 错误消息
     */
    static toBeTruthy(value, message) {
        if (!value) {
            throw new Error(message || `期望 ${value} 为真值`);
        }
    }

    /**
     * 断言值为假值
     * @param {*} value - 要检查的值
     * @param {string} message - 错误消息
     */
    static toBeFalsy(value, message) {
        if (value) {
            throw new Error(message || `期望 ${value} 为假值`);
        }
    }

    /**
     * 断言数组包含元素
     * @param {Array} array - 数组
     * @param {*} item - 要查找的元素
     * @param {string} message - 错误消息
     */
    static toContain(array, item, message) {
        if (!Array.isArray(array) || !array.includes(item)) {
            throw new Error(message || `期望数组包含 ${item}`);
        }
    }

    /**
     * 断言函数抛出错误
     * @param {Function} fn - 要测试的函数
     * @param {string} message - 错误消息
     */
    static toThrow(fn, message) {
        let threw = false;
        try {
            fn();
        } catch (error) {
            threw = true;
        }
        if (!threw) {
            throw new Error(message || '期望函数抛出错误');
        }
    }

    /**
     * 断言对象具有属性
     * @param {Object} obj - 对象
     * @param {string} prop - 属性名
     * @param {string} message - 错误消息
     */
    static toHaveProperty(obj, prop, message) {
        if (!obj || !obj.hasOwnProperty(prop)) {
            throw new Error(message || `期望对象具有属性 ${prop}`);
        }
    }

    /**
     * 断言数组长度
     * @param {Array} array - 数组
     * @param {number} length - 期望长度
     * @param {string} message - 错误消息
     */
    static toHaveLength(array, length, message) {
        if (!Array.isArray(array) || array.length !== length) {
            throw new Error(message || `期望数组长度为 ${length}，实际为 ${array ? array.length : 'undefined'}`);
        }
    }

    /**
     * 断言类型
     * @param {*} value - 值
     * @param {string} type - 期望类型
     * @param {string} message - 错误消息
     */
    static toBeType(value, type, message) {
        if (typeof value !== type) {
            throw new Error(message || `期望类型为 ${type}，实际为 ${typeof value}`);
        }
    }
}

// 创建全局测试框架实例
const testFramework = new TestFramework();

// 全局测试函数
window.describe = testFramework.describe.bind(testFramework);
window.it = testFramework.it.bind(testFramework);
window.beforeEach = testFramework.beforeEach.bind(testFramework);
window.afterEach = testFramework.afterEach.bind(testFramework);
window.beforeAll = testFramework.beforeAll.bind(testFramework);
window.afterAll = testFramework.afterAll.bind(testFramework);
window.expect = Assertions;

// 测试运行器
window.TestRunner = {
    init() {
        // 绑定按钮事件
        document.getElementById('run-all-btn').addEventListener('click', () => {
            testFramework.runAll();
        });
        
        document.getElementById('clear-results-btn').addEventListener('click', () => {
            testFramework.clearResults();
        });
        
        // 隐藏加载状态
        testFramework.hideLoading();
        
        console.log('测试运行器已初始化');
    },
    
    toggleSuite(suiteId) {
        testFramework.toggleSuite(suiteId);
    }
};