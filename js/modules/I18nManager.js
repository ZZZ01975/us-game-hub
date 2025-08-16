/**
 * 国际化管理器 (Internationalization Manager)
 * 负责多语言支持功能，包括语言文件加载、文本替换、语言切换等
 */

// 延迟导入SEO管理器以避免循环依赖
let seoManager = null;

class I18nManager {
    constructor() {
        // 支持的语言列表
        this.supportedLanguages = ['en', 'zh', 'es', 'fr'];
        
        // 默认语言
        this.defaultLanguage = 'en';
        
        // 当前语言
        this.currentLanguage = this.getStoredLanguage() || this.defaultLanguage;
        
        // 语言数据缓存
        this.languageData = {};
        
        // 语言文件路径模板
        this.languageFilePath = 'languages/{lang}.json';
        
        // 初始化
        this.init();
    }

    /**
     * 初始化国际化管理器
     */
    async init() {
        try {
            // 加载当前语言文件
            await this.loadLanguage(this.currentLanguage);
            
            // 应用语言到页面
            this.applyLanguage();
            
            // 设置语言选择器
            this.setupLanguageSelector();
            
            // 通知GameManager当前语言
            if (window.gameManager && typeof window.gameManager.setCurrentLanguage === 'function') {
                window.gameManager.setCurrentLanguage(this.currentLanguage);
            }
            
            console.log(`I18n initialized with language: ${this.currentLanguage}`);
        } catch (error) {
            console.error('Failed to initialize I18n:', error);
            // 如果当前语言加载失败，尝试加载默认语言
            if (this.currentLanguage !== this.defaultLanguage) {
                await this.loadLanguage(this.defaultLanguage);
                this.currentLanguage = this.defaultLanguage;
                this.applyLanguage();
            }
        }
    }

    /**
     * 加载指定语言的文件
     * @param {string} language - 语言代码
     */
    async loadLanguage(language) {
        if (this.languageData[language]) {
            return this.languageData[language];
        }

        try {
            const filePath = this.languageFilePath.replace('{lang}', language);
            const response = await fetch(filePath);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.languageData[language] = data;
            
            console.log(`Language file loaded: ${language}`);
            return data;
        } catch (error) {
            console.error(`Failed to load language file: ${language}`, error);
            throw error;
        }
    }

    /**
     * 获取存储的语言偏好
     */
    getStoredLanguage() {
        try {
            return localStorage.getItem('preferred-language');
        } catch (error) {
            console.warn('Failed to get stored language:', error);
            return null;
        }
    }

    /**
     * 存储语言偏好
     * @param {string} language - 语言代码
     */
    storeLanguage(language) {
        try {
            localStorage.setItem('preferred-language', language);
        } catch (error) {
            console.warn('Failed to store language preference:', error);
        }
    }

    /**
     * 切换语言
     * @param {string} language - 目标语言代码
     */
    async switchLanguage(language) {
        if (!this.supportedLanguages.includes(language)) {
            console.warn(`Unsupported language: ${language}`);
            return;
        }

        if (language === this.currentLanguage) {
            return;
        }

        try {
            // 显示加载状态
            this.showLoadingState();
            
            // 加载新语言文件
            await this.loadLanguage(language);
            
            // 更新当前语言
            this.currentLanguage = language;
            
            // 存储语言偏好
            this.storeLanguage(language);
            
            // 应用新语言
            this.applyLanguage();
            
            // 更新语言选择器
            this.updateLanguageSelector();
            
            // 更新页面meta标签
            this.updateMetaTags();
            
            // 更新SEO管理器的语言设置
            if (!seoManager) {
                // 延迟导入SEO管理器
                const { default: SEOManager } = await import('./SEOManager.js');
                seoManager = SEOManager;
            }
            seoManager.setCurrentLanguage(language);
            
            // 隐藏加载状态
            this.hideLoadingState();
            
            console.log(`Language switched to: ${language}`);
            
            // 触发语言切换事件
            this.dispatchLanguageChangeEvent(language);
            
            // 调用应用程序的语言切换处理方法
            if (window.app && typeof window.app.handleLanguageChange === 'function') {
                window.app.handleLanguageChange(language);
            }
            
        } catch (error) {
            console.error(`Failed to switch language to ${language}:`, error);
            this.hideLoadingState();
        }
    }

    /**
     * 获取翻译文本
     * @param {string} key - 翻译键，支持点号分隔的嵌套键
     * @param {string} fallback - 备用文本
     */
    getText(key, fallback = key) {
        const data = this.languageData[this.currentLanguage];
        if (!data) {
            return fallback;
        }

        // 支持嵌套键，如 'nav.home'
        const keys = key.split('.');
        let value = data;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return fallback;
            }
        }
        
        return typeof value === 'string' ? value : fallback;
    }

    /**
     * 应用语言到页面元素
     */
    applyLanguage() {
        // 查找所有带有 data-i18n 属性的元素
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const text = this.getText(key);
            
            // 根据元素类型设置文本
            if (element.tagName === 'INPUT' && element.type === 'text') {
                element.placeholder = text;
            } else if (element.tagName === 'INPUT' && element.type === 'submit') {
                element.value = text;
            } else if (element.tagName === 'IMG') {
                element.alt = text;
            } else {
                element.textContent = text;
            }
        });

        // 更新页面标题
        const titleKey = document.documentElement.getAttribute('data-i18n-title');
        if (titleKey) {
            document.title = this.getText(titleKey);
        }
    }

    /**
     * 设置语言选择器
     */
    setupLanguageSelector() {
        const languageBtn = document.getElementById('language-btn');
        const languageDropdown = document.getElementById('language-dropdown');
        const languageSelector = document.querySelector('.language-selector');
        
        if (!languageBtn || !languageDropdown) {
            console.warn('Language selector elements not found');
            return;
        }

        // 设置当前语言的显示
        this.updateLanguageDisplay();
        
        // 语言按钮点击事件
        languageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            languageSelector.classList.toggle('open');
        });
        
        // 语言选项点击事件
        document.querySelectorAll('.language-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const lang = option.getAttribute('data-lang');
                this.switchLanguage(lang);
            });
        });

        // 点击外部关闭下拉菜单
        document.addEventListener('click', (e) => {
            if (!languageSelector.contains(e.target)) {
                languageSelector.classList.remove('open');
            }
        });
    }

    /**
     * 更新语言选择器的选中状态
     */
    updateLanguageSelector() {
        this.updateLanguageDisplay();
        
        // 关闭下拉菜单
        const languageSelector = document.querySelector('.language-selector');
        if (languageSelector) {
            languageSelector.classList.remove('open');
        }
    }

    /**
     * 更新语言显示
     */
    updateLanguageDisplay() {
        const languageText = document.querySelector('.language-text');
        const languageOptions = document.querySelectorAll('.language-option');
        
        // 语言名称映射
        const languageNames = {
            'en': 'English',
            'zh': '中文',
            'es': 'Español',
            'fr': 'Français'
        };
        
        // 更新按钮文本
        if (languageText) {
            languageText.textContent = languageNames[this.currentLanguage] || 'English';
        }
        
        // 更新激活状态
        languageOptions.forEach(option => {
            const lang = option.getAttribute('data-lang');
            if (lang === this.currentLanguage) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }

    /**
     * 更新页面meta标签
     */
    updateMetaTags() {
        const data = this.languageData[this.currentLanguage];
        if (!data || !data.meta) {
            return;
        }

        // 更新title
        if (data.meta.title) {
            document.title = data.meta.title;
        }

        // 更新description
        const descriptionMeta = document.querySelector('meta[name="description"]');
        if (descriptionMeta && data.meta.description) {
            descriptionMeta.setAttribute('content', data.meta.description);
        }

        // 更新keywords
        const keywordsMeta = document.querySelector('meta[name="keywords"]');
        if (keywordsMeta && data.meta.keywords) {
            keywordsMeta.setAttribute('content', data.meta.keywords);
        }

        // 更新语言属性
        document.documentElement.setAttribute('lang', this.currentLanguage);
    }

    /**
     * 显示加载状态
     */
    showLoadingState() {
        const selector = document.getElementById('language-select');
        if (selector) {
            selector.disabled = true;
        }
        
        // 可以添加加载动画或提示
        document.body.classList.add('language-switching');
    }

    /**
     * 隐藏加载状态
     */
    hideLoadingState() {
        const selector = document.getElementById('language-select');
        if (selector) {
            selector.disabled = false;
        }
        
        document.body.classList.remove('language-switching');
    }

    /**
     * 触发语言切换事件
     * @param {string} language - 新语言代码
     */
    dispatchLanguageChangeEvent(language) {
        const event = new CustomEvent('languageChanged', {
            detail: { 
                language: language,
                previousLanguage: this.currentLanguage 
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * 获取当前语言
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * 获取支持的语言列表
     */
    getSupportedLanguages() {
        return [...this.supportedLanguages];
    }

    /**
     * 检查是否支持指定语言
     * @param {string} language - 语言代码
     */
    isLanguageSupported(language) {
        return this.supportedLanguages.includes(language);
    }

    /**
     * 预加载所有语言文件
     */
    async preloadAllLanguages() {
        const promises = this.supportedLanguages.map(lang => 
            this.loadLanguage(lang).catch(error => {
                console.warn(`Failed to preload language: ${lang}`, error);
            })
        );
        
        await Promise.all(promises);
        console.log('All language files preloaded');
    }
}

// 导出类供其他模块使用
window.I18nManager = I18nManager;

// ES6模块导出
export { I18nManager };
export default I18nManager;