/**
 * 常量定义文件
 * 定义项目中使用的常量
 */

// API端点和数据文件路径
export const API_ENDPOINTS = {
    GAMES: 'data/games.json',
    LANGUAGES: 'languages/'
};

// 游戏分类定义
export const GAME_CATEGORIES = {
    ALL: 'all',
    ACTION: 'action',
    PUZZLE: 'puzzle',
    ARCADE: 'arcade',
    CASUAL: 'casual'
};

// 游戏分类中文名称映射
export const CATEGORY_NAMES = {
    [GAME_CATEGORIES.ALL]: '全部游戏',
    [GAME_CATEGORIES.ACTION]: '动作游戏',
    [GAME_CATEGORIES.PUZZLE]: '益智游戏',
    [GAME_CATEGORIES.ARCADE]: '街机游戏',
    [GAME_CATEGORIES.CASUAL]: '休闲游戏'
};

// 支持的语言列表
export const SUPPORTED_LANGUAGES = {
    EN: 'en',
    ZH: 'zh',
    ES: 'es',
    FR: 'fr'
};

// 语言显示名称
export const LANGUAGE_NAMES = {
    [SUPPORTED_LANGUAGES.EN]: 'English',
    [SUPPORTED_LANGUAGES.ZH]: '中文',
    [SUPPORTED_LANGUAGES.ES]: 'Español',
    [SUPPORTED_LANGUAGES.FR]: 'Français'
};

// 默认设置
export const DEFAULT_SETTINGS = {
    LANGUAGE: SUPPORTED_LANGUAGES.ZH,
    CATEGORY: GAME_CATEGORIES.ALL,
    GAMES_PER_PAGE: 12,
    SEARCH_DEBOUNCE_DELAY: 300
};

// 本地存储键名
export const STORAGE_KEYS = {
    LANGUAGE: 'us_game_hub_language',
    GAME_HISTORY: 'us_game_hub_game_history',
    FAVORITES: 'us_game_hub_favorites',
    USER_PREFERENCES: 'us_game_hub_preferences'
};

// 游戏标签类型
export const GAME_TAGS = {
    NEW: 'new',
    HOT: 'hot',
    FEATURED: 'featured'
};

// 游戏标签显示名称
export const TAG_NAMES = {
    [GAME_TAGS.NEW]: '新游戏',
    [GAME_TAGS.HOT]: '热门',
    [GAME_TAGS.FEATURED]: '精选'
};

// 错误消息
export const ERROR_MESSAGES = {
    NETWORK_ERROR: '网络连接失败，请检查网络设置',
    GAME_LOAD_ERROR: '游戏加载失败，请稍后重试',
    DATA_LOAD_ERROR: '数据加载失败，请刷新页面',
    GAME_NOT_FOUND: '游戏不存在或已下线',
    BROWSER_NOT_SUPPORTED: '您的浏览器不支持此功能',
    TIMEOUT_ERROR: '请求超时，请检查网络连接',
    SERVER_ERROR: '服务器暂时无法响应，请稍后重试',
    NOT_FOUND_ERROR: '请求的资源不存在',
    OFFLINE_ERROR: '当前处于离线状态，请检查网络连接',
    GAME_IFRAME_ERROR: '游戏加载失败，可能是游戏文件损坏或不兼容',
    UNKNOWN_ERROR: '发生未知错误，请刷新页面重试'
};

// 成功消息
export const SUCCESS_MESSAGES = {
    GAME_ADDED_TO_FAVORITES: '游戏已添加到收藏',
    GAME_REMOVED_FROM_FAVORITES: '游戏已从收藏中移除',
    LANGUAGE_CHANGED: '语言设置已更改'
};

// 动画持续时间（毫秒）
export const ANIMATION_DURATION = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
};

// 响应式断点
export const BREAKPOINTS = {
    SM: 576,
    MD: 768,
    LG: 992,
    XL: 1200,
    XXL: 1400
};

// 游戏网格布局配置
export const GRID_COLUMNS = {
    DESKTOP_XL: 8,      // ≥1400px: 8列
    DESKTOP_LG: 6,      // 1200-1399px: 6列  
    DESKTOP_MD: 5,      // 992-1199px: 5列
    TABLET_LG: 4,       // 768-991px: 4列
    TABLET_SM: 3,       // 576-767px: 3列
    MOBILE_LG: 2,       // ≤575px: 2列
    MOBILE_SM: 1        // ≤400px: 1列
};

// 搜索配置
export const SEARCH_CONFIG = {
    MIN_QUERY_LENGTH: 2,
    MAX_RESULTS: 50,
    HIGHLIGHT_CLASS: 'search-highlight'
};

// 图片配置
export const IMAGE_CONFIG = {
    // 占位符图片
    PLACEHOLDER: 'assets/images/placeholder-game.svg',
    
    // 懒加载配置
    LAZY_LOAD_THRESHOLD: 50, // 提前50px开始加载
    INTERSECTION_THRESHOLD: 0.1, // 10%可见时触发
    
    // 支持的图片格式（按优先级排序）
    FORMATS: ['avif', 'webp', 'jpg', 'png'],
    
    // 图片尺寸配置
    SIZES: {
        THUMBNAIL: { width: 200, height: 133 },
        SMALL: { width: 300, height: 200 },
        MEDIUM: { width: 400, height: 267 },
        LARGE: { width: 600, height: 400 },
        XLARGE: { width: 800, height: 533 }
    },
    
    // 压缩质量
    QUALITY: {
        HIGH: 0.9,
        MEDIUM: 0.8,
        LOW: 0.6
    },
    
    // 重试配置
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 毫秒
    
    // 超时配置
    LOAD_TIMEOUT: 10000 // 10秒
};

// 性能配置
export const PERFORMANCE_CONFIG = {
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 100,
    INTERSECTION_THRESHOLD: 0.1,
    MAX_CONCURRENT_REQUESTS: 6
};

// 重试配置
export const RETRY_CONFIG = {
    MAX_RETRIES: 3,           // 最大重试次数
    RETRY_DELAY: 1000,        // 基础重试延迟（毫秒）
    TIMEOUT: 10000,           // 请求超时时间（毫秒）
    EXPONENTIAL_BACKOFF: true // 是否使用指数退避
};

// 网络状态配置
export const NETWORK_CONFIG = {
    CHECK_INTERVAL: 30000,    // 网络状态检查间隔（毫秒）
    OFFLINE_QUEUE_LIMIT: 50,  // 离线队列最大长度
    CACHE_DURATION: 86400000  // 缓存持续时间（24小时，毫秒）
};