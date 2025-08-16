/**
 * 移动端交互管理器
 * 负责移动端特有的触摸交互、手势支持和用户体验优化
 */

import { ANIMATION_DURATION } from '../utils/constants.js';
import { debounce, throttle } from '../utils/helpers.js';

class MobileInteractionManager {
    constructor() {
        this.isInitialized = false;
        this.isMobile = this._detectMobile();
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.isScrolling = false;
        this.lastTouchTime = 0;
        this.tapTimeout = null;
        this.longPressTimeout = null;
        this.swipeThreshold = 50; // 滑动阈值（像素）
        this.longPressDelay = 500; // 长按延迟（毫秒）
        this.doubleTapDelay = 300; // 双击延迟（毫秒）
        
        // 绑定方法上下文
        this._handleTouchStart = this._handleTouchStart.bind(this);
        this._handleTouchMove = this._handleTouchMove.bind(this);
        this._handleTouchEnd = this._handleTouchEnd.bind(this);
        this._handleOrientationChange = this._handleOrientationChange.bind(this);
        this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
    }

    /**
     * 初始化移动端交互管理器
     */
    init() {
        if (this.isInitialized || !this.isMobile) return;

        this._setupTouchEvents();
        this._setupMobileNavigation();
        this._setupSwipeGestures();
        this._setupTouchFeedback();
        this._setupOrientationHandling();
        this._setupViewportOptimization();
        this._setupMobileFriendlyFeatures();
        
        this.isInitialized = true;
        console.log('移动端交互管理器已初始化');
    }

    /**
     * 检测是否为移动设备
     * @private
     * @returns {boolean} 是否为移动设备
     */
    _detectMobile() {
        const userAgent = navigator.userAgent.toLowerCase();
        const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
        
        // 检查用户代理字符串
        const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
        
        // 检查屏幕尺寸
        const isMobileScreen = window.innerWidth <= 768;
        
        // 检查触摸支持
        const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        return isMobileUA || (isMobileScreen && hasTouchSupport);
    }

    /**
     * 设置触摸事件监听
     * @private
     */
    _setupTouchEvents() {
        // 添加触摸事件监听器
        document.addEventListener('touchstart', this._handleTouchStart, { passive: false });
        document.addEventListener('touchmove', this._handleTouchMove, { passive: false });
        document.addEventListener('touchend', this._handleTouchEnd, { passive: false });
        
        // 防止双击缩放
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        // 防止长按选择文本
        document.addEventListener('selectstart', (e) => {
            if (e.target.closest('.game-card, .mobile-category-menu')) {
                e.preventDefault();
            }
        });
    }

    /**
     * 设置移动端导航优化
     * @private
     */
    _setupMobileNavigation() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileCategoryMenu = document.getElementById('mobile-category-menu');
        const mobileMenuClose = document.getElementById('mobile-menu-close');
        
        if (!mobileMenuToggle || !mobileCategoryMenu) return;

        // 优化汉堡菜单动画
        mobileMenuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            this._toggleMobileMenu();
        });

        // 优化菜单关闭
        if (mobileMenuClose) {
            mobileMenuClose.addEventListener('click', (e) => {
                e.preventDefault();
                this._closeMobileMenu();
            });
        }

        // 点击遮罩关闭菜单
        mobileCategoryMenu.addEventListener('click', (e) => {
            if (e.target === mobileCategoryMenu) {
                this._closeMobileMenu();
            }
        });

        // 添加滑动关闭手势
        this._setupMenuSwipeGesture(mobileCategoryMenu);

        // 优化菜单项点击
        const mobileMenuLinks = mobileCategoryMenu.querySelectorAll('.mobile-category-link');
        mobileMenuLinks.forEach(link => {
            this._addTouchFeedback(link);
            
            link.addEventListener('click', (e) => {
                // 添加点击动画
                link.classList.add('clicked');
                setTimeout(() => {
                    link.classList.remove('clicked');
                }, 150);
                
                // 延迟关闭菜单以显示动画
                setTimeout(() => {
                    this._closeMobileMenu();
                }, 100);
            });
        });
    }

    /**
     * 设置滑动手势支持
     * @private
     */
    _setupSwipeGestures() {
        // 为游戏卡片添加滑动手势
        document.addEventListener('DOMContentLoaded', () => {
            this._setupGameCardSwipes();
            this._setupNavigationSwipes();
        });

        // 监听DOM变化，为新添加的元素设置手势
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.classList?.contains('game-card')) {
                            this._addGameCardSwipe(node);
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * 设置游戏卡片滑动手势
     * @private
     */
    _setupGameCardSwipes() {
        const gameCards = document.querySelectorAll('.game-card');
        gameCards.forEach(card => this._addGameCardSwipe(card));
    }

    /**
     * 为游戏卡片添加滑动手势
     * @private
     * @param {Element} card - 游戏卡片元素
     */
    _addGameCardSwipe(card) {
        if (!card || card.hasAttribute('data-swipe-enabled')) return;
        
        card.setAttribute('data-swipe-enabled', 'true');
        
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let isDragging = false;
        let startTime = 0;

        const handleTouchStart = (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            currentX = startX;
            startTime = Date.now();
            isDragging = false;
            
            card.style.transition = 'none';
        };

        const handleTouchMove = (e) => {
            if (!startX) return;
            
            currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const deltaX = currentX - startX;
            const deltaY = currentY - startY;
            
            // 判断是否为水平滑动
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
                isDragging = true;
                e.preventDefault();
                
                // 添加滑动视觉反馈
                const opacity = Math.max(0.7, 1 - Math.abs(deltaX) / 200);
                const scale = Math.max(0.95, 1 - Math.abs(deltaX) / 400);
                
                card.style.transform = `translateX(${deltaX * 0.3}px) scale(${scale})`;
                card.style.opacity = opacity;
                
                // 显示操作提示
                this._showSwipeHint(card, deltaX);
            }
        };

        const handleTouchEnd = (e) => {
            if (!isDragging) {
                startX = 0;
                return;
            }
            
            const deltaX = currentX - startX;
            const deltaTime = Date.now() - startTime;
            const velocity = Math.abs(deltaX) / deltaTime;
            
            card.style.transition = 'all 0.3s ease';
            card.style.transform = '';
            card.style.opacity = '';
            
            // 判断滑动操作
            if (Math.abs(deltaX) > this.swipeThreshold || velocity > 0.5) {
                if (deltaX > 0) {
                    // 右滑 - 添加到收藏
                    this._handleSwipeRight(card);
                } else {
                    // 左滑 - 显示更多选项
                    this._handleSwipeLeft(card);
                }
            }
            
            this._hideSwipeHint(card);
            startX = 0;
            isDragging = false;
        };

        card.addEventListener('touchstart', handleTouchStart, { passive: false });
        card.addEventListener('touchmove', handleTouchMove, { passive: false });
        card.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    /**
     * 设置导航滑动手势
     * @private
     */
    _setupNavigationSwipes() {
        const header = document.querySelector('.header');
        if (!header) return;

        let startY = 0;
        let isScrollingUp = false;

        const handleTouchStart = (e) => {
            startY = e.touches[0].clientY;
        };

        const handleTouchMove = throttle((e) => {
            const currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            
            if (Math.abs(deltaY) > 10) {
                isScrollingUp = deltaY > 0;
                
                // 根据滑动方向显示/隐藏导航栏
                if (isScrollingUp && window.pageYOffset > 100) {
                    header.classList.add('nav-hidden');
                } else {
                    header.classList.remove('nav-hidden');
                }
            }
        }, 16);

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
    }

    /**
     * 设置触摸反馈
     * @private
     */
    _setupTouchFeedback() {
        // 为所有可点击元素添加触摸反馈
        const clickableElements = document.querySelectorAll(
            'button, .btn, .game-card, .category-link, .mobile-category-link, .language-option'
        );
        
        clickableElements.forEach(element => {
            this._addTouchFeedback(element);
        });

        // 监听新添加的元素
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const clickableChildren = node.querySelectorAll(
                            'button, .btn, .game-card, .category-link, .mobile-category-link, .language-option'
                        );
                        clickableChildren.forEach(element => {
                            this._addTouchFeedback(element);
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * 为元素添加触摸反馈
     * @private
     * @param {Element} element - 目标元素
     */
    _addTouchFeedback(element) {
        if (!element || element.hasAttribute('data-touch-feedback')) return;
        
        element.setAttribute('data-touch-feedback', 'true');
        
        const handleTouchStart = (e) => {
            element.classList.add('touch-active');
            
            // 添加触觉反馈（如果支持）
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        };

        const handleTouchEnd = () => {
            setTimeout(() => {
                element.classList.remove('touch-active');
            }, 150);
        };

        const handleTouchCancel = () => {
            element.classList.remove('touch-active');
        };

        element.addEventListener('touchstart', handleTouchStart, { passive: true });
        element.addEventListener('touchend', handleTouchEnd, { passive: true });
        element.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    }

    /**
     * 设置屏幕方向处理
     * @private
     */
    _setupOrientationHandling() {
        // 监听屏幕方向变化
        window.addEventListener('orientationchange', this._handleOrientationChange);
        window.addEventListener('resize', debounce(this._handleOrientationChange, 300));
        
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', this._handleVisibilityChange);
    }

    /**
     * 设置视口优化
     * @private
     */
    _setupViewportOptimization() {
        // 动态调整视口高度（解决移动端地址栏问题）
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setViewportHeight();
        window.addEventListener('resize', debounce(setViewportHeight, 300));
        window.addEventListener('orientationchange', () => {
            setTimeout(setViewportHeight, 500);
        });
    }

    /**
     * 设置移动端友好功能
     * @private
     */
    _setupMobileFriendlyFeatures() {
        // 优化滚动性能
        this._optimizeScrolling();
        
        // 设置快速点击
        this._setupFastClick();
        
        // 优化输入框体验
        this._optimizeInputs();
        
        // 设置下拉刷新
        this._setupPullToRefresh();
    }

    /**
     * 优化滚动性能
     * @private
     */
    _optimizeScrolling() {
        // 使用 passive 事件监听器
        let ticking = false;
        
        const updateScrollPosition = () => {
            // 更新滚动相关的UI状态
            const scrollTop = window.pageYOffset;
            document.documentElement.style.setProperty('--scroll-top', `${scrollTop}px`);
            ticking = false;
        };

        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollPosition);
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    /**
     * 设置快速点击
     * @private
     */
    _setupFastClick() {
        // 减少点击延迟
        document.addEventListener('touchend', (e) => {
            const target = e.target.closest('button, .btn, .game-card, a');
            if (target && !target.disabled) {
                target.classList.add('fast-click');
                setTimeout(() => {
                    target.classList.remove('fast-click');
                }, 100);
            }
        }, { passive: true });
    }

    /**
     * 优化输入框体验
     * @private
     */
    _optimizeInputs() {
        const inputs = document.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
            // 防止输入时页面缩放
            input.addEventListener('focus', () => {
                const viewport = document.querySelector('meta[name="viewport"]');
                if (viewport) {
                    viewport.setAttribute('content', 
                        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
                    );
                }
            });

            input.addEventListener('blur', () => {
                const viewport = document.querySelector('meta[name="viewport"]');
                if (viewport) {
                    viewport.setAttribute('content', 
                        'width=device-width, initial-scale=1.0'
                    );
                }
            });
        });
    }

    /**
     * 设置下拉刷新
     * @private
     */
    _setupPullToRefresh() {
        let startY = 0;
        let pullDistance = 0;
        let isPulling = false;
        const pullThreshold = 80;
        
        const pullToRefreshElement = document.createElement('div');
        pullToRefreshElement.className = 'pull-to-refresh';
        pullToRefreshElement.innerHTML = `
            <div class="pull-to-refresh-content">
                <div class="pull-icon">↓</div>
                <div class="pull-text">下拉刷新</div>
            </div>
        `;
        document.body.insertBefore(pullToRefreshElement, document.body.firstChild);

        const handleTouchStart = (e) => {
            if (window.pageYOffset === 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        };

        const handleTouchMove = (e) => {
            if (!isPulling || window.pageYOffset > 0) return;
            
            const currentY = e.touches[0].clientY;
            pullDistance = Math.max(0, (currentY - startY) * 0.5);
            
            if (pullDistance > 0) {
                e.preventDefault();
                
                pullToRefreshElement.style.transform = `translateY(${pullDistance}px)`;
                pullToRefreshElement.style.opacity = Math.min(1, pullDistance / pullThreshold);
                
                if (pullDistance >= pullThreshold) {
                    pullToRefreshElement.classList.add('ready');
                    pullToRefreshElement.querySelector('.pull-text').textContent = '释放刷新';
                    pullToRefreshElement.querySelector('.pull-icon').style.transform = 'rotate(180deg)';
                } else {
                    pullToRefreshElement.classList.remove('ready');
                    pullToRefreshElement.querySelector('.pull-text').textContent = '下拉刷新';
                    pullToRefreshElement.querySelector('.pull-icon').style.transform = 'rotate(0deg)';
                }
            }
        };

        const handleTouchEnd = () => {
            if (!isPulling) return;
            
            if (pullDistance >= pullThreshold) {
                // 触发刷新
                this._triggerRefresh();
            }
            
            // 重置状态
            pullToRefreshElement.style.transform = '';
            pullToRefreshElement.style.opacity = '';
            pullToRefreshElement.classList.remove('ready');
            
            isPulling = false;
            pullDistance = 0;
            startY = 0;
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    /**
     * 处理触摸开始事件
     * @private
     * @param {TouchEvent} e - 触摸事件
     */
    _handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.isScrolling = false;
        
        // 设置长按定时器
        this.longPressTimeout = setTimeout(() => {
            this._handleLongPress(e);
        }, this.longPressDelay);
    }

    /**
     * 处理触摸移动事件
     * @private
     * @param {TouchEvent} e - 触摸事件
     */
    _handleTouchMove(e) {
        if (!this.touchStartX || !this.touchStartY) return;
        
        const deltaX = Math.abs(e.touches[0].clientX - this.touchStartX);
        const deltaY = Math.abs(e.touches[0].clientY - this.touchStartY);
        
        // 如果移动距离超过阈值，取消长按
        if (deltaX > 10 || deltaY > 10) {
            this._clearLongPress();
            
            // 判断滚动方向
            if (deltaY > deltaX) {
                this.isScrolling = true;
            }
        }
    }

    /**
     * 处理触摸结束事件
     * @private
     * @param {TouchEvent} e - 触摸事件
     */
    _handleTouchEnd(e) {
        this.touchEndX = e.changedTouches[0].clientX;
        this.touchEndY = e.changedTouches[0].clientY;
        
        this._clearLongPress();
        
        if (!this.isScrolling) {
            this._handleSwipe();
            this._handleTap(e);
        }
        
        // 重置状态
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.isScrolling = false;
    }

    /**
     * 处理屏幕方向变化
     * @private
     */
    _handleOrientationChange() {
        // 延迟执行以确保尺寸更新完成
        setTimeout(() => {
            // 重新计算布局
            this._recalculateLayout();
            
            // 关闭移动菜单
            this._closeMobileMenu();
            
            // 触发自定义事件
            window.dispatchEvent(new CustomEvent('mobileOrientationChange', {
                detail: {
                    orientation: screen.orientation?.angle || window.orientation,
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            }));
        }, 300);
    }

    /**
     * 处理页面可见性变化
     * @private
     */
    _handleVisibilityChange() {
        if (document.hidden) {
            // 页面隐藏时暂停动画和定时器
            this._pauseAnimations();
        } else {
            // 页面显示时恢复动画和定时器
            this._resumeAnimations();
        }
    }

    /**
     * 切换移动端菜单
     * @private
     */
    _toggleMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileCategoryMenu = document.getElementById('mobile-category-menu');
        
        if (!mobileMenuToggle || !mobileCategoryMenu) return;
        
        const isOpen = mobileCategoryMenu.classList.contains('show');
        
        if (isOpen) {
            this._closeMobileMenu();
        } else {
            this._openMobileMenu();
        }
    }

    /**
     * 打开移动端菜单
     * @private
     */
    _openMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileCategoryMenu = document.getElementById('mobile-category-menu');
        
        if (!mobileMenuToggle || !mobileCategoryMenu) return;
        
        mobileMenuToggle.classList.add('active');
        mobileCategoryMenu.classList.add('show');
        document.body.classList.add('menu-open');
        
        // 添加触觉反馈
        if (navigator.vibrate) {
            navigator.vibrate(20);
        }
        
        // 聚焦到第一个菜单项
        const firstMenuItem = mobileCategoryMenu.querySelector('.mobile-category-link');
        if (firstMenuItem) {
            setTimeout(() => {
                firstMenuItem.focus();
            }, 300);
        }
    }

    /**
     * 关闭移动端菜单
     * @private
     */
    _closeMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileCategoryMenu = document.getElementById('mobile-category-menu');
        
        if (!mobileMenuToggle || !mobileCategoryMenu) return;
        
        mobileMenuToggle.classList.remove('active');
        mobileCategoryMenu.classList.remove('show');
        document.body.classList.remove('menu-open');
    }

    /**
     * 设置菜单滑动手势
     * @private
     * @param {Element} menu - 菜单元素
     */
    _setupMenuSwipeGesture(menu) {
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        
        const handleTouchStart = (e) => {
            startX = e.touches[0].clientX;
            currentX = startX;
            isDragging = false;
        };
        
        const handleTouchMove = (e) => {
            if (!startX) return;
            
            currentX = e.touches[0].clientX;
            const deltaX = currentX - startX;
            
            // 只处理向右滑动（关闭菜单）
            if (deltaX > 0 && deltaX > 10) {
                isDragging = true;
                e.preventDefault();
                
                // 添加滑动视觉反馈
                const opacity = Math.max(0.3, 1 - deltaX / 200);
                menu.style.backgroundColor = `rgba(0, 0, 0, ${opacity * 0.5})`;
            }
        };
        
        const handleTouchEnd = () => {
            if (!isDragging) {
                startX = 0;
                return;
            }
            
            const deltaX = currentX - startX;
            
            menu.style.backgroundColor = '';
            
            // 如果滑动距离足够，关闭菜单
            if (deltaX > this.swipeThreshold) {
                this._closeMobileMenu();
            }
            
            startX = 0;
            isDragging = false;
        };
        
        menu.addEventListener('touchstart', handleTouchStart, { passive: false });
        menu.addEventListener('touchmove', handleTouchMove, { passive: false });
        menu.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    /**
     * 显示滑动提示
     * @private
     * @param {Element} card - 游戏卡片
     * @param {number} deltaX - 滑动距离
     */
    _showSwipeHint(card, deltaX) {
        let hint = card.querySelector('.swipe-hint');
        if (!hint) {
            hint = document.createElement('div');
            hint.className = 'swipe-hint';
            card.appendChild(hint);
        }
        
        if (deltaX > 0) {
            hint.innerHTML = '❤️ 收藏';
            hint.className = 'swipe-hint swipe-right';
        } else {
            hint.innerHTML = '⚙️ 选项';
            hint.className = 'swipe-hint swipe-left';
        }
        
        hint.style.opacity = Math.min(1, Math.abs(deltaX) / this.swipeThreshold);
    }

    /**
     * 隐藏滑动提示
     * @private
     * @param {Element} card - 游戏卡片
     */
    _hideSwipeHint(card) {
        const hint = card.querySelector('.swipe-hint');
        if (hint) {
            hint.style.opacity = '0';
            setTimeout(() => {
                hint.remove();
            }, 300);
        }
    }

    /**
     * 处理右滑操作
     * @private
     * @param {Element} card - 游戏卡片
     */
    _handleSwipeRight(card) {
        const gameId = card.dataset.gameId;
        if (gameId) {
            // 触发收藏事件
            window.dispatchEvent(new CustomEvent('gameSwipeRight', {
                detail: { gameId, action: 'favorite' }
            }));
            
            // 显示反馈
            this._showSwipeFeedback(card, '已添加到收藏', 'success');
        }
    }

    /**
     * 处理左滑操作
     * @private
     * @param {Element} card - 游戏卡片
     */
    _handleSwipeLeft(card) {
        const gameId = card.dataset.gameId;
        if (gameId) {
            // 触发选项事件
            window.dispatchEvent(new CustomEvent('gameSwipeLeft', {
                detail: { gameId, action: 'options' }
            }));
            
            // 显示选项菜单
            this._showGameOptions(card, gameId);
        }
    }

    /**
     * 显示滑动反馈
     * @private
     * @param {Element} card - 游戏卡片
     * @param {string} message - 反馈消息
     * @param {string} type - 反馈类型
     */
    _showSwipeFeedback(card, message, type = 'info') {
        const feedback = document.createElement('div');
        feedback.className = `swipe-feedback swipe-feedback-${type}`;
        feedback.textContent = message;
        
        card.appendChild(feedback);
        
        setTimeout(() => {
            feedback.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            feedback.classList.remove('show');
            setTimeout(() => {
                feedback.remove();
            }, 300);
        }, 2000);
    }

    /**
     * 显示游戏选项菜单
     * @private
     * @param {Element} card - 游戏卡片
     * @param {string} gameId - 游戏ID
     */
    _showGameOptions(card, gameId) {
        // 这里可以显示一个选项菜单
        // 暂时显示一个简单的提示
        this._showSwipeFeedback(card, '选项菜单', 'info');
    }

    /**
     * 处理滑动手势
     * @private
     */
    _handleSwipe() {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.swipeThreshold) {
            if (deltaX > 0) {
                // 右滑
                window.dispatchEvent(new CustomEvent('swipeRight'));
            } else {
                // 左滑
                window.dispatchEvent(new CustomEvent('swipeLeft'));
            }
        } else if (Math.abs(deltaY) > this.swipeThreshold) {
            if (deltaY > 0) {
                // 下滑
                window.dispatchEvent(new CustomEvent('swipeDown'));
            } else {
                // 上滑
                window.dispatchEvent(new CustomEvent('swipeUp'));
            }
        }
    }

    /**
     * 处理点击手势
     * @private
     * @param {TouchEvent} e - 触摸事件
     */
    _handleTap(e) {
        const currentTime = Date.now();
        const timeDiff = currentTime - this.lastTouchTime;
        
        if (timeDiff < this.doubleTapDelay) {
            // 双击
            this._handleDoubleTap(e);
        } else {
            // 单击
            this.tapTimeout = setTimeout(() => {
                this._handleSingleTap(e);
            }, this.doubleTapDelay);
        }
        
        this.lastTouchTime = currentTime;
    }

    /**
     * 处理单击
     * @private
     * @param {TouchEvent} e - 触摸事件
     */
    _handleSingleTap(e) {
        // 触发单击事件
        window.dispatchEvent(new CustomEvent('mobileTap', {
            detail: {
                target: e.target,
                x: this.touchEndX,
                y: this.touchEndY
            }
        }));
    }

    /**
     * 处理双击
     * @private
     * @param {TouchEvent} e - 触摸事件
     */
    _handleDoubleTap(e) {
        if (this.tapTimeout) {
            clearTimeout(this.tapTimeout);
            this.tapTimeout = null;
        }
        
        // 触发双击事件
        window.dispatchEvent(new CustomEvent('mobileDoubleTap', {
            detail: {
                target: e.target,
                x: this.touchEndX,
                y: this.touchEndY
            }
        }));
    }

    /**
     * 处理长按
     * @private
     * @param {TouchEvent} e - 触摸事件
     */
    _handleLongPress(e) {
        // 添加触觉反馈
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // 触发长按事件
        window.dispatchEvent(new CustomEvent('mobileLongPress', {
            detail: {
                target: e.target,
                x: this.touchStartX,
                y: this.touchStartY
            }
        }));
    }

    /**
     * 清除长按定时器
     * @private
     */
    _clearLongPress() {
        if (this.longPressTimeout) {
            clearTimeout(this.longPressTimeout);
            this.longPressTimeout = null;
        }
    }

    /**
     * 重新计算布局
     * @private
     */
    _recalculateLayout() {
        // 触发布局重新计算
        window.dispatchEvent(new CustomEvent('layoutRecalculate'));
        
        // 更新视口高度
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    /**
     * 暂停动画
     * @private
     */
    _pauseAnimations() {
        document.body.classList.add('animations-paused');
    }

    /**
     * 恢复动画
     * @private
     */
    _resumeAnimations() {
        document.body.classList.remove('animations-paused');
    }

    /**
     * 触发刷新
     * @private
     */
    _triggerRefresh() {
        // 触发刷新事件
        window.dispatchEvent(new CustomEvent('pullToRefresh'));
        
        // 显示刷新状态
        const pullToRefresh = document.querySelector('.pull-to-refresh');
        if (pullToRefresh) {
            pullToRefresh.classList.add('refreshing');
            pullToRefresh.querySelector('.pull-text').textContent = '正在刷新...';
            pullToRefresh.querySelector('.pull-icon').style.animation = 'spin 1s linear infinite';
            
            // 模拟刷新完成
            setTimeout(() => {
                pullToRefresh.classList.remove('refreshing');
                pullToRefresh.querySelector('.pull-text').textContent = '刷新完成';
                pullToRefresh.querySelector('.pull-icon').style.animation = '';
                
                setTimeout(() => {
                    pullToRefresh.style.transform = '';
                    pullToRefresh.style.opacity = '';
                }, 500);
            }, 1500);
        }
    }

    /**
     * 销毁移动端交互管理器
     */
    destroy() {
        if (!this.isInitialized) return;
        
        // 移除事件监听器
        document.removeEventListener('touchstart', this._handleTouchStart);
        document.removeEventListener('touchmove', this._handleTouchMove);
        document.removeEventListener('touchend', this._handleTouchEnd);
        window.removeEventListener('orientationchange', this._handleOrientationChange);
        window.removeEventListener('resize', this._handleOrientationChange);
        document.removeEventListener('visibilitychange', this._handleVisibilityChange);
        
        // 清除定时器
        this._clearLongPress();
        if (this.tapTimeout) {
            clearTimeout(this.tapTimeout);
        }
        
        // 移除添加的元素
        const pullToRefresh = document.querySelector('.pull-to-refresh');
        if (pullToRefresh) {
            pullToRefresh.remove();
        }
        
        this.isInitialized = false;
        console.log('移动端交互管理器已销毁');
    }
}

// 创建单例实例
const mobileInteractionManager = new MobileInteractionManager();

export default mobileInteractionManager;