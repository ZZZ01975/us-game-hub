/**
 * 筛选和排序管理器
 * 负责游戏数据的筛选、排序和高级搜索功能
 */

class FilterSortManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.currentFilters = {
            category: 'all',
            tags: [],
            rating: { min: 0, max: 5 },
            difficulty: 'all',
            minAge: 0,
            featured: 'all',
            status: 'active'
        };
        this.currentSort = {
            field: 'popularityScore',
            order: 'desc'
        };
        this.filteredGames = [];
        this.sortedGames = [];
    }

    /**
     * 设置筛选条件
     * @param {Object} filters - 筛选条件对象
     */
    setFilters(filters) {
        this.currentFilters = { ...this.currentFilters, ...filters };
        this.applyFiltersAndSort();
    }

    /**
     * 设置排序条件
     * @param {string} field - 排序字段
     * @param {string} order - 排序顺序 ('asc' 或 'desc')
     */
    setSort(field, order = 'desc') {
        this.currentSort = { field, order };
        this.applyFiltersAndSort();
    }

    /**
     * 应用筛选和排序
     * @returns {Array} 筛选排序后的游戏数组
     */
    applyFiltersAndSort() {
        const gameData = this.dataManager.gameData;
        if (!gameData || !gameData.games) {
            this.filteredGames = [];
            this.sortedGames = [];
            return [];
        }

        // 先筛选
        this.filteredGames = this.filterGames(gameData.games);
        
        // 再排序
        this.sortedGames = this.sortGames(this.filteredGames);
        
        return this.sortedGames;
    }

    /**
     * 筛选游戏
     * @param {Array} games - 游戏数组
     * @returns {Array} 筛选后的游戏数组
     */
    filterGames(games) {
        return games.filter(game => {
            // 分类筛选
            if (this.currentFilters.category !== 'all' && 
                game.category !== this.currentFilters.category) {
                return false;
            }

            // 标签筛选
            if (this.currentFilters.tags.length > 0) {
                const hasRequiredTag = this.currentFilters.tags.some(tag => 
                    game.tags && game.tags.includes(tag)
                );
                if (!hasRequiredTag) {
                    return false;
                }
            }

            // 评分筛选
            if (game.rating < this.currentFilters.rating.min || 
                game.rating > this.currentFilters.rating.max) {
                return false;
            }

            // 难度筛选
            if (this.currentFilters.difficulty !== 'all' && 
                game.metadata && game.metadata.difficulty !== this.currentFilters.difficulty) {
                return false;
            }

            // 年龄筛选
            if (game.metadata && game.metadata.minAge > this.currentFilters.minAge) {
                return false;
            }

            // 精选筛选
            if (this.currentFilters.featured === 'featured' && !game.featured) {
                return false;
            } else if (this.currentFilters.featured === 'not_featured' && game.featured) {
                return false;
            }

            // 状态筛选
            if (this.currentFilters.status !== 'all' && 
                game.status !== this.currentFilters.status) {
                return false;
            }

            return true;
        });
    }

    /**
     * 排序游戏
     * @param {Array} games - 游戏数组
     * @returns {Array} 排序后的游戏数组
     */
    sortGames(games) {
        const sortedGames = [...games];
        const { field, order } = this.currentSort;

        sortedGames.sort((a, b) => {
            let valueA, valueB;

            switch (field) {
                case 'title':
                    // 按标题排序（使用英文标题）
                    valueA = (a.title && a.title.en) ? a.title.en.toLowerCase() : '';
                    valueB = (b.title && b.title.en) ? b.title.en.toLowerCase() : '';
                    break;

                case 'rating':
                    valueA = a.rating || 0;
                    valueB = b.rating || 0;
                    break;

                case 'playCount':
                    valueA = a.playCount || 0;
                    valueB = b.playCount || 0;
                    break;

                case 'addedDate':
                    valueA = new Date(a.addedDate || 0);
                    valueB = new Date(b.addedDate || 0);
                    break;

                case 'lastUpdated':
                    valueA = new Date(a.lastUpdated || 0);
                    valueB = new Date(b.lastUpdated || 0);
                    break;

                case 'popularityScore':
                    valueA = a.popularityScore || 0;
                    valueB = b.popularityScore || 0;
                    break;

                case 'category':
                    valueA = a.category || '';
                    valueB = b.category || '';
                    break;

                case 'difficulty':
                    // 难度排序：easy < medium < hard
                    const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
                    valueA = difficultyOrder[a.metadata?.difficulty] || 0;
                    valueB = difficultyOrder[b.metadata?.difficulty] || 0;
                    break;

                case 'size':
                    // 按文件大小排序（需要解析大小字符串）
                    valueA = this.parseSizeToBytes(a.metadata?.size);
                    valueB = this.parseSizeToBytes(b.metadata?.size);
                    break;

                default:
                    valueA = a[field] || 0;
                    valueB = b[field] || 0;
            }

            // 比较值
            let comparison = 0;
            if (valueA < valueB) {
                comparison = -1;
            } else if (valueA > valueB) {
                comparison = 1;
            }

            // 应用排序顺序
            return order === 'asc' ? comparison : -comparison;
        });

        return sortedGames;
    }

    /**
     * 解析大小字符串为字节数
     * @param {string} sizeStr - 大小字符串（如 "2.3MB"）
     * @returns {number} 字节数
     */
    parseSizeToBytes(sizeStr) {
        if (!sizeStr) return 0;
        
        const units = {
            'B': 1,
            'KB': 1024,
            'MB': 1024 * 1024,
            'GB': 1024 * 1024 * 1024
        };

        const match = sizeStr.match(/^([\d.]+)\s*([A-Z]+)$/i);
        if (!match) return 0;

        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        
        return value * (units[unit] || 1);
    }

    /**
     * 获取可用的筛选选项
     * @returns {Object} 筛选选项对象
     */
    getFilterOptions() {
        const gameData = this.dataManager.gameData;
        if (!gameData || !gameData.games) {
            return this.getDefaultFilterOptions();
        }

        const options = {
            categories: [],
            tags: [],
            difficulties: [],
            minAges: [],
            ratingRange: { min: 0, max: 5 },
            developers: []
        };

        const categoriesSet = new Set();
        const tagsSet = new Set();
        const difficultiesSet = new Set();
        const minAgesSet = new Set();
        const developersSet = new Set();
        let minRating = 5, maxRating = 0;

        gameData.games.forEach(game => {
            // 收集分类
            if (game.category) {
                categoriesSet.add(game.category);
            }

            // 收集标签
            if (game.tags) {
                game.tags.forEach(tag => tagsSet.add(tag));
            }

            // 收集难度
            if (game.metadata && game.metadata.difficulty) {
                difficultiesSet.add(game.metadata.difficulty);
            }

            // 收集最小年龄
            if (game.metadata && game.metadata.minAge !== undefined) {
                minAgesSet.add(game.metadata.minAge);
            }

            // 收集开发者
            if (game.metadata && game.metadata.developer) {
                developersSet.add(game.metadata.developer);
            }

            // 计算评分范围
            if (game.rating) {
                minRating = Math.min(minRating, game.rating);
                maxRating = Math.max(maxRating, game.rating);
            }
        });

        options.categories = Array.from(categoriesSet).sort();
        options.tags = Array.from(tagsSet).sort();
        options.difficulties = Array.from(difficultiesSet).sort();
        options.minAges = Array.from(minAgesSet).sort((a, b) => a - b);
        options.developers = Array.from(developersSet).sort();
        options.ratingRange = { min: minRating, max: maxRating };

        return options;
    }

    /**
     * 获取默认筛选选项
     * @returns {Object} 默认筛选选项
     */
    getDefaultFilterOptions() {
        return {
            categories: ['action', 'puzzle', 'arcade', 'casual'],
            tags: ['featured', 'new', 'hot', 'popular'],
            difficulties: ['easy', 'medium', 'hard'],
            minAges: [0, 3, 6, 10, 13, 16],
            ratingRange: { min: 0, max: 5 },
            developers: ['US Game Hub']
        };
    }

    /**
     * 重置筛选条件
     */
    resetFilters() {
        this.currentFilters = {
            category: 'all',
            tags: [],
            rating: { min: 0, max: 5 },
            difficulty: 'all',
            minAge: 0,
            featured: 'all',
            status: 'active'
        };
        this.applyFiltersAndSort();
    }

    /**
     * 重置排序条件
     */
    resetSort() {
        this.currentSort = {
            field: 'popularityScore',
            order: 'desc'
        };
        this.applyFiltersAndSort();
    }

    /**
     * 获取当前筛选条件
     * @returns {Object} 当前筛选条件
     */
    getCurrentFilters() {
        return { ...this.currentFilters };
    }

    /**
     * 获取当前排序条件
     * @returns {Object} 当前排序条件
     */
    getCurrentSort() {
        return { ...this.currentSort };
    }

    /**
     * 获取筛选后的游戏数量
     * @returns {number} 游戏数量
     */
    getFilteredCount() {
        return this.filteredGames.length;
    }

    /**
     * 获取总游戏数量
     * @returns {number} 总游戏数量
     */
    getTotalCount() {
        const gameData = this.dataManager.gameData;
        return gameData && gameData.games ? gameData.games.length : 0;
    }

    /**
     * 获取筛选统计信息
     * @returns {Object} 统计信息
     */
    getFilterStats() {
        return {
            total: this.getTotalCount(),
            filtered: this.getFilteredCount(),
            filters: this.getCurrentFilters(),
            sort: this.getCurrentSort()
        };
    }

    /**
     * 导出筛选结果
     * @param {string} format - 导出格式 ('json' 或 'csv')
     * @returns {string} 导出数据
     */
    exportFilteredGames(format = 'json') {
        if (format === 'csv') {
            return this.exportToCSV(this.sortedGames);
        } else {
            return JSON.stringify({
                filters: this.currentFilters,
                sort: this.currentSort,
                games: this.sortedGames,
                count: this.sortedGames.length,
                exportDate: new Date().toISOString()
            }, null, 2);
        }
    }

    /**
     * 导出为CSV格式
     * @param {Array} games - 游戏数组
     * @returns {string} CSV字符串
     */
    exportToCSV(games) {
        if (games.length === 0) {
            return 'No games to export';
        }

        const headers = [
            'ID', 'Title (EN)', 'Category', 'Rating', 'Play Count',
            'Featured', 'Tags', 'Added Date', 'Developer', 'Version', 'Size'
        ];

        const rows = games.map(game => [
            game.id,
            game.title?.en || '',
            game.category,
            game.rating || 0,
            game.playCount || 0,
            game.featured ? 'Yes' : 'No',
            game.tags ? game.tags.join(';') : '',
            game.addedDate || '',
            game.metadata?.developer || '',
            game.metadata?.version || '',
            game.metadata?.size || ''
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        return csvContent;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FilterSortManager;
} else {
    window.FilterSortManager = FilterSortManager;
}