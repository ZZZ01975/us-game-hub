/**
 * 图片优化工具
 * 提供图片压缩、格式转换、尺寸优化等功能
 */

class ImageOptimizer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.supportedFormats = ['webp', 'jpeg', 'png'];
        this.defaultQuality = 0.8;
        this.maxWidth = 800;
        this.maxHeight = 600;
    }

    /**
     * 初始化Canvas
     */
    initCanvas() {
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
        }
    }

    /**
     * 压缩图片
     * @param {File|Blob} file - 原始图片文件
     * @param {Object} options - 压缩选项
     * @returns {Promise<Blob>} 压缩后的图片
     */
    async compressImage(file, options = {}) {
        const {
            quality = this.defaultQuality,
            maxWidth = this.maxWidth,
            maxHeight = this.maxHeight,
            format = 'webp'
        } = options;

        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                try {
                    this.initCanvas();
                    
                    // 计算新尺寸
                    const { width, height } = this.calculateNewSize(
                        img.width, 
                        img.height, 
                        maxWidth, 
                        maxHeight
                    );
                    
                    // 设置Canvas尺寸
                    this.canvas.width = width;
                    this.canvas.height = height;
                    
                    // 清除Canvas
                    this.ctx.clearRect(0, 0, width, height);
                    
                    // 绘制图片
                    this.ctx.drawImage(img, 0, 0, width, height);
                    
                    // 转换为Blob
                    this.canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                reject(new Error('图片压缩失败'));
                            }
                        },
                        `image/${format}`,
                        quality
                    );
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => reject(new Error('图片加载失败'));
            
            // 加载图片
            if (file instanceof File || file instanceof Blob) {
                img.src = URL.createObjectURL(file);
            } else {
                img.src = file;
            }
        });
    }

    /**
     * 计算新的图片尺寸（保持宽高比）
     */
    calculateNewSize(originalWidth, originalHeight, maxWidth, maxHeight) {
        let { width, height } = { width: originalWidth, height: originalHeight };
        
        // 如果图片尺寸超过最大限制，按比例缩放
        if (width > maxWidth || height > maxHeight) {
            const widthRatio = maxWidth / width;
            const heightRatio = maxHeight / height;
            const ratio = Math.min(widthRatio, heightRatio);
            
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }
        
        return { width, height };
    }

    /**
     * 生成响应式图片URL
     * @param {string} originalUrl - 原始图片URL
     * @param {number} width - 目标宽度
     * @returns {string} 优化后的图片URL
     */
    getResponsiveImageUrl(originalUrl, width) {
        if (!originalUrl) return '';
        
        // 如果是本地图片，返回原URL
        if (originalUrl.startsWith('data:') || originalUrl.startsWith('blob:')) {
            return originalUrl;
        }
        
        // 根据宽度选择合适的图片尺寸
        let targetWidth;
        if (width <= 200) {
            targetWidth = 200;
        } else if (width <= 400) {
            targetWidth = 400;
        } else if (width <= 600) {
            targetWidth = 600;
        } else {
            targetWidth = 800;
        }
        
        // 如果URL已经包含尺寸参数，替换它
        if (originalUrl.includes('w=') || originalUrl.includes('width=')) {
            return originalUrl.replace(/[?&](w|width)=\d+/, `$1=${targetWidth}`);
        }
        
        // 添加尺寸参数
        const separator = originalUrl.includes('?') ? '&' : '?';
        return `${originalUrl}${separator}w=${targetWidth}`;
    }

    /**
     * 创建图片的多种尺寸版本
     * @param {string} originalUrl - 原始图片URL
     * @returns {Object} 包含不同尺寸的图片URL对象
     */
    createImageSrcSet(originalUrl) {
        if (!originalUrl) return {};
        
        const sizes = [200, 400, 600, 800];
        const srcSet = {};
        
        sizes.forEach(size => {
            srcSet[`${size}w`] = this.getResponsiveImageUrl(originalUrl, size);
        });
        
        return {
            src: this.getResponsiveImageUrl(originalUrl, 400), // 默认尺寸
            srcSet: Object.entries(srcSet)
                .map(([key, url]) => `${url} ${key}`)
                .join(', '),
            sizes: '(max-width: 480px) 200px, (max-width: 768px) 400px, (max-width: 1200px) 600px, 800px'
        };
    }

    /**
     * 预加载关键图片
     * @param {Array<string>} imageUrls - 图片URL数组
     * @returns {Promise<Array>} 预加载结果
     */
    async preloadCriticalImages(imageUrls) {
        const preloadPromises = imageUrls.map(url => this.preloadImage(url));
        
        try {
            const results = await Promise.allSettled(preloadPromises);
            const successful = results.filter(result => result.status === 'fulfilled').length;
            const failed = results.length - successful;
            
            console.log(`关键图片预加载完成: ${successful}成功, ${failed}失败`);
            return results;
        } catch (error) {
            console.error('关键图片预加载失败:', error);
            throw error;
        }
    }

    /**
     * 预加载单张图片
     * @param {string} url - 图片URL
     * @returns {Promise<HTMLImageElement>} 预加载的图片元素
     */
    preloadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            const timeout = setTimeout(() => {
                reject(new Error(`图片预加载超时: ${url}`));
            }, 5000);
            
            img.onload = () => {
                clearTimeout(timeout);
                resolve(img);
            };
            
            img.onerror = () => {
                clearTimeout(timeout);
                reject(new Error(`图片预加载失败: ${url}`));
            };
            
            img.src = url;
        });
    }

    /**
     * 检测图片格式支持
     * @returns {Promise<Object>} 支持的格式对象
     */
    async detectFormatSupport() {
        const formats = {
            webp: false,
            avif: false,
            jpeg: true,
            png: true
        };

        // 检测WebP支持
        try {
            const webpImg = new Image();
            await new Promise((resolve, reject) => {
                webpImg.onload = () => {
                    formats.webp = (webpImg.width === 1 && webpImg.height === 1);
                    resolve();
                };
                webpImg.onerror = reject;
                webpImg.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
            });
        } catch (error) {
            console.warn('WebP支持检测失败:', error);
        }

        // 检测AVIF支持
        try {
            const avifImg = new Image();
            await new Promise((resolve, reject) => {
                avifImg.onload = () => {
                    formats.avif = (avifImg.width === 1 && avifImg.height === 1);
                    resolve();
                };
                avifImg.onerror = reject;
                avifImg.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
            });
        } catch (error) {
            console.warn('AVIF支持检测失败:', error);
        }

        console.log('图片格式支持检测结果:', formats);
        return formats;
    }

    /**
     * 获取最佳图片格式
     * @param {Object} supportedFormats - 支持的格式
     * @returns {string} 最佳格式
     */
    getBestFormat(supportedFormats) {
        if (supportedFormats.avif) return 'avif';
        if (supportedFormats.webp) return 'webp';
        return 'jpeg';
    }

    /**
     * 生成图片的多格式版本
     * @param {string} originalUrl - 原始图片URL
     * @param {Object} supportedFormats - 支持的格式
     * @returns {Array} 图片源数组
     */
    generateImageSources(originalUrl, supportedFormats) {
        if (!originalUrl) return [];
        
        const sources = [];
        const baseUrl = originalUrl.replace(/\.(jpg|jpeg|png|webp|avif)$/i, '');
        
        // 按优先级添加格式
        if (supportedFormats.avif) {
            sources.push({
                srcset: `${baseUrl}.avif`,
                type: 'image/avif'
            });
        }
        
        if (supportedFormats.webp) {
            sources.push({
                srcset: `${baseUrl}.webp`,
                type: 'image/webp'
            });
        }
        
        // 添加原始格式作为后备
        sources.push({
            srcset: originalUrl,
            type: this.getImageMimeType(originalUrl)
        });
        
        return sources;
    }

    /**
     * 获取图片MIME类型
     * @param {string} url - 图片URL
     * @returns {string} MIME类型
     */
    getImageMimeType(url) {
        const extension = url.split('.').pop().toLowerCase();
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'webp': 'image/webp',
            'avif': 'image/avif',
            'gif': 'image/gif',
            'svg': 'image/svg+xml'
        };
        
        return mimeTypes[extension] || 'image/jpeg';
    }

    /**
     * 清理Canvas资源
     */
    cleanup() {
        if (this.canvas) {
            this.canvas.width = 0;
            this.canvas.height = 0;
            this.canvas = null;
            this.ctx = null;
        }
    }
}

// 创建单例实例
const imageOptimizer = new ImageOptimizer();

export default imageOptimizer;