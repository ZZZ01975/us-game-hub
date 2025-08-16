/**
 * Service Worker for US Game Hub
 * 实现缓存策略和离线支持
 */

const CACHE_NAME = 'us-game-hub-v1.0.0';
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',
    '/game.html',
    '/css/main.css',
    '/css/game.css',
    '/js/main.js',
    '/js/game.js',
    '/data/games.json',
    '/assets/images/placeholder-game.svg',
    '/languages/en.json',
    '/languages/zh.json',
    '/languages/es.json',
    '/languages/fr.json'
];

// 动态缓存的资源类型
const DYNAMIC_CACHE_TYPES = [
    'image',
    'font',
    'style',
    'script'
];

// 缓存策略配置
const CACHE_STRATEGIES = {
    // HTML文件：网络优先，缓存备用
    document: 'networkFirst',
    // CSS/JS文件：缓存优先，网络备用
    style: 'cacheFirst',
    script: 'cacheFirst',
    // 图片：缓存优先，网络备用
    image: 'cacheFirst',
    // 数据文件：网络优先，缓存备用
    fetch: 'networkFirst'
};

/**
 * 安装事件 - 缓存静态资源
 */
self.addEventListener('install', event => {
    console.log('Service Worker 安装中...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('缓存静态资源...');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => {
                console.log('静态资源缓存完成');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('静态资源缓存失败:', error);
            })
    );
});

/**
 * 激活事件 - 清理旧缓存
 */
self.addEventListener('activate', event => {
    console.log('Service Worker 激活中...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => {
                            return cacheName.startsWith('us-game-hub-') && 
                                   cacheName !== CACHE_NAME;
                        })
                        .map(cacheName => {
                            console.log('删除旧缓存:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('旧缓存清理完成');
                return self.clients.claim();
            })
            .catch(error => {
                console.error('缓存清理失败:', error);
            })
    );
});

/**
 * 拦截请求 - 实现缓存策略
 */
self.addEventListener('fetch', event => {
    // 只处理GET请求
    if (event.request.method !== 'GET') {
        return;
    }
    
    // 跳过chrome-extension和其他协议
    if (!event.request.url.startsWith('http')) {
        return;
    }
    
    const url = new URL(event.request.url);
    const destination = event.request.destination;
    
    // 根据资源类型选择缓存策略
    const strategy = CACHE_STRATEGIES[destination] || 'networkFirst';
    
    event.respondWith(
        handleRequest(event.request, strategy)
    );
});

/**
 * 处理请求的核心函数
 * @param {Request} request - 请求对象
 * @param {string} strategy - 缓存策略
 * @returns {Promise<Response>} 响应对象
 */
async function handleRequest(request, strategy) {
    try {
        switch (strategy) {
            case 'cacheFirst':
                return await cacheFirstStrategy(request);
            case 'networkFirst':
                return await networkFirstStrategy(request);
            case 'staleWhileRevalidate':
                return await staleWhileRevalidateStrategy(request);
            default:
                return await networkFirstStrategy(request);
        }
    } catch (error) {
        console.error('请求处理失败:', error);
        return await handleRequestError(request);
    }
}

/**
 * 缓存优先策略
 * @param {Request} request - 请求对象
 * @returns {Promise<Response>} 响应对象
 */
async function cacheFirstStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.warn('网络请求失败:', request.url);
        throw error;
    }
}

/**
 * 网络优先策略
 * @param {Request} request - 请求对象
 * @returns {Promise<Response>} 响应对象
 */
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.warn('网络请求失败，尝试缓存:', request.url);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

/**
 * 过期重新验证策略
 * @param {Request} request - 请求对象
 * @returns {Promise<Response>} 响应对象
 */
async function staleWhileRevalidateStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    // 异步更新缓存
    const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then(c => c.put(request, networkResponse.clone()));
        }
        return networkResponse;
    }).catch(error => {
        console.warn('后台更新失败:', request.url);
    });
    
    // 如果有缓存，立即返回缓存
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // 如果没有缓存，等待网络响应
    return await fetchPromise;
}

/**
 * 处理请求错误
 * @param {Request} request - 请求对象
 * @returns {Promise<Response>} 错误响应
 */
async function handleRequestError(request) {
    // 如果是HTML请求，返回离线页面
    if (request.destination === 'document') {
        const offlineResponse = await caches.match('/index.html');
        if (offlineResponse) {
            return offlineResponse;
        }
    }
    
    // 如果是图片请求，返回占位符
    if (request.destination === 'image') {
        const placeholderResponse = await caches.match('/assets/images/placeholder-game.svg');
        if (placeholderResponse) {
            return placeholderResponse;
        }
    }
    
    // 返回通用错误响应
    return new Response('资源不可用', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
            'Content-Type': 'text/plain; charset=utf-8'
        }
    });
}

/**
 * 消息事件处理
 */
self.addEventListener('message', event => {
    const { type, payload } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_CACHE_INFO':
            getCacheInfo().then(info => {
                event.ports[0].postMessage(info);
            });
            break;
            
        case 'CLEAR_CACHE':
            clearCache().then(success => {
                event.ports[0].postMessage({ success });
            });
            break;
            
        default:
            console.warn('未知消息类型:', type);
    }
});

/**
 * 获取缓存信息
 * @returns {Promise<Object>} 缓存信息
 */
async function getCacheInfo() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        
        return {
            cacheName: CACHE_NAME,
            cacheSize: keys.length,
            cachedUrls: keys.map(request => request.url)
        };
    } catch (error) {
        console.error('获取缓存信息失败:', error);
        return { error: error.message };
    }
}

/**
 * 清理缓存
 * @returns {Promise<boolean>} 是否成功
 */
async function clearCache() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );
        return true;
    } catch (error) {
        console.error('清理缓存失败:', error);
        return false;
    }
}

console.log('Service Worker 已加载');