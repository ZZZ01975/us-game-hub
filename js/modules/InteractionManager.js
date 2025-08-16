/**
 * 交互体验管理器
 * 负责页面加载动画、过渡效果、错误提示等交互体验功能
 */

import { ANIMATION_DURATION } from '../utils/constants.js';
import { delay } from '../utils/helpers.js';

class InteractionManager {
    constructor() {
        this.isInitialized = false;
        this.loadingOverlay = null;
        this.toastContainer = null;
        this.backToTopButton = null;
    }

    /**
     * 初始化交互管理器
     */
    init() {
        if (this.isInitialized) return;

        this._createLoadingOverlay();
        this._createToastContainer();
        this._initBackToTop();
        this._setupPageTransitions();
        this._setupScrollEffects();
        
        this.isInitialized = true;
        console.log('交互体验管理器已初始化');
    }

    /**
     * 创建页面加载遮罩
     * @private
     */
    _createLoadingOverlay() {
        this.loadingOverlay = document.createElement('div');
        this.loadingOverlay.className = 'page-loading-overlay';
        this.loadingOverlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-logo">
                    <span class="logo-icon">🎮</span>
                    <span class="logo-text">US Game Hub</span>
                </div>
                <div class="loading-spinner-container">
                    <div class="loading-spinner"></div>
                    <div class="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
                <div class="loading-text">正在加载精彩游戏...</div>
                <div class="loading-progress">
                    <div class="progress-bar"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.loadingOverlay);
    }

    /**
     * 创建Toast通知容器
     * @private
     */
    _createToastContainer() {
        this.toastContainer = document.createElement('div');
        this.toastContainer.className = 'toast-container';
        document.body.appendChild(this.toastContainer);
    }

    /**
     * 初始化返回顶部按钮
     * @private
     */
    _initBackToTop() {
        this.backToTopButton = document.getElementById('back-to-top');
        if (!this.backToTopButton) {
            // 如果页面中没有返回顶部按钮，创建一个
            this.backToTopButton = document.createElement('button');
            this.backToTopButton.id = 'back-to-top';
            this.backToTopButton.className = 'back-to-top';
            this.backToTopButton.innerHTML = '↑';
            this.backToTopButton.title = '返回顶部';
            document.body.appendChild(this.backToTopButton);
        }

        // 添加点击事件
        this.backToTopButton.addEventListener('click', this.scrollToTop.bind(this));

        // 添加滚动监听
        window.addEventListener('scroll', this._handleScroll.bind(this));
    }

    /**
     * 设置页面过渡效果
     * @private
     */
    _setupPageTransitions() {
        // 为所有链接添加页面过渡效果
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && !link.hasAttribute('target') && link.href.startsWith(window.location.origin)) {
                e.preventDefault();
                this.navigateWithTransition(link.href);
            }
        });
    }

    /**
     * 设置滚动效果
     * @private
     */
    _setupScrollEffects() {
        // 为页面元素添加滚动动画
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            // 观察需要动画的元素
            document.querySelectorAll('.game-card, .recent-game-card, .favorite-game-card').forEach(el => {
                el.classList.add('animate-on-scroll');
                observer.observe(el);
            });
        }
    }

    /**
     * 显示页面加载动画
     * @param {string} message - 加载消息
     */
    showPageLoading(message = '正在加载...') {
        if (!this.loadingOverlay) return;

        const loadingText = this.loadingOverlay.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = message;
        }

        this.loadingOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';

        // 启动进度条动画
        this._animateProgressBar();
    }

    /**
     * 隐藏页面加载动画
     * @param {number} delay - 延迟时间（毫秒）
     */
    async hidePageLoading(delay = 500) {
        if (!this.loadingOverlay) return;

        await this._completeProgressBar();
        
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        this.loadingOverlay.classList.add('fade-out');
        
        setTimeout(() => {
            if (this.loadingOverlay) {
                this.loadingOverlay.classList.remove('show', 'fade-out');
                document.body.style.overflow = '';
            }
        }, ANIMATION_DURATION.NORMAL);
    }

    /**
     * 动画进度条
     * @private
     */
    _animateProgressBar() {
        const progressBar = this.loadingOverlay?.querySelector('.progress-bar');
        if (!progressBar) return;

        progressBar.style.width = '0%';
        progressBar.style.transition = 'width 2s ease-out';
        
        setTimeout(() => {
            progressBar.style.width = '70%';
        }, 100);
    }

    /**
     * 完成进度条动画
     * @private
     */
    async _completeProgressBar() {
        const progressBar = this.loadingOverlay?.querySelector('.progress-bar');
        if (!progressBar) return;

        progressBar.style.transition = 'width 0.3s ease-out';
        progressBar.style.width = '100%';
        
        return new Promise(resolve => setTimeout(resolve, 300));
    }

    /**
     * 显示优雅的错误提示
     * @param {string} title - 错误标题
     * @param {string} message - 错误消息
     * @param {Object} options - 选项
     */
    showErrorDialog(title, message, options = {}) {
        const {
            showRetry = true,
            showHome = true,
            retryCallback = null,
            autoClose = false,
            duration = 0
        } = options;

        const errorDialog = document.createElement('div');
        errorDialog.className = 'error-dialog-overlay';
        
        const retryButton = showRetry ? `
            <button class="btn btn-primary error-retry-btn" ${retryCallback ? `onclick="(${retryCallback.toString()})()"` : 'onclick="location.reload()"'}>
                <span>🔄</span>
                <span>重试</span>
            </button>
        ` : '';

        const homeButton = showHome ? `
            <button class="btn btn-secondary error-home-btn" onclick="window.location.href='index.html'">
                <span>🏠</span>
                <span>返回首页</span>
            </button>
        ` : '';

        errorDialog.innerHTML = `
            <div class="error-dialog">
                <div class="error-dialog-content">
                    <div class="error-icon">
                        <div class="error-icon-circle">
                            <span>⚠️</span>
                        </div>
                    </div>
                    <div class="error-info">
                        <h3 class="error-title">${title}</h3>
                        <p class="error-message">${message}</p>
                    </div>
                    <div class="error-actions">
                        ${retryButton}
                        ${homeButton}
                        <button class="btn btn-ghost error-close-btn" onclick="this.closest('.error-dialog-overlay').remove()">
                            <span>✕</span>
                            <span>关闭</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(errorDialog);

        // 添加动画效果
        setTimeout(() => {
            errorDialog.classList.add('show');
        }, 10);

        // 自动关闭
        if (autoClose && duration > 0) {
            setTimeout(() => {
                if (errorDialog.parentNode) {
                    errorDialog.classList.add('fade-out');
                    setTimeout(() => {
                        errorDialog.remove();
                    }, ANIMATION_DURATION.NORMAL);
                }
            }, duration);
        }

        return errorDialog;
    }

    /**
     * 显示Toast通知
     * @param {string} message - 通知消息
     * @param {string} type - 通知类型
     * @param {number} duration - 显示时长
     */
    showToast(message, type = 'info', duration = 3000) {
        if (!this.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        this.toastContainer.appendChild(toast);

        // 添加显示动画
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // 自动移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('fade-out');
                setTimeout(() => {
                    toast.remove();
                }, ANIMATION_DURATION.NORMAL);
            }
        }, duration);

        return toast;
    }

    /**
     * 页面过渡导航
     * @param {string} url - 目标URL
     */
    async navigateWithTransition(url) {
        // 添加页面退出动画
        document.body.classList.add('page-exit');
        
        await delay(ANIMATION_DURATION.NORMAL);
        
        // 导航到新页面
        window.location.href = url;
    }

    /**
     * 滚动到顶部
     */
    scrollToTop() {
        const startPosition = window.pageYOffset;
        const startTime = performance.now();
        const duration = 800;

        const easeInOutCubic = (t) => {
            return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        };

        const animateScroll = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = easeInOutCubic(progress);
            
            window.scrollTo(0, startPosition * (1 - easeProgress));
            
            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            }
        };

        requestAnimationFrame(animateScroll);
    }

    /**
     * 处理滚动事件
     * @private
     */
    _handleScroll() {
        if (!this.backToTopButton) return;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 300) {
            this.backToTopButton.classList.add('show');
        } else {
            this.backToTopButton.classList.remove('show');
        }

        // 添加滚动方向检测
        if (this.lastScrollTop === undefined) {
            this.lastScrollTop = scrollTop;
            return;
        }

        if (scrollTop > this.lastScrollTop && scrollTop > 100) {
            // 向下滚动，隐藏导航栏
            document.body.classList.add('scroll-down');
            document.body.classList.remove('scroll-up');
        } else {
            // 向上滚动，显示导航栏
            document.body.classList.add('scroll-up');
            document.body.classList.remove('scroll-down');
        }

        this.lastScrollTop = scrollTop;
    }

    /**
     * 添加加载状态到元素
     * @param {Element} element - 目标元素
     * @param {string} message - 加载消息
     */
    addLoadingState(element, message = '加载中...') {
        if (!element) return;

        element.classList.add('loading-state');
        
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'element-loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="element-loading-content">
                <div class="loading-spinner"></div>
                <span class="loading-message">${message}</span>
            </div>
        `;

        element.style.position = 'relative';
        element.appendChild(loadingOverlay);

        return loadingOverlay;
    }

    /**
     * 移除元素的加载状态
     * @param {Element} element - 目标元素
     */
    removeLoadingState(element) {
        if (!element) return;

        element.classList.remove('loading-state');
        
        const loadingOverlay = element.querySelector('.element-loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }

    /**
     * 创建确认对话框
     * @param {string} title - 对话框标题
     * @param {string} message - 对话框消息
     * @param {Object} options - 选项
     * @returns {Promise<boolean>} 用户选择结果
     */
    showConfirmDialog(title, message, options = {}) {
        const {
            confirmText = '确认',
            cancelText = '取消',
            type = 'warning'
        } = options;

        return new Promise((resolve) => {
            const confirmDialog = document.createElement('div');
            confirmDialog.className = 'confirm-dialog-overlay';
            
            const icons = {
                warning: '⚠️',
                danger: '🚨',
                info: 'ℹ️',
                question: '❓'
            };

            confirmDialog.innerHTML = `
                <div class="confirm-dialog">
                    <div class="confirm-dialog-content">
                        <div class="confirm-icon">
                            <span>${icons[type] || icons.warning}</span>
                        </div>
                        <div class="confirm-info">
                            <h3 class="confirm-title">${title}</h3>
                            <p class="confirm-message">${message}</p>
                        </div>
                        <div class="confirm-actions">
                            <button class="btn btn-primary confirm-btn">
                                <span>${confirmText}</span>
                            </button>
                            <button class="btn btn-secondary cancel-btn">
                                <span>${cancelText}</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(confirmDialog);

            // 添加事件监听
            const confirmBtn = confirmDialog.querySelector('.confirm-btn');
            const cancelBtn = confirmDialog.querySelector('.cancel-btn');

            const cleanup = () => {
                confirmDialog.classList.add('fade-out');
                setTimeout(() => {
                    confirmDialog.remove();
                }, ANIMATION_DURATION.NORMAL);
            };

            confirmBtn.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });

            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });

            // 添加显示动画
            setTimeout(() => {
                confirmDialog.classList.add('show');
            }, 10);
        });
    }

    /**
     * 销毁交互管理器
     */
    destroy() {
        if (this.loadingOverlay) {
            this.loadingOverlay.remove();
        }
        
        if (this.toastContainer) {
            this.toastContainer.remove();
        }

        window.removeEventListener('scroll', this._handleScroll);
        
        this.isInitialized = false;
    }
}

// 创建单例实例
const interactionManager = new InteractionManager();

export default interactionManager;