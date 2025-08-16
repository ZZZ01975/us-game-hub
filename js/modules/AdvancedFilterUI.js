/**
 * 高级筛选界面组件
 * 负责渲染和管理筛选界面的交互
 */

class AdvancedFilterUI {
    constructor(filterSortManager, i18nManager) {
        this.filterSortManager = filterSortManager;
        this.i18nManager = i18nManager;
        this.container = null;
        this.isCollapsed = false;
        this.filterOptions = null;
        
        // 绑定方法
        this.handleFilterChange = this.handleFilterChange.bind(this);
        this.handleSortChange = this.handleSortChange.bind(this);
        this.handleReset = this.handleReset.bind(this);
        this.togglePanel = this.togglePanel.bind(this);
    }

    /**
     * 初始化筛选界面
     * @param {string|HTMLElement} container - 容器选择器或元素
     */
    init(container) {
        this.container = typeof container === 'string' ? 
            document.querySelector(container) : container;
        
        if (!this.container) {
            console.error('筛选界面容器未找到');
            return;
        }

        this.loadFilterOptions();
        this.render();
        this.bindEvents();
    }

    /**
     * 加载筛选选项
     */
    loadFilterOptions() {
        this.filterOptions = this.filterSortManager.getFilterOptions();
    }

    /**
     * 渲染筛选界面
     */
    render() {
        const currentFilters = this.filterSortManager.getCurrentFilters();
        const currentSort = this.filterSortManager.getCurrentSort();
        const stats = this.filterSortManager.getFilterStats();

        this.container.innerHTML = `
            <div class="filter-panel ${this.isCollapsed ? 'collapsed' : ''}">
                ${this.renderHeader()}
                ${this.renderStats(stats)}
                ${this.renderContent(currentFilters, currentSort)}
            </div>
        `;
    }

    /**
     * 渲染筛选面板头部
     */
    renderHeader() {
        return `
            <div class="filter-header" onclick="advancedFilterUI.togglePanel()">
                <div class="filter-title">
                    <span>🔍</span>
                    <span data-i18n="filter.title">高级筛选</span>
                </div>
                <button class="filter-toggle ${this.isCollapsed ? 'collapsed' : ''}">
                    ▼
                </button>
            </div>
        `;
    }

    /**
     * 渲染统计信息
     */
    renderStats(stats) {
        return `
            <div class="filter-stats">
                <div class="filter-stats-text">
                    <span data-i18n="filter.showing">显示</span>
                    <span class="filter-stats-count">${stats.filtered}</span>
                    <span data-i18n="filter.of">个游戏，共</span>
                    <span class="filter-stats-count">${stats.total}</span>
                    <span data-i18n="filter.total">个</span>
                </div>
                <button class="filter-clear" onclick="advancedFilterUI.handleReset()">
                    <span data-i18n="filter.clearAll">清除所有筛选</span>
                </button>
            </div>
        `;
    }

    /**
     * 渲染筛选内容
     */
    renderContent(currentFilters, currentSort) {
        return `
            <div class="filter-content ${this.isCollapsed ? 'collapsed' : ''}">
                ${this.renderFilterGroups(currentFilters)}
                ${this.renderSortControls(currentSort)}
                ${this.renderActions()}
            </div>
        `;
    }

    /**
     * 渲染筛选组
     */
    renderFilterGroups(currentFilters) {
        return `
            <!-- 分类筛选 -->
            <div class="filter-group">
                <div class="filter-group-title" data-i18n="filter.category">分类</div>
                <select class="filter-select" id="filter-category" onchange="advancedFilterUI.handleFilterChange()">
                    <option value="all" ${currentFilters.category === 'all' ? 'selected' : ''}>
                        <span data-i18n="filter.allCategories">所有分类</span>
                    </option>
                    ${this.filterOptions.categories.map(category => `
                        <option value="${category}" ${currentFilters.category === category ? 'selected' : ''}>
                            ${this.getCategoryName(category)}
                        </option>
                    `).join('')}
                </select>
            </div>

            <!-- 标签筛选 -->
            <div class="filter-group">
                <div class="filter-group-title" data-i18n="filter.tags">标签</div>
                <div class="tag-selector">
                    ${this.filterOptions.tags.map(tag => `
                        <div class="tag-option ${currentFilters.tags.includes(tag) ? 'selected' : ''}" 
                             data-tag="${tag}" onclick="advancedFilterUI.toggleTag('${tag}')">
                            ${this.getTagName(tag)}
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- 评分筛选 -->
            <div class="filter-group">
                <div class="filter-group-title" data-i18n="filter.rating">评分</div>
                <div class="range-slider">
                    <input type="range" class="range-input" id="filter-rating-min" 
                           min="0" max="5" step="0.1" value="${currentFilters.rating.min}"
                           onchange="advancedFilterUI.handleFilterChange()">
                    <div class="range-values">
                        <span>${currentFilters.rating.min}</span>
                        <span>-</span>
                        <span>${currentFilters.rating.max}</span>
                    </div>
                    <input type="range" class="range-input" id="filter-rating-max" 
                           min="0" max="5" step="0.1" value="${currentFilters.rating.max}"
                           onchange="advancedFilterUI.handleFilterChange()">
                </div>
            </div>

            <!-- 难度筛选 -->
            <div class="filter-group">
                <div class="filter-group-title" data-i18n="filter.difficulty">难度</div>
                <select class="filter-select" id="filter-difficulty" onchange="advancedFilterUI.handleFilterChange()">
                    <option value="all" ${currentFilters.difficulty === 'all' ? 'selected' : ''}>
                        <span data-i18n="filter.allDifficulties">所有难度</span>
                    </option>
                    ${this.filterOptions.difficulties.map(difficulty => `
                        <option value="${difficulty}" ${currentFilters.difficulty === difficulty ? 'selected' : ''}>
                            ${this.getDifficultyName(difficulty)}
                        </option>
                    `).join('')}
                </select>
            </div>

            <!-- 年龄筛选 -->
            <div class="filter-group">
                <div class="filter-group-title" data-i18n="filter.minAge">最小年龄</div>
                <select class="filter-select" id="filter-min-age" onchange="advancedFilterUI.handleFilterChange()">
                    ${this.filterOptions.minAges.map(age => `
                        <option value="${age}" ${currentFilters.minAge === age ? 'selected' : ''}>
                            ${age}+ <span data-i18n="filter.years">岁</span>
                        </option>
                    `).join('')}
                </select>
            </div>

            <!-- 精选筛选 -->
            <div class="filter-group">
                <div class="filter-group-title" data-i18n="filter.featured">精选状态</div>
                <select class="filter-select" id="filter-featured" onchange="advancedFilterUI.handleFilterChange()">
                    <option value="all" ${currentFilters.featured === 'all' ? 'selected' : ''}>
                        <span data-i18n="filter.allGames">所有游戏</span>
                    </option>
                    <option value="featured" ${currentFilters.featured === 'featured' ? 'selected' : ''}>
                        <span data-i18n="filter.featuredOnly">仅精选</span>
                    </option>
                    <option value="not_featured" ${currentFilters.featured === 'not_featured' ? 'selected' : ''}>
                        <span data-i18n="filter.notFeatured">非精选</span>
                    </option>
                </select>
            </div>
        `;
    }

    /**
     * 渲染排序控件
     */
    renderSortControls(currentSort) {
        const sortOptions = [
            { value: 'popularityScore', key: 'filter.sort.popularity' },
            { value: 'rating', key: 'filter.sort.rating' },
            { value: 'playCount', key: 'filter.sort.playCount' },
            { value: 'addedDate', key: 'filter.sort.newest' },
            { value: 'title', key: 'filter.sort.title' },
            { value: 'category', key: 'filter.sort.category' },
            { value: 'difficulty', key: 'filter.sort.difficulty' }
        ];

        return `
            <div class="sort-controls">
                <div class="sort-label" data-i18n="filter.sortBy">排序方式:</div>
                <select class="filter-select sort-select" id="sort-field" onchange="advancedFilterUI.handleSortChange()">
                    ${sortOptions.map(option => `
                        <option value="${option.value}" ${currentSort.field === option.value ? 'selected' : ''}>
                            <span data-i18n="${option.key}">${this.getSortOptionName(option.value)}</span>
                        </option>
                    `).join('')}
                </select>
                <button class="sort-order-toggle ${currentSort.order}" 
                        onclick="advancedFilterUI.toggleSortOrder()">
                    <span data-i18n="filter.sort.${currentSort.order}">
                        ${currentSort.order === 'desc' ? '降序' : '升序'}
                    </span>
                </button>
            </div>
        `;
    }

    /**
     * 渲染操作按钮
     */
    renderActions() {
        return `
            <div class="filter-actions">
                <button class="filter-btn" onclick="advancedFilterUI.exportResults()">
                    <span data-i18n="filter.export">导出结果</span>
                </button>
                <button class="filter-btn" onclick="advancedFilterUI.handleReset()">
                    <span data-i18n="filter.reset">重置</span>
                </button>
                <button class="filter-btn primary" onclick="advancedFilterUI.applyFilters()">
                    <span data-i18n="filter.apply">应用筛选</span>
                </button>
            </div>
        `;
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 全局绑定，避免重复绑定
        if (!window.advancedFilterUI) {
            window.advancedFilterUI = this;
        }
    }

    /**
     * 切换面板展开/收起
     */
    togglePanel() {
        this.isCollapsed = !this.isCollapsed;
        this.render();
    }

    /**
     * 处理筛选条件变化
     */
    handleFilterChange() {
        const filters = {
            category: document.getElementById('filter-category')?.value || 'all',
            difficulty: document.getElementById('filter-difficulty')?.value || 'all',
            minAge: parseInt(document.getElementById('filter-min-age')?.value || '0'),
            featured: document.getElementById('filter-featured')?.value || 'all',
            rating: {
                min: parseFloat(document.getElementById('filter-rating-min')?.value || '0'),
                max: parseFloat(document.getElementById('filter-rating-max')?.value || '5')
            },
            tags: this.getSelectedTags()
        };

        this.filterSortManager.setFilters(filters);
        this.updateStats();
        this.notifyFilterChange();
    }

    /**
     * 处理排序变化
     */
    handleSortChange() {
        const field = document.getElementById('sort-field')?.value || 'popularityScore';
        const currentSort = this.filterSortManager.getCurrentSort();
        
        this.filterSortManager.setSort(field, currentSort.order);
        this.notifyFilterChange();
    }

    /**
     * 切换排序顺序
     */
    toggleSortOrder() {
        const currentSort = this.filterSortManager.getCurrentSort();
        const newOrder = currentSort.order === 'desc' ? 'asc' : 'desc';
        
        this.filterSortManager.setSort(currentSort.field, newOrder);
        this.render();
        this.notifyFilterChange();
    }

    /**
     * 切换标签选择
     */
    toggleTag(tag) {
        const tagElement = document.querySelector(`[data-tag="${tag}"]`);
        if (!tagElement) return;

        tagElement.classList.toggle('selected');
        this.handleFilterChange();
    }

    /**
     * 获取选中的标签
     */
    getSelectedTags() {
        const selectedTags = [];
        document.querySelectorAll('.tag-option.selected').forEach(element => {
            selectedTags.push(element.dataset.tag);
        });
        return selectedTags;
    }

    /**
     * 重置筛选条件
     */
    handleReset() {
        this.filterSortManager.resetFilters();
        this.filterSortManager.resetSort();
        this.render();
        this.notifyFilterChange();
    }

    /**
     * 应用筛选
     */
    applyFilters() {
        this.handleFilterChange();
        // 可以添加额外的应用逻辑
    }

    /**
     * 导出筛选结果
     */
    exportResults() {
        const format = confirm('选择导出格式:\n确定 = JSON\n取消 = CSV') ? 'json' : 'csv';
        const data = this.filterSortManager.exportFilteredGames(format);
        
        const blob = new Blob([data], { 
            type: format === 'json' ? 'application/json' : 'text/csv' 
        });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `filtered-games.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 更新统计信息
     */
    updateStats() {
        const stats = this.filterSortManager.getFilterStats();
        const statsElement = this.container.querySelector('.filter-stats');
        if (statsElement) {
            statsElement.innerHTML = this.renderStats(stats);
        }
    }

    /**
     * 通知筛选变化
     */
    notifyFilterChange() {
        const event = new CustomEvent('filterChange', {
            detail: {
                filters: this.filterSortManager.getCurrentFilters(),
                sort: this.filterSortManager.getCurrentSort(),
                games: this.filterSortManager.sortedGames
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * 获取分类名称
     */
    getCategoryName(category) {
        const names = {
            'action': '动作',
            'puzzle': '益智',
            'arcade': '街机',
            'casual': '休闲'
        };
        return names[category] || category;
    }

    /**
     * 获取标签名称
     */
    getTagName(tag) {
        const names = {
            'featured': '精选',
            'new': '新游戏',
            'hot': '热门',
            'popular': '受欢迎',
            'classic': '经典',
            'family': '家庭',
            'memory': '记忆',
            'action': '动作',
            'platformer': '平台',
            'relaxing': '放松'
        };
        return names[tag] || tag;
    }

    /**
     * 获取难度名称
     */
    getDifficultyName(difficulty) {
        const names = {
            'easy': '简单',
            'medium': '中等',
            'hard': '困难'
        };
        return names[difficulty] || difficulty;
    }

    /**
     * 获取排序选项名称
     */
    getSortOptionName(option) {
        const names = {
            'popularityScore': '热度',
            'rating': '评分',
            'playCount': '播放次数',
            'addedDate': '最新',
            'title': '标题',
            'category': '分类',
            'difficulty': '难度'
        };
        return names[option] || option;
    }

    /**
     * 销毁组件
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        if (window.advancedFilterUI === this) {
            delete window.advancedFilterUI;
        }
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedFilterUI;
} else {
    window.AdvancedFilterUI = AdvancedFilterUI;
}