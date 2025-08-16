/**
 * 数据管理器
 * 负责游戏数据的加载、验证、缓存和管理
 */

class DataManager {
    constructor() {
        this.gameData = null;
        this.validator = new DataValidator();
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5分钟缓存
        this.isLoading = false;
        this.loadPromise = null;
    }

    /**
     * 加载游戏数据
     * @param {boolean} forceReload - 是否强制重新加载
     * @returns {Promise<Object>} 游戏数据
     */
    async loadGameData(forceReload = false) {
        // 如果正在加载，返回现有的Promise
        if (this.isLoading && this.loadPromise) {
            return this.loadPromise;
        }

        // 检查缓存
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
            console.error('加载游戏数据失败:', error);
            throw new Error('无法加载游戏数据，请检查网络连接');
        } finally {
            this.isLoading = false;
            this.loadPromise = null;
        }
    }

    /**
     * 获取数据并验证
     * @returns {Promise<Object>} 验证后的数据
     */
    async _fetchGameData() {
        try {
            const response = await fetch('data/games.json');
            
            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // 验证数据
            const validationResult = this.validator.validateGameData(data);
            
            if (!validationResult.isValid) {
                console.warn('游戏数据验证发现问题:');
                console.warn(this.validator.generateReport(validationResult));
                
                // 如果有严重错误，抛出异常
                if (validationResult.errorCount > 0) {
                    throw new Error('游戏数据格式错误，请检查数据文件');
                }
            }

            // 处理数据（添加计算字段等）
            return this.processGameData(data);

        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error('游戏数据文件格式错误，请检查JSON语法');
            }
            throw error;
        }
    }

    /**
     * 处理游戏数据，添加计算字段和索引
     * @param {Object} data - 原始数据
     * @returns {Object} 处理后的数据
     */
    processGameData(data) {
        // 为每个游戏添加计算字段
        data.games = data.games.map(game => {
            return {
                ...game,
                // 添加搜索关键词（用于搜索功能）
                searchKeywords: this.generateSearchKeywords(game),
                // 添加热度分数（基于评分和播放次数）
                popularityScore: this.calculatePopularityScore(game),
                // 添加新游戏标识（7天内添加的游戏）
                isNew: this.isNewGame(game.addedDate),
                // 添加热门标识（基于播放次数）
                isHot: this.isHotGame(game.playCount)
            };
        });

        // 创建分类索引
        data.categoryIndex = this.createCategoryIndex(data.games);
        
        // 创建标签索引
        data.tagIndex = this.createTagIndex(data.games);

        // 添加统计信息
        data.statistics = this.generateStatistics(data.games);

        return data;
    }

    /**
     * 生成搜索关键词
     * @param {Object} game - 游戏对象
     * @returns {string} 搜索关键词字符串
     */
    generateSearchKeywords(game) {
        const keywords = [];
        
        // 添加所有语言的标题和描述
        Object.values(game.title || {}).forEach(title => {
            keywords.push(title.toLowerCase());
        });
        
        Object.values(game.description || {}).forEach(desc => {
            keywords.push(desc.toLowerCase());
        });

        // 添加分类
        keywords.push(game.category);
        Object.values(game.categoryName || {}).forEach(catName => {
            keywords.push(catName.toLowerCase());
        });

        // 添加标签
        if (game.tags) {
            keywords.push(...game.tags.map(tag => tag.toLowerCase()));
        }

        // 添加开发者
        if (game.metadata && game.metadata.developer) {
            keywords.push(game.metadata.developer.toLowerCase());
        }

        return keywords.join(' ');
    }

    /**
     * 计算热度分数
     * @param {Object} game - 游戏对象
     * @returns {number} 热度分数
     */
    calculatePopularityScore(game) {
        const rating = game.rating || 0;
        const playCount = game.playCount || 0;
        const featured = game.featured ? 1.2 : 1;
        
        // 综合评分和播放次数计算热度
        return Math.round((rating * 20 + Math.log10(playCount + 1) * 10) * featured);
    }

    /**
     * 判断是否为新游戏
     * @param {string} addedDate - 添加日期
     * @returns {boolean} 是否为新游戏
     */
    isNewGame(addedDate) {
        if (!addedDate) return false;
        const added = new Date(addedDate);
        const now = new Date();
        const daysDiff = (now - added) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
    }

    /**
     * 判断是否为热门游戏
     * @param {number} playCount - 播放次数
     * @returns {boolean} 是否为热门游戏
     */
    isHotGame(playCount) {
        return (playCount || 0) > 1000;
    }

    /**
     * 创建分类索引
     * @param {Array} games - 游戏数组
     * @returns {Object} 分类索引
     */
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

    /**
     * 创建标签索引
     * @param {Array} games - 游戏数组
     * @returns {Object} 标签索引
     */
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

    /**
     * 生成统计信息
     * @param {Array} games - 游戏数组
     * @returns {Object} 统计信息
     */
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
            // 分类统计
            if (!stats.categories[game.category]) {
                stats.categories[game.category] = 0;
            }
            stats.categories[game.category]++;

            // 评分统计
            if (game.rating) {
                totalRating += game.rating;
                ratedGamesCount++;
            }

            // 播放次数统计
            stats.totalPlayCount += game.playCount || 0;

            // 精选游戏统计
            if (game.featured) {
                stats.featuredCount++;
            }

            // 新游戏统计
            if (game.isNew) {
                stats.newGamesCount++;
            }

            // 热门游戏统计
            if (game.isHot) {
                stats.hotGamesCount++;
            }
        });

        stats.averageRating = ratedGamesCount > 0 ? 
            Math.round((totalRating / ratedGamesCount) * 10) / 10 : 0;

        return stats;
    }

    /**
     * 根据ID获取游戏
     * @param {string} gameId - 游戏ID
     * @returns {Object|null} 游戏对象
     */
    getGameById(gameId) {
        if (!this.gameData || !this.gameData.games) {
            return null;
        }
        return this.gameData.games.find(game => game.id === gameId) || null;
    }

    /**
     * 根据分类获取游戏
     * @param {string} category - 分类名称
     * @returns {Array} 游戏数组
     */
    getGamesByCategory(category) {
        if (!this.gameData || !this.gameData.games) {
            return [];
        }
        return this.gameData.games.filter(game => game.category === category);
    }

    /**
     * 根据标签获取游戏
     * @param {string} tag - 标签名称
     * @returns {Array} 游戏数组
     */
    getGamesByTag(tag) {
        if (!this.gameData || !this.gameData.games) {
            return [];
        }
        return this.gameData.games.filter(game => 
            game.tags && game.tags.includes(tag)
        );
    }

    /**
     * 搜索游戏
     * @param {string} query - 搜索关键词
     * @param {string} language - 当前语言
     * @returns {Array} 搜索结果
     */
    searchGames(query, language = 'en') {
        if (!this.gameData || !this.gameData.games || !query.trim()) {
            return [];
        }

        const searchTerm = query.toLowerCase().trim();
        
        return this.gameData.games.filter(game => {
            // 搜索标题
            if (game.title && game.title[language] && 
                game.title[language].toLowerCase().includes(searchTerm)) {
                return true;
            }

            // 搜索描述
            if (game.description && game.description[language] && 
                game.description[language].toLowerCase().includes(searchTerm)) {
                return true;
            }

            // 搜索关键词
            if (game.searchKeywords && game.searchKeywords.includes(searchTerm)) {
                return true;
            }

            return false;
        });
    }

    /**
     * 获取精选游戏
     * @param {number} limit - 限制数量
     * @returns {Array} 精选游戏数组
     */
    getFeaturedGames(limit = 8) {
        if (!this.gameData || !this.gameData.games) {
            return [];
        }
        return this.gameData.games
            .filter(game => game.featured)
            .slice(0, limit);
    }

    /**
     * 获取新游戏
     * @param {number} limit - 限制数量
     * @returns {Array} 新游戏数组
     */
    getNewGames(limit = 8) {
        if (!this.gameData || !this.gameData.games) {
            return [];
        }
        return this.gameData.games
            .filter(game => game.isNew)
            .sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate))
            .slice(0, limit);
    }

    /**
     * 获取热门游戏
     * @param {number} limit - 限制数量
     * @returns {Array} 热门游戏数组
     */
    getHotGames(limit = 8) {
        if (!this.gameData || !this.gameData.games) {
            return [];
        }
        return this.gameData.games
            .filter(game => game.isHot)
            .sort((a, b) => b.playCount - a.playCount)
            .slice(0, limit);
    }

    /**
     * 更新缓存
     * @param {string} key - 缓存键
     * @param {*} data - 缓存数据
     */
    updateCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * 检查缓存是否有效
     * @returns {boolean} 缓存是否有效
     */
    isCacheValid() {
        const cached = this.cache.get('gameData');
        if (!cached) return false;
        return (Date.now() - cached.timestamp) < this.cacheExpiry;
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.cache.clear();
        this.gameData = null;
    }

    /**
     * 获取统计信息
     * @returns {Object|null} 统计信息
     */
    getStatistics() {
        return this.gameData ? this.gameData.statistics : null;
    }
}

// 创建全局实例
const dataManager = new DataManager();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
} else {
    window.DataManager = DataManager;
    window.dataManager = dataManager;
}