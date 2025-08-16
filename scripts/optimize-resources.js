/**
 * 资源优化脚本
 * 用于压缩CSS、JavaScript文件，优化图片等
 * 注意：这是一个示例脚本，实际使用时需要Node.js环境
 */

// 这个脚本展示了如何优化资源，但在浏览器环境中无法直接运行
// 实际项目中应该使用构建工具如Webpack、Vite、Gulp等

const OPTIMIZATION_CONFIG = {
    // CSS优化配置
    css: {
        minify: true,
        removeComments: true,
        removeUnusedRules: false, // 需要更复杂的分析
        autoprefixer: true
    },
    
    // JavaScript优化配置
    js: {
        minify: true,
        removeComments: true,
        removeConsoleLog: false, // 开发阶段保留
        treeshaking: true
    },
    
    // 图片优化配置
    images: {
        formats: ['webp', 'avif'],
        quality: 80,
        progressive: true,
        sizes: [200, 300, 400, 600, 800]
    }
};

/**
 * CSS优化函数（示例）
 */
function optimizeCSS(cssContent) {
    // 移除注释
    let optimized = cssContent.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // 移除多余的空白
    optimized = optimized.replace(/\s+/g, ' ');
    
    // 移除不必要的分号
    optimized = optimized.replace(/;\s*}/g, '}');
    
    // 压缩颜色值
    optimized = optimized.replace(/#([a-f0-9])\1([a-f0-9])\2([a-f0-9])\3/gi, '#$1$2$3');
    
    return optimized.trim();
}

/**
 * JavaScript优化函数（示例）
 */
function optimizeJS(jsContent) {
    // 移除单行注释
    let optimized = jsContent.replace(/\/\/.*$/gm, '');
    
    // 移除多行注释
    optimized = optimized.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // 移除多余的空白（保留必要的空格）
    optimized = optimized.replace(/\s+/g, ' ');
    
    // 移除行末分号前的空格
    optimized = optimized.replace(/\s*;\s*/g, ';');
    
    return optimized.trim();
}

/**
 * 生成资源清单
 */
function generateResourceManifest() {
    const manifest = {
        version: Date.now(),
        resources: {
            css: [
                'css/main.css',
                'css/game.css'
            ],
            js: [
                'js/main.js',
                'js/game.js'
            ],
            images: [
                'assets/images/placeholder-game.svg'
            ]
        },
        optimization: {
            timestamp: new Date().toISOString(),
            config: OPTIMIZATION_CONFIG
        }
    };
    
    return JSON.stringify(manifest, null, 2);
}

/**
 * 创建Service Worker缓存策略
 */
function generateServiceWorkerCache() {
    const swContent = `
// Service Worker for US Game Hub
// 自动生成的缓存策略

const CACHE_NAME = 'us-game-hub-v${Date.now()}';
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',
    '/game.html',
    '/css/main.css',
    '/css/game.css',
    '/js/main.js',
    '/js/game.js',
    '/data/games.json',
    '/assets/images/placeholder-game.svg'
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_CACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => caches.delete(cacheName))
            );
        }).then(() => self.clients.claim())
    );
});

// 拦截请求 - 缓存优先策略
self.addEventListener('fetch', event => {
    // 只处理GET请求
    if (event.request.method !== 'GET') return;
    
    // 对于HTML文件使用网络优先策略
    if (event.request.destination === 'document') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, responseClone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }
    
    // 对于其他资源使用缓存优先策略
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                
                return fetch(event.request)
                    .then(response => {
                        // 只缓存成功的响应
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(event.request, responseClone));
                        
                        return response;
                    });
            })
    );
});
`;
    
    return swContent;
}

/**
 * 生成预加载提示
 */
function generatePreloadHints() {
    const hints = [
        '<link rel="preload" href="css/main.css" as="style">',
        '<link rel="preload" href="js/main.js" as="script">',
        '<link rel="preload" href="data/games.json" as="fetch" crossorigin>',
        '<link rel="dns-prefetch" href="//fonts.googleapis.com">',
        '<link rel="preconnect" href="//fonts.gstatic.com" crossorigin>'
    ];
    
    return hints.join('\n    ');
}

/**
 * 生成关键CSS内联代码
 */
function generateCriticalCSS() {
    // 这里应该包含首屏渲染必需的CSS
    const criticalCSS = `
/* 关键CSS - 首屏渲染必需 */
body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #ffffff;
}

.header {
    position: sticky;
    top: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(10px);
}

.loading-spinner {
    display: inline-block;
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
`;
    
    return criticalCSS.trim();
}

// 导出优化函数（在Node.js环境中使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        optimizeCSS,
        optimizeJS,
        generateResourceManifest,
        generateServiceWorkerCache,
        generatePreloadHints,
        generateCriticalCSS,
        OPTIMIZATION_CONFIG
    };
}

// 在浏览器环境中，这些函数可以用于运行时优化
console.log('资源优化工具已加载');
console.log('建议的优化配置:', OPTIMIZATION_CONFIG);