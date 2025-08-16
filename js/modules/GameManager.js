/**
 * 游戏管理器模块
 * 负责游戏数据的加载、筛选、搜索等功能
 */

import { API_ENDPOINTS, GAME_CATEGORIES, ERROR_MESSAGES, RETRY_CONFIG } from '../utils/constants.js';
import { storage, showNotification } from '../utils/helpers.js';
import errorHandler from './ErrorHandler.js';

class GameManager {
    constructor() {
        this.games = []; // 所有游戏数据
        this.filteredGames = []; // 筛选后的游戏数据
        this.currentCategory = GAME_CATEGORIES.ALL; // 当前分类
        this.searchQuery = ''; // 搜索关键词
        this.isLoading = false; // 是否正在加载
        this.loadPromise = null; // 加载Promise，避免重复加载
        this.currentLanguage = 'en'; // 当前语言
    }

    /**
     * 设置当前语言
     * @param {string} language - 语言代码
     */
    setCurrentLanguage(language) {
        this.currentLanguage = language;
        console.log(`GameManager语言已设置为: ${language}`);
    }

    /**
     * 获取本地化的游戏数据
     * @param {Object} game - 原始游戏数据
     * @returns {Object} 本地化后的游戏数据
     */
    getLocalizedGame(game) {
        if (!game) return null;

        return {
            ...game,
            title: this.getLocalizedText(game.title, 'Unknown Game'),
            description: this.getLocalizedText(game.description, 'No description available')
        };
    }

    /**
     * 获取本地化文本
     * @param {string|Object} text - 文本内容（可能是字符串或多语言对象）
     * @param {string} fallback - 备用文本
     * @returns {string} 本地化后的文本
     */
    getLocalizedText(text, fallback = '') {
        if (typeof text === 'string') {
            return text;
        }
        
        if (typeof text === 'object' && text !== null) {
            return text[this.currentLanguage] || text['en'] || fallback;
        }
        
        return fallback;
    }

    /**
     * 获取本地化的游戏列表
     * @param {Array} games - 游戏数组
     * @returns {Array} 本地化后的游戏数组
     */
    getLocalizedGames(games = this.games) {
        return games.map(game => this.getLocalizedGame(game));
    }

    /**
     * 加载游戏数据
     * @returns {Promise<Array>} 游戏数据数组
     */
    async loadGames() {
        // 如果正在加载，返回现有的Promise
        if (this.loadPromise) {
            return this.loadPromise;
        }

        // 如果已经加载过，直接返回
        if (this.games.length > 0) {
            return this.games;
        }

        this.isLoading = true;
        
        this.loadPromise = this._fetchGames();
        
        try {
            const games = await this.loadPromise;
            this.games = games;
            this.filteredGames = [...games];
            console.log(`成功加载 ${games.length} 个游戏`);
            return games;
        } catch (error) {
            console.error('加载游戏数据失败:', error);
            showNotification(ERROR_MESSAGES.DATA_LOAD_ERROR, 'error');
            throw error;
        } finally {
            this.isLoading = false;
            this.loadPromise = null;
        }
    }

    /**
     * 从服务器获取游戏数据
     * @private
     * @returns {Promise<Array>} 游戏数据数组
     */
    async _fetchGames() {
        try {
            // 使用带超时的fetch请求
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), RETRY_CONFIG.TIMEOUT);

            const response = await fetch(API_ENDPOINTS.GAMES, {
                signal: controller.signal,
                cache: 'no-cache'
            });

            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.games || !Array.isArray(data.games)) {
                throw new Error('游戏数据格式错误');
            }

            // 缓存成功获取的数据
            errorHandler.cacheData(API_ENDPOINTS.GAMES, data);
            
            // 数据预处理
            const processedGames = data.games.map(game => ({
                ...game,
                // 确保必要字段存在
                id: game.id || 0,
                title: game.title || { en: 'Unknown Game', zh: '未知游戏', es: 'Juego Desconocido', fr: 'Jeu Inconnu' },
                description: game.description || { en: 'No description available', zh: '暂无描述', es: 'Sin descripción', fr: 'Aucune description' },
                category: game.category || 'casual',
                categoryName: game.categoryName || '休闲',
                image: game.image || '',
                gameUrl: game.gameUrl || '',
                featured: Boolean(game.featured),
                tags: Array.isArray(game.tags) ? game.tags : [],
                rating: Number(game.rating) || 0,
                playCount: Number(game.playCount) || 0,
                addedDate: game.addedDate || new Date().toISOString()
            }));

            console.log(`成功获取并处理 ${processedGames.length} 个游戏数据`);
            return processedGames;

        } catch (error) {
            console.error('获取游戏数据失败:', error);
            
            // 使用错误处理器处理网络错误
            try {
                return await errorHandler.handleNetworkError(error, API_ENDPOINTS.GAMES);
            } catch (handledError) {
                // 如果错误处理器也无法处理，返回空数组作为降级方案
                console.warn('使用降级方案：返回空游戏列表');
                showNotification('无法加载游戏数据，请检查网络连接', 'error');
                return [];
            }
        }
    }

    /**
     * 根据分类筛选游戏
     * @param {string} category - 游戏分类
     * @returns {Array} 筛选后的游戏数组
     */
    filterByCategory(category) {
        this.currentCategory = category;
        this._applyFilters();
        return this.getLocalizedGames(this.filteredGames);
    }

    /**
     * 搜索游戏
     * @param {string} query - 搜索关键词
     * @returns {Array} 搜索结果数组
     */
    searchGames(query) {
        this.searchQuery = query.toLowerCase().trim();
        
        if (!this.searchQuery) {
            this._applyFilters();
            return this.getLocalizedGames(this.filteredGames);
        }

        // 执行高级搜索
        const searchResults = this._performAdvancedSearch(this.searchQuery);
        
        // 如果有分类筛选，进一步过滤结果
        if (this.currentCategory !== GAME_CATEGORIES.ALL) {
            this.filteredGames = searchResults.filter(game => game.category === this.currentCategory);
        } else {
            this.filteredGames = searchResults;
        }
        
        return this.getLocalizedGames(this.filteredGames);
    }

    /**
     * 执行高级搜索
     * @private
     * @param {string} query - 搜索关键词
     * @returns {Array} 搜索结果数组
     */
    _performAdvancedSearch(query) {
        const results = [];
        const queryWords = query.split(/\s+/).filter(word => word.length > 0);
        
        this.games.forEach(game => {
            let score = 0;
            
            // 获取本地化的文本用于搜索
            const localizedTitle = this.getLocalizedText(game.title, '').toLowerCase();
            const localizedDescription = this.getLocalizedText(game.description, '').toLowerCase();
            
            const searchableText = {
                title: localizedTitle,
                description: localizedDescription,
                categoryName: game.categoryName ? game.categoryName.toLowerCase() : '',
                tags: Array.isArray(game.tags) ? game.tags.map(tag => tag.toLowerCase()).join(' ') : ''
            };
            
            // 计算匹配分数
            queryWords.forEach(word => {
                // 标题完全匹配 - 最高分
                if (searchableText.title === word) {
                    score += 100;
                }
                // 标题开头匹配 - 高分
                else if (searchableText.title.startsWith(word)) {
                    score += 80;
                }
                // 标题包含 - 中高分
                else if (searchableText.title.includes(word)) {
                    score += 60;
                }
                
                // 标签完全匹配 - 高分
                if (searchableText.tags.includes(word)) {
                    score += 70;
                }
                
                // 分类匹配 - 中分
                if (searchableText.categoryName.includes(word)) {
                    score += 40;
                }
                
                // 描述匹配 - 低分
                if (searchableText.description.includes(word)) {
                    score += 20;
                }
            });
            
            // 如果有匹配，添加到结果中
            if (score > 0) {
                results.push({ ...game, searchScore: score });
            }
        });
        
        // 按分数排序，分数相同时按游玩次数排序
        return results
            .sort((a, b) => {
                if (b.searchScore !== a.searchScore) {
                    return b.searchScore - a.searchScore;
                }
                return b.playCount - a.playCount;
            })
            .map(({ searchScore, ...game }) => game); // 移除搜索分数
    }

    /**
     * 应用所有筛选条件
     * @private
     */
    _applyFilters() {
        let filtered = [...this.games];

        // 分类筛选
        if (this.currentCategory !== GAME_CATEGORIES.ALL) {
            filtered = filtered.filter(game => game.category === this.currentCategory);
        }

        // 搜索筛选
        if (this.searchQuery) {
            filtered = filtered.filter(game => {
                const searchText = `${game.title} ${game.description} ${game.categoryName}`.toLowerCase();
                return searchText.includes(this.searchQuery);
            });
        }

        this.filteredGames = filtered;
    }

    /**
     * 根据ID获取游戏
     * @param {number} gameId - 游戏ID
     * @returns {Object|null} 游戏对象
     */
    getGameById(gameId) {
        const game = this.games.find(game => game.id === parseInt(gameId)) || null;
        return game ? this.getLocalizedGame(game) : null;
    }

    /**
     * 获取精选游戏
     * @param {number} limit - 限制数量
     * @returns {Array} 精选游戏数组
     */
    getFeaturedGames(limit = 8) {
        const games = this.games
            .filter(game => game.featured)
            .slice(0, limit);
        return this.getLocalizedGames(games);
    }

    /**
     * 获取最新游戏
     * @param {number} limit - 限制数量
     * @returns {Array} 最新游戏数组
     */
    getNewGames(limit = 8) {
        const games = this.games
            .sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate))
            .slice(0, limit);
        return this.getLocalizedGames(games);
    }

    /**
     * 获取热门游戏
     * @param {number} limit - 限制数量
     * @returns {Array} 热门游戏数组
     */
    getPopularGames(limit = 8) {
        const games = this.games
            .sort((a, b) => b.playCount - a.playCount)
            .slice(0, limit);
        return this.getLocalizedGames(games);
    }

    /**
     * 获取相关游戏
     * @param {number} gameId - 当前游戏ID
     * @param {number} limit - 限制数量
     * @returns {Array} 相关游戏数组
     */
    getRelatedGames(gameId, limit = 4) {
        const currentGame = this.getGameById(gameId);
        if (!currentGame) return [];

        console.log('为游戏生成推荐:', currentGame.title);

        // 计算游戏相似度并排序
        const scoredGames = this.games
            .filter(game => game.id !== gameId)
            .map(game => ({
                ...game,
                similarity: this._calculateGameSimilarity(currentGame, game)
            }))
            .sort((a, b) => b.similarity - a.similarity);

        // 获取推荐游戏
        const related = scoredGames.slice(0, limit);

        console.log('推荐游戏:', related.map(g => `${g.title} (相似度: ${g.similarity.toFixed(2)})`));

        return this.getLocalizedGames(related);
    }

    /**
     * 计算两个游戏的相似度
     * @private
     * @param {Object} game1 - 游戏1
     * @param {Object} game2 - 游戏2
     * @returns {number} 相似度分数 (0-1)
     */
    _calculateGameSimilarity(game1, game2) {
        let score = 0;
        let factors = 0;

        // 1. 分类相似度 (权重: 40%)
        if (game1.category === game2.category) {
            score += 0.4;
        }
        factors += 0.4;

        // 2. 标签相似度 (权重: 30%)
        if (game1.tags && game2.tags) {
            const tags1 = new Set(game1.tags);
            const tags2 = new Set(game2.tags);
            const intersection = new Set([...tags1].filter(x => tags2.has(x)));
            const union = new Set([...tags1, ...tags2]);
            
            if (union.size > 0) {
                const tagSimilarity = intersection.size / union.size;
                score += tagSimilarity * 0.3;
            }
        }
        factors += 0.3;

        // 3. 评分相似度 (权重: 15%)
        if (game1.rating && game2.rating) {
            const ratingDiff = Math.abs(game1.rating - game2.rating);
            const ratingSimilarity = Math.max(0, 1 - ratingDiff / 5); // 5星制
            score += ratingSimilarity * 0.15;
        }
        factors += 0.15;

        // 4. 精选游戏加分 (权重: 10%)
        if (game2.featured) {
            score += 0.1;
        }
        factors += 0.1;

        // 5. 热门游戏加分 (权重: 5%)
        if (game2.playCount && game2.playCount > 1000) {
            score += 0.05;
        }
        factors += 0.05;

        return factors > 0 ? score / factors : 0;
    }



    /**
     * 获取混合推荐游戏
     * @param {number} gameId - 当前游戏ID
     * @param {number} limit - 返回数量限制
     * @returns {Array} 混合推荐游戏数组
     */
    getMixedRecommendations(gameId, limit = 8) {
        const currentGame = this.getGameById(gameId);
        if (!currentGame) return this.getFeaturedGames(limit);

        const recommendations = [];
        
        // 1. 获取2个同类游戏
        const sameCategory = this.games
            .filter(game => 
                game.id !== gameId && 
                game.category === currentGame.category
            )
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 2);
        
        recommendations.push(...sameCategory);

        // 2. 获取2个热门游戏
        const popular = this.getPopularGames(4)
            .filter(game => 
                game.id !== gameId && 
                !recommendations.find(r => r.id === game.id)
            )
            .slice(0, 2);
        
        recommendations.push(...popular);

        // 3. 获取2个精选游戏
        const featured = this.getFeaturedGames(4)
            .filter(game => 
                game.id !== gameId && 
                !recommendations.find(r => r.id === game.id)
            )
            .slice(0, 2);
        
        recommendations.push(...featured);

        // 4. 如果还不够，补充其他游戏
        if (recommendations.length < limit) {
            const additional = this.games
                .filter(game => 
                    game.id !== gameId && 
                    !recommendations.find(r => r.id === game.id)
                )
                .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                .slice(0, limit - recommendations.length);
            
            recommendations.push(...additional);
        }

        return this.getLocalizedGames(recommendations.slice(0, limit));
    }

    /**
     * 获取游戏统计信息
     * @returns {Object} 统计信息对象
     */
    getGameStats() {
        const stats = {
            total: this.games.length,
            categories: {},
            featured: 0,
            totalPlays: 0
        };

        this.games.forEach(game => {
            // 分类统计
            if (!stats.categories[game.category]) {
                stats.categories[game.category] = 0;
            }
            stats.categories[game.category]++;

            // 精选游戏统计
            if (game.featured) {
                stats.featured++;
            }

            // 总游玩次数
            stats.totalPlays += game.playCount || 0;
        });

        return stats;
    }

    /**
     * 获取分类预览数据
     * @returns {Object} 分类预览数据对象
     */
    getCategoriesPreviewData() {
        const categoriesData = {};
        const categories = ['action', 'puzzle', 'arcade', 'casual', 'sports', 'racing'];
        
        categories.forEach(category => {
            const categoryGames = this.games.filter(game => game.category === category);
            const localizedGames = this.getLocalizedGames(categoryGames);
            
            categoriesData[category] = {
                count: categoryGames.length,
                games: localizedGames.slice(0, 4) // 只取前4个游戏用于预览
            };
        });
        
        return categoriesData;
    }

    /**
     * 增加游戏游玩次数
     * @param {number} gameId - 游戏ID
     */
    incrementPlayCount(gameId) {
        const game = this.getGameById(gameId);
        if (game) {
            game.playCount = (game.playCount || 0) + 1;
            // 这里可以添加向服务器同步数据的逻辑
            console.log(`游戏 "${game.title}" 游玩次数增加到 ${game.playCount}`);
        }
    }

    /**
     * 获取当前筛选的游戏
     * @returns {Array} 当前筛选的游戏数组
     */
    getCurrentGames() {
        return this.getLocalizedGames(this.filteredGames);
    }

    /**
     * 获取所有游戏
     * @returns {Array} 所有游戏数组
     */
    getAllGames() {
        return this.getLocalizedGames(this.games);
    }

    /**
     * 检查是否正在加载
     * @returns {boolean} 是否正在加载
     */
    isLoadingGames() {
        return this.isLoading;
    }

    /**
     * 重新加载游戏数据
     * @returns {Promise<Array>} 游戏数据数组
     */
    async reloadGames() {
        this.games = [];
        this.filteredGames = [];
        this.loadPromise = null;
        return this.loadGames();
    }
}

// 创建单例实例
const gameManager = new GameManager();

export default gameManager;