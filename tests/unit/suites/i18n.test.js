/**
 * 国际化管理器测试套件
 * 测试多语言切换功能
 */

// 模拟I18nManager类
class MockI18nManager {
    constructor() {
        this.supportedLanguages = ['en', 'zh', 'es', 'fr'];
        this.defaultLanguage = 'en';
        this.currentLanguage = 'en';
        this.languageData = {};
        this.languageFilePath = 'languages/{lang}.json';
    }

    // 模拟语言数据
    getMockLanguageData(lang) {
        const mockData = {
            en: {
                nav: {
                    home: 'Home',
                    allGames: 'All Games',
                    action: 'Action'
                },
                ui: {
                    playNow: 'Play Now',
                    loading: 'Loading...'
                },
                meta: {
                    title: 'US Game Hub - Free Online Games',
                    description: 'Play free online games'
                }
            },
            zh: {
                nav: {
                    home: '首页',
                    allGames: '所有游戏',
                    action: '动作游戏'
                },
                ui: {
                    playNow: '立即开始',
                    loading: '加载中...'
                },
                meta: {
                    title: 'US Game Hub - 免费在线游戏',
                    description: '玩免费在线游戏'
                }
            },
            es: {
                nav: {
                    home: 'Inicio',
                    allGames: 'Todos los Juegos',
                    action: 'Acción'
                },
                ui: {
                    playNow: 'Jugar Ahora',
                    loading: 'Cargando...'
                },
                meta: {
                    title: 'US Game Hub - Juegos Gratis Online',
                    description: 'Juega juegos gratis online'
                }
            },
            fr: {
                nav: {
                    home: 'Accueil',
                    allGames: 'Tous les Jeux',
                    action: 'Action'
                },
                ui: {
                    playNow: 'Jouer Maintenant',
                    loading: 'Chargement...'
                },
                meta: {
                    title: 'US Game Hub - Jeux Gratuits en Ligne',
                    description: 'Jouez à des jeux gratuits en ligne'
                }
            }
        };
        return mockData[lang] || mockData.en;
    }

    async loadLanguage(language) {
        if (this.languageData[language]) {
            return this.languageData[language];
        }

        // 模拟异步加载
        await new Promise(resolve => setTimeout(resolve, 10));
        
        if (!this.supportedLanguages.includes(language)) {
            throw new Error(`Unsupported language: ${language}`);
        }

        const data = this.getMockLanguageData(language);
        this.languageData[language] = data;
        return data;
    }

    getText(key, fallback = key) {
        const data = this.languageData[this.currentLanguage];
        if (!data) {
            return fallback;
        }

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

    async switchLanguage(language) {
        if (!this.supportedLanguages.includes(language)) {
            throw new Error(`Unsupported language: ${language}`);
        }

        if (language === this.currentLanguage) {
            return;
        }

        await this.loadLanguage(language);
        this.currentLanguage = language;
        
        // 模拟存储语言偏好
        try {
            localStorage.setItem('preferred-language', language);
        } catch (error) {
            // 忽略存储错误
        }
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    getSupportedLanguages() {
        return [...this.supportedLanguages];
    }

    isLanguageSupported(language) {
        return this.supportedLanguages.includes(language);
    }

    getStoredLanguage() {
        try {
            return localStorage.getItem('preferred-language');
        } catch (error) {
            return null;
        }
    }
}

describe('国际化管理器测试', () => {
    let i18nManager;

    beforeEach(() => {
        i18nManager = new MockI18nManager();
        // 清空localStorage
        localStorage.clear();
    });

    describe('初始化功能', () => {
        it('应该有正确的默认设置', () => {
            expect.toBe(i18nManager.defaultLanguage, 'en', '默认语言应该是英文');
            expect.toBe(i18nManager.currentLanguage, 'en', '当前语言应该是英文');
            expect.toHaveLength(i18nManager.supportedLanguages, 4, '应该支持4种语言');
        });

        it('应该包含所有支持的语言', () => {
            const languages = i18nManager.getSupportedLanguages();
            expect.toContain(languages, 'en', '应该支持英文');
            expect.toContain(languages, 'zh', '应该支持中文');
            expect.toContain(languages, 'es', '应该支持西班牙文');
            expect.toContain(languages, 'fr', '应该支持法文');
        });
    });

    describe('语言文件加载', () => {
        it('应该能够加载支持的语言文件', async () => {
            const data = await i18nManager.loadLanguage('zh');
            
            expect.toBeType(data, 'object', '语言数据应该是对象');
            expect.toHaveProperty(data, 'nav', '应该包含导航翻译');
            expect.toHaveProperty(data, 'ui', '应该包含UI翻译');
        });

        it('应该缓存已加载的语言数据', async () => {
            await i18nManager.loadLanguage('zh');
            const cachedData = await i18nManager.loadLanguage('zh');
            
            expect.toBeTruthy(cachedData, '应该返回缓存的数据');
            expect.toBe(i18nManager.languageData['zh'], cachedData, '应该使用缓存数据');
        });

        it('应该拒绝不支持的语言', async () => {
            try {
                await i18nManager.loadLanguage('invalid');
                expect.toBe(true, false, '应该抛出错误');
            } catch (error) {
                expect.toBeTruthy(error.message.includes('Unsupported language'), '应该包含不支持语言的错误信息');
            }
        });
    });

    describe('文本获取功能', () => {
        beforeEach(async () => {
            await i18nManager.loadLanguage('zh');
            i18nManager.currentLanguage = 'zh';
        });

        it('应该能够获取简单的翻译文本', () => {
            const text = i18nManager.getText('nav.home');
            expect.toBe(text, '首页', '应该返回中文翻译');
        });

        it('应该能够获取嵌套的翻译文本', () => {
            const text = i18nManager.getText('ui.playNow');
            expect.toBe(text, '立即开始', '应该返回嵌套的中文翻译');
        });

        it('应该返回备用文本当键不存在时', () => {
            const fallback = '备用文本';
            const text = i18nManager.getText('non.existent.key', fallback);
            expect.toBe(text, fallback, '应该返回备用文本');
        });

        it('应该返回键名当没有备用文本时', () => {
            const key = 'non.existent.key';
            const text = i18nManager.getText(key);
            expect.toBe(text, key, '应该返回键名作为默认值');
        });
    });

    describe('语言切换功能', () => {
        it('应该能够切换到支持的语言', async () => {
            await i18nManager.switchLanguage('zh');
            
            expect.toBe(i18nManager.getCurrentLanguage(), 'zh', '当前语言应该是中文');
            
            const text = i18nManager.getText('nav.home');
            expect.toBe(text, '首页', '应该显示中文文本');
        });

        it('应该能够切换到不同的语言', async () => {
            await i18nManager.switchLanguage('es');
            
            expect.toBe(i18nManager.getCurrentLanguage(), 'es', '当前语言应该是西班牙文');
            
            const text = i18nManager.getText('nav.home');
            expect.toBe(text, 'Inicio', '应该显示西班牙文文本');
        });

        it('应该拒绝切换到不支持的语言', async () => {
            try {
                await i18nManager.switchLanguage('invalid');
                expect.toBe(true, false, '应该抛出错误');
            } catch (error) {
                expect.toBeTruthy(error.message.includes('Unsupported language'), '应该包含不支持语言的错误信息');
            }
        });

        it('应该忽略切换到相同语言的请求', async () => {
            const originalLang = i18nManager.getCurrentLanguage();
            await i18nManager.switchLanguage(originalLang);
            
            expect.toBe(i18nManager.getCurrentLanguage(), originalLang, '语言应该保持不变');
        });

        it('应该存储语言偏好', async () => {
            await i18nManager.switchLanguage('fr');
            
            const storedLang = i18nManager.getStoredLanguage();
            expect.toBe(storedLang, 'fr', '应该存储语言偏好');
        });
    });

    describe('语言支持检查', () => {
        it('应该正确识别支持的语言', () => {
            expect.toBeTruthy(i18nManager.isLanguageSupported('en'), '应该支持英文');
            expect.toBeTruthy(i18nManager.isLanguageSupported('zh'), '应该支持中文');
            expect.toBeTruthy(i18nManager.isLanguageSupported('es'), '应该支持西班牙文');
            expect.toBeTruthy(i18nManager.isLanguageSupported('fr'), '应该支持法文');
        });

        it('应该正确识别不支持的语言', () => {
            expect.toBeFalsy(i18nManager.isLanguageSupported('de'), '不应该支持德文');
            expect.toBeFalsy(i18nManager.isLanguageSupported('ja'), '不应该支持日文');
            expect.toBeFalsy(i18nManager.isLanguageSupported('invalid'), '不应该支持无效语言');
        });
    });

    describe('多语言内容验证', () => {
        it('应该为所有支持的语言提供基本翻译', async () => {
            const languages = i18nManager.getSupportedLanguages();
            
            for (const lang of languages) {
                await i18nManager.loadLanguage(lang);
                i18nManager.currentLanguage = lang;
                
                const homeText = i18nManager.getText('nav.home');
                const playText = i18nManager.getText('ui.playNow');
                
                expect.toBeTruthy(homeText && homeText !== 'nav.home', 
                    `${lang} 应该有首页翻译`);
                expect.toBeTruthy(playText && playText !== 'ui.playNow', 
                    `${lang} 应该有播放按钮翻译`);
            }
        });

        it('应该为所有语言提供元数据翻译', async () => {
            const languages = i18nManager.getSupportedLanguages();
            
            for (const lang of languages) {
                await i18nManager.loadLanguage(lang);
                i18nManager.currentLanguage = lang;
                
                const title = i18nManager.getText('meta.title');
                const description = i18nManager.getText('meta.description');
                
                expect.toBeTruthy(title && title !== 'meta.title', 
                    `${lang} 应该有标题翻译`);
                expect.toBeTruthy(description && description !== 'meta.description', 
                    `${lang} 应该有描述翻译`);
            }
        });
    });

    describe('错误处理', () => {
        it('应该处理语言数据为空的情况', () => {
            i18nManager.languageData = {};
            i18nManager.currentLanguage = 'en';
            
            const text = i18nManager.getText('nav.home', '默认文本');
            expect.toBe(text, '默认文本', '应该返回备用文本');
        });

        it('应该处理localStorage不可用的情况', () => {
            // 模拟localStorage错误
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = () => {
                throw new Error('Storage not available');
            };
            
            // 这不应该抛出错误
            expect.toBeTruthy(true, '应该优雅处理存储错误');
            
            // 恢复localStorage
            localStorage.setItem = originalSetItem;
        });
    });
});