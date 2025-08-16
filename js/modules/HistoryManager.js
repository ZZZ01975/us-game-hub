/**
 * 游戏历史记录管理器
 * 负责管理用户的游戏历史记录功能
 */

import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../utils/constants.js';
import { storage, formatDate } from '../utils/helpers.js';

class HistoryManager {
    constructor() {
        this.history = []; // 游戏历史记录数组
        this.maxHistoryItems = 50; // 最大历史记录数量
        this.init();
    }

    /**
     * 初始化历史记录管理器
     */
    init() {
        this.loadHistory();
        console.log('游戏历史记录管理器已初始化');
    }

    /**
     * 从本地存储加载历史记录
     */
    loadHistory() {
        try {
            this.history = storage.get(STORAGE_KEYS.GAME_HISTORY, []);
            console.log(`已加载 ${this.history.length} 条游戏历史记录`);
        } catch (error) {
            console.error('加载游戏历史记录失败:', error);
            this.history = [];
        }
    }

    /**
     * 保存历史记录到本地存储
     */
    saveHistory() {
        try {
            storage.set(STORAGE_KEYS.GAME_HISTORY, this.history);
            console.log('游戏历史记录已保存');
        } catch (error) {
            console.error('保存游戏历史记录失败:', error);
        }
    }

    /**
     * 添加游戏到历史记录
     * @param {Object} game - 游戏对象
     */
    addToHistory(game) {
        if (!game || !game.id) {
            console.warn('无效的游戏对象，无法添加到历史记录');
            return;
        }

        const now = new Date().toISOString();
        
        // 检查游戏是否已在历史记录中
        const existingIndex = this.history.findIndex(item => item.gameId === game.id);
        
        if (existingIndex !== -1) {
            // 如果游戏已存在，更新时间并移到最前面
            this.history[existingIndex].lastPlayed = now;
            this.history[existingIndex].playCount = (this.history[existingIndex].playCount || 0) + 1;
            
            // 移动到数组开头
            const item = this.history.splice(existingIndex, 1)[0];
            this.history.unshift(item);
        } else {
            // 如果游戏不存在，添加新记录
            const historyItem = {
                gameId: game.id,
                title: game.title,
                category: game.category,
                image: game.image,
                gameUrl: game.gameUrl,
                lastPlayed: now,
                playCount: 1,
                addedToHistory: now
            };
            
            this.history.unshift(historyItem);
        }

        // 限制历史记录数量
        if (this.history.length > this.maxHistoryItems) {
            this.history = this.history.slice(0, this.maxHistoryItems);
        }

        // 保存到本地存储
        this.saveHistory();
        
        console.log(`游戏 "${game.title}" 已添加到历史记录`);
    }

    /**
     * 获取历史记录列表
     * @param {number} limit - 限制返回数量
     * @returns {Array} 历史记录数组
     */
    getHistory(limit = null) {
        const historyList = limit ? this.history.slice(0, limit) : [...this.history];
        return historyList.map(item => ({
            ...item,
            lastPlayedFormatted: this.formatPlayTime(item.lastPlayed)
        }));
    }

    /**
     * 获取最近游玩的游戏
     * @param {number} limit - 限制返回数量，默认10个
     * @returns {Array} 最近游玩的游戏数组
     */
    getRecentGames(limit = 10) {
        return this.getHistory(limit);
    }

    /**
     * 根据游戏ID获取历史记录项
     * @param {number} gameId - 游戏ID
     * @returns {Object|null} 历史记录项
     */
    getHistoryItem(gameId) {
        const item = this.history.find(item => item.gameId === parseInt(gameId));
        if (item) {
            return {
                ...item,
                lastPlayedFormatted: this.formatPlayTime(item.lastPlayed)
            };
        }
        return null;
    }

    /**
     * 从历史记录中移除游戏
     * @param {number} gameId - 游戏ID
     */
    removeFromHistory(gameId) {
        const index = this.history.findIndex(item => item.gameId === parseInt(gameId));
        if (index !== -1) {
            const removedItem = this.history.splice(index, 1)[0];
            this.saveHistory();
            console.log(`游戏 "${removedItem.title}" 已从历史记录中移除`);
            return true;
        }
        return false;
    }

    /**
     * 清空所有历史记录
     */
    clearHistory() {
        this.history = [];
        this.saveHistory();
        console.log('所有游戏历史记录已清空');
    }

    /**
     * 检查游戏是否在历史记录中
     * @param {number} gameId - 游戏ID
     * @returns {boolean} 是否在历史记录中
     */
    isInHistory(gameId) {
        return this.history.some(item => item.gameId === parseInt(gameId));
    }

    /**
     * 获取历史记录统计信息
     * @returns {Object} 统计信息对象
     */
    getHistoryStats() {
        const stats = {
            totalGames: this.history.length,
            totalPlayCount: 0,
            categoriesPlayed: {},
            mostPlayedGame: null,
            recentActivity: []
        };

        // 计算总游玩次数和分类统计
        this.history.forEach(item => {
            stats.totalPlayCount += item.playCount || 0;
            
            // 分类统计
            if (!stats.categoriesPlayed[item.category]) {
                stats.categoriesPlayed[item.category] = 0;
            }
            stats.categoriesPlayed[item.category]++;
        });

        // 找出最常玩的游戏
        if (this.history.length > 0) {
            stats.mostPlayedGame = this.history.reduce((prev, current) => {
                return (prev.playCount || 0) > (current.playCount || 0) ? prev : current;
            });
        }

        // 最近7天的活动
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        stats.recentActivity = this.history.filter(item => {
            const lastPlayed = new Date(item.lastPlayed);
            return lastPlayed >= sevenDaysAgo;
        });

        return stats;
    }

    /**
     * 格式化游玩时间
     * @param {string} dateString - 日期字符串
     * @returns {string} 格式化后的时间描述
     */
    formatPlayTime(dateString) {
        const playTime = new Date(dateString);
        const now = new Date();
        const diffMs = now - playTime;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) {
            return '刚刚';
        } else if (diffMinutes < 60) {
            return `${diffMinutes}分钟前`;
        } else if (diffHours < 24) {
            return `${diffHours}小时前`;
        } else if (diffDays < 7) {
            return `${diffDays}天前`;
        } else {
            return formatDate(playTime, 'MM-DD');
        }
    }

    /**
     * 导出历史记录数据
     * @returns {Object} 导出的历史记录数据
     */
    exportHistory() {
        return {
            history: this.history,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
    }

    /**
     * 导入历史记录数据
     * @param {Object} data - 要导入的历史记录数据
     * @returns {boolean} 导入是否成功
     */
    importHistory(data) {
        try {
            if (!data || !Array.isArray(data.history)) {
                throw new Error('无效的历史记录数据格式');
            }

            // 合并现有历史记录和导入的历史记录
            const importedHistory = data.history;
            const mergedHistory = [...this.history];

            importedHistory.forEach(importedItem => {
                const existingIndex = mergedHistory.findIndex(item => item.gameId === importedItem.gameId);
                
                if (existingIndex !== -1) {
                    // 如果游戏已存在，保留游玩次数更多的记录
                    if ((importedItem.playCount || 0) > (mergedHistory[existingIndex].playCount || 0)) {
                        mergedHistory[existingIndex] = importedItem;
                    }
                } else {
                    // 如果游戏不存在，直接添加
                    mergedHistory.push(importedItem);
                }
            });

            // 按最后游玩时间排序
            mergedHistory.sort((a, b) => new Date(b.lastPlayed) - new Date(a.lastPlayed));

            // 限制数量
            this.history = mergedHistory.slice(0, this.maxHistoryItems);
            this.saveHistory();

            console.log('历史记录导入成功');
            return true;
        } catch (error) {
            console.error('导入历史记录失败:', error);
            return false;
        }
    }

    /**
     * 获取历史记录数量
     * @returns {number} 历史记录数量
     */
    getHistoryCount() {
        return this.history.length;
    }

    /**
     * 设置最大历史记录数量
     * @param {number} maxItems - 最大数量
     */
    setMaxHistoryItems(maxItems) {
        if (maxItems > 0) {
            this.maxHistoryItems = maxItems;
            
            // 如果当前历史记录超过新的限制，进行裁剪
            if (this.history.length > maxItems) {
                this.history = this.history.slice(0, maxItems);
                this.saveHistory();
            }
        }
    }
}

// 创建单例实例
const historyManager = new HistoryManager();

export default historyManager;