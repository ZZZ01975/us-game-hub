/**
 * 主应用程序文件
 * 整合各个模块，初始化应用程序
 */

import gameManager from './modules/GameManager.js';
import uiManager from './modules/UIManager.js';
import { I18nManager } from './modules/I18nManager.js';
import historyManager from './modules/HistoryManager.js';
import favoritesManager from './modules/FavoritesManager.js';
import interactionManager from './modules/InteractionManager.js';
import mobileInteractionManager from './modules/MobileInteractionManager.js';
import crossDeviceCompatibilityManager from './modules/CrossDeviceCompatibilityManager.js';
import imageLazyLoader from './modules/ImageLazyLoader.js';
import imageOptimizer from './utils/imageOptimizer.js';
import performanceOptimizer from './modules/PerformanceOptimizer.js';
import seoManager from './modules/SEOManager.js';
import { 
    GAME_CATEGORIES, 
    DEFAULT_SETTINGS, 
    STORAGE_KEYS,
    SEARCH_CONFIG,
    ERROR_MESSAGES 
} from './utils/constants.js';
import { 
    debounce, 
    getUrlParameter, 
    storage, 
    showNotification,
    scrollToElement 
} from './utils/helpers.js';

// 导入监控模块
import AnalyticsManager from './modules/AnalyticsManager.js';
import ErrorMonitor from './modules/ErrorMonitor.js';

/**
 * 主应用程序类
 */
class App {
    constructor() {
        this.currentCategory = DEFAULT_SETTINGS.CATEGORY;
        this.searchQuery = '';
        this.isInitialized = false;
        
        // 初始化国际化管理器
        this.i18nManager = new I18nManager();
        
        // 初始化数据管理器和筛选管理器
        this.dataManager = window.dataManager;
        this.filterSortManager = null;
        this.advancedFilterUI = null;
        
        // 初始化监控系统
        this.analyticsManager = new AnalyticsManager();
        this.errorMonitor = new ErrorMonitor();
        
        // 将监控管理器设置为全局可访问
        window.analyticsManager = this.analyticsManager;
        window.errorMonitor = this.errorMonitor;
        
        // 绑定方法上下文
        this.handleCategoryClick = this.handleCategoryClick.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleBackToTop = this.handleBackToTop.bind(this);
        this.handleFilterChange = this.handleFilterChange.bind(this);
    }

    /**
     * 初始化应用程序
     */
    async init() {
        if (this.isInitialized) return;

        try {
            console.log('开始初始化应用程序...');

            // 初始化跨设备兼容性管理器（最先执行）
            crossDeviceCompatibilityManager.init();
            console.log('跨设备兼容性管理器初始化完成');

            // 初始化性能优化器
            await performanceOptimizer.init();

            // 显示页面加载动画
            interactionManager.init();
            interactionManager.showPageLoading('正在初始化应用程序...');

            // 初始化国际化管理器
            await this.i18nManager.init();

            // 初始化UI管理器
            uiManager.init();

            // 初始化移动端交互管理器
            mobileInteractionManager.init();
            console.log('移动端交互管理器初始化完成');

            // 初始化图片懒加载器
            await imageLazyLoader.init();
            console.log('图片懒加载器初始化完成');

            // 初始化SEO管理器
            seoManager.init();
            console.log('SEO管理器初始化完成');

            // 初始化筛选和排序管理器
            this.filterSortManager = new FilterSortManager(this.dataManager);
            this.advancedFilterUI = new AdvancedFilterUI(this.filterSortManager, this.i18nManager);
            console.log('筛选管理器初始化完成');

            // 设置事件监听器
            this._setupEventListeners();

            // 加载游戏数据
            await this._loadInitialData();

            // 初始化返回顶部按钮
            this._initBackToTop();

            // 恢复用户设置
            this._restoreUserSettings();

            // 注册Service Worker
            this._registerServiceWorker();

            this.isInitialized = true;
            console.log('应用程序初始化完成');

            // 隐藏页面加载动画
            await interactionManager.hidePageLoading();

        } catch (error) {
            console.error('应用程序初始化失败:', error);
            
            // 隐藏加载动画并显示错误
            await interactionManager.hidePageLoading();
            interactionManager.showErrorDialog(
                '初始化失败',
                ERROR_MESSAGES.DATA_LOAD_ERROR,
                {
                    retryCallback: () => this.init()
                }
            );
        }
    }

    /**
     * 设置事件监听器
     * @private
     */
    _setupEventListeners() {
        // 分类导航链接点击事件
        document.querySelectorAll('.category-link').forEach(link => {
            link.addEventListener('click', this.handleCategoryClick);
        });

        // 移动端分类链接点击事件
        document.querySelectorAll('.mobile-category-link').forEach(link => {
            link.addEventListener('click', this.handleCategoryClick);
        });

        // 搜索输入事件
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            const debouncedSearch = debounce(this.handleSearch, SEARCH_CONFIG.DEBOUNCE_DELAY);
            searchInput.addEventListener('input', debouncedSearch);
            
            // 键盘事件处理
            searchInput.addEventListener('keydown', this.handleSearchKeydown.bind(this));
            
            // 搜索框焦点事件
            searchInput.addEventListener('focus', this.handleSearchFocus.bind(this));
            searchInput.addEventListener('blur', this.handleSearchBlur.bind(this));
        }

        // 搜索按钮点击事件
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    this.handleSearch({ target: searchInput });
                }
            });
        }

        // 语言选择器由I18nManager处理

        // 移动端菜单切换
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', this.handleMobileMenuToggle.bind(this));
        }

        // 移动端菜单关闭
        const mobileMenuClose = document.getElementById('mobile-menu-close');
        if (mobileMenuClose) {
            mobileMenuClose.addEventListener('click', this.handleMobileMenuClose.bind(this));
        }

        // 移动端菜单背景点击关闭
        const mobileCategoryMenu = document.getElementById('mobile-category-menu');
        if (mobileCategoryMenu) {
            mobileCategoryMenu.addEventListener('click', (e) => {
                if (e.target === mobileCategoryMenu) {
                    this.handleMobileMenuClose();
                }
            });
        }

        // 滚动事件
        window.addEventListener('scroll', debounce(this.handleScroll, 100));

        // 筛选变化事件
        document.addEventListener('filterChange', this.handleFilterChange);

        // 返回顶部按钮
        const backToTopBtn = document.getElementById('back-to-top');
        if (backToTopBtn) {
            backToTopBtn.addEventListener('click', this.handleBackToTop);
        }

        // 窗口大小改变事件
        window.addEventListener('resize', debounce(() => {
            this._handleResize();
        }, 250));

        // 点击外部关闭下拉菜单
        document.addEventListener('click', this.handleDocumentClick.bind(this));

        // 精选游戏视图切换按钮
        const featuredViewToggle = document.getElementById('featured-view-toggle');
        if (featuredViewToggle) {
            featuredViewToggle.addEventListener('click', this.handleFeaturedViewToggle.bind(this));
        }

        // 查看更多按钮
        const newGamesViewMore = document.getElementById('new-games-view-more');
        if (newGamesViewMore) {
            newGamesViewMore.addEventListener('click', () => this.handleViewMore('new'));
        }

        const mostPlayedViewMore = document.getElementById('most-played-view-more');
        if (mostPlayedViewMore) {
            mostPlayedViewMore.addEventListener('click', () => this.handleViewMore('popular'));
        }

        console.log('事件监听器设置完成');
    }

    /**
     * 加载初始数据
     * @private
     */
    async _loadInitialData() {
        // 显示加载状态
        uiManager.showLoading('正在加载游戏数据...');

        try {
            // 加载游戏数据
            const games = await gameManager.loadGames();
            
            // 渲染精选游戏区域
            this._renderFeaturedGames();
            
            // 渲染最新游戏区域
            this._renderNewGames();
            
            // 渲染热门游戏区域
            this._renderMostPlayedGames();
            
            // 渲染分类预览区域
            this._renderCategoriesPreview();
            
            // 显示游戏列表
            uiManager.renderGamesList(games);

            // 显示最近游玩的游戏
            this._renderRecentGames();

            // 显示收藏的游戏
            this._renderFavoriteGames();

            // 初始化筛选界面
            this._initAdvancedFilter();
            
            console.log('初始数据加载完成');
        } catch (error) {
            console.error('加载初始数据失败:', error);
            throw error;
        }
    }

    /**
     * 处理分类点击事件
     * @param {Event} event - 点击事件
     */
    handleCategoryClick(event) {
        event.preventDefault();
        
        const link = event.currentTarget;
        const category = link.getAttribute('data-category');
        
        if (category === this.currentCategory) return;

        console.log('切换到分类:', category);
        
        // 更新当前分类
        this.currentCategory = category;
        
        // 清空搜索
        this.searchQuery = '';
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // 更新导航状态
        uiManager.updateNavigation(category);
        
        // 筛选并显示游戏
        const filteredGames = gameManager.filterByCategory(category);
        uiManager.renderGamesList(filteredGames);
        
        // 移除自动滚动 - 用户应该控制浏览位置
        // 原来的自动滚动会让页面跳到底部，影响用户体验
    }

    /**
     * 处理搜索事件
     * @param {Event} event - 输入事件
     */
    handleSearch(event) {
        const query = event.target.value.trim();
        
        this.searchQuery = query;
        
        if (query.length === 0) {
            // 清空搜索，显示当前分类的所有游戏
            uiManager.hideSearchResults();
            const filteredGames = gameManager.filterByCategory(this.currentCategory);
            uiManager.renderGamesList(filteredGames);
            return;
        }
        
        if (query.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
            uiManager.hideSearchResults();
            return; // 搜索词太短，不执行搜索
        }
        
        console.log('搜索游戏:', query);
        
        // 执行搜索
        const searchResults = gameManager.searchGames(query);
        
        // 显示搜索结果下拉框
        uiManager.showSearchResults(searchResults, query);
        
        // 同时更新主游戏列表
        uiManager.renderGamesList(searchResults, query);
        
        // 移除自动滚动 - 搜索时用户应该保持当前浏览位置
        // 原来的自动滚动会影响用户搜索体验
    }



    /**
     * 处理语言切换事件（由I18nManager调用）
     * @param {string} language - 语言代码
     */
    async handleLanguageChange(language) {
        console.log('语言已切换到:', language);
        
        // 更新GameManager的当前语言
        gameManager.setCurrentLanguage(language);
        
        // 重新渲染当前游戏列表以应用新语言
        const currentGames = gameManager.filterByCategory(this.currentCategory);
        if (this.searchQuery) {
            const searchResults = gameManager.searchGames(this.searchQuery);
            uiManager.renderGamesList(searchResults, this.searchQuery);
        } else {
            uiManager.renderGamesList(currentGames);
        }
    }

    /**
     * 处理搜索框焦点事件
     * @param {Event} event - 焦点事件
     */
    handleSearchFocus(event) {
        const searchResults = document.getElementById('search-results');
        const query = event.target.value.trim();
        
        if (searchResults && query && query.length >= SEARCH_CONFIG.MIN_QUERY_LENGTH) {
            // 重新执行搜索并显示结果
            const results = gameManager.searchGames(query);
            uiManager.showSearchResults(results, query);
        }
    }

    /**
     * 处理搜索框失焦事件
     * @param {Event} event - 失焦事件
     */
    handleSearchBlur(event) {
        // 延迟隐藏搜索结果，以便点击搜索结果项
        setTimeout(() => {
            const searchResults = document.getElementById('search-results');
            if (searchResults) {
                searchResults.style.display = 'none';
                // 清除键盘导航状态
                this._clearSearchNavigation();
            }
        }, 200);
    }

    /**
     * 处理搜索框键盘事件
     * @param {Event} event - 键盘事件
     */
    handleSearchKeydown(event) {
        const searchResults = document.getElementById('search-results');
        if (!searchResults || searchResults.style.display === 'none') {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.handleSearch(event);
            }
            return;
        }

        const resultItems = searchResults.querySelectorAll('.search-result-item');
        if (resultItems.length === 0) return;

        let currentIndex = -1;
        const activeItem = searchResults.querySelector('.search-result-item.keyboard-active');
        if (activeItem) {
            currentIndex = Array.from(resultItems).indexOf(activeItem);
        }

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this._navigateSearchResults(resultItems, currentIndex + 1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                this._navigateSearchResults(resultItems, currentIndex - 1);
                break;
            case 'Enter':
                event.preventDefault();
                if (activeItem) {
                    activeItem.click();
                } else {
                    this.handleSearch(event);
                }
                break;
            case 'Escape':
                event.preventDefault();
                searchResults.style.display = 'none';
                this._clearSearchNavigation();
                break;
        }
    }

    /**
     * 导航搜索结果
     * @private
     * @param {NodeList} items - 搜索结果项
     * @param {number} index - 目标索引
     */
    _navigateSearchResults(items, index) {
        // 清除当前激活状态
        items.forEach(item => item.classList.remove('keyboard-active'));

        // 处理边界情况
        if (index < 0) index = items.length - 1;
        if (index >= items.length) index = 0;

        // 激活新项
        if (items[index]) {
            items[index].classList.add('keyboard-active');
            items[index].scrollIntoView({ block: 'nearest' });
        }
    }

    /**
     * 清除搜索导航状态
     * @private
     */
    _clearSearchNavigation() {
        const searchResults = document.getElementById('search-results');
        if (searchResults) {
            const activeItems = searchResults.querySelectorAll('.search-result-item.keyboard-active');
            activeItems.forEach(item => item.classList.remove('keyboard-active'));
        }
    }

    /**
     * 处理移动端菜单切换
     */
    handleMobileMenuToggle() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileCategoryMenu = document.getElementById('mobile-category-menu');
        
        if (mobileMenuToggle && mobileCategoryMenu) {
            mobileMenuToggle.classList.toggle('active');
            mobileCategoryMenu.classList.toggle('show');
            
            // 防止背景滚动
            if (mobileCategoryMenu.classList.contains('show')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        }
    }

    /**
     * 处理移动端菜单关闭
     */
    handleMobileMenuClose() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileCategoryMenu = document.getElementById('mobile-category-menu');
        
        if (mobileMenuToggle && mobileCategoryMenu) {
            mobileMenuToggle.classList.remove('active');
            mobileCategoryMenu.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    /**
     * 处理文档点击事件（关闭下拉菜单）
     * @param {Event} event - 点击事件
     */
    handleDocumentClick(event) {
        // 关闭语言选择器下拉菜单
        const languageSelector = document.querySelector('.language-selector');
        if (languageSelector && !languageSelector.contains(event.target)) {
            languageSelector.classList.remove('open');
        }
        
        // 关闭搜索结果
        const searchContainer = document.querySelector('.search-container');
        const searchResults = document.getElementById('search-results');
        if (searchResults && !searchContainer.contains(event.target)) {
            searchResults.style.display = 'none';
        }
    }

    /**
     * 处理精选游戏视图切换
     * @param {Event} event - 点击事件
     */
    handleFeaturedViewToggle(event) {
        event.preventDefault();
        
        const button = event.currentTarget;
        const currentView = button.getAttribute('data-view') || 'grid';
        const newView = currentView === 'grid' ? 'carousel' : 'grid';
        
        // 更新按钮状态
        button.setAttribute('data-view', newView);
        
        // 更新图标显示
        const gridIcon = button.querySelector('.grid-icon');
        const carouselIcon = button.querySelector('.carousel-icon');
        
        if (newView === 'carousel') {
            gridIcon.style.display = 'none';
            carouselIcon.style.display = 'block';
            button.classList.add('active');
        } else {
            gridIcon.style.display = 'block';
            carouselIcon.style.display = 'none';
            button.classList.remove('active');
        }
        
        // 重新渲染精选游戏
        const featuredGames = gameManager.getFeaturedGames(8);
        uiManager.renderFeaturedGames(featuredGames, newView);
        
        console.log(`精选游戏视图已切换到: ${newView}`);
    }

    /**
     * 处理查看更多按钮点击
     * @param {string} type - 类型 ('new' 或 'popular')
     */
    handleViewMore(type) {
        let games = [];
        let category = 'all';
        
        if (type === 'new') {
            games = gameManager.getNewGames(20); // 获取更多最新游戏
            console.log('显示更多最新游戏');
        } else if (type === 'popular') {
            games = gameManager.getPopularGames(20); // 获取更多热门游戏
            console.log('显示更多热门游戏');
        }
        
        // 更新当前分类和搜索状态
        this.currentCategory = category;
        this.searchQuery = '';
        
        // 清空搜索框
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // 更新导航状态
        uiManager.updateNavigation(category);
        
        // 显示游戏列表
        uiManager.renderGamesList(games);
        
        // 移除自动滚动 - 用户应该控制浏览位置
        // 原来的自动滚动会让页面跳到底部，影响用户体验
    }

    /**
     * 处理滚动事件
     * @private
     */
    handleScroll() {
        const backToTopBtn = document.getElementById('back-to-top');
        if (backToTopBtn) {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        }
    }

    /**
     * 处理返回顶部点击事件
     * @private
     */
    handleBackToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    /**
     * 处理窗口大小改变
     * @private
     */
    _handleResize() {
        // 移动端菜单处理
        const mobileCategoryMenu = document.getElementById('mobile-category-menu');
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        
        if (window.innerWidth > 768) {
            // 桌面端：关闭移动端菜单
            if (mobileCategoryMenu) {
                mobileCategoryMenu.classList.remove('show');
            }
            if (mobileMenuToggle) {
                mobileMenuToggle.classList.remove('active');
            }
            document.body.style.overflow = '';
        }
    }

    /**
     * 初始化返回顶部按钮
     * @private
     */
    _initBackToTop() {
        const backToTopBtn = document.getElementById('back-to-top');
        if (backToTopBtn) {
            // 初始状态隐藏
            backToTopBtn.classList.remove('show');
        }
    }

    /**
     * 恢复用户设置
     * @private
     */
    _restoreUserSettings() {
        // 恢复语言设置
        const savedLanguage = storage.get(STORAGE_KEYS.LANGUAGE, DEFAULT_SETTINGS.LANGUAGE);
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.value = savedLanguage;
        }

        console.log('用户设置已恢复');
    }

    /**
     * 注册Service Worker
     * @private
     */
    async _registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.log('浏览器不支持Service Worker');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            console.log('Service Worker注册成功:', registration.scope);

            // 监听Service Worker更新
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('发现Service Worker更新');

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // 新的Service Worker已安装，提示用户刷新
                        showNotification('应用已更新，请刷新页面获取最新版本', 'info');
                    }
                });
            });

            // 监听Service Worker控制变化
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('Service Worker控制权已转移');
                window.location.reload();
            });

        } catch (error) {
            console.warn('Service Worker注册失败:', error);
        }
    }

    /**
     * 渲染最近游玩的游戏
     * @private
     */
    _renderRecentGames() {
        const recentGames = historyManager.getRecentGames(6);
        const recentGamesSection = document.getElementById('recent-games-section');
        
        if (recentGamesSection) {
            uiManager.renderRecentGames(recentGames, recentGamesSection);
        }
    }

    /**
     * 渲染收藏的游戏
     * @private
     */
    _renderFavoriteGames() {
        const favoriteGames = favoritesManager.getFavoriteGames(gameManager.getGameById.bind(gameManager)).slice(0, 6);
        const favoriteGamesSection = document.getElementById('favorite-games-section');
        
        if (favoriteGamesSection) {
            uiManager.renderFavoriteGames(favoriteGames, favoriteGamesSection);
        }
    }

    /**
     * 渲染精选游戏区域
     * @private
     */
    _renderFeaturedGames() {
        const featuredGames = gameManager.getFeaturedGames(8);
        const viewToggleBtn = document.getElementById('featured-view-toggle');
        
        // 获取当前视图模式
        const currentView = viewToggleBtn ? viewToggleBtn.getAttribute('data-view') || 'grid' : 'grid';
        
        // 渲染精选游戏
        uiManager.renderFeaturedGames(featuredGames, currentView);
        
        console.log(`渲染了 ${featuredGames.length} 个精选游戏，视图模式: ${currentView}`);
    }

    /**
     * 渲染最新游戏区域
     * @private
     */
    _renderNewGames() {
        const newGames = gameManager.getNewGames(6);
        uiManager.renderNewGames(newGames);
        console.log(`渲染了 ${newGames.length} 个最新游戏`);
    }

    /**
     * 渲染热门游戏区域
     * @private
     */
    _renderMostPlayedGames() {
        const mostPlayedGames = gameManager.getPopularGames(6);
        uiManager.renderMostPlayedGames(mostPlayedGames);
        console.log(`渲染了 ${mostPlayedGames.length} 个热门游戏`);
    }

    /**
     * 渲染分类预览区域
     * @private
     */
    _renderCategoriesPreview() {
        const categoriesData = gameManager.getCategoriesPreviewData();
        uiManager.renderCategoriesPreview(categoriesData);
        console.log(`渲染了分类预览，包含 ${Object.keys(categoriesData).length} 个分类`);
    }

    /**
     * 获取应用状态
     * @returns {Object} 应用状态对象
     */
    getState() {
        return {
            currentCategory: this.currentCategory,
            searchQuery: this.searchQuery,
            isInitialized: this.isInitialized,
            gameStats: gameManager.getGameStats(),
            historyStats: historyManager.getHistoryStats()
        };
    }

    /**
     * 销毁应用程序
     */
    destroy() {
        // 移除事件监听器
        document.querySelectorAll('.category-link').forEach(link => {
            link.removeEventListener('click', this.handleCategoryClick);
        });

        document.querySelectorAll('.mobile-category-link').forEach(link => {
            link.removeEventListener('click', this.handleCategoryClick);
        });

        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.removeEventListener('input', this.handleSearch);
            searchInput.removeEventListener('focus', this.handleSearchFocus);
            searchInput.removeEventListener('blur', this.handleSearchBlur);
        }

        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.removeEventListener('click', this.handleMobileMenuToggle);
        }

        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this._handleResize);
        document.removeEventListener('click', this.handleDocumentClick);

        // 销毁UI管理器
        uiManager.destroy();

        this.isInitialized = false;
        console.log('应用程序已销毁');
    }
}

// 全局函数，供HTML中的onclick事件使用
window.openGame = function(gameId) {
    console.log('打开游戏，ID:', gameId);
    
    // 获取游戏信息并添加到历史记录
    const game = gameManager.getGameById(gameId);
    if (game) {
        historyManager.addToHistory(game);
    }
    
    // 新游戏使用独立HTML文件，旧游戏使用game.html
    const newGames = ['flappy-bird', 'pac-man', 'space-invaders'];
    
    if (newGames.includes(gameId)) {
        // 新游戏：直接跳转到独立的HTML文件
        window.location.href = `games/${gameId}/index.html`;
    } else {
        // 旧游戏：使用原有的game.html框架
        window.location.href = `game.html?id=${gameId}`;
    }
};

// 处理分类查看全部按钮点击
window.handleCategoryViewAll = function(category, event) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('查看分类全部游戏:', category);
    
    // 更新当前分类
    app.currentCategory = category;
    app.searchQuery = '';
    
    // 清空搜索框
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // 更新导航状态
    uiManager.updateNavigation(category);
    
    // 筛选并显示游戏
    const filteredGames = gameManager.filterByCategory(category);
    uiManager.renderGamesList(filteredGames);
    
    // 移除自动滚动 - 用户应该控制浏览位置
    // 原来的自动滚动会让页面跳到底部，影响用户体验
};

// 从历史记录中移除游戏
window.removeFromHistory = async function(gameId) {
    const confirmed = await interactionManager.showConfirmDialog(
        '移除历史记录',
        '确定要从历史记录中移除这个游戏吗？',
        { type: 'warning' }
    );
    
    if (confirmed) {
        historyManager.removeFromHistory(gameId);
        
        // 重新渲染最近游戏
        app._renderRecentGames();
        
        // 如果当前在历史记录页面，也需要重新渲染
        const historyContainer = document.getElementById('history-container');
        if (historyContainer) {
            const historyItems = historyManager.getHistory();
            uiManager.renderHistoryList(historyItems, historyContainer);
        }
        
        window.showNotification('游戏已从历史记录中移除', 'success');
    }
};

// 显示历史记录模态框
window.showHistoryModal = function() {
    // 这里可以实现一个模态框来显示完整的历史记录
    // 暂时跳转到一个专门的历史记录页面
    console.log('显示历史记录');
    
    // 创建简单的历史记录弹窗
    const historyItems = historyManager.getHistory();
    
    if (historyItems.length === 0) {
        showNotification('您还没有游戏历史记录', 'info');
        return;
    }
    
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'history-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeHistoryModal()"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>游戏历史记录</h3>
                <button class="modal-close" onclick="closeHistoryModal()">×</button>
            </div>
            <div class="modal-body">
                <div id="history-modal-container"></div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="clearAllHistory()">清空历史</button>
                <button class="btn btn-primary" onclick="closeHistoryModal()">关闭</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // 渲染历史记录
    const historyContainer = document.getElementById('history-modal-container');
    uiManager.renderHistoryList(historyItems, historyContainer);
};

// 关闭历史记录模态框
window.closeHistoryModal = function() {
    const modal = document.querySelector('.history-modal');
    if (modal) {
        document.body.removeChild(modal);
        document.body.style.overflow = '';
    }
};

// 清空所有历史记录
window.clearAllHistory = async function() {
    const confirmed = await interactionManager.showConfirmDialog(
        '清空历史记录',
        '确定要清空所有游戏历史记录吗？此操作不可恢复。',
        { type: 'danger' }
    );
    
    if (confirmed) {
        historyManager.clearHistory();
        
        // 重新渲染相关界面
        app._renderRecentGames();
        
        const historyContainer = document.getElementById('history-modal-container');
        if (historyContainer) {
            uiManager.renderHistoryList([], historyContainer);
        }
        
        window.showNotification('所有历史记录已清空', 'success');
        closeHistoryModal();
    }
};

// 切换游戏收藏状态
window.toggleFavorite = function(gameId) {
    const game = gameManager.getGameById(gameId);
    if (!game) {
        showNotification('游戏不存在', 'error');
        return;
    }

    const isFavorited = favoritesManager.toggleFavorite(game);
    
    // 更新UI
    uiManager.updateFavoriteButton(gameId, isFavorited);
    
    // 重新渲染收藏游戏区域
    app._renderFavoriteGames();
};

// 从收藏中移除游戏
window.removeFromFavorites = async function(gameId) {
    const confirmed = await interactionManager.showConfirmDialog(
        '取消收藏',
        '确定要从收藏中移除这个游戏吗？',
        { type: 'warning' }
    );
    
    if (confirmed) {
        favoritesManager.removeFromFavorites(gameId);
        
        // 重新渲染收藏游戏
        app._renderFavoriteGames();
        
        // 如果当前在收藏页面，也需要重新渲染
        const favoritesContainer = document.getElementById('favorites-container');
        if (favoritesContainer) {
            const favoriteGames = favoritesManager.getFavoriteGames(gameManager.getGameById.bind(gameManager));
            uiManager.renderFavoritesList(favoriteGames, favoritesContainer);
        }
        
        // 更新游戏详情页的收藏按钮状态
        uiManager.updateFavoriteButton(gameId, false);
    }
};

// 显示收藏游戏模态框
window.showFavoritesModal = function() {
    const favoriteGames = favoritesManager.getFavoriteGames(gameManager.getGameById.bind(gameManager));
    
    if (favoriteGames.length === 0) {
        showNotification('您还没有收藏任何游戏', 'info');
        return;
    }
    
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'favorites-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeFavoritesModal()"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>我的收藏游戏</h3>
                <button class="modal-close" onclick="closeFavoritesModal()">×</button>
            </div>
            <div class="modal-body">
                <div id="favorites-modal-container"></div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="clearAllFavorites()">清空收藏</button>
                <button class="btn btn-primary" onclick="closeFavoritesModal()">关闭</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // 渲染收藏游戏
    const favoritesContainer = document.getElementById('favorites-modal-container');
    uiManager.renderFavoritesList(favoriteGames, favoritesContainer);
};

// 关闭收藏游戏模态框
window.closeFavoritesModal = function() {
    const modal = document.querySelector('.favorites-modal');
    if (modal) {
        document.body.removeChild(modal);
        document.body.style.overflow = '';
    }
};

// 清空所有收藏
window.clearAllFavorites = async function() {
    const confirmed = await interactionManager.showConfirmDialog(
        '清空收藏',
        '确定要清空所有收藏游戏吗？此操作不可恢复。',
        { type: 'danger' }
    );
    
    if (confirmed) {
        favoritesManager.clearFavorites();
        
        // 重新渲染相关界面
        app._renderFavoriteGames();
        
        const favoritesContainer = document.getElementById('favorites-modal-container');
        if (favoritesContainer) {
            uiManager.renderFavoritesList([], favoritesContainer);
        }
        
        closeFavoritesModal();
    }

    /**
     * 初始化高级筛选界面
     * @private
     */
    _initAdvancedFilter() {
        if (!this.advancedFilterUI) return;

        try {
            // 初始化筛选界面
            this.advancedFilterUI.init('#advanced-filter-container');
            console.log('高级筛选界面初始化完成');
        } catch (error) {
            console.error('高级筛选界面初始化失败:', error);
        }
    }

    /**
     * 处理筛选变化事件
     * @param {CustomEvent} event - 筛选变化事件
     */
    handleFilterChange(event) {
        const { filters, sort, games } = event.detail;
        
        console.log('筛选条件变化:', { filters, sort, games: games.length });

        // 更新游戏列表显示
        this._updateGamesList(games);

        // 更新URL参数（可选）
        this._updateUrlParams(filters, sort);
    }

    /**
     * 更新游戏列表显示
     * @param {Array} games - 筛选后的游戏数组
     * @private
     */
    _updateGamesList(games) {
        const gamesContainer = document.getElementById('games-container');
        if (!gamesContainer) return;

        if (games.length === 0) {
            gamesContainer.innerHTML = `
                <div class="filter-empty">
                    <div class="filter-empty-icon">🎮</div>
                    <div class="filter-empty-text">没有找到符合条件的游戏</div>
                    <div class="filter-empty-hint">请尝试调整筛选条件</div>
                </div>
            `;
            return;
        }

        // 使用UIManager渲染游戏列表
        uiManager.renderGamesList(games);
    }

    /**
     * 更新URL参数
     * @param {Object} filters - 筛选条件
     * @param {Object} sort - 排序条件
     * @private
     */
    _updateUrlParams(filters, sort) {
        const url = new URL(window.location);
        
        // 清除现有的筛选参数
        url.searchParams.delete('category');
        url.searchParams.delete('tags');
        url.searchParams.delete('rating');
        url.searchParams.delete('difficulty');
        url.searchParams.delete('sort');
        url.searchParams.delete('order');

        // 添加新的筛选参数
        if (filters.category !== 'all') {
            url.searchParams.set('category', filters.category);
        }
        
        if (filters.tags.length > 0) {
            url.searchParams.set('tags', filters.tags.join(','));
        }
        
        if (filters.rating.min > 0 || filters.rating.max < 5) {
            url.searchParams.set('rating', `${filters.rating.min}-${filters.rating.max}`);
        }
        
        if (filters.difficulty !== 'all') {
            url.searchParams.set('difficulty', filters.difficulty);
        }
        
        if (sort.field !== 'popularityScore') {
            url.searchParams.set('sort', sort.field);
        }
        
        if (sort.order !== 'desc') {
            url.searchParams.set('order', sort.order);
        }

        // 更新URL（不刷新页面）
        window.history.replaceState({}, '', url.toString());
    }
};

// 创建应用实例
const app = new App();

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('页面DOM加载完成，开始初始化应用...');
    app.init().catch(error => {
        console.error('应用初始化失败:', error);
    });
});

// 导出应用实例（用于调试）
window.app = app;
window.gameManager = gameManager;
window.historyManager = historyManager;
window.favoritesManager = favoritesManager;
window.interactionManager = interactionManager;
window.showNotification = (message, type, duration) => {
    // 优先使用InteractionManager的Toast，如果不可用则使用原始函数
    if (interactionManager.isInitialized) {
        return interactionManager.showToast(message, type, duration);
    } else {
        return showNotification(message, type, duration);
    }
};

export default app;