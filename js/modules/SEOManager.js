/**
 * SEO管理器模块
 * 负责搜索引擎优化、meta标签管理、结构化数据等
 */

class SEOManager {
    constructor() {
        this.defaultMeta = {
            title: 'US Game Hub - Free Online Games',
            description: 'Play free online games at US Game Hub. Enjoy action, puzzle, arcade and casual games directly in your browser.',
            keywords: 'free games, online games, browser games, action games, puzzle games, arcade games, casual games',
            author: 'US Game Hub',
            robots: 'index, follow',
            language: 'en'
        };
        
        this.currentLanguage = 'en';
        this.baseUrl = window.location.origin;
        this.isInitialized = false;
    }

    /**
     * 初始化SEO管理器
     */
    init() {
        if (this.isInitialized) return;

        console.log('初始化SEO管理器...');

        // 设置基础meta标签
        this.setupBasicMeta();

        // 设置Open Graph标签
        this.setupOpenGraph();

        // 设置Twitter Card标签
        this.setupTwitterCard();

        // 设置结构化数据
        this.setupStructuredData();

        // 设置语言和地区标签
        this.setupLanguageAndRegion();

        // 设置移动端优化标签
        this.setupMobileOptimization();

        this.isInitialized = true;
        console.log('SEO管理器初始化完成');
    }

    /**
     * 设置当前语言
     * @param {string} language - 语言代码
     */
    setCurrentLanguage(language) {
        this.currentLanguage = language;
        this.updateLanguageMeta();
    }

    /**
     * 设置基础meta标签
     */
    setupBasicMeta() {
        // 设置viewport（如果不存在）
        this.setMetaTag('viewport', 'width=device-width, initial-scale=1.0');

        // 设置字符编码（如果不存在）
        this.setMetaTag('charset', 'UTF-8');

        // 设置robots
        this.setMetaTag('robots', this.defaultMeta.robots);

        // 设置author
        this.setMetaTag('author', this.defaultMeta.author);

        // 设置generator
        this.setMetaTag('generator', 'US Game Hub v1.0');

        // 设置theme-color
        this.setMetaTag('theme-color', '#667eea');

        // 设置color-scheme
        this.setMetaTag('color-scheme', 'dark light');
    }

    /**
     * 设置Open Graph标签
     */
    setupOpenGraph() {
        const ogData = {
            'og:type': 'website',
            'og:site_name': 'US Game Hub',
            'og:title': this.defaultMeta.title,
            'og:description': this.defaultMeta.description,
            'og:url': this.baseUrl,
            'og:image': `${this.baseUrl}/assets/images/og-image.jpg`,
            'og:image:width': '1200',
            'og:image:height': '630',
            'og:image:alt': 'US Game Hub - Free Online Games',
            'og:locale': 'en_US'
        };

        Object.entries(ogData).forEach(([property, content]) => {
            this.setMetaTag(property, content, 'property');
        });
    }

    /**
     * 设置Twitter Card标签
     */
    setupTwitterCard() {
        const twitterData = {
            'twitter:card': 'summary_large_image',
            'twitter:site': '@USGameHub',
            'twitter:creator': '@USGameHub',
            'twitter:title': this.defaultMeta.title,
            'twitter:description': this.defaultMeta.description,
            'twitter:image': `${this.baseUrl}/assets/images/twitter-card.jpg`,
            'twitter:image:alt': 'US Game Hub - Free Online Games'
        };

        Object.entries(twitterData).forEach(([name, content]) => {
            this.setMetaTag(name, content);
        });
    }

    /**
     * 设置结构化数据
     */
    setupStructuredData() {
        // 网站结构化数据
        const websiteSchema = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "US Game Hub",
            "description": this.defaultMeta.description,
            "url": this.baseUrl,
            "potentialAction": {
                "@type": "SearchAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": `${this.baseUrl}/?search={search_term_string}`
                },
                "query-input": "required name=search_term_string"
            },
            "publisher": {
                "@type": "Organization",
                "name": "US Game Hub",
                "url": this.baseUrl,
                "logo": {
                    "@type": "ImageObject",
                    "url": `${this.baseUrl}/assets/images/logo.png`,
                    "width": 200,
                    "height": 60
                }
            }
        };

        // 游戏平台结构化数据
        const gamePlatformSchema = {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "US Game Hub",
            "description": this.defaultMeta.description,
            "url": this.baseUrl,
            "applicationCategory": "GameApplication",
            "operatingSystem": "Web Browser",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.5",
                "ratingCount": "1000",
                "bestRating": "5",
                "worstRating": "1"
            }
        };

        // 面包屑导航结构化数据
        const breadcrumbSchema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": this.baseUrl
                }
            ]
        };

        // 添加结构化数据到页面
        this.addStructuredData('website-schema', websiteSchema);
        this.addStructuredData('game-platform-schema', gamePlatformSchema);
        this.addStructuredData('breadcrumb-schema', breadcrumbSchema);
    }

    /**
     * 设置语言和地区标签
     */
    setupLanguageAndRegion() {
        // 设置语言
        document.documentElement.lang = this.currentLanguage;

        // 设置hreflang标签
        const languages = ['en', 'zh', 'es', 'fr'];
        languages.forEach(lang => {
            const link = document.createElement('link');
            link.rel = 'alternate';
            link.hreflang = lang;
            link.href = `${this.baseUrl}?lang=${lang}`;
            document.head.appendChild(link);
        });

        // 设置默认语言
        const defaultLink = document.createElement('link');
        defaultLink.rel = 'alternate';
        defaultLink.hreflang = 'x-default';
        defaultLink.href = this.baseUrl;
        document.head.appendChild(defaultLink);
    }

    /**
     * 设置移动端优化标签
     */
    setupMobileOptimization() {
        // 设置移动端优化
        this.setMetaTag('mobile-web-app-capable', 'yes');
        this.setMetaTag('apple-mobile-web-app-capable', 'yes');
        this.setMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
        this.setMetaTag('apple-mobile-web-app-title', 'US Game Hub');

        // 设置图标
        const iconSizes = [57, 72, 76, 114, 120, 144, 152, 180];
        iconSizes.forEach(size => {
            const link = document.createElement('link');
            link.rel = 'apple-touch-icon';
            link.sizes = `${size}x${size}`;
            link.href = `/assets/icons/apple-touch-icon-${size}x${size}.png`;
            document.head.appendChild(link);
        });

        // 设置favicon
        const faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        faviconLink.type = 'image/x-icon';
        faviconLink.href = '/favicon.ico';
        document.head.appendChild(faviconLink);
    }

    /**
     * 更新页面标题和描述
     * @param {string} title - 页面标题
     * @param {string} description - 页面描述
     * @param {string} keywords - 关键词
     */
    updatePageMeta(title, description, keywords = null) {
        // 更新标题
        document.title = title;
        this.setMetaTag('title', title);

        // 更新描述
        this.setMetaTag('description', description);

        // 更新关键词
        if (keywords) {
            this.setMetaTag('keywords', keywords);
        }

        // 更新Open Graph
        this.setMetaTag('og:title', title, 'property');
        this.setMetaTag('og:description', description, 'property');
        this.setMetaTag('og:url', window.location.href, 'property');

        // 更新Twitter Card
        this.setMetaTag('twitter:title', title);
        this.setMetaTag('twitter:description', description);

        console.log('页面meta信息已更新:', { title, description });
    }

    /**
     * 为游戏页面设置SEO
     * @param {Object} game - 游戏对象
     */
    setupGamePageSEO(game) {
        if (!game) return;

        const title = `${game.title} - Free Online Game | US Game Hub`;
        const description = `Play ${game.title} for free online. ${game.description} Enjoy this ${game.categoryName} game directly in your browser.`;
        const keywords = `${game.title}, ${game.categoryName} games, free online games, browser games`;

        this.updatePageMeta(title, description, keywords);

        // 添加游戏特定的结构化数据
        const gameSchema = {
            "@context": "https://schema.org",
            "@type": "VideoGame",
            "name": game.title,
            "description": game.description,
            "genre": game.categoryName,
            "url": `${this.baseUrl}/game.html?id=${game.id}`,
            "image": game.image,
            "publisher": {
                "@type": "Organization",
                "name": "US Game Hub"
            },
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": game.rating || "4.0",
                "ratingCount": game.playCount || "100",
                "bestRating": "5",
                "worstRating": "1"
            }
        };

        this.addStructuredData('game-schema', gameSchema);

        // 更新面包屑导航
        this.updateBreadcrumb([
            { name: 'Home', url: this.baseUrl },
            { name: game.categoryName, url: `${this.baseUrl}?category=${game.category}` },
            { name: game.title, url: `${this.baseUrl}/game.html?id=${game.id}` }
        ]);
    }

    /**
     * 为分类页面设置SEO
     * @param {string} category - 分类名称
     * @param {string} categoryDisplayName - 分类显示名称
     * @param {number} gameCount - 游戏数量
     */
    setupCategoryPageSEO(category, categoryDisplayName, gameCount) {
        const title = `${categoryDisplayName} Games - Free Online ${categoryDisplayName} Games | US Game Hub`;
        const description = `Play ${gameCount}+ free ${categoryDisplayName.toLowerCase()} games online. Enjoy the best ${categoryDisplayName.toLowerCase()} games directly in your browser at US Game Hub.`;
        const keywords = `${categoryDisplayName.toLowerCase()} games, free ${categoryDisplayName.toLowerCase()} games, online ${categoryDisplayName.toLowerCase()} games, browser games`;

        this.updatePageMeta(title, description, keywords);

        // 添加分类页面结构化数据
        const categorySchema = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": `${categoryDisplayName} Games`,
            "description": description,
            "url": `${this.baseUrl}?category=${category}`,
            "mainEntity": {
                "@type": "ItemList",
                "name": `${categoryDisplayName} Games`,
                "numberOfItems": gameCount
            }
        };

        this.addStructuredData('category-schema', categorySchema);

        // 更新面包屑导航
        this.updateBreadcrumb([
            { name: 'Home', url: this.baseUrl },
            { name: categoryDisplayName, url: `${this.baseUrl}?category=${category}` }
        ]);
    }

    /**
     * 更新面包屑导航结构化数据
     * @param {Array} breadcrumbs - 面包屑数组
     */
    updateBreadcrumb(breadcrumbs) {
        const breadcrumbSchema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": breadcrumbs.map((item, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": item.name,
                "item": item.url
            }))
        };

        this.addStructuredData('breadcrumb-schema', breadcrumbSchema);
    }

    /**
     * 设置meta标签
     * @param {string} name - 标签名称
     * @param {string} content - 标签内容
     * @param {string} attribute - 属性名称（name或property）
     */
    setMetaTag(name, content, attribute = 'name') {
        let meta = document.querySelector(`meta[${attribute}="${name}"]`);
        
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute(attribute, name);
            document.head.appendChild(meta);
        }
        
        meta.setAttribute('content', content);
    }

    /**
     * 添加结构化数据
     * @param {string} id - 脚本ID
     * @param {Object} data - 结构化数据对象
     */
    addStructuredData(id, data) {
        // 移除现有的结构化数据
        const existingScript = document.getElementById(id);
        if (existingScript) {
            existingScript.remove();
        }

        // 添加新的结构化数据
        const script = document.createElement('script');
        script.id = id;
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(data, null, 2);
        document.head.appendChild(script);
    }

    /**
     * 更新语言相关的meta标签
     */
    updateLanguageMeta() {
        document.documentElement.lang = this.currentLanguage;
        
        // 更新Open Graph locale
        const localeMap = {
            'en': 'en_US',
            'zh': 'zh_CN',
            'es': 'es_ES',
            'fr': 'fr_FR'
        };
        
        this.setMetaTag('og:locale', localeMap[this.currentLanguage] || 'en_US', 'property');
    }

    /**
     * 生成sitemap.xml内容
     * @param {Array} games - 游戏数组
     * @returns {string} sitemap XML内容
     */
    generateSitemap(games) {
        const urls = [
            {
                loc: this.baseUrl,
                changefreq: 'daily',
                priority: '1.0',
                lastmod: new Date().toISOString().split('T')[0]
            }
        ];

        // 添加分类页面
        const categories = ['action', 'puzzle', 'arcade', 'casual', 'sports', 'racing'];
        categories.forEach(category => {
            urls.push({
                loc: `${this.baseUrl}?category=${category}`,
                changefreq: 'weekly',
                priority: '0.8',
                lastmod: new Date().toISOString().split('T')[0]
            });
        });

        // 添加游戏页面
        games.forEach(game => {
            urls.push({
                loc: `${this.baseUrl}/game.html?id=${game.id}`,
                changefreq: 'monthly',
                priority: '0.6',
                lastmod: game.addedDate ? new Date(game.addedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            });
        });

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `    <url>
        <loc>${url.loc}</loc>
        <lastmod>${url.lastmod}</lastmod>
        <changefreq>${url.changefreq}</changefreq>
        <priority>${url.priority}</priority>
    </url>`).join('\n')}
</urlset>`;

        return sitemap;
    }

    /**
     * 生成robots.txt内容
     * @returns {string} robots.txt内容
     */
    generateRobotsTxt() {
        return `User-agent: *
Allow: /

# Sitemap
Sitemap: ${this.baseUrl}/sitemap.xml

# Crawl-delay for polite crawling
Crawl-delay: 1

# Disallow admin areas (if any)
Disallow: /admin/
Disallow: /private/

# Allow all game pages
Allow: /game.html
Allow: /games/

# Allow all assets
Allow: /css/
Allow: /js/
Allow: /assets/
Allow: /images/`;
    }

    /**
     * 获取页面性能指标用于SEO
     * @returns {Object} 性能指标
     */
    getPerformanceMetrics() {
        if (!('performance' in window)) {
            return null;
        }

        const navigation = performance.getEntriesByType('navigation')[0];
        if (!navigation) {
            return null;
        }

        return {
            // 首次内容绘制
            firstContentfulPaint: this.getMetricValue('first-contentful-paint'),
            // 最大内容绘制
            largestContentfulPaint: this.getMetricValue('largest-contentful-paint'),
            // 首次输入延迟
            firstInputDelay: this.getMetricValue('first-input'),
            // 累积布局偏移
            cumulativeLayoutShift: this.getMetricValue('layout-shift'),
            // 页面加载时间
            loadTime: navigation.loadEventEnd - navigation.loadEventStart,
            // DOM内容加载时间
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
        };
    }

    /**
     * 获取性能指标值
     * @param {string} metricName - 指标名称
     * @returns {number|null} 指标值
     */
    getMetricValue(metricName) {
        const entries = performance.getEntriesByName(metricName);
        return entries.length > 0 ? entries[0].value : null;
    }

    /**
     * 清理SEO资源
     */
    cleanup() {
        // 移除动态添加的meta标签
        const dynamicMetas = document.querySelectorAll('meta[data-dynamic="true"]');
        dynamicMetas.forEach(meta => meta.remove());

        // 移除结构化数据
        const structuredDataScripts = document.querySelectorAll('script[type="application/ld+json"]');
        structuredDataScripts.forEach(script => script.remove());

        console.log('SEO管理器资源已清理');
    }
}

// 创建单例实例
const seoManager = new SEOManager();

export default seoManager;