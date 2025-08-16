/**
 * 数据管理器测试套件
 * 测试游戏数据加载和处理逻辑
 */

// 模拟DataManager类
class MockDataManager {
    constructor() {
        this.gameData = null;
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5分钟缓存
        this.isLoading = false;
        this.loadPromise = null;
    }

    // 模拟游戏数据
    getMockGameData() {
        return {
            games: [
                {
                    id: 'game001',
                    title: {
                        en: 'Snake Game',
                        zh: '贪吃蛇游戏',
                        es: 'Juego de Serpiente',
                        fr: 'Jeu de Serpent'
                    },
                    description: {
                        en: 'Classic snake game',
                        zh: '经典贪吃蛇游戏',
                        es: 'Juego clásico de serpiente',
                        fr: 'Jeu de serpent classique'
                    },
                    category: 'arcade',
                    rating: 4.5,
                    playCount: 1250,
                    featured: true,
                    tags: ['classic', 'arcade'],
                    addedDate: '2024-01-15',
                    metadata: {
                        developer: 'US Game Hub',
                        version: '1.0'
                    }
                },
                {
                    id: 'game002',
                    title: {
                        en: 'Puzzle Master',
                        zh: '拼图大师',
                        es: 'Maestro de Rompecabezas',
                        fr: 'Maître du Puzzle'
                    },
                    description: {
                        en: 'Challenging puzzle game',
                        zh: '挑战性拼图游戏',
                        es: 'Juego de rompecabezas desafiante',
                        fr: 'Jeu de puzzle stimulant'
                    },
                    category: 'puzzle',
                    rating: 4.2,
                    playCount: 800,
                    featured: false,
                    tags: ['puzzle', 'brain'],
                    addedDate: '2024-01-10',
                    metadata: {
                        developer: 'Puzzle Studio',
                        version: '2.1'
                    }
                },
                {
                    id: 'game003',
                    title: {
                        en: 'Action Hero',
                        zh: '动作英雄',
                        es: 'Héroe de Acción',
                        fr: 'Héros d\'Action'
                    },
                    description: {
                        en: 'Fast-paced action game',
                        zh: '快节奏动作游戏',
                        es: 'Juego de acción trepidante',
                        fr: 'Jeu d\'action rapide'
                    },
                    category: 'action',
                    rating: 4.8,
                    playCount: 2100,
                    featured: true,
                    tags: ['action', 'hero', 'new'],
                    addedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2天前
                    metadata: {
                        developer: 'Action Games Inc',
                        version: '1.5'
                    }
                }
            ]
        };
    }

    async loadGameData(forceReload = false) {
        if (this.isLoading && this.loadPromise) {
            return this.loadPromise;
        }

        if (!forceReload && this.gameData && this.isCacheValid()) {
            return this.gameData;
        }

        this.isLoading = true;
        this.loadPromise = this._fetchGameData();

        try {
            const data = await this.loadPromise;
            this.gameData = data;
            this.updateCache('gameData', data);
            return data;
        } catch (error) {
            throw new Error('无法加载游戏数据，请检查网络连接');
        } finally {
            this.isLoading = false;
            this.loadPromise = null;
        }
    }

    async _fetchGameData() {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const data = this.getMockGameData();
        return this.processGameData(data);
    }

    processGameData(data) {
        data.games = data.games.map(game => {
            return {
                ...game,
                searchKeywords: this.generateSearchKeywords(game),
                popularityScore: this.calculatePopularityScore(game),
                isNew: this.isNewGame(game.addedDate),
                isHot: this.isHotGame(game.playCount)
            };
        });

        data.categoryIndex = this.createCategoryIndex(data.games);
        data.tagIndex = this.createTagIndex(data.games);
        data.statistics = this.generateStatistics(data.games);

        return data;
    }

    generateSearchKeywords(game) {
        const keywords = [];
        
        Object.values(game.title || {}).forEach(title => {
            keywords.push(title.toLowerCase());
        });
        
        Object.values(game.description || {}).forEach(desc => {
            keywords.push(desc.toLowerCase());
        });

        keywords.push(game.category);

        if (game.tags) {
            keywords.push(...game.tags.map(tag => tag.toLowerCase()));
        }

        if (game.metadata && game.metadata.developer) {
            keywords.push(game.metadata.developer.toLowerCase());
        }

        return keywords.join(' ');
    }

    calculatePopularityScore(game) {
        const rating = game.rating || 0;
        const playCount = game.playCount || 0;
        const featured = game.featured ? 1.2 : 1;
        
        return Math.round((rating * 20 + Math.log10(playCount + 1) * 10) * featured);
    }

    isNewGame(addedDate) {
        if (!addedDate) return false;
        const added = new Date(addedDate);
        const now = new Date();
        const daysDiff = (now - added) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
    }

    isHotGame(playCount) {
        return (playCount || 0) > 1000;
    }

    createCategoryIndex(games) {
        const index = {};
        games.forEach(game => {
            if (!index[game.category]) {
                index[game.category] = [];
            }
            index[game.category].push(game.id);
        });
        return index;
    }

    createTagIndex(games) {
        const index = {};
        games.forEach(game => {
            if (game.tags) {
                game.tags.forEach(tag => {
                    if (!index[tag]) {
                        index[tag] = [];
                    }
                    index[tag].push(game.id);
                });
            }
        });
        return index;
    }

    generateStatistics(games) {
        const stats = {
            totalGames: games.length,
            categories: {},
            averageRating: 0,
            totalPlayCount: 0,
            featuredCount: 0,
            newGamesCount: 0,
            hotGamesCount: 0
        };

        let totalRating = 0;
        let ratedGamesCount = 0;

        games.forEach(game => {
            if (!stats.categories[game.category]) {
                stats.categories[game.category] = 0;
            }
            stats.categories[game.category]++;

            if (game.rating) {
                totalRating += game.rating;
                ratedGamesCount++;
            }

            stats.totalPlayCount += game.playCount || 0;

            if (game.featured) {
                stats.featuredCount++;
            }

            if (game.isNew) {
                stats.newGamesCount++;
            }

            if (game.isHot) {
                stats.hotGamesCount++;
            }
        });

        stats.averageRating = ratedGamesCount > 0 ? 
            Math.round((totalRating / ratedGamesCount) * 10) / 10 : 0;

        return stats;
    }

    getGameById(gameId) {
        if (!this.gameData || !this.gameData.games) {
            return null;
        }
        return this.gameData.games.find(game => game.id === gameId) || null;
    }

    getGamesByCategory(category) {
        if (!this.gameData || !this.gameData.games) {
            return [];
        }
        return this.gameData.games.filter(game => game.category === category);
    }

    searchGames(query, language = 'en') {
        if (!this.gameData || !this.gameData.games || !query.trim()) {
            return [];
        }

        const searchTerm = query.toLowerCase().trim();
        
        return this.gameData.games.filter(game => {
            if (game.title && game.title[language] && 
                game.title[language].toLowerCase().includes(searchTerm)) {
                return true;
            }

            if (game.description && game.description[language] && 
                game.description[language].toLowerCase().includes(searchTerm)) {
                return true;
            }

            if (game.searchKeywords && game.searchKeywords.includes(searchTerm)) {
                return true;
            }

            return false;
        });
    }

    getFeaturedGames(limit = 8) {
        if (!this.gameData || !this.gameData.games) {
            return [];
        }
        return this.gameData.games
            .filter(game => game.featured)
            .slice(0, limit);
    }

    getNewGames(limit = 8) {
        if (!this.gameData || !this.gameData.games) {
            return [];
        }
        return this.gameData.games
            .filter(game => game.isNew)
            .sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate))
            .slice(0, limit);
    }

    getHotGames(limit = 8) {
        if (!this.gameData || !this.gameData.games) {
            return [];
        }
        return this.gameData.games
            .filter(game => game.isHot)
            .sort((a, b) => b.playCount - a.playCount)
            .slice(0, limit);
    }

    updateCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    isCacheValid() {
        const cached = this.cache.get('gameData');
        if (!cached) return false;
        return (Date.now() - cached.timestamp) < this.cacheExpiry;
    }

    clearCache() {
        this.cache.clear();
        this.gameData = null;
    }

    getStatistics() {
        return this.gameData ? this.gameData.statistics : null;
    }
}

describe('数据管理器测试', () => {
    let dataManager;

    beforeEach(() => {
        dataManager = new MockDataManager();
    });

    describe('数据加载功能', () => {
        it('应该能够加载游戏数据', async () => {
            const data = await dataManager.loadGameData();
            
            expect.toBeType(data, 'object', '应该返回对象');
            expect.toHaveProperty(data, 'games', '应该包含games属性');
            expect.toBeTruthy(Array.isArray(data.games), 'games应该是数组');
            expect.toBeTruthy(data.games.length > 0, '应该包含游戏数据');
        });

        it('应该缓存加载的数据', async () => {
            const data1 = await dataManager.loadGameData();
            const data2 = await dataManager.loadGameData();
            
            expect.toBe(data1, data2, '应该返回相同的缓存数据');
        });

        it('应该支持强制重新加载', async () => {
            await dataManager.loadGameData();
            const data = await dataManager.loadGameData(true);
            
            expect.toBeTruthy(data, '强制重新加载应该成功');
        });

        it('应该处理并发加载请求', async () => {
            const promise1 = dataManager.loadGameData();
            const promise2 = dataManager.loadGameData();
            
            const [data1, data2] = await Promise.all([promise1, promise2]);
            
            expect.toBe(data1, data2, '并发请求应该返回相同数据');
        });
    });

    describe('数据处理功能', () => {
        let gameData;

        beforeEach(async () => {
            gameData = await dataManager.loadGameData();
        });

        it('应该为游戏添加计算字段', () => {
            const game = gameData.games[0];
            
            expect.toHaveProperty(game, 'searchKeywords', '应该有搜索关键词');
            expect.toHaveProperty(game, 'popularityScore', '应该有热度分数');
            expect.toHaveProperty(game, 'isNew', '应该有新游戏标识');
            expect.toHaveProperty(game, 'isHot', '应该有热门标识');
        });

        it('应该正确生成搜索关键词', () => {
            const game = gameData.games[0];
            const keywords = game.searchKeywords;
            
            expect.toBeTruthy(keywords.includes('snake'), '应该包含英文标题');
            expect.toBeTruthy(keywords.includes('贪吃蛇'), '应该包含中文标题');
            expect.toBeTruthy(keywords.includes('arcade'), '应该包含分类');
            expect.toBeTruthy(keywords.includes('classic'), '应该包含标签');
        });

        it('应该正确计算热度分数', () => {
            const game = gameData.games[0];
            const score = game.popularityScore;
            
            expect.toBeType(score, 'number', '热度分数应该是数字');
            expect.toBeTruthy(score > 0, '热度分数应该大于0');
        });

        it('应该正确识别新游戏', () => {
            const newGame = gameData.games.find(game => game.tags && game.tags.includes('new'));
            expect.toBeTruthy(newGame.isNew, '应该正确识别新游戏');
        });

        it('应该正确识别热门游戏', () => {
            const hotGame = gameData.games.find(game => game.playCount > 1000);
            expect.toBeTruthy(hotGame.isHot, '应该正确识别热门游戏');
        });
    });

    describe('索引创建功能', () => {
        let gameData;

        beforeEach(async () => {
            gameData = await dataManager.loadGameData();
        });

        it('应该创建分类索引', () => {
            const categoryIndex = gameData.categoryIndex;
            
            expect.toHaveProperty(categoryIndex, 'arcade', '应该有arcade分类');
            expect.toHaveProperty(categoryIndex, 'puzzle', '应该有puzzle分类');
            expect.toHaveProperty(categoryIndex, 'action', '应该有action分类');
            
            expect.toBeTruthy(Array.isArray(categoryIndex.arcade), '分类索引应该是数组');
            expect.toContain(categoryIndex.arcade, 'game001', '应该包含对应的游戏ID');
        });

        it('应该创建标签索引', () => {
            const tagIndex = gameData.tagIndex;
            
            expect.toHaveProperty(tagIndex, 'classic', '应该有classic标签');
            expect.toHaveProperty(tagIndex, 'puzzle', '应该有puzzle标签');
            
            expect.toBeTruthy(Array.isArray(tagIndex.classic), '标签索引应该是数组');
            expect.toContain(tagIndex.classic, 'game001', '应该包含对应的游戏ID');
        });
    });

    describe('统计信息生成', () => {
        let statistics;

        beforeEach(async () => {
            const gameData = await dataManager.loadGameData();
            statistics = gameData.statistics;
        });

        it('应该生成基本统计信息', () => {
            expect.toHaveProperty(statistics, 'totalGames', '应该有总游戏数');
            expect.toHaveProperty(statistics, 'categories', '应该有分类统计');
            expect.toHaveProperty(statistics, 'averageRating', '应该有平均评分');
            expect.toHaveProperty(statistics, 'totalPlayCount', '应该有总播放次数');
        });

        it('应该正确计算游戏总数', () => {
            expect.toBe(statistics.totalGames, 3, '总游戏数应该是3');
        });

        it('应该正确计算分类统计', () => {
            expect.toBe(statistics.categories.arcade, 1, 'arcade分类应该有1个游戏');
            expect.toBe(statistics.categories.puzzle, 1, 'puzzle分类应该有1个游戏');
            expect.toBe(statistics.categories.action, 1, 'action分类应该有1个游戏');
        });

        it('应该正确计算平均评分', () => {
            const expectedAverage = Math.round(((4.5 + 4.2 + 4.8) / 3) * 10) / 10;
            expect.toBe(statistics.averageRating, expectedAverage, '平均评分计算应该正确');
        });

        it('应该正确计算特殊游戏数量', () => {
            expect.toBe(statistics.featuredCount, 2, '精选游戏数应该是2');
            expect.toBeTruthy(statistics.hotGamesCount >= 1, '热门游戏数应该至少为1');
        });
    });

    describe('游戏查询功能', () => {
        beforeEach(async () => {
            await dataManager.loadGameData();
        });

        it('应该能够根据ID获取游戏', () => {
            const game = dataManager.getGameById('game001');
            
            expect.toBeTruthy(game, '应该找到游戏');
            expect.toBe(game.id, 'game001', '应该返回正确的游戏');
        });

        it('应该在游戏不存在时返回null', () => {
            const game = dataManager.getGameById('non-existent');
            expect.toBe(game, null, '不存在的游戏应该返回null');
        });

        it('应该能够根据分类获取游戏', () => {
            const games = dataManager.getGamesByCategory('arcade');
            
            expect.toBeTruthy(Array.isArray(games), '应该返回数组');
            expect.toBeTruthy(games.length > 0, '应该找到游戏');
            expect.toBe(games[0].category, 'arcade', '返回的游戏应该属于正确分类');
        });

        it('应该能够获取精选游戏', () => {
            const games = dataManager.getFeaturedGames();
            
            expect.toBeTruthy(Array.isArray(games), '应该返回数组');
            games.forEach(game => {
                expect.toBeTruthy(game.featured, '所有返回的游戏都应该是精选游戏');
            });
        });

        it('应该能够获取新游戏', () => {
            const games = dataManager.getNewGames();
            
            expect.toBeTruthy(Array.isArray(games), '应该返回数组');
            games.forEach(game => {
                expect.toBeTruthy(game.isNew, '所有返回的游戏都应该是新游戏');
            });
        });

        it('应该能够获取热门游戏', () => {
            const games = dataManager.getHotGames();
            
            expect.toBeTruthy(Array.isArray(games), '应该返回数组');
            games.forEach(game => {
                expect.toBeTruthy(game.isHot, '所有返回的游戏都应该是热门游戏');
            });
        });
    });

    describe('搜索功能', () => {
        beforeEach(async () => {
            await dataManager.loadGameData();
        });

        it('应该能够搜索游戏标题', () => {
            const results = dataManager.searchGames('Snake', 'en');
            
            expect.toBeTruthy(Array.isArray(results), '应该返回数组');
            expect.toBeTruthy(results.length > 0, '应该找到匹配的游戏');
            expect.toBe(results[0].id, 'game001', '应该找到正确的游戏');
        });

        it('应该支持多语言搜索', () => {
            const results = dataManager.searchGames('贪吃蛇', 'zh');
            
            expect.toBeTruthy(results.length > 0, '应该找到中文匹配的游戏');
            expect.toBe(results[0].id, 'game001', '应该找到正确的游戏');
        });

        it('应该能够搜索游戏描述', () => {
            const results = dataManager.searchGames('puzzle', 'en');
            
            expect.toBeTruthy(results.length > 0, '应该找到描述匹配的游戏');
        });

        it('应该在没有匹配时返回空数组', () => {
            const results = dataManager.searchGames('nonexistent');
            
            expect.toBeTruthy(Array.isArray(results), '应该返回数组');
            expect.toBe(results.length, 0, '没有匹配时应该返回空数组');
        });

        it('应该在查询为空时返回空数组', () => {
            const results = dataManager.searchGames('');
            
            expect.toBeTruthy(Array.isArray(results), '应该返回数组');
            expect.toBe(results.length, 0, '空查询应该返回空数组');
        });
    });

    describe('缓存管理', () => {
        it('应该能够更新缓存', () => {
            const testData = { test: 'data' };
            dataManager.updateCache('test', testData);
            
            const cached = dataManager.cache.get('test');
            expect.toBeTruthy(cached, '应该存储缓存数据');
            expect.toBe(cached.data, testData, '应该存储正确的数据');
        });

        it('应该能够检查缓存有效性', async () => {
            await dataManager.loadGameData();
            expect.toBeTruthy(dataManager.isCacheValid(), '新加载的数据缓存应该有效');
        });

        it('应该能够清除缓存', async () => {
            await dataManager.loadGameData();
            dataManager.clearCache();
            
            expect.toBe(dataManager.gameData, null, '游戏数据应该被清除');
            expect.toBe(dataManager.cache.size, 0, '缓存应该被清空');
        });
    });
});