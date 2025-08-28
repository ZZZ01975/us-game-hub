/**
 * UI管理器模块
 * 负责用户界面的渲染和交互管理
 */

import { GAME_CATEGORIES, CATEGORY_NAMES, TAG_NAMES, IMAGE_CONFIG } from '../utils/constants.js';
import { escapeHtml, highlightKeyword, showNotification, isElementInViewport } from '../utils/helpers.js';
import imageLazyLoader from './ImageLazyLoader.js';
import imageOptimizer from '../utils/imageOptimizer.js';

class UIManager {
    constructor() {
        this.elements = {}; // 缓存DOM元素
        this.observers = new Map(); // Intersection Observer实例
        this.isInitialized = false;
    }

    /**
     * 初始化UI管理器
     */
    init() {
        if (this.isInitialized) return;

        this._cacheElements();
        this._setupLazyLoading();
        this._setupMobileGestureHandlers();
        this.isInitialized = true;
        
        console.log('UI管理器初始化完成');
    }

    /**
     * 缓存常用DOM元素
     * @private
     */
    _cacheElements() {
        this.elements = {
            gamesContainer: document.getElementById('games-container'),
            gameInfo: document.getElementById('game-info'),
            gameContainer: document.getElementById('game-container'),
            recommendedList: document.getElementById('recommended-list'),
            searchInput: document.getElementById('search-input'),
            searchResults: document.getElementById('search-results'),
            languageBtn: document.getElementById('language-btn'),
            languageDropdown: document.getElementById('language-dropdown'),
            backToTop: document.getElementById('back-to-top'),
            categoryLinks: document.querySelectorAll('.category-link'),
            mobileCategoryLinks: document.querySelectorAll('.mobile-category-link'),
            mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
            mobileCategoryMenu: document.getElementById('mobile-category-menu'),
            mobileMenuClose: document.getElementById('mobile-menu-close')
        };
    }

    /**
     * 设置图片懒加载
     * @private
     */
    _setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this._loadImage(img);
                        observer.unobserve(img);
                    }
                });
            }, {
                threshold: IMAGE_CONFIG.LAZY_LOAD_THRESHOLD / 100
            });

            this.observers.set('images', imageObserver);
        }
    }

    /**
     * 渲染游戏列表
     * @param {Array} games - 游戏数据数组
     * @param {string} searchQuery - 搜索关键词（用于高亮）
     */
    renderGamesList(games, searchQuery = '') {
        const container = this.elements.gamesContainer;
        if (!container) {
            console.error('游戏容器元素未找到');
            return;
        }

        if (games.length === 0) {
            container.innerHTML = this._createEmptyState();
            return;
        }

        const gamesHTML = games.map(game => this._createGameCard(game, searchQuery)).join('');
        container.innerHTML = gamesHTML;

        // 设置懒加载
        this._setupImageLazyLoading(container);

        console.log(`渲染了 ${games.length} 个游戏`);
    }

    /**
     * 渲染精选游戏区域
     * @param {Array} games - 精选游戏数据数组
     * @param {string} viewMode - 视图模式 ('grid' 或 'carousel')
     */
    renderFeaturedGames(games, viewMode = 'grid') {
        const container = document.getElementById('featured-games-container');
        if (!container) {
            console.error('精选游戏容器元素未找到');
            return;
        }

        if (games.length === 0) {
            container.innerHTML = this._createFeaturedEmptyState();
            return;
        }

        if (viewMode === 'carousel') {
            container.innerHTML = this._createFeaturedCarousel(games);
            this._setupCarouselControls(container);
        } else {
            container.innerHTML = this._createFeaturedGrid(games);
        }

        // 设置懒加载
        this._setupImageLazyLoading(container);

        console.log(`渲染了 ${games.length} 个精选游戏，视图模式: ${viewMode}`);
    }

    /**
     * 创建精选游戏网格视图
     * @private
     * @param {Array} games - 游戏数据数组
     * @returns {string} 网格视图HTML
     */
    _createFeaturedGrid(games) {
        const gamesHTML = games.map(game => this._createFeaturedGameCard(game)).join('');
        return `<div class="featured-games-grid">${gamesHTML}</div>`;
    }

    /**
     * 创建精选游戏轮播视图
     * @private
     * @param {Array} games - 游戏数据数组
     * @returns {string} 轮播视图HTML
     */
    _createFeaturedCarousel(games) {
        const slidesHTML = games.map(game => 
            `<div class="carousel-slide">${this._createFeaturedGameCard(game)}</div>`
        ).join('');
        
        const indicatorsHTML = games.map((_, index) => 
            `<div class="carousel-indicator ${index === 0 ? 'active' : ''}" data-slide="${index}"></div>`
        ).join('');

        return `
            <div class="featured-games-carousel">
                <div class="carousel-track" style="transform: translateX(0%)">
                    ${slidesHTML}
                </div>
                <div class="carousel-controls">
                    <button class="carousel-btn carousel-prev" aria-label="上一个">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15,18 9,12 15,6"></polyline>
                        </svg>
                    </button>
                    <button class="carousel-btn carousel-next" aria-label="下一个">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9,18 15,12 9,6"></polyline>
                        </svg>
                    </button>
                </div>
                <div class="carousel-indicators">
                    ${indicatorsHTML}
                </div>
            </div>
        `;
    }

    /**
     * 创建精选游戏大卡片
     * @private
     * @param {Object} game - 游戏数据
     * @returns {string} 精选游戏卡片HTML
     */
    _createFeaturedGameCard(game) {
        const tags = this._createFeaturedGameTags(game.tags || []);
        const rating = this._createFeaturedRating(game.rating || 0);
        
        return `
            <div class="featured-game-card" data-game-id="${game.id}" onclick="openGame('${game.id}')">
                <div class="featured-game-image">
                    <img 
                        class="lazy-load" 
                        data-src="${game.image}" 
                        src="${IMAGE_CONFIG.PLACEHOLDER}"
                        alt="${escapeHtml(game.title)}"
                        onerror="this.src='${IMAGE_CONFIG.PLACEHOLDER}'"
                    >
                    ${tags}
                    ${rating}
                </div>
                <div class="featured-game-info">
                    <h3 class="featured-game-title">${escapeHtml(game.title)}</h3>
                    <p class="featured-game-description">${escapeHtml(game.description)}</p>
                    <div class="featured-game-meta">
                        <div class="featured-game-category">${escapeHtml(game.categoryName || game.category)}</div>
                        <div class="featured-game-plays">${this._formatPlayCount(game.playCount || 0)}</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 创建精选游戏标签
     * @private
     * @param {Array} tags - 标签数组
     * @returns {string} 标签HTML
     */
    _createFeaturedGameTags(tags) {
        if (!tags || tags.length === 0) return '';
        
        const tagElements = tags.slice(0, 2).map(tag => {
            const tagName = this._getTagDisplayName(tag);
            return `<span class="featured-tag tag-${tag}">${tagName}</span>`;
        }).join('');
        
        return `<div class="featured-game-tags">${tagElements}</div>`;
    }

    /**
     * 创建精选游戏评分
     * @private
     * @param {number} rating - 评分（0-5）
     * @returns {string} 评分HTML
     */
    _createFeaturedRating(rating) {
        if (!rating) return '';
        
        const stars = this._createRatingStars(rating);
        return `
            <div class="featured-game-rating">
                <span class="stars">${stars}</span>
                <span>${rating.toFixed(1)}</span>
            </div>
        `;
    }

    /**
     * 创建精选游戏空状态
     * @private
     * @returns {string} 空状态HTML
     */
    _createFeaturedEmptyState() {
        return `
            <div class="featured-games-empty">
                <div class="empty-icon">🎮</div>
                <h3>暂无精选游戏</h3>
                <p>精选游戏正在准备中，请稍后再来查看</p>
            </div>
        `;
    }

    /**
     * 设置轮播控制功能
     * @private
     * @param {Element} container - 轮播容器
     */
    _setupCarouselControls(container) {
        const carousel = container.querySelector('.featured-games-carousel');
        if (!carousel) return;

        const track = carousel.querySelector('.carousel-track');
        const slides = carousel.querySelectorAll('.carousel-slide');
        const prevBtn = carousel.querySelector('.carousel-prev');
        const nextBtn = carousel.querySelector('.carousel-next');
        const indicators = carousel.querySelectorAll('.carousel-indicator');

        if (!track || slides.length === 0) return;

        let currentSlide = 0;
        const totalSlides = slides.length;

        // 更新轮播位置
        const updateCarousel = () => {
            const translateX = -currentSlide * 100;
            track.style.transform = `translateX(${translateX}%)`;
            
            // 更新指示器
            indicators.forEach((indicator, index) => {
                indicator.classList.toggle('active', index === currentSlide);
            });
            
            // 更新按钮状态
            prevBtn.disabled = currentSlide === 0;
            nextBtn.disabled = currentSlide === totalSlides - 1;
        };

        // 上一张
        prevBtn.addEventListener('click', () => {
            if (currentSlide > 0) {
                currentSlide--;
                updateCarousel();
            }
        });

        // 下一张
        nextBtn.addEventListener('click', () => {
            if (currentSlide < totalSlides - 1) {
                currentSlide++;
                updateCarousel();
            }
        });

        // 指示器点击
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                currentSlide = index;
                updateCarousel();
            });
        });

        // 键盘支持
        carousel.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && currentSlide > 0) {
                currentSlide--;
                updateCarousel();
            } else if (e.key === 'ArrowRight' && currentSlide < totalSlides - 1) {
                currentSlide++;
                updateCarousel();
            }
        });

        // 自动播放（可选）
        let autoPlayInterval;
        const startAutoPlay = () => {
            autoPlayInterval = setInterval(() => {
                if (currentSlide < totalSlides - 1) {
                    currentSlide++;
                } else {
                    currentSlide = 0;
                }
                updateCarousel();
            }, 5000); // 5秒切换一次
        };

        const stopAutoPlay = () => {
            if (autoPlayInterval) {
                clearInterval(autoPlayInterval);
                autoPlayInterval = null;
            }
        };

        // 鼠标悬停时停止自动播放
        carousel.addEventListener('mouseenter', stopAutoPlay);
        carousel.addEventListener('mouseleave', startAutoPlay);

        // 初始化
        updateCarousel();
        startAutoPlay();
    }

    /**
     * 渲染最新游戏区域
     * @param {Array} games - 最新游戏数据数组
     */
    renderNewGames(games) {
        const container = document.getElementById('new-games-container');
        if (!container) {
            console.error('最新游戏容器元素未找到');
            return;
        }

        if (games.length === 0) {
            container.innerHTML = this._createSectionEmptyState('暂无最新游戏', '最新游戏正在准备中，请稍后再来查看');
            return;
        }

        const gamesHTML = games.map(game => this._createSectionGameCard(game)).join('');
        container.innerHTML = gamesHTML;

        // 设置懒加载
        this._setupImageLazyLoading(container);

        console.log(`渲染了 ${games.length} 个最新游戏`);
    }

    /**
     * 渲染热门游戏区域
     * @param {Array} games - 热门游戏数据数组
     */
    renderMostPlayedGames(games) {
        const container = document.getElementById('most-played-container');
        if (!container) {
            console.error('热门游戏容器元素未找到');
            return;
        }

        if (games.length === 0) {
            container.innerHTML = this._createSectionEmptyState('暂无热门游戏', '热门游戏正在统计中，请稍后再来查看');
            return;
        }

        const gamesHTML = games.map(game => this._createSectionGameCard(game)).join('');
        container.innerHTML = gamesHTML;

        // 设置懒加载
        this._setupImageLazyLoading(container);

        console.log(`渲染了 ${games.length} 个热门游戏`);
    }

    /**
     * 创建区域游戏卡片
     * @private
     * @param {Object} game - 游戏数据
     * @returns {string} 区域游戏卡片HTML
     */
    _createSectionGameCard(game) {
        const tags = this._createSectionGameTags(game.tags || []);
        const rating = this._createSectionRating(game.rating || 0);
        
        return `
            <div class="section-game-card" data-game-id="${game.id}" onclick="openGame('${game.id}')">
                <div class="section-game-image">
                    <img 
                        class="lazy-load" 
                        data-src="${game.image}" 
                        src="${IMAGE_CONFIG.PLACEHOLDER}"
                        alt="${escapeHtml(game.title)}"
                        onerror="this.src='${IMAGE_CONFIG.PLACEHOLDER}'"
                    >
                    ${tags}
                    ${rating}
                </div>
                <div class="section-game-info">
                    <h3 class="section-game-title">${escapeHtml(game.title)}</h3>
                    <p class="section-game-description">${escapeHtml(game.description)}</p>
                    <div class="section-game-meta">
                        <div class="section-game-category">${escapeHtml(game.categoryName || game.category)}</div>
                        <div class="section-game-plays">${this._formatPlayCount(game.playCount || 0)}</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 创建区域游戏标签
     * @private
     * @param {Array} tags - 标签数组
     * @returns {string} 标签HTML
     */
    _createSectionGameTags(tags) {
        if (!tags || tags.length === 0) return '';
        
        const tagElements = tags.slice(0, 1).map(tag => {
            const tagName = this._getTagDisplayName(tag);
            return `<span class="section-tag tag-${tag}">${tagName}</span>`;
        }).join('');
        
        return `<div class="section-game-tags">${tagElements}</div>`;
    }

    /**
     * 创建区域游戏评分
     * @private
     * @param {number} rating - 评分（0-5）
     * @returns {string} 评分HTML
     */
    _createSectionRating(rating) {
        if (!rating) return '';
        
        return `
            <div class="section-game-rating">
                <span class="stars">★</span>
                <span>${rating.toFixed(1)}</span>
            </div>
        `;
    }

    /**
     * 创建区域空状态
     * @private
     * @param {string} title - 标题
     * @param {string} message - 消息
     * @returns {string} 空状态HTML
     */
    _createSectionEmptyState(title, message) {
        return `
            <div class="section-empty">
                <div class="empty-icon">🎮</div>
                <h3>${title}</h3>
                <p>${message}</p>
            </div>
        `;
    }

    /**
     * 渲染分类预览区域
     * @param {Object} categoriesData - 分类数据对象
     */
    renderCategoriesPreview(categoriesData) {
        const container = document.getElementById('categories-preview-container');
        if (!container) {
            console.error('分类预览容器元素未找到');
            return;
        }

        if (!categoriesData || Object.keys(categoriesData).length === 0) {
            container.innerHTML = this._createSectionEmptyState('暂无分类数据', '分类数据正在加载中，请稍后再来查看');
            return;
        }

        const categoriesHTML = Object.entries(categoriesData).map(([category, data]) => 
            this._createCategoryPreviewCard(category, data)
        ).join('');
        
        container.innerHTML = categoriesHTML;

        // 设置懒加载
        this._setupImageLazyLoading(container);

        console.log(`渲染了 ${Object.keys(categoriesData).length} 个分类预览`);
    }

    /**
     * 创建分类预览卡片
     * @private
     * @param {string} category - 分类名称
     * @param {Object} data - 分类数据
     * @returns {string} 分类预览卡片HTML
     */
    _createCategoryPreviewCard(category, data) {
        const categoryInfo = this._getCategoryInfo(category);
        const gamesPreview = this._createCategoryGamesPreview(data.games || []);
        
        return `
            <div class="category-preview-card" data-category="${category}">
                <div class="category-preview-header">
                    <div class="category-preview-info">
                        <div class="category-icon">${categoryInfo.icon}</div>
                        <div class="category-details">
                            <h3>${categoryInfo.name}</h3>
                            <p>${categoryInfo.description}</p>
                        </div>
                    </div>
                    <div class="category-count">${data.count || 0}</div>
                </div>
                <div class="category-games-preview">
                    ${gamesPreview}
                </div>
                <div class="category-preview-footer">
                    <button class="category-view-all-btn" onclick="window.handleCategoryViewAll('${category}', event)">
                        查看全部 ${categoryInfo.name}
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 创建分类游戏预览
     * @private
     * @param {Array} games - 游戏数组
     * @returns {string} 游戏预览HTML
     */
    _createCategoryGamesPreview(games) {
        if (!games || games.length === 0) {
            return `
                <div class="category-games-empty">
                    <div class="empty-icon">🎮</div>
                    <div>暂无游戏</div>
                </div>
            `;
        }

        // 最多显示4个游戏预览
        const previewGames = games.slice(0, 4);
        
        return previewGames.map(game => `
            <div class="category-game-mini" onclick="openGame('${game.id}'); event.stopPropagation();">
                <img 
                    class="lazy-load" 
                    data-src="${game.image}" 
                    src="${IMAGE_CONFIG.PLACEHOLDER}"
                    alt="${escapeHtml(game.title)}"
                    onerror="this.src='${IMAGE_CONFIG.PLACEHOLDER}'"
                >
                <div class="game-mini-overlay">
                    ${escapeHtml(game.title)}
                </div>
            </div>
        `).join('');
    }

    /**
     * 获取分类信息
     * @private
     * @param {string} category - 分类名称
     * @returns {Object} 分类信息对象
     */
    _getCategoryInfo(category) {
        const categoryMap = {
            'action': {
                name: '动作游戏',
                description: '刺激的动作冒险游戏',
                icon: '⚔️'
            },
            'puzzle': {
                name: '益智游戏',
                description: '锻炼大脑的智力游戏',
                icon: '🧩'
            },
            'arcade': {
                name: '街机游戏',
                description: '经典的街机风格游戏',
                icon: '🕹️'
            },
            'casual': {
                name: '休闲游戏',
                description: '轻松愉快的休闲游戏',
                icon: '🎲'
            },
            'sports': {
                name: '体育游戏',
                description: '各种体育运动游戏',
                icon: '⚽'
            },
            'racing': {
                name: '竞速游戏',
                description: '速度与激情的竞速游戏',
                icon: '🏎️'
            },
            'strategy': {
                name: '策略游戏',
                description: '考验智慧的策略游戏',
                icon: '🎯'
            }
        };

        return categoryMap[category] || {
            name: category.charAt(0).toUpperCase() + category.slice(1),
            description: `精彩的${category}游戏`,
            icon: '🎮'
        };
    }

    /**
     * 创建游戏卡片HTML
     * @private
     * @param {Object} game - 游戏数据
     * @param {string} searchQuery - 搜索关键词
     * @returns {string} 游戏卡片HTML
     */
    _createGameCard(game, searchQuery = '') {
        const title = searchQuery ? highlightKeyword(game.title, searchQuery) : escapeHtml(game.title);
        const description = searchQuery ? highlightKeyword(game.description, searchQuery) : escapeHtml(game.description);
        
        // 创建标签系统
        const tags = this._createGameTags(game.tags || []);
        
        // 创建评分显示
        const rating = this._createRatingStars(game.rating || 0);
        
        // 创建游玩次数显示
        const playCount = game.playCount ? `<div class="game-plays">${this._formatPlayCount(game.playCount)}</div>` : '';

        // 获取优化后的图片信息
        const imageInfo = this._getOptimizedImageInfo(game.image, game.title);

        return `
            <div class="game-card" data-game-id="${game.id}" onclick="openGame('${game.id}')">
                <div class="game-image-container">
                    <img 
                        class="game-image" 
                        data-src="${imageInfo.src}" 
                        data-width="${imageInfo.width}"
                        data-height="${imageInfo.height}"
                        src="${imageInfo.placeholder}"
                        alt="${escapeHtml(game.title)}"
                        loading="lazy"
                        decoding="async"
                    >
                    ${tags}
                </div>
                <div class="game-info">
                    <h3 class="game-title">${title}</h3>
                    <p class="game-description">${description}</p>
                    <div class="game-rating">
                        ${rating}
                        <span class="rating-value">${(game.rating || 0).toFixed(1)}</span>
                    </div>
                    <div class="game-meta">
                        <div class="game-category">${escapeHtml(game.categoryName)}</div>
                        ${playCount}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 获取优化后的图片信息
     * @private
     * @param {string} originalSrc - 原始图片URL
     * @param {string} title - 图片标题
     * @returns {Object} 优化后的图片信息
     */
    _getOptimizedImageInfo(originalSrc, title) {
        const defaultWidth = 300;
        const defaultHeight = 200;
        
        // 创建占位符SVG
        const placeholder = this._createImagePlaceholder(defaultWidth, defaultHeight, title);
        
        return {
            src: originalSrc || '',
            width: defaultWidth,
            height: defaultHeight,
            placeholder: placeholder
        };
    }

    /**
     * 创建图片占位符
     * @private
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @param {string} title - 标题
     * @returns {string} 占位符数据URL
     */
    _createImagePlaceholder(width, height, title = '') {
        const svg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad-${Date.now()}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#667eea;stop-opacity:0.8" />
                        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:0.8" />
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#grad-${Date.now()})" />
                <text x="50%" y="45%" text-anchor="middle" dy=".3em" 
                      fill="white" font-family="Arial, sans-serif" font-size="24" opacity="0.8">
                    🎮
                </text>
                <text x="50%" y="60%" text-anchor="middle" dy=".3em" 
                      fill="white" font-family="Arial, sans-serif" font-size="12" opacity="0.7">
                    Loading...
                </text>
            </svg>
        `;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    /**
     * 创建游戏标签
     * @private
     * @param {Array} tags - 标签数组
     * @returns {string} 标签HTML
     */
    _createGameTags(tags) {
        if (!tags || tags.length === 0) return '';
        
        const tagElements = tags.map(tag => {
            const tagName = this._getTagDisplayName(tag);
            return `<span class="tag tag-${tag}">${tagName}</span>`;
        }).join('');
        
        return `
            <div class="game-tags">
                <div class="game-tags-left">
                    ${tagElements}
                </div>
            </div>
        `;
    }

    /**
     * 获取标签显示名称
     * @private
     * @param {string} tag - 标签键
     * @returns {string} 标签显示名称
     */
    _getTagDisplayName(tag) {
        const tagNames = {
            'new': 'NEW',
            'hot': 'HOT',
            'featured': 'FEATURED'
        };
        return tagNames[tag] || tag.toUpperCase();
    }

    /**
     * 创建评分星星
     * @private
     * @param {number} rating - 评分（0-5）
     * @returns {string} 星星HTML
     */
    _createRatingStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let stars = '';
        
        // 实心星星
        for (let i = 0; i < fullStars; i++) {
            stars += '★';
        }
        
        // 半星
        if (hasHalfStar) {
            stars += '☆';
        }
        
        // 空心星星
        for (let i = 0; i < emptyStars; i++) {
            stars += '☆';
        }

        return `<span class="stars">${stars}</span>`;
    }

    /**
     * 格式化游玩次数
     * @private
     * @param {number} count - 游玩次数
     * @returns {string} 格式化后的游玩次数
     */
    _formatPlayCount(count) {
        if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}k 次游玩`;
        }
        return `${count} 次游玩`;
    }

    /**
     * 创建空状态HTML
     * @private
     * @returns {string} 空状态HTML
     */
    _createEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">🎮</div>
                <h3>暂无游戏</h3>
                <p>没有找到符合条件的游戏，请尝试其他搜索条件</p>
            </div>
        `;
    }

    /**
     * 显示加载状态
     * @param {string} message - 加载消息
     */
    showLoading(message = '正在加载...') {
        const container = this.elements.gamesContainer;
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>${escapeHtml(message)}</p>
                </div>
            `;
        }
    }

    /**
     * 显示错误状态
     * @param {string} message - 错误消息
     * @param {Function} retryCallback - 重试回调函数
     */
    showError(message, retryCallback = null) {
        const container = this.elements.gamesContainer;
        if (container) {
            const retryButton = retryCallback 
                ? `<button class="btn btn-primary" onclick="(${retryCallback.toString()})()">重试</button>`
                : '';

            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>加载失败</h3>
                    <p>${escapeHtml(message)}</p>
                    ${retryButton}
                </div>
            `;
        }
    }

    /**
     * 渲染游戏详情
     * @param {Object} game - 游戏数据
     */
    renderGameDetail(game) {
        const container = this.elements.gameInfo;
        if (!container) {
            console.error('游戏信息容器未找到');
            return;
        }

        // 更新页面标题和meta描述
        document.title = `${game.title} - US Game Hub`;
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.content = `在US Game Hub上游玩${game.title}。${game.description}`;
        }

        // 检查是否已收藏（需要从外部传入favoritesManager）
        // 这里暂时使用localStorage，后续可以优化
        const favorites = JSON.parse(localStorage.getItem('us_game_hub_favorites') || '[]');
        const isFavorited = favorites.includes(game.id);

        const tags = game.tags && game.tags.length > 0 
            ? game.tags.map(tag => `<span class="tag tag-${tag}">${TAG_NAMES[tag] || tag}</span>`).join('')
            : '';

        const rating = this._createRatingStars(game.rating || 0);

        container.innerHTML = `
            <div class="game-header">
                <img 
                    src="${game.image}" 
                    alt="${escapeHtml(game.title)}" 
                    class="game-cover"
                    onerror="this.src='${IMAGE_CONFIG.PLACEHOLDER}'"
                    loading="lazy"
                >
                <div class="game-details">
                    <h1>${escapeHtml(game.title)}</h1>
                    <div class="game-meta">
                        <span class="game-category-tag">${escapeHtml(game.categoryName)}</span>
                        ${tags ? `<div class="game-tags">${tags}</div>` : ''}
                    </div>
                    <div class="game-rating">
                        ${rating}
                        <span class="rating-value">${game.rating || 0}</span>
                        ${game.playCount ? `<span class="play-count">${this._formatPlayCount(game.playCount)}</span>` : ''}
                    </div>
                    <p class="game-description">${escapeHtml(game.description)}</p>
                    <div class="game-actions">
                        <button class="btn btn-primary btn-lg play-button" onclick="startGame()" title="开始游戏">
                            <span>🎮</span>
                            <span>开始游戏</span>
                        </button>
                        <button class="btn btn-secondary ${isFavorited ? 'favorited' : ''}" onclick="toggleFavorite(${game.id})" title="${isFavorited ? '取消收藏' : '收藏游戏'}">
                            <span>${isFavorited ? '❤️' : '♥'}</span>
                            <span>${isFavorited ? '已收藏' : '收藏'}</span>
                        </button>
                        <button class="btn btn-ghost" onclick="shareGame(${game.id})" title="分享游戏">
                            <span>📤</span>
                            <span>分享</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        console.log('游戏详情渲染完成:', game.title);
    }

    /**
     * 渲染推荐游戏
     * @param {Array} games - 推荐游戏数组
     */
    renderRecommendedGames(games) {
        const container = this.elements.recommendedList;
        if (!container) return;

        if (games.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎯</div>
                    <h4>暂无推荐游戏</h4>
                    <p>我们正在为您寻找更多精彩游戏</p>
                </div>
            `;
            return;
        }

        const gamesHTML = games.map(game => {
            const rating = game.rating ? this._createRatingStars(game.rating) : '';
            return `
                <div class="recommended-card" onclick="openGame('${game.id}')" title="点击游玩 ${escapeHtml(game.title)}">
                    <img 
                        src="${game.image}" 
                        alt="${escapeHtml(game.title)}" 
                        class="recommended-image"
                        onerror="this.src='${IMAGE_CONFIG.PLACEHOLDER}'"
                        loading="lazy"
                    >
                    <div class="recommended-info">
                        <h4 class="recommended-title">${escapeHtml(game.title)}</h4>
                        ${rating ? `<div class="recommended-rating">${rating}</div>` : ''}
                        <span class="recommended-category">${escapeHtml(game.categoryName)}</span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = gamesHTML;
        console.log('推荐游戏渲染完成，共', games.length, '个游戏');
    }

    /**
     * 更新导航激活状态
     * @param {string} activeCategory - 激活的分类
     */
    updateNavigation(activeCategory) {
        // 更新桌面端分类导航
        document.querySelectorAll('.category-link').forEach(link => {
            const category = link.getAttribute('data-category');
            if (category === activeCategory) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // 更新移动端分类导航
        document.querySelectorAll('.mobile-category-link').forEach(link => {
            const category = link.getAttribute('data-category');
            if (category === activeCategory) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // 关闭移动端菜单（如果打开的话）
        const mobileCategoryMenu = document.getElementById('mobile-category-menu');
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        if (mobileCategoryMenu && mobileCategoryMenu.classList.contains('show')) {
            mobileCategoryMenu.classList.remove('show');
            if (mobileMenuToggle) {
                mobileMenuToggle.classList.remove('active');
            }
            document.body.style.overflow = '';
        }
    }

    /**
     * 设置图片懒加载
     * @private
     * @param {Element} container - 容器元素
     */
    _setupImageLazyLoading(container) {
        // 使用新的图片懒加载器
        const lazyImages = container.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            imageLazyLoader.observe(img);
        });
        
        // 设置卡片点击效果
        this._setupCardClickEffects(container);
        
        console.log(`设置了 ${lazyImages.length} 张图片的懒加载`);
    }

    /**
     * 设置卡片点击效果
     * @private
     * @param {Element} container - 容器元素
     */
    _setupCardClickEffects(container) {
        const gameCards = container.querySelectorAll('.game-card');
        
        gameCards.forEach(card => {
            // 添加点击波纹效果
            card.addEventListener('click', (e) => {
                this._createRippleEffect(card, e);
            });
            
            // 添加键盘支持
            card.setAttribute('tabindex', '0');
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this._createRippleEffect(card, e);
                    card.click();
                }
            });
        });
    }

    /**
     * 创建波纹点击效果
     * @private
     * @param {Element} element - 目标元素
     * @param {Event} event - 事件对象
     */
    _createRippleEffect(element, event) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple-effect';
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = (event.clientX || rect.left + rect.width / 2) - rect.left - size / 2;
        const y = (event.clientY || rect.top + rect.height / 2) - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out;
            pointer-events: none;
            z-index: 10;
        `;
        
        element.style.position = 'relative';
        element.appendChild(ripple);
        
        // 移除波纹效果
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }

    /**
     * 加载图片
     * @private
     * @param {HTMLImageElement} img - 图片元素
     */
    _loadImage(img) {
        const src = img.getAttribute('data-src');
        if (src) {
            // 创建新的图片对象来预加载
            const newImg = new Image();
            
            newImg.onload = () => {
                // 图片加载成功后应用到元素
                img.src = src;
                img.classList.remove('lazy-load');
                img.classList.add('loaded');
                
                // 添加加载完成的动画效果
                setTimeout(() => {
                    img.style.opacity = '1';
                }, 50);
            };
            
            newImg.onerror = () => {
                // 图片加载失败时使用占位符
                img.src = IMAGE_CONFIG.PLACEHOLDER;
                img.classList.remove('lazy-load');
                img.classList.add('error');
                console.warn('图片加载失败:', src);
            };
            
            // 开始加载图片
            newImg.src = src;
        }
    }

    /**
     * 显示游戏加载状态
     * @param {string} gameName - 游戏名称
     */
    showGameLoading(gameName) {
        const container = this.elements.gameContainer;
        if (container) {
            container.innerHTML = `
                <div class="game-loading">
                    <div class="loading-spinner"></div>
                    <h3>正在加载游戏</h3>
                    <p>正在为您加载 "${escapeHtml(gameName)}"，请稍候...</p>
                </div>
            `;
        }
    }

    /**
     * 显示游戏错误
     * @param {string} message - 错误消息
     * @param {Object} options - 选项
     */
    showGameError(message, options = {}) {
        const container = this.elements.gameContainer;
        if (!container) return;

        const {
            showRetry = true,
            showRefresh = true,
            showHome = true,
            showAlternatives = false,
            gameUrl = '',
            gameTitle = ''
        } = options;

        container.innerHTML = `
            <div class="game-error-interface">
                <div class="error-content">
                    <div class="error-icon">⚠️</div>
                    <h3 class="error-title">游戏加载失败</h3>
                    <p class="error-message">${escapeHtml(message)}</p>
                    <div class="error-suggestions">
                        <h4>可能的解决方案：</h4>
                        <ul>
                            <li>检查网络连接是否正常</li>
                            <li>尝试刷新页面重新加载</li>
                            <li>清除浏览器缓存后重试</li>
                            <li>使用其他浏览器尝试</li>
                            <li>关闭广告拦截器后重试</li>
                        </ul>
                    </div>
                    <div class="error-actions">
                        ${showRetry ? `
                            <button class="btn btn-primary" onclick="refreshGame()" title="重新尝试加载游戏">
                                <span>🔄</span>
                                <span>重试</span>
                            </button>
                        ` : ''}
                        ${showRefresh ? `
                            <button class="btn btn-secondary" onclick="location.reload()" title="刷新整个页面">
                                <span>🔃</span>
                                <span>刷新页面</span>
                            </button>
                        ` : ''}
                        ${showAlternatives ? `
                            <button class="btn btn-secondary" onclick="showAlternativeGames()" title="查看其他游戏">
                                <span>🎮</span>
                                <span>其他游戏</span>
                            </button>
                        ` : ''}
                        ${showHome ? `
                            <button class="btn btn-ghost" onclick="window.location.href='index.html'" title="返回首页">
                                <span>🏠</span>
                                <span>返回首页</span>
                            </button>
                        ` : ''}
                    </div>
                    ${gameUrl ? `
                        <div class="error-details">
                            <details>
                                <summary>技术详情</summary>
                                <div class="tech-details">
                                    <p><strong>游戏标题:</strong> ${escapeHtml(gameTitle)}</p>
                                    <p><strong>游戏URL:</strong> ${escapeHtml(gameUrl)}</p>
                                    <p><strong>错误时间:</strong> ${new Date().toLocaleString()}</p>
                                    <p><strong>浏览器:</strong> ${navigator.userAgent}</p>
                                </div>
                            </details>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * 渲染游戏iframe
     * @param {string} gameUrl - 游戏URL
     * @param {string} gameName - 游戏名称
     */
    renderGameFrame(gameUrl, gameName) {
        const container = this.elements.gameContainer;
        if (!container) return;

        // 创建唯一的iframe ID
        const iframeId = `game-frame-${Date.now()}`;
        
        container.innerHTML = `
            <div class="game-frame-container">
                <div class="game-frame-header">
                    <h3 class="game-frame-title">
                        <span class="game-icon">🎮</span>
                        正在游玩: ${escapeHtml(gameName)}
                    </h3>
                    <div class="game-frame-controls">
                        <button class="btn-frame-control" onclick="this.closest('.game-frame-container').querySelector('iframe').requestFullscreen()" title="全屏">
                            📺
                        </button>
                        <button class="btn-frame-control" onclick="location.reload()" title="重新加载">
                            🔄
                        </button>
                    </div>
                </div>
                <div class="game-frame-wrapper">
                    <iframe 
                        id="${iframeId}"
                        src="${gameUrl}" 
                        class="game-frame" 
                        frameborder="0"
                        allowfullscreen
                        allow="gamepad; microphone; camera"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
                        onload="this.style.opacity='1'; console.log('游戏加载完成: ${escapeHtml(gameName)}')"
                        onerror="window.gameApp && window.gameApp._handleGameLoadError('${escapeHtml(gameName)}')"
                    ></iframe>
                    <div class="game-frame-loading">
                        <div class="loading-spinner"></div>
                        <p>正在加载游戏...</p>
                    </div>
                </div>
                <div class="game-frame-footer">
                    <p class="game-tips">
                        <span class="tip-icon">💡</span>
                        如果游戏无法正常显示，请检查网络连接或尝试刷新页面
                    </p>
                    <div class="game-controls-hint">
                        <span>游戏控制：</span>
                        <span class="control-key">方向键</span>
                        <span class="control-key">空格键</span>
                        <span class="control-key">鼠标</span>
                    </div>
                </div>
            </div>
        `;

        // 设置iframe加载超时检测
        this._setupIframeTimeout(iframeId, gameName);
    }

    /**
     * 设置iframe加载超时检测
     * @private
     * @param {string} iframeId - iframe ID
     * @param {string} gameName - 游戏名称
     */
    _setupIframeTimeout(iframeId, gameName) {
        const iframe = document.getElementById(iframeId);
        if (!iframe) return;

        let hasLoaded = false;
        
        // 监听加载完成
        iframe.addEventListener('load', () => {
            hasLoaded = true;
            const loadingElement = iframe.parentElement.querySelector('.game-frame-loading');
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        });

        // 设置超时检测（15秒）
        setTimeout(() => {
            if (!hasLoaded) {
                console.warn('游戏加载超时:', gameName);
                this.showGameError(`游戏 "${gameName}" 加载超时，请检查网络连接后重试`);
            }
        }, 15000);
    }

    /**
     * 显示搜索结果下拉框
     * @param {Array} results - 搜索结果数组
     * @param {string} query - 搜索关键词
     */
    showSearchResults(results, query) {
        const searchResults = this.elements.searchResults;
        if (!searchResults) return;

        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="search-result-item">
                    <div class="search-result-info">
                        <div class="search-result-title">未找到相关游戏</div>
                        <div class="search-result-category">尝试使用其他关键词搜索</div>
                    </div>
                </div>
            `;
        } else {
            const resultsHTML = results.slice(0, 5).map(game => {
                const title = highlightKeyword(game.title, query);
                return `
                    <div class="search-result-item" onclick="openGame('${game.id}')">
                        <img 
                            src="${game.image}" 
                            alt="${escapeHtml(game.title)}" 
                            class="search-result-icon"
                            onerror="this.src='${IMAGE_CONFIG.PLACEHOLDER}'"
                        >
                        <div class="search-result-info">
                            <div class="search-result-title">${title}</div>
                            <div class="search-result-category">${escapeHtml(game.categoryName)}</div>
                        </div>
                    </div>
                `;
            }).join('');
            
            searchResults.innerHTML = resultsHTML;
        }

        searchResults.style.display = 'block';
    }

    /**
     * 隐藏搜索结果下拉框
     */
    hideSearchResults() {
        const searchResults = this.elements.searchResults;
        if (searchResults) {
            searchResults.style.display = 'none';
        }
    }

    /**
     * 渲染历史记录列表
     * @param {Array} historyItems - 历史记录数组
     * @param {Element} container - 容器元素
     */
    renderHistoryList(historyItems, container) {
        if (!container) {
            console.error('历史记录容器元素未找到');
            return;
        }

        if (historyItems.length === 0) {
            container.innerHTML = this._createHistoryEmptyState();
            return;
        }

        const historyHTML = historyItems.map(item => this._createHistoryCard(item)).join('');
        container.innerHTML = historyHTML;

        // 设置懒加载
        this._setupImageLazyLoading(container);

        console.log(`渲染了 ${historyItems.length} 条历史记录`);
    }

    /**
     * 创建历史记录卡片HTML
     * @private
     * @param {Object} historyItem - 历史记录项
     * @returns {string} 历史记录卡片HTML
     */
    _createHistoryCard(historyItem) {
        const title = escapeHtml(historyItem.title);
        const playCount = historyItem.playCount || 1;
        const lastPlayed = historyItem.lastPlayedFormatted || '未知时间';

        return `
            <div class="history-card" data-game-id="${historyItem.gameId}" onclick="openGame('${historyItem.gameId}')">
                <div class="history-image-container">
                    <img 
                        class="history-image lazy-load" 
                        data-src="${historyItem.image}" 
                        src="${IMAGE_CONFIG.PLACEHOLDER}"
                        alt="${title}"
                        onerror="this.src='${IMAGE_CONFIG.PLACEHOLDER}'"
                    >
                    <div class="history-overlay">
                        <div class="history-play-count">${playCount} 次</div>
                    </div>
                </div>
                <div class="history-info">
                    <h4 class="history-title">${title}</h4>
                    <div class="history-meta">
                        <span class="history-category">${escapeHtml(historyItem.category)}</span>
                        <span class="history-time">${lastPlayed}</span>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="history-remove-btn" onclick="event.stopPropagation(); removeFromHistory(${historyItem.gameId})" title="从历史记录中移除">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 创建历史记录空状态HTML
     * @private
     * @returns {string} 历史记录空状态HTML
     */
    _createHistoryEmptyState() {
        return `
            <div class="history-empty-state">
                <div class="empty-icon">🕒</div>
                <h3>暂无游戏历史</h3>
                <p>开始游玩游戏后，您的游戏历史将显示在这里</p>
                <a href="index.html" class="btn btn-primary">
                    <span>🎮</span>
                    <span>去发现游戏</span>
                </a>
            </div>
        `;
    }

    /**
     * 渲染最近游玩的游戏（首页展示）
     * @param {Array} recentGames - 最近游戏数组
     * @param {Element} container - 容器元素
     */
    renderRecentGames(recentGames, container) {
        if (!container) return;

        if (recentGames.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        
        const gamesHTML = recentGames.map(game => {
            return `
                <div class="recent-game-card" onclick="openGame('${game.gameId}')" title="继续游玩 ${escapeHtml(game.title)}">
                    <img 
                        src="${game.image}" 
                        alt="${escapeHtml(game.title)}" 
                        class="recent-game-image"
                        onerror="this.src='${IMAGE_CONFIG.PLACEHOLDER}'"
                        loading="lazy"
                    >
                    <div class="recent-game-info">
                        <h4 class="recent-game-title">${escapeHtml(game.title)}</h4>
                        <div class="recent-game-meta">
                            <span class="recent-game-time">${game.lastPlayedFormatted}</span>
                            <span class="recent-game-count">${game.playCount} 次</span>
                        </div>
                    </div>
                    <div class="recent-game-continue">
                        <span class="continue-icon">▶️</span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="recent-games-header">
                <h3>
                    <span class="section-icon">🕒</span>
                    <span>最近游玩</span>
                </h3>
                <a href="#" onclick="showHistoryModal()" class="view-all-link">查看全部</a>
            </div>
            <div class="recent-games-list">
                ${gamesHTML}
            </div>
        `;

        console.log('最近游戏渲染完成，共', recentGames.length, '个游戏');
    }

    /**
     * 渲染收藏游戏列表
     * @param {Array} favoriteGames - 收藏游戏数组
     * @param {Element} container - 容器元素
     */
    renderFavoritesList(favoriteGames, container) {
        if (!container) {
            console.error('收藏游戏容器元素未找到');
            return;
        }

        if (favoriteGames.length === 0) {
            container.innerHTML = this._createFavoritesEmptyState();
            return;
        }

        const favoritesHTML = favoriteGames.map(game => this._createFavoriteCard(game)).join('');
        container.innerHTML = favoritesHTML;

        // 设置懒加载
        this._setupImageLazyLoading(container);

        console.log(`渲染了 ${favoriteGames.length} 个收藏游戏`);
    }

    /**
     * 创建收藏游戏卡片HTML
     * @private
     * @param {Object} game - 游戏对象
     * @returns {string} 收藏游戏卡片HTML
     */
    _createFavoriteCard(game) {
        const title = escapeHtml(game.title);
        const description = escapeHtml(game.description);
        const rating = this._createRatingStars(game.rating || 0);

        return `
            <div class="favorite-card" data-game-id="${game.id}" onclick="openGame('${game.id}')">
                <div class="favorite-image-container">
                    <img 
                        class="favorite-image lazy-load" 
                        data-src="${game.image}" 
                        src="${IMAGE_CONFIG.PLACEHOLDER}"
                        alt="${title}"
                        onerror="this.src='${IMAGE_CONFIG.PLACEHOLDER}'"
                    >
                    <div class="favorite-overlay">
                        <div class="favorite-heart">❤️</div>
                    </div>
                </div>
                <div class="favorite-info">
                    <h4 class="favorite-title">${title}</h4>
                    <p class="favorite-description">${description}</p>
                    <div class="favorite-meta">
                        <div class="favorite-rating">
                            ${rating}
                            <span class="rating-value">${(game.rating || 0).toFixed(1)}</span>
                        </div>
                        <span class="favorite-category">${escapeHtml(game.categoryName || game.category)}</span>
                    </div>
                </div>
                <div class="favorite-actions">
                    <button class="favorite-remove-btn" onclick="event.stopPropagation(); removeFromFavorites(${game.id})" title="取消收藏">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 创建收藏空状态HTML
     * @private
     * @returns {string} 收藏空状态HTML
     */
    _createFavoritesEmptyState() {
        return `
            <div class="favorites-empty-state">
                <div class="empty-icon">💝</div>
                <h3>暂无收藏游戏</h3>
                <p>发现喜欢的游戏时，点击收藏按钮将它们保存在这里</p>
                <a href="index.html" class="btn btn-primary">
                    <span>🎮</span>
                    <span>去发现游戏</span>
                </a>
            </div>
        `;
    }

    /**
     * 渲染收藏游戏（首页展示）
     * @param {Array} favoriteGames - 收藏游戏数组
     * @param {Element} container - 容器元素
     */
    renderFavoriteGames(favoriteGames, container) {
        if (!container) return;

        if (favoriteGames.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        
        const gamesHTML = favoriteGames.map(game => {
            return `
                <div class="favorite-game-card" onclick="openGame('${game.id}')" title="游玩收藏的游戏 ${escapeHtml(game.title)}">
                    <img 
                        src="${game.image}" 
                        alt="${escapeHtml(game.title)}" 
                        class="favorite-game-image"
                        onerror="this.src='${IMAGE_CONFIG.PLACEHOLDER}'"
                        loading="lazy"
                    >
                    <div class="favorite-game-info">
                        <h4 class="favorite-game-title">${escapeHtml(game.title)}</h4>
                        <div class="favorite-game-meta">
                            <span class="favorite-game-category">${escapeHtml(game.categoryName || game.category)}</span>
                            <div class="favorite-game-rating">
                                ${this._createRatingStars(game.rating || 0)}
                            </div>
                        </div>
                    </div>
                    <div class="favorite-game-heart">
                        <span>❤️</span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="favorite-games-header">
                <h3>
                    <span class="section-icon">💝</span>
                    <span>我的收藏</span>
                </h3>
                <a href="#" onclick="showFavoritesModal()" class="view-all-link">查看全部</a>
            </div>
            <div class="favorite-games-list">
                ${gamesHTML}
            </div>
        `;

        console.log('收藏游戏渲染完成，共', favoriteGames.length, '个游戏');
    }

    /**
     * 更新收藏按钮状态
     * @param {number} gameId - 游戏ID
     * @param {boolean} isFavorited - 是否已收藏
     */
    updateFavoriteButton(gameId, isFavorited) {
        // 更新游戏详情页的收藏按钮
        const favoriteBtn = document.querySelector(`[onclick*="toggleFavorite(${gameId})"]`);
        if (favoriteBtn) {
            const heartIcon = favoriteBtn.querySelector('span:first-child');
            const textSpan = favoriteBtn.querySelector('span:last-child');
            
            if (heartIcon && textSpan) {
                heartIcon.textContent = isFavorited ? '❤️' : '♥';
                textSpan.textContent = isFavorited ? '已收藏' : '收藏';
                favoriteBtn.classList.toggle('favorited', isFavorited);
                favoriteBtn.title = isFavorited ? '取消收藏' : '收藏游戏';
            }
        }

        // 更新游戏卡片上的收藏状态（如果有的话）
        const gameCards = document.querySelectorAll(`[data-game-id="${gameId}"]`);
        gameCards.forEach(card => {
            const favoriteIndicator = card.querySelector('.favorite-indicator');
            if (favoriteIndicator) {
                favoriteIndicator.style.display = isFavorited ? 'block' : 'none';
            }
        });
    }

    /**
     * 切换移动端菜单
     */
    toggleMobileMenu() {
        const mobileMenuToggle = this.elements.mobileMenuToggle;
        const mobileCategoryMenu = this.elements.mobileCategoryMenu;
        
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
     * 设置移动端手势处理器
     * @private
     */
    _setupMobileGestureHandlers() {
        // 监听移动端手势事件
        window.addEventListener('gameSwipeRight', this._handleGameSwipeRight.bind(this));
        window.addEventListener('gameSwipeLeft', this._handleGameSwipeLeft.bind(this));
        window.addEventListener('mobileLongPress', this._handleMobileLongPress.bind(this));
        window.addEventListener('mobileDoubleTap', this._handleMobileDoubleTap.bind(this));
        window.addEventListener('pullToRefresh', this._handlePullToRefresh.bind(this));
        window.addEventListener('mobileOrientationChange', this._handleMobileOrientationChange.bind(this));
    }

    /**
     * 处理游戏卡片右滑（收藏）
     * @private
     * @param {CustomEvent} e - 手势事件
     */
    _handleGameSwipeRight(e) {
        const { gameId } = e.detail;
        
        // 触发收藏功能
        if (window.favoritesManager) {
            window.favoritesManager.toggleFavorite(gameId);
        }
        
        // 显示反馈
        this._showMobileNotification('已添加到收藏', 'success');
    }

    /**
     * 处理游戏卡片左滑（选项）
     * @private
     * @param {CustomEvent} e - 手势事件
     */
    _handleGameSwipeLeft(e) {
        const { gameId } = e.detail;
        
        // 显示游戏选项菜单
        this._showGameOptionsMenu(gameId);
    }

    /**
     * 处理移动端长按
     * @private
     * @param {CustomEvent} e - 手势事件
     */
    _handleMobileLongPress(e) {
        const { target } = e.detail;
        const gameCard = target.closest('.game-card');
        
        if (gameCard) {
            const gameId = gameCard.dataset.gameId;
            this._showGameContextMenu(gameId, e.detail.x, e.detail.y);
        }
    }

    /**
     * 处理移动端双击
     * @private
     * @param {CustomEvent} e - 手势事件
     */
    _handleMobileDoubleTap(e) {
        const { target } = e.detail;
        const gameCard = target.closest('.game-card');
        
        if (gameCard) {
            const gameId = gameCard.dataset.gameId;
            // 双击直接打开游戏
            if (window.openGame) {
                window.openGame(gameId);
            }
        }
    }

    /**
     * 处理下拉刷新
     * @private
     */
    _handlePullToRefresh() {
        // 重新加载游戏数据
        if (window.gameManager) {
            window.gameManager.refreshGames();
        }
        
        this._showMobileNotification('内容已刷新', 'success');
    }

    /**
     * 处理移动端屏幕方向变化
     * @private
     * @param {CustomEvent} e - 方向变化事件
     */
    _handleMobileOrientationChange(e) {
        const { orientation, width, height } = e.detail;
        
        // 重新计算游戏卡片布局
        this._recalculateGameCardLayout();
        
        // 更新视口相关的样式
        this._updateViewportStyles(width, height);
    }

    /**
     * 显示移动端通知
     * @private
     * @param {string} message - 通知消息
     * @param {string} type - 通知类型
     */
    _showMobileNotification(message, type = 'info') {
        if (window.interactionManager) {
            window.interactionManager.showToast(message, type);
        }
    }

    /**
     * 重新计算游戏卡片布局
     * @private
     */
    _recalculateGameCardLayout() {
        const container = this.elements.gamesContainer;
        if (!container) return;

        // 触发重新布局
        container.style.display = 'none';
        container.offsetHeight; // 强制重排
        container.style.display = '';
    }

    /**
     * 更新视口样式
     * @private
     * @param {number} width - 视口宽度
     * @param {number} height - 视口高度
     */
    _updateViewportStyles(width, height) {
        const vh = height * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        document.documentElement.style.setProperty('--vw', `${width * 0.01}px`);
    }

    /**
     * 销毁UI管理器
     */
    destroy() {
        // 清理观察者
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        this.observers.clear();

        // 移除移动端事件监听器
        window.removeEventListener('gameSwipeRight', this._handleGameSwipeRight);
        window.removeEventListener('gameSwipeLeft', this._handleGameSwipeLeft);
        window.removeEventListener('mobileLongPress', this._handleMobileLongPress);
        window.removeEventListener('mobileDoubleTap', this._handleMobileDoubleTap);
        window.removeEventListener('pullToRefresh', this._handlePullToRefresh);
        window.removeEventListener('mobileOrientationChange', this._handleMobileOrientationChange);

        // 清理缓存的元素
        this.elements = {};
        this.isInitialized = false;
    }
}

// 创建单例实例
const uiManager = new UIManager();

export default uiManager;