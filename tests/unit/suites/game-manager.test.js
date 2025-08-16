/**
 * 游戏管理器测试套件
 * 测试游戏管理相关功能
 */

// 模拟GameManager类
class MockGameManager {
    constructor() {
        this.games = [];
        this.currentLanguage = 'en';
        this.categories = ['all', 'action', 'puzzle', 'arcade', 'casual'];
    }

    // 模拟游戏数据
    getMockGames() {
        return [
            {
                id: 'game001',
                title: {
                    en: 'Snake Game',
                    zh: '贪吃蛇游戏',
                    es: 'Juego de Serpiente',
                    fr: 'Jeu de Serpent'
                },
                description: {
                    en: 'Classic snake game with modern graphics',
                    zh: '具有现代图形的经典贪吃蛇游戏',
                    es: 'Juego clásico de serpiente con gráficos modernos',
                    fr: 'Jeu de serpent classique avec des graphiques modernes'
                },
                category: 'arcade',
                rating: 4.5,
                playCount: 1250,
                featured: true,
                tags: ['classic', 'arcade'],
                addedDate: '2024-01-15',
                isNew: false,
                isHot: true,
                popularityScore: 120
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
                    en: 'Challenging puzzle game for brain training',
                    zh: '挑战性拼图游戏，训练大脑',
                    es: 'Juego de rompecabezas desafiante para entrenar el cerebro',
                    fr: 'Jeu de puzzle stimulant pour l\'entraînement cérébral'
                },
                category: 'puzzle',
                rating: 4.2,
                playCount: 800,
                featured: false,
                tags: ['puzzle', 'brain', 'challenging'],
                addedDate: '2024-01-10',
                isNew: false,
                isHot: false,
                popularityScore: 95
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
                    en: 'Fast-paced action game with epic battles',
                    zh: '快节奏动作游戏，史诗般的战斗',
                    es: 'Juego de acción trepidante con batallas épicas',
                    fr: 'Jeu d\'action rapide avec des batailles épiques'
                },
                category: 'action',
                rating: 4.8,
                playCount: 2100,
                featured: true,
                tags: ['action', 'hero', 'new', 'epic'],
                addedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                isNew: true,
                isHot: true,
                popularityScore: 150
            },
            {
                id: 'game004',
                title: {
                    en: 'Casual Fun',
                    zh: '休闲乐趣',
                    es: 'Diversión Casual',
                    fr: 'Plaisir Décontracté'
                },
                description: {
                    en: 'Relaxing casual game for everyone',
                    zh: '适合所有人的轻松休闲游戏',
                    es: 'Juego casual relajante para todos',
                    fr: 'Jeu décontracté relaxant pour tous'
                },
                category: 'casual',
                rating: 4.0,
                playCount: 500,
                featured: false,
                tags: ['casual', 'relaxing'],
                addedDate: '2024-01-05',
                isNew: false,
                isHot: false,
                popularityScore: 80
            }
        ];
    }

    async loadGames() {
        // 模拟异步加载
        await new Promise(resolve => setTimeout(resolve, 10));
        this.games = this.getMockGames();
        return this.games;
    }

    setCurrentLanguage(language) {
        this.currentLanguage = language;
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    getGameById(gameId) {
        return this.games.find(game => game.id === gameId) || null;
    }

    filterByCategory(category) {
        if (category === 'all') {
            return [...this.games];
        }
        return this.games.filter(game => game.category === category);
    }

    searchGames(query) {
        if (!query || query.trim().length === 0) {
            return [];
        }

        const searchTerm = query.toLowerCase().trim();
        
        return this.games.filter(game => {
            // 搜索当前语言的标题
            const title = game.title[this.currentLanguage] || game.title.en || '';
            if (title.toLowerCase().includes(searchTerm)) {
                return true;
            }

            // 搜索当前语言的描述
            const description = game.description[this.currentLanguage] || game.description.en || '';
            if (description.toLowerCase().includes(searchTerm)) {
                return true;
            }

            // 搜索标签
            if (game.tags && game.tags.some(tag => tag.toLowerCase().includes(searchTerm))) {
                return true;
            }

            // 搜索分类
            if (game.category.toLowerCase().includes(searchTerm)) {
                return true;
            }

            return false;
        });
    }

    getFeaturedGames(limit = 8) {
        return this.games
            .filter(game => game.featured)
            .slice(0, limit);
    }

    getNewGames(limit = 8) {
        return this.games
            .filter(game => game.isNew)
            .sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate))
            .slice(0, limit);
    }

    getPopularGames(limit = 8) {
        return this.games
            .filter(game => game.isHot)
            .sort((a, b) => b.playCount - a.playCount)
            .slice(0, limit);
    }

    getGamesByRating(minRating = 4.0, limit = 8) {
        return this.games
            .filter(game => game.rating >= minRating)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, limit);
    }

    getGamesByPopularity(limit = 8) {
        return this.games
            .sort((a, b) => b.popularityScore - a.popularityScore)
            .slice(0, limit);
    }

    getCategoriesPreviewData() {
        const categories = {};
        
        this.categories.forEach(category => {
            if (category === 'all') return;
            
            const categoryGames = this.filterByCategory(category);
            categories[category] = {
                name: category,
                count: categoryGames.length,
                games: categoryGames.slice(0, 4), // 预览前4个游戏
                totalPlayCount: categoryGames.reduce((sum, game) => sum + game.playCount, 0)
            };
        });
        
        return categories;
    }

    getGameStats() {
        return {
            totalGames: this.games.length,
            totalPlayCount: this.games.reduce((sum, game) => sum + game.playCount, 0),
            averageRating: this.games.reduce((sum, game) => sum + game.rating, 0) / this.games.length,
            featuredCount: this.games.filter(game => game.featured).length,
            newGamesCount: this.games.filter(game => game.isNew).length,
            hotGamesCount: this.games.filter(game => game.isHot).length,
            categoriesCount: this.categories.length - 1 // 排除'all'分类
        };
    }

    getGameTitle(game, language = null) {
        const lang = language || this.currentLanguage;
        return game.title[lang] || game.title.en || game.title[Object.keys(game.title)[0]] || 'Unknown Game';
    }

    getGameDescription(game, language = null) {
        const lang = language || this.currentLanguage;
        return game.description[lang] || game.description.en || game.description[Object.keys(game.description)[0]] || '';
    }

    sortGames(games, sortBy = 'popularity') {
        const sortedGames = [...games];
        
        switch (sortBy) {
            case 'popularity':
                return sortedGames.sort((a, b) => b.popularityScore - a.popularityScore);
            case 'rating':
                return sortedGames.sort((a, b) => b.rating - a.rating);
            case 'playCount':
                return sortedGames.sort((a, b) => b.playCount - a.playCount);
            case 'newest':
                return sortedGames.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));
            case 'alphabetical':
                return sortedGames.sort((a, b) => {
                    const titleA = this.getGameTitle(a).toLowerCase();
                    const titleB = this.getGameTitle(b).toLowerCase();
                    return titleA.localeCompare(titleB);
                });
            default:
                return sortedGames;
        }
    }

    filterGames(games, filters = {}) {
        let filteredGames = [...games];

        // 按分类筛选
        if (filters.category && filters.category !== 'all') {
            filteredGames = filteredGames.filter(game => game.category === filters.category);
        }

        // 按评分筛选
        if (filters.minRating) {
            filteredGames = filteredGames.filter(game => game.rating >= filters.minRating);
        }

        // 按标签筛选
        if (filters.tags && filters.tags.length > 0) {
            filteredGames = filteredGames.filter(game => 
                game.tags && filters.tags.some(tag => game.tags.includes(tag))
            );
        }

        // 按特殊属性筛选
        if (filters.featured) {
            filteredGames = filteredGames.filter(game => game.featured);
        }

        if (filters.isNew) {
            filteredGames = filteredGames.filter(game => game.isNew);
        }

        if (filters.isHot) {
            filteredGames = filteredGames.filter(game => game.isHot);
        }

        return filteredGames;
    }
}

describe('游戏管理器测试', () => {
    let gameManager;

    beforeEach(async () => {
        gameManager = new MockGameManager();
        await gameManager.loadGames();
    });

    describe('初始化和数据加载', () => {
        it('应该能够加载游戏数据', () => {
            expect.toBeTruthy(Array.isArray(gameManager.games), '游戏数据应该是数组');
            expect.toBeTruthy(gameManager.games.length > 0, '应该加载到游戏数据');
        });

        it('应该有默认的当前语言', () => {
            expect.toBe(gameManager.getCurrentLanguage(), 'en', '默认语言应该是英文');
        });

        it('应该能够设置当前语言', () => {
            gameManager.setCurrentLanguage('zh');
            expect.toBe(gameManager.getCurrentLanguage(), 'zh', '应该能够设置中文');
        });
    });

    describe('游戏查询功能', () => {
        it('应该能够根据ID获取游戏', () => {
            const game = gameManager.getGameById('game001');
            
            expect.toBeTruthy(game, '应该找到游戏');
            expect.toBe(game.id, 'game001', '应该返回正确的游戏');
        });

        it('应该在游戏不存在时返回null', () => {
            const game = gameManager.getGameById('nonexistent');
            expect.toBe(game, null, '不存在的游戏应该返回null');
        });

        it('应该能够获取游戏标题', () => {
            const game = gameManager.getGameById('game001');
            const title = gameManager.getGameTitle(game, 'en');
            
            expect.toBe(title, 'Snake Game', '应该返回英文标题');
        });

        it('应该能够获取不同语言的游戏标题', () => {
            const game = gameManager.getGameById('game001');
            const zhTitle = gameManager.getGameTitle(game, 'zh');
            
            expect.toBe(zhTitle, '贪吃蛇游戏', '应该返回中文标题');
        });

        it('应该在语言不存在时回退到英文', () => {
            const game = gameManager.getGameById('game001');
            const title = gameManager.getGameTitle(game, 'invalid');
            
            expect.toBe(title, 'Snake Game', '应该回退到英文标题');
        });
    });

    describe('分类筛选功能', () => {
        it('应该能够获取所有游戏', () => {
            const games = gameManager.filterByCategory('all');
            
            expect.toBeTruthy(Array.isArray(games), '应该返回数组');
            expect.toBe(games.length, 4, '应该返回所有4个游戏');
        });

        it('应该能够按分类筛选游戏', () => {
            const arcadeGames = gameManager.filterByCategory('arcade');
            
            expect.toBeTruthy(Array.isArray(arcadeGames), '应该返回数组');
            expect.toBeTruthy(arcadeGames.length > 0, '应该找到arcade游戏');
            arcadeGames.forEach(game => {
                expect.toBe(game.category, 'arcade', '所有游戏都应该是arcade分类');
            });
        });

        it('应该在分类不存在时返回空数组', () => {
            const games = gameManager.filterByCategory('nonexistent');
            
            expect.toBeTruthy(Array.isArray(games), '应该返回数组');
            expect.toBe(games.length, 0, '不存在的分类应该返回空数组');
        });
    });

    describe('搜索功能', () => {
        it('应该能够搜索游戏标题', () => {
            const results = gameManager.searchGames('Snake');
            
            expect.toBeTruthy(Array.isArray(results), '应该返回数组');
            expect.toBeTruthy(results.length > 0, '应该找到匹配的游戏');
            expect.toBe(results[0].id, 'game001', '应该找到正确的游戏');
        });

        it('应该支持多语言搜索', () => {
            gameManager.setCurrentLanguage('zh');
            const results = gameManager.searchGames('贪吃蛇');
            
            expect.toBeTruthy(results.length > 0, '应该找到中文匹配的游戏');
            expect.toBe(results[0].id, 'game001', '应该找到正确的游戏');
        });

        it('应该能够搜索游戏描述', () => {
            const results = gameManager.searchGames('puzzle');
            
            expect.toBeTruthy(results.length > 0, '应该找到描述匹配的游戏');
        });

        it('应该能够搜索游戏标签', () => {
            const results = gameManager.searchGames('hero');
            
            expect.toBeTruthy(results.length > 0, '应该找到标签匹配的游戏');
        });

        it('应该能够搜索游戏分类', () => {
            const results = gameManager.searchGames('action');
            
            expect.toBeTruthy(results.length > 0, '应该找到分类匹配的游戏');
        });

        it('应该在没有匹配时返回空数组', () => {
            const results = gameManager.searchGames('nonexistent');
            
            expect.toBeTruthy(Array.isArray(results), '应该返回数组');
            expect.toBe(results.length, 0, '没有匹配时应该返回空数组');
        });

        it('应该在查询为空时返回空数组', () => {
            const results = gameManager.searchGames('');
            
            expect.toBeTruthy(Array.isArray(results), '应该返回数组');
            expect.toBe(results.length, 0, '空查询应该返回空数组');
        });

        it('应该忽略大小写', () => {
            const results1 = gameManager.searchGames('SNAKE');
            const results2 = gameManager.searchGames('snake');
            
            expect.toBe(results1.length, results2.length, '大小写不应该影响搜索结果');
        });
    });

    describe('特殊游戏获取功能', () => {
        it('应该能够获取精选游戏', () => {
            const games = gameManager.getFeaturedGames();
            
            expect.toBeTruthy(Array.isArray(games), '应该返回数组');
            games.forEach(game => {
                expect.toBeTruthy(game.featured, '所有返回的游戏都应该是精选游戏');
            });
        });

        it('应该能够获取新游戏', () => {
            const games = gameManager.getNewGames();
            
            expect.toBeTruthy(Array.isArray(games), '应该返回数组');
            games.forEach(game => {
                expect.toBeTruthy(game.isNew, '所有返回的游戏都应该是新游戏');
            });
        });

        it('应该能够获取热门游戏', () => {
            const games = gameManager.getPopularGames();
            
            expect.toBeTruthy(Array.isArray(games), '应该返回数组');
            games.forEach(game => {
                expect.toBeTruthy(game.isHot, '所有返回的游戏都应该是热门游戏');
            });
        });

        it('应该能够按评分获取游戏', () => {
            const games = gameManager.getGamesByRating(4.5);
            
            expect.toBeTruthy(Array.isArray(games), '应该返回数组');
            games.forEach(game => {
                expect.toBeTruthy(game.rating >= 4.5, '所有游戏评分都应该大于等于4.5');
            });
        });

        it('应该能够按热度获取游戏', () => {
            const games = gameManager.getGamesByPopularity();
            
            expect.toBeTruthy(Array.isArray(games), '应该返回数组');
            
            // 检查是否按热度排序
            for (let i = 1; i < games.length; i++) {
                expect.toBeTruthy(games[i-1].popularityScore >= games[i].popularityScore, 
                    '游戏应该按热度降序排列');
            }
        });

        it('应该支持限制返回数量', () => {
            const games = gameManager.getFeaturedGames(1);
            
            expect.toBeTruthy(games.length <= 1, '应该限制返回数量');
        });
    });

    describe('游戏排序功能', () => {
        let testGames;

        beforeEach(() => {
            testGames = gameManager.games.slice(0, 3); // 取前3个游戏测试
        });

        it('应该能够按热度排序', () => {
            const sorted = gameManager.sortGames(testGames, 'popularity');
            
            for (let i = 1; i < sorted.length; i++) {
                expect.toBeTruthy(sorted[i-1].popularityScore >= sorted[i].popularityScore, 
                    '应该按热度降序排列');
            }
        });

        it('应该能够按评分排序', () => {
            const sorted = gameManager.sortGames(testGames, 'rating');
            
            for (let i = 1; i < sorted.length; i++) {
                expect.toBeTruthy(sorted[i-1].rating >= sorted[i].rating, 
                    '应该按评分降序排列');
            }
        });

        it('应该能够按播放次数排序', () => {
            const sorted = gameManager.sortGames(testGames, 'playCount');
            
            for (let i = 1; i < sorted.length; i++) {
                expect.toBeTruthy(sorted[i-1].playCount >= sorted[i].playCount, 
                    '应该按播放次数降序排列');
            }
        });

        it('应该能够按字母顺序排序', () => {
            const sorted = gameManager.sortGames(testGames, 'alphabetical');
            
            for (let i = 1; i < sorted.length; i++) {
                const titleA = gameManager.getGameTitle(sorted[i-1]).toLowerCase();
                const titleB = gameManager.getGameTitle(sorted[i]).toLowerCase();
                expect.toBeTruthy(titleA <= titleB, '应该按字母顺序排列');
            }
        });

        it('应该不修改原数组', () => {
            const originalLength = testGames.length;
            const originalFirst = testGames[0];
            
            gameManager.sortGames(testGames, 'rating');
            
            expect.toBe(testGames.length, originalLength, '原数组长度不应该改变');
            expect.toBe(testGames[0], originalFirst, '原数组第一个元素不应该改变');
        });
    });

    describe('游戏筛选功能', () => {
        it('应该能够按分类筛选', () => {
            const filtered = gameManager.filterGames(gameManager.games, { category: 'action' });
            
            filtered.forEach(game => {
                expect.toBe(game.category, 'action', '所有游戏都应该是action分类');
            });
        });

        it('应该能够按评分筛选', () => {
            const filtered = gameManager.filterGames(gameManager.games, { minRating: 4.5 });
            
            filtered.forEach(game => {
                expect.toBeTruthy(game.rating >= 4.5, '所有游戏评分都应该大于等于4.5');
            });
        });

        it('应该能够按标签筛选', () => {
            const filtered = gameManager.filterGames(gameManager.games, { tags: ['hero'] });
            
            filtered.forEach(game => {
                expect.toBeTruthy(game.tags && game.tags.includes('hero'), 
                    '所有游戏都应该包含hero标签');
            });
        });

        it('应该能够筛选精选游戏', () => {
            const filtered = gameManager.filterGames(gameManager.games, { featured: true });
            
            filtered.forEach(game => {
                expect.toBeTruthy(game.featured, '所有游戏都应该是精选游戏');
            });
        });

        it('应该能够组合多个筛选条件', () => {
            const filtered = gameManager.filterGames(gameManager.games, { 
                featured: true, 
                minRating: 4.0 
            });
            
            filtered.forEach(game => {
                expect.toBeTruthy(game.featured, '所有游戏都应该是精选游戏');
                expect.toBeTruthy(game.rating >= 4.0, '所有游戏评分都应该大于等于4.0');
            });
        });
    });

    describe('统计信息功能', () => {
        it('应该能够获取游戏统计信息', () => {
            const stats = gameManager.getGameStats();
            
            expect.toHaveProperty(stats, 'totalGames', '应该有总游戏数');
            expect.toHaveProperty(stats, 'totalPlayCount', '应该有总播放次数');
            expect.toHaveProperty(stats, 'averageRating', '应该有平均评分');
            expect.toHaveProperty(stats, 'featuredCount', '应该有精选游戏数');
            expect.toHaveProperty(stats, 'newGamesCount', '应该有新游戏数');
            expect.toHaveProperty(stats, 'hotGamesCount', '应该有热门游戏数');
        });

        it('应该正确计算统计数据', () => {
            const stats = gameManager.getGameStats();
            
            expect.toBe(stats.totalGames, 4, '总游戏数应该是4');
            expect.toBeTruthy(stats.totalPlayCount > 0, '总播放次数应该大于0');
            expect.toBeTruthy(stats.averageRating > 0, '平均评分应该大于0');
        });

        it('应该能够获取分类预览数据', () => {
            const categoriesData = gameManager.getCategoriesPreviewData();
            
            expect.toBeType(categoriesData, 'object', '应该返回对象');
            expect.toHaveProperty(categoriesData, 'action', '应该有action分类');
            expect.toHaveProperty(categoriesData, 'puzzle', '应该有puzzle分类');
            expect.toHaveProperty(categoriesData, 'arcade', '应该有arcade分类');
            
            const actionData = categoriesData.action;
            expect.toHaveProperty(actionData, 'count', '分类数据应该有游戏数量');
            expect.toHaveProperty(actionData, 'games', '分类数据应该有游戏列表');
            expect.toBeTruthy(Array.isArray(actionData.games), '游戏列表应该是数组');
        });
    });
});