/**
 * 游戏收藏管理器
 * 负责管理用户的游戏收藏功能
 */

import { STORAGE_KEYS, SUCCESS_MESSAGES } from '../utils/constants.js';
import { storage, showNotification } from '../utils/helpers.js';

class FavoritesManager {
    constructor() {
        this.favorites = []; // 收藏的游戏ID数组
        this.favoritesData = []; // 收藏的游戏详细数据
        this.init();
    }

    /**
     * 初始化收藏管理器
     */
    init() {
        this.loadFavorites();
        console.log('游戏收藏管理器已初始化');
    }

    /**
     * 从本地存储加载收藏列表
     */
    loadFavorites() {
        try {
            this.favorites = storage.get(STORAGE_KEYS.FAVORITES, []);
            console.log(`已加载 ${this.favorites.length} 个收藏游戏`);
        } catch (error) {
            console.error('加载收藏列表失败:', error);
            this.favorites = [];
        }
    }

    /**
     * 保存收藏列表到本地存储
     */
    saveFavorites() {
        try {
            storage.set(STORAGE_KEYS.FAVORITES, this.favorites);
            console.log('收藏列表已保存');
        } catch (error) {
            console.error('保存收藏列表失败:', error);
        }
    }

    /**
     * 添加游戏到收藏
     * @param {Object} game - 游戏对象
     * @returns {boolean} 是否添加成功
     */
    addToFavorites(game) {
        if (!game || !game.id) {
            console.warn('无效的游戏对象，无法添加到收藏');
            return false;
        }

        const gameId = parseInt(game.id);

        // 检查游戏是否已在收藏中
        if (this.favorites.includes(gameId)) {
            console.log(`游戏 "${game.title}" 已在收藏列表中`);
            return false;
        }

        // 添加到收藏列表
        this.favorites.push(gameId);
        
        // 保存到本地存储
        this.saveFavorites();
        
        console.log(`游戏 "${game.title}" 已添加到收藏`);
        showNotification(SUCCESS_MESSAGES.GAME_ADDED_TO_FAVORITES, 'success');
        
        return true;
    }

    /**
     * 从收藏中移除游戏
     * @param {number} gameId - 游戏ID
     * @returns {boolean} 是否移除成功
     */
    removeFromFavorites(gameId) {
        const gameIdNum = parseInt(gameId);
        const index = this.favorites.indexOf(gameIdNum);
        
        if (index === -1) {
            console.log(`游戏ID ${gameId} 不在收藏列表中`);
            return false;
        }

        // 从收藏列表中移除
        this.favorites.splice(index, 1);
        
        // 保存到本地存储
        this.saveFavorites();
        
        console.log(`游戏ID ${gameId} 已从收藏中移除`);
        showNotification(SUCCESS_MESSAGES.GAME_REMOVED_FROM_FAVORITES, 'success');
        
        return true;
    }

    /**
     * 切换游戏的收藏状态
     * @param {Object} game - 游戏对象
     * @returns {boolean} 切换后的收藏状态（true表示已收藏）
     */
    toggleFavorite(game) {
        if (!game || !game.id) {
            console.warn('无效的游戏对象');
            return false;
        }

        const gameId = parseInt(game.id);
        const isFavorited = this.isFavorited(gameId);

        if (isFavorited) {
            this.removeFromFavorites(gameId);
            return false;
        } else {
            this.addToFavorites(game);
            return true;
        }
    }

    /**
     * 检查游戏是否已收藏
     * @param {number} gameId - 游戏ID
     * @returns {boolean} 是否已收藏
     */
    isFavorited(gameId) {
        return this.favorites.includes(parseInt(gameId));
    }

    /**
     * 获取收藏的游戏ID列表
     * @returns {Array} 收藏的游戏ID数组
     */
    getFavoriteIds() {
        return [...this.favorites];
    }

    /**
     * 获取收藏的游戏详细数据
     * @param {Function} getGameById - 根据ID获取游戏的函数
     * @returns {Array} 收藏的游戏数据数组
     */
    getFavoriteGames(getGameById) {
        if (typeof getGameById !== 'function') {
            console.error('需要提供getGameById函数');
            return [];
        }

        const favoriteGames = [];
        
        this.favorites.forEach(gameId => {
            const game = getGameById(gameId);
            if (game) {
                favoriteGames.push({
                    ...game,
                    addedToFavorites: new Date().toISOString() // 可以后续优化为实际添加时间
                });
            }
        });

        return favoriteGames;
    }

    /**
     * 获取收藏统计信息
     * @param {Function} getGameById - 根据ID获取游戏的函数
     * @returns {Object} 收藏统计信息
     */
    getFavoritesStats(getGameById) {
        const stats = {
            totalFavorites: this.favorites.length,
            categoriesCount: {},
            averageRating: 0,
            topCategory: null
        };

        if (this.favorites.length === 0) {
            return stats;
        }

        let totalRating = 0;
        let ratedGamesCount = 0;

        this.favorites.forEach(gameId => {
            const game = getGameById(gameId);
            if (game) {
                // 分类统计
                const category = game.category || 'unknown';
                stats.categoriesCount[category] = (stats.categoriesCount[category] || 0) + 1;

                // 评分统计
                if (game.rating && game.rating > 0) {
                    totalRating += game.rating;
                    ratedGamesCount++;
                }
            }
        });

        // 计算平均评分
        if (ratedGamesCount > 0) {
            stats.averageRating = totalRating / ratedGamesCount;
        }

        // 找出最喜欢的分类
        let maxCount = 0;
        Object.entries(stats.categoriesCount).forEach(([category, count]) => {
            if (count > maxCount) {
                maxCount = count;
                stats.topCategory = category;
            }
        });

        return stats;
    }

    /**
     * 清空所有收藏
     */
    clearFavorites() {
        this.favorites = [];
        this.saveFavorites();
        console.log('所有收藏已清空');
        showNotification('所有收藏已清空', 'success');
    }

    /**
     * 导出收藏数据
     * @returns {Object} 导出的收藏数据
     */
    exportFavorites() {
        return {
            favorites: this.favorites,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
    }

    /**
     * 导入收藏数据
     * @param {Object} data - 要导入的收藏数据
     * @returns {boolean} 导入是否成功
     */
    importFavorites(data) {
        try {
            if (!data || !Array.isArray(data.favorites)) {
                throw new Error('无效的收藏数据格式');
            }

            // 合并现有收藏和导入的收藏
            const importedFavorites = data.favorites.map(id => parseInt(id)).filter(id => !isNaN(id));
            const mergedFavorites = [...new Set([...this.favorites, ...importedFavorites])];

            this.favorites = mergedFavorites;
            this.saveFavorites();

            console.log('收藏数据导入成功');
            showNotification(`成功导入 ${importedFavorites.length} 个收藏游戏`, 'success');
            return true;
        } catch (error) {
            console.error('导入收藏数据失败:', error);
            showNotification('导入收藏数据失败', 'error');
            return false;
        }
    }

    /**
     * 获取收藏数量
     * @returns {number} 收藏数量
     */
    getFavoritesCount() {
        return this.favorites.length;
    }

    /**
     * 批量添加收藏
     * @param {Array} gameIds - 游戏ID数组
     * @returns {number} 成功添加的数量
     */
    batchAddFavorites(gameIds) {
        if (!Array.isArray(gameIds)) {
            console.warn('gameIds必须是数组');
            return 0;
        }

        let addedCount = 0;
        const validIds = gameIds.map(id => parseInt(id)).filter(id => !isNaN(id));

        validIds.forEach(gameId => {
            if (!this.favorites.includes(gameId)) {
                this.favorites.push(gameId);
                addedCount++;
            }
        });

        if (addedCount > 0) {
            this.saveFavorites();
            console.log(`批量添加了 ${addedCount} 个收藏游戏`);
            showNotification(`成功添加 ${addedCount} 个游戏到收藏`, 'success');
        }

        return addedCount;
    }

    /**
     * 批量移除收藏
     * @param {Array} gameIds - 游戏ID数组
     * @returns {number} 成功移除的数量
     */
    batchRemoveFavorites(gameIds) {
        if (!Array.isArray(gameIds)) {
            console.warn('gameIds必须是数组');
            return 0;
        }

        let removedCount = 0;
        const validIds = gameIds.map(id => parseInt(id)).filter(id => !isNaN(id));

        validIds.forEach(gameId => {
            const index = this.favorites.indexOf(gameId);
            if (index !== -1) {
                this.favorites.splice(index, 1);
                removedCount++;
            }
        });

        if (removedCount > 0) {
            this.saveFavorites();
            console.log(`批量移除了 ${removedCount} 个收藏游戏`);
            showNotification(`成功移除 ${removedCount} 个游戏收藏`, 'success');
        }

        return removedCount;
    }

    /**
     * 搜索收藏的游戏
     * @param {string} query - 搜索关键词
     * @param {Function} getGameById - 根据ID获取游戏的函数
     * @returns {Array} 搜索结果数组
     */
    searchFavorites(query, getGameById) {
        if (!query || typeof getGameById !== 'function') {
            return this.getFavoriteGames(getGameById);
        }

        const favoriteGames = this.getFavoriteGames(getGameById);
        const searchQuery = query.toLowerCase().trim();

        return favoriteGames.filter(game => {
            const title = (typeof game.title === 'string' ? game.title : game.title?.en || '').toLowerCase();
            const description = (typeof game.description === 'string' ? game.description : game.description?.en || '').toLowerCase();
            const category = (game.category || '').toLowerCase();

            return title.includes(searchQuery) || 
                   description.includes(searchQuery) || 
                   category.includes(searchQuery);
        });
    }

    /**
     * 按分类筛选收藏的游戏
     * @param {string} category - 游戏分类
     * @param {Function} getGameById - 根据ID获取游戏的函数
     * @returns {Array} 筛选结果数组
     */
    filterFavoritesByCategory(category, getGameById) {
        if (!category || category === 'all' || typeof getGameById !== 'function') {
            return this.getFavoriteGames(getGameById);
        }

        const favoriteGames = this.getFavoriteGames(getGameById);
        return favoriteGames.filter(game => game.category === category);
    }
}

// 创建单例实例
const favoritesManager = new FavoritesManager();

export default favoritesManager;