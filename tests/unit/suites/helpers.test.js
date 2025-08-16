/**
 * 工具函数测试套件
 * 测试 js/utils/helpers.js 中的工具函数
 */

// 模拟导入helpers模块（在实际环境中会通过模块系统导入）
const mockHelpers = {
    // 防抖函数
    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    // 节流函数
    throttle(func, delay) {
        let lastCall = 0;
        return function (...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                return func.apply(this, args);
            }
        };
    },

    // 获取URL参数
    getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    },

    // 本地存储操作
    storage: {
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('获取本地存储数据失败:', error);
                return defaultValue;
            }
        },

        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (error) {
                console.error('设置本地存储数据失败:', error);
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.error('删除本地存储数据失败:', error);
            }
        },

        clear() {
            try {
                localStorage.clear();
            } catch (error) {
                console.error('清空本地存储失败:', error);
            }
        }
    },

    // 格式化日期
    formatDate(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },

    // 深拷贝对象
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    },

    // 检查是否为移动设备
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    // 转义HTML字符
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // 高亮搜索关键词
    highlightKeyword(text, keyword) {
        if (!keyword || !text) return this.escapeHtml(text);
        
        const escapedText = this.escapeHtml(text);
        
        // 分割关键词，支持多个关键词搜索
        const keywords = keyword.trim().split(/\s+/).filter(word => word.length > 0);
        
        if (keywords.length === 0) return escapedText;
        
        // 创建正则表达式，匹配所有关键词
        const escapedKeywords = keywords.map(word => 
            word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // 转义正则特殊字符
        );
        
        const regex = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');
        
        return escapedText.replace(regex, '<mark class="search-highlight">$1</mark>');
    }
};

describe('工具函数测试', () => {
    let callCount;
    let testFunction;

    beforeEach(() => {
        callCount = 0;
        testFunction = () => {
            callCount++;
            return callCount;
        };
    });

    describe('防抖函数 (debounce)', () => {
        it('应该延迟执行函数', async () => {
            const debouncedFn = mockHelpers.debounce(testFunction, 100);
            
            // 快速调用多次
            debouncedFn();
            debouncedFn();
            debouncedFn();
            
            // 立即检查，函数不应该被调用
            expect.toBe(callCount, 0, '防抖函数应该延迟执行');
            
            // 等待延迟时间
            await new Promise(resolve => setTimeout(resolve, 150));
            
            // 现在函数应该被调用一次
            expect.toBe(callCount, 1, '防抖函数应该只执行一次');
        });

        it('应该取消之前的调用', async () => {
            const debouncedFn = mockHelpers.debounce(testFunction, 100);
            
            debouncedFn();
            await new Promise(resolve => setTimeout(resolve, 50));
            debouncedFn(); // 这应该取消之前的调用
            
            await new Promise(resolve => setTimeout(resolve, 150));
            
            expect.toBe(callCount, 1, '应该只执行最后一次调用');
        });
    });

    describe('节流函数 (throttle)', () => {
        it('应该限制函数执行频率', async () => {
            const throttledFn = mockHelpers.throttle(testFunction, 100);
            
            // 快速调用多次
            throttledFn();
            throttledFn();
            throttledFn();
            
            // 第一次调用应该立即执行
            expect.toBe(callCount, 1, '节流函数应该立即执行第一次调用');
            
            // 等待一段时间后再次调用
            await new Promise(resolve => setTimeout(resolve, 150));
            throttledFn();
            
            expect.toBe(callCount, 2, '节流函数应该在延迟后允许再次执行');
        });
    });

    describe('本地存储操作', () => {
        beforeEach(() => {
            // 清空localStorage
            localStorage.clear();
        });

        it('应该能够存储和获取数据', () => {
            const testData = { name: '测试', value: 123 };
            
            mockHelpers.storage.set('test-key', testData);
            const retrieved = mockHelpers.storage.get('test-key');
            
            expect.toBe(JSON.stringify(retrieved), JSON.stringify(testData), '应该能够正确存储和获取对象');
        });

        it('应该返回默认值当键不存在时', () => {
            const defaultValue = '默认值';
            const result = mockHelpers.storage.get('non-existent-key', defaultValue);
            
            expect.toBe(result, defaultValue, '应该返回默认值');
        });

        it('应该能够删除数据', () => {
            mockHelpers.storage.set('test-key', '测试数据');
            mockHelpers.storage.remove('test-key');
            
            const result = mockHelpers.storage.get('test-key', null);
            expect.toBe(result, null, '删除后应该返回null');
        });

        it('应该能够清空所有数据', () => {
            mockHelpers.storage.set('key1', 'value1');
            mockHelpers.storage.set('key2', 'value2');
            
            mockHelpers.storage.clear();
            
            expect.toBe(mockHelpers.storage.get('key1'), null, '清空后key1应该为null');
            expect.toBe(mockHelpers.storage.get('key2'), null, '清空后key2应该为null');
        });
    });

    describe('日期格式化', () => {
        it('应该正确格式化日期', () => {
            const date = new Date('2024-01-15T10:30:45');
            
            const result = mockHelpers.formatDate(date, 'YYYY-MM-DD');
            expect.toBe(result, '2024-01-15', '应该正确格式化为YYYY-MM-DD');
        });

        it('应该支持时间格式化', () => {
            const date = new Date('2024-01-15T10:30:45');
            
            const result = mockHelpers.formatDate(date, 'YYYY-MM-DD HH:mm:ss');
            expect.toBe(result, '2024-01-15 10:30:45', '应该正确格式化包含时间');
        });

        it('应该处理无效日期', () => {
            const result = mockHelpers.formatDate('invalid-date');
            expect.toBe(result, '', '无效日期应该返回空字符串');
        });
    });

    describe('深拷贝功能', () => {
        it('应该深拷贝简单对象', () => {
            const original = { a: 1, b: '测试', c: true };
            const cloned = mockHelpers.deepClone(original);
            
            expect.toBe(JSON.stringify(cloned), JSON.stringify(original), '深拷贝应该复制所有属性');
            
            // 修改原对象不应该影响拷贝
            original.a = 999;
            expect.toBe(cloned.a, 1, '修改原对象不应该影响拷贝');
        });

        it('应该深拷贝嵌套对象', () => {
            const original = {
                user: { name: '张三', age: 25 },
                items: [1, 2, 3]
            };
            const cloned = mockHelpers.deepClone(original);
            
            // 修改嵌套对象
            original.user.name = '李四';
            original.items.push(4);
            
            expect.toBe(cloned.user.name, '张三', '嵌套对象应该被深拷贝');
            expect.toHaveLength(cloned.items, 3, '嵌套数组应该被深拷贝');
        });

        it('应该处理null和基本类型', () => {
            expect.toBe(mockHelpers.deepClone(null), null, '应该正确处理null');
            expect.toBe(mockHelpers.deepClone(123), 123, '应该正确处理数字');
            expect.toBe(mockHelpers.deepClone('测试'), '测试', '应该正确处理字符串');
        });
    });

    describe('HTML转义功能', () => {
        it('应该转义HTML特殊字符', () => {
            const html = '<script>alert("xss")</script>';
            const escaped = mockHelpers.escapeHtml(html);
            
            expect.toBeTruthy(escaped.includes('&lt;'), '应该转义小于号');
            expect.toBeTruthy(escaped.includes('&gt;'), '应该转义大于号');
            expect.toBeTruthy(!escaped.includes('<script>'), '不应该包含原始script标签');
        });

        it('应该处理空字符串', () => {
            const result = mockHelpers.escapeHtml('');
            expect.toBe(result, '', '空字符串应该返回空字符串');
        });
    });

    describe('关键词高亮功能', () => {
        it('应该高亮单个关键词', () => {
            const text = '这是一个测试文本';
            const keyword = '测试';
            const result = mockHelpers.highlightKeyword(text, keyword);
            
            expect.toBeTruthy(result.includes('<mark class="search-highlight">测试</mark>'), 
                '应该包含高亮标记');
        });

        it('应该高亮多个关键词', () => {
            const text = '这是一个测试文本，包含多个关键词';
            const keyword = '测试 关键词';
            const result = mockHelpers.highlightKeyword(text, keyword);
            
            expect.toBeTruthy(result.includes('<mark class="search-highlight">测试</mark>'), 
                '应该高亮第一个关键词');
            expect.toBeTruthy(result.includes('<mark class="search-highlight">关键词</mark>'), 
                '应该高亮第二个关键词');
        });

        it('应该处理空关键词', () => {
            const text = '测试文本';
            const result = mockHelpers.highlightKeyword(text, '');
            
            expect.toBeTruthy(!result.includes('<mark'), '空关键词不应该产生高亮');
        });

        it('应该转义HTML内容', () => {
            const text = '<script>alert("test")</script>';
            const keyword = 'script';
            const result = mockHelpers.highlightKeyword(text, keyword);
            
            expect.toBeTruthy(!result.includes('<script>'), '应该转义HTML标签');
            expect.toBeTruthy(result.includes('&lt;'), '应该包含转义字符');
        });
    });
});