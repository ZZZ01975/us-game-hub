/**
 * 图片懒加载管理器
 * 负责图片的懒加载、WebP格式支持、占位符处理等功能
 */

class ImageLazyLoader {
    constructor() {
        this.observer = null;
        this.supportsWebP = false;
        this.loadedImages = new Set(); // 记录已加载的图片
        this.failedImages = new Set(); // 记录加载失败的图片
        this.retryCount = new Map(); // 记录重试次数
        this.maxRetries = 3; // 最大重试次数
        
        this.init();
    }

    /**
     * 初始化懒加载器
     */
    async init() {
        // 检测WebP支持
        await this.detectWebPSupport();
        
        // 创建Intersection Observer
        this.createObserver();
        
        console.log('图片懒加载器初始化完成', {
            webpSupported: this.supportsWebP,
            observerSupported: !!this.observer
        });
    }

    /**
     * 检测浏览器是否支持WebP格式
     */
    async detectWebPSupport() {
        return new Promise((resolve) => {
            const webP = new Image();
            webP.onload = webP.onerror = () => {
                this.supportsWebP = (webP.height === 2);
                console.log('WebP支持检测:', this.supportsWebP ? '支持' : '不支持');
                resolve(this.supportsWebP);
            };
            // 使用1x1像素的WebP图片进行测试
            webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        });
    }

    /**
     * 创建Intersection Observer
     */
    createObserver() {
        if (!('IntersectionObserver' in window)) {
            console.warn('浏览器不支持IntersectionObserver，使用降级方案');
            this.fallbackToScrollListener();
            return;
        }

        const options = {
            root: null, // 使用视口作为根
            rootMargin: '50px', // 提前50px开始加载
            threshold: 0.1 // 当10%的图片可见时触发
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, options);
    }

    /**
     * 降级到滚动监听（兼容旧浏览器）
     */
    fallbackToScrollListener() {
        let ticking = false;
        
        const checkImages = () => {
            const images = document.querySelectorAll('img[data-src]:not(.loaded):not(.loading)');
            images.forEach(img => {
                if (this.isInViewport(img)) {
                    this.loadImage(img);
                }
            });
            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(checkImages);
                ticking = true;
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        
        // 初始检查
        checkImages();
    }

    /**
     * 检查元素是否在视口内
     */
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        
        return (
            rect.top <= windowHeight + 50 && // 提前50px
            rect.bottom >= -50 &&
            rect.left <= windowWidth &&
            rect.right >= 0
        );
    }

    /**
     * 观察图片元素
     */
    observe(img) {
        if (!img || this.loadedImages.has(img.src)) {
            return;
        }

        // 添加懒加载类
        img.classList.add('lazy-load');
        
        // 设置占位符
        this.setPlaceholder(img);

        if (this.observer) {
            this.observer.observe(img);
        } else {
            // 降级方案：立即检查是否在视口内
            if (this.isInViewport(img)) {
                this.loadImage(img);
            }
        }
    }

    /**
     * 设置图片占位符
     */
    setPlaceholder(img) {
        if (!img.src || img.src === img.dataset.src) {
            // 创建SVG占位符
            const placeholder = this.createPlaceholderSVG(
                img.dataset.width || 300,
                img.dataset.height || 200
            );
            img.src = placeholder;
        }
    }

    /**
     * 创建SVG占位符
     */
    createPlaceholderSVG(width, height) {
        const svg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#667eea;stop-opacity:0.8" />
                        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:0.8" />
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#grad)" />
                <text x="50%" y="50%" text-anchor="middle" dy=".3em" 
                      fill="white" font-family="Arial, sans-serif" font-size="14" opacity="0.8">
                    🎮 Loading...
                </text>
            </svg>
        `;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    /**
     * 加载图片
     */
    async loadImage(img) {
        if (img.classList.contains('loading') || img.classList.contains('loaded')) {
            return;
        }

        const originalSrc = img.dataset.src;
        if (!originalSrc) {
            console.warn('图片缺少data-src属性:', img);
            return;
        }

        img.classList.add('loading');

        try {
            // 获取优化后的图片URL
            const optimizedSrc = this.getOptimizedImageUrl(originalSrc);
            
            // 预加载图片
            await this.preloadImage(optimizedSrc);
            
            // 设置图片源
            img.src = optimizedSrc;
            img.classList.remove('loading');
            img.classList.add('loaded');
            
            this.loadedImages.add(originalSrc);
            
            // 触发加载完成事件
            img.dispatchEvent(new CustomEvent('imageLoaded', {
                detail: { originalSrc, optimizedSrc }
            }));
            
            console.log('图片加载成功:', optimizedSrc);
            
        } catch (error) {
            console.error('图片加载失败:', originalSrc, error);
            this.handleImageError(img, originalSrc);
        }
    }

    /**
     * 获取优化后的图片URL
     */
    getOptimizedImageUrl(originalSrc) {
        // 如果支持WebP，尝试使用WebP版本
        if (this.supportsWebP && !originalSrc.includes('.webp')) {
            const webpSrc = originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
            return webpSrc;
        }
        
        return originalSrc;
    }

    /**
     * 预加载图片
     */
    preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            const timeout = setTimeout(() => {
                reject(new Error('图片加载超时'));
            }, 10000); // 10秒超时
            
            img.onload = () => {
                clearTimeout(timeout);
                resolve(img);
            };
            
            img.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('图片加载失败'));
            };
            
            img.src = src;
        });
    }

    /**
     * 处理图片加载错误
     */
    async handleImageError(img, originalSrc) {
        const retryCount = this.retryCount.get(originalSrc) || 0;
        
        if (retryCount < this.maxRetries) {
            // 重试加载
            this.retryCount.set(originalSrc, retryCount + 1);
            console.log(`图片加载重试 ${retryCount + 1}/${this.maxRetries}:`, originalSrc);
            
            // 延迟重试
            setTimeout(() => {
                img.classList.remove('loading');
                this.loadImage(img);
            }, 1000 * (retryCount + 1)); // 递增延迟
            
        } else {
            // 使用错误占位符
            this.setErrorPlaceholder(img);
            this.failedImages.add(originalSrc);
            
            img.classList.remove('loading');
            img.classList.add('error');
            
            // 触发错误事件
            img.dispatchEvent(new CustomEvent('imageError', {
                detail: { originalSrc, retryCount }
            }));
        }
    }

    /**
     * 设置错误占位符
     */
    setErrorPlaceholder(img) {
        const width = img.dataset.width || 300;
        const height = img.dataset.height || 200;
        
        const errorSvg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f5f5f5" />
                <text x="50%" y="40%" text-anchor="middle" dy=".3em" 
                      fill="#999" font-family="Arial, sans-serif" font-size="24">
                    🎮
                </text>
                <text x="50%" y="60%" text-anchor="middle" dy=".3em" 
                      fill="#666" font-family="Arial, sans-serif" font-size="12">
                    图片加载失败
                </text>
            </svg>
        `;
        
        img.src = `data:image/svg+xml;base64,${btoa(errorSvg)}`;
        img.alt = '图片加载失败';
    }

    /**
     * 批量观察图片
     */
    observeImages(selector = 'img[data-src]') {
        const images = document.querySelectorAll(selector);
        images.forEach(img => this.observe(img));
        console.log(`开始观察 ${images.length} 张图片`);
    }

    /**
     * 立即加载所有图片（用于调试）
     */
    loadAllImages() {
        const images = document.querySelectorAll('img[data-src]:not(.loaded)');
        images.forEach(img => this.loadImage(img));
    }

    /**
     * 获取加载统计信息
     */
    getStats() {
        const totalImages = document.querySelectorAll('img[data-src]').length;
        const loadedCount = this.loadedImages.size;
        const failedCount = this.failedImages.size;
        const loadingCount = document.querySelectorAll('img.loading').length;
        
        return {
            total: totalImages,
            loaded: loadedCount,
            failed: failedCount,
            loading: loadingCount,
            pending: totalImages - loadedCount - failedCount - loadingCount,
            successRate: totalImages > 0 ? (loadedCount / totalImages * 100).toFixed(1) + '%' : '0%'
        };
    }

    /**
     * 重置加载器状态
     */
    reset() {
        this.loadedImages.clear();
        this.failedImages.clear();
        this.retryCount.clear();
        
        // 重置所有图片状态
        const images = document.querySelectorAll('img.lazy-load');
        images.forEach(img => {
            img.classList.remove('loaded', 'loading', 'error');
            if (this.observer) {
                this.observer.unobserve(img);
            }
        });
        
        console.log('图片懒加载器已重置');
    }

    /**
     * 销毁加载器
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        this.reset();
        console.log('图片懒加载器已销毁');
    }
}

// 创建单例实例
const imageLazyLoader = new ImageLazyLoader();

export default imageLazyLoader;