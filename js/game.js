/**
 * 游戏详情页JavaScript文件
 * 处理游戏详情页的功能
 */

import gameManager from './modules/GameManager.js';
import uiManager from './modules/UIManager.js';
import historyManager from './modules/HistoryManager.js';
import favoritesManager from './modules/FavoritesManager.js';
import interactionManager from './modules/InteractionManager.js';
import gameErrorHandler from './modules/GameErrorHandler.js';
import { 
    STORAGE_KEYS, 
    ERROR_MESSAGES, 
    SUCCESS_MESSAGES 
} from './utils/constants.js';
import { 
    getUrlParameter, 
    storage, 
    showNotification,
    delay 
} from './utils/helpers.js';

/**
 * 游戏详情页应用类
 */
class GameApp {
    constructor() {
        this.currentGame = null;
        this.gameId = null;
        this.isInitialized = false;
    }

    /**
     * 初始化游戏详情页
     */
    async init() {
        if (this.isInitialized) return;

        try {
            console.log('初始化游戏详情页...');

            // 获取游戏ID
            this.gameId = getUrlParameter('id');
            if (!this.gameId) {
                this._showError('游戏不存在');
                return;
            }

            console.log('游戏ID:', this.gameId);

            // 初始化交互管理器
            interactionManager.init();

            // 初始化UI管理器
            uiManager.init();

            // 设置事件监听器
            this._setupEventListeners();

            // 加载游戏数据
            await this._loadGameData();

            this.isInitialized = true;
            console.log('游戏详情页初始化完成');

        } catch (error) {
            console.error('游戏详情页初始化失败:', error);
            this._showError(ERROR_MESSAGES.DATA_LOAD_ERROR);
        }
    }

    /**
     * 设置事件监听器
     * @private
     */
    _setupEventListeners() {
        // 返回顶部按钮
        const backToTopBtn = document.getElementById('back-to-top');
        if (backToTopBtn) {
            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }

        // 滚动事件
        window.addEventListener('scroll', () => {
            if (backToTopBtn) {
                if (window.pageYOffset > 300) {
                    backToTopBtn.classList.add('show');
                } else {
                    backToTopBtn.classList.remove('show');
                }
            }
        });

        // 推荐游戏筛选按钮
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this._filterRecommendedGames(filter);
                
                // 更新按钮状态
                filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // 查看更多游戏按钮
        const loadMoreBtn = document.getElementById('load-more-recommended');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }

        console.log('游戏详情页事件监听器设置完成');
    }

    /**
     * 筛选推荐游戏
     * @private
     * @param {string} filter - 筛选类型
     */
    _filterRecommendedGames(filter) {
        if (!this.currentGame) return;

        console.log('筛选推荐游戏:', filter);

        let games = [];
        const gameId = parseInt(this.gameId);

        switch (filter) {
            case 'mixed':
                games = gameManager.getMixedRecommendations(gameId, 6);
                break;
            case 'category':
                games = gameManager.games
                    .filter(game => 
                        game.id !== gameId && 
                        game.category === this.currentGame.category
                    )
                    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                    .slice(0, 6);
                games = gameManager.getLocalizedGames(games);
                break;
            case 'popular':
                games = gameManager.getPopularGames(6)
                    .filter(game => game.id !== gameId);
                break;
            case 'new':
                games = gameManager.getNewGames(6)
                    .filter(game => game.id !== gameId);
                break;
            default:
                games = gameManager.getMixedRecommendations(gameId, 6);
        }

        // 如果没有足够的游戏，用其他游戏补充
        if (games.length < 4) {
            const additional = gameManager.getFeaturedGames(6)
                .filter(game => 
                    game.id !== gameId && 
                    !games.find(g => g.id === game.id)
                )
                .slice(0, 6 - games.length);
            games.push(...additional);
        }

        uiManager.renderRecommendedGames(games);
        console.log(`加载了 ${games.length} 个${this._getFilterName(filter)}游戏`);
    }

    /**
     * 获取筛选类型的中文名称
     * @private
     * @param {string} filter - 筛选类型
     * @returns {string} 中文名称
     */
    _getFilterName(filter) {
        const names = {
            mixed: '智能推荐',
            category: '同类',
            popular: '热门',
            new: '最新'
        };
        return names[filter] || '推荐';
    }

    /**
     * 加载游戏数据
     * @private
     */
    async _loadGameData() {
        try {
            // 加载所有游戏数据
            await gameManager.loadGames();

            // 查找当前游戏
            this.currentGame = gameManager.getGameById(parseInt(this.gameId));

            if (!this.currentGame) {
                this._showError(ERROR_MESSAGES.GAME_NOT_FOUND);
                return;
            }

            console.log('找到游戏:', this.currentGame.title);

            // 渲染游戏信息
            uiManager.renderGameDetail(this.currentGame);

            // 加载推荐游戏
            this._loadRecommendedGames();

            // 记录游戏访问历史
            this._recordGameVisit();

        } catch (error) {
            console.error('加载游戏数据失败:', error);
            this._showError(ERROR_MESSAGES.DATA_LOAD_ERROR);
        }
    }

    /**
     * 加载推荐游戏
     * @private
     */
    _loadRecommendedGames() {
        try {
            // 使用混合推荐算法获取更多样化的推荐
            const relatedGames = gameManager.getMixedRecommendations(parseInt(this.gameId), 6);
            
            if (relatedGames.length === 0) {
                // 如果没有推荐游戏，显示热门游戏
                const popularGames = gameManager.getPopularGames(6);
                uiManager.renderRecommendedGames(popularGames);
                console.log('加载了', popularGames.length, '个热门游戏作为推荐');
            } else {
                uiManager.renderRecommendedGames(relatedGames);
                console.log('加载了', relatedGames.length, '个推荐游戏');
            }

            // 显示"查看更多"按钮
            const loadMoreBtn = document.getElementById('load-more-recommended');
            if (loadMoreBtn && gameManager.games.length > 6) {
                loadMoreBtn.style.display = 'flex';
            }

        } catch (error) {
            console.error('加载推荐游戏失败:', error);
            // 降级到简单推荐
            const fallbackGames = gameManager.getFeaturedGames(4);
            uiManager.renderRecommendedGames(fallbackGames);
        }
    }

    /**
     * 记录游戏访问历史
     * @private
     */
    _recordGameVisit() {
        try {
            // 使用HistoryManager记录游戏访问
            historyManager.addToHistory(this.currentGame);
            console.log('游戏访问历史已记录');
        } catch (error) {
            console.error('记录游戏历史失败:', error);
        }
    }

    /**
     * 开始游戏
     */
    async startGame() {
        if (!this.currentGame) {
            showNotification(ERROR_MESSAGES.GAME_NOT_FOUND, 'error');
            return;
        }

        console.log('开始游戏:', this.currentGame.title);

        // 检查游戏URL是否存在
        if (!this.currentGame.gameUrl) {
            this._showGameUnavailable('游戏即将上线，敬请期待！');
            return;
        }

        try {
            // 显示游戏加载状态
            uiManager.showGameLoading(this.currentGame.title);

            // 验证游戏URL
            const isValidUrl = await gameErrorHandler.validateGameUrl(this.currentGame.gameUrl);
            
            if (!isValidUrl) {
                console.warn('游戏URL验证失败，但仍尝试加载');
                showNotification('游戏可能无法正常加载，正在尝试...', 'warning');
            }

            // 模拟加载延迟
            await delay(800);

            // 使用安全的游戏iframe创建方法
            await this._createSafeGameFrame();

            // 增加游戏游玩次数
            gameManager.incrementPlayCount(this.currentGame.id);

            // 记录游戏游玩历史
            this._recordGamePlay();

            console.log('游戏启动成功');

        } catch (error) {
            console.error('启动游戏失败:', error);
            await gameErrorHandler.handleGameLoadError(
                this.currentGame.gameUrl, 
                this.currentGame.title, 
                document.getElementById('game-container')
            );
        }
    }

    /**
     * 创建安全的游戏框架
     * @private
     */
    async _createSafeGameFrame() {
        const gameContainer = document.getElementById('game-container');
        if (!gameContainer) {
            throw new Error('游戏容器不存在');
        }

        // 清空容器
        gameContainer.innerHTML = '';

        // 创建游戏框架容器
        const frameContainer = document.createElement('div');
        frameContainer.className = 'game-frame-container';
        
        // 创建游戏头部
        const frameHeader = document.createElement('div');
        frameHeader.className = 'game-frame-header';
        frameHeader.innerHTML = `
            <h3 class="game-frame-title">
                <span class="game-icon">🎮</span>
                ${this.currentGame.title}
            </h3>
            <div class="game-frame-controls">
                <button class="btn-frame-control" onclick="this._refreshGame()" title="刷新游戏">
                    🔄
                </button>
                <button class="btn-frame-control" onclick="this._toggleFullscreen()" title="全屏">
                    ⛶
                </button>
            </div>
        `;

        // 创建游戏iframe包装器
        const frameWrapper = document.createElement('div');
        frameWrapper.className = 'game-frame-wrapper';

        // 使用游戏错误处理器创建安全的iframe
        const iframe = gameErrorHandler.createSafeGameIframe(
            this.currentGame.gameUrl,
            this.currentGame.title,
            gameContainer
        );

        iframe.className = 'game-frame';

        // 创建加载指示器
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'game-frame-loading';
        loadingIndicator.innerHTML = `
            <div class="loading-spinner"></div>
            <p>正在加载游戏...</p>
        `;

        // 组装框架
        frameWrapper.appendChild(loadingIndicator);
        frameWrapper.appendChild(iframe);

        // 创建游戏底部信息
        const frameFooter = document.createElement('div');
        frameFooter.className = 'game-frame-footer';
        frameFooter.innerHTML = `
            <p class="game-tips">
                <span class="tip-icon">💡</span>
                如果游戏无法加载，请尝试刷新页面或检查网络连接
            </p>
            <div class="game-controls-hint">
                <span>常用控制：</span>
                <span class="control-key">WASD</span>
                <span class="control-key">方向键</span>
                <span class="control-key">空格</span>
                <span class="control-key">鼠标</span>
            </div>
        `;

        // 添加到容器
        frameContainer.appendChild(frameHeader);
        frameContainer.appendChild(frameWrapper);
        frameContainer.appendChild(frameFooter);
        gameContainer.appendChild(frameContainer);

        // iframe加载完成后隐藏加载指示器
        iframe.onload = () => {
            setTimeout(() => {
                loadingIndicator.style.opacity = '0';
                iframe.style.opacity = '1';
                setTimeout(() => {
                    if (loadingIndicator.parentNode) {
                        loadingIndicator.parentNode.removeChild(loadingIndicator);
                    }
                }, 300);
            }, 500);
        };
    }

    /**
     * 显示游戏不可用界面
     * @private
     * @param {string} message - 提示消息
     */
    _showGameUnavailable(message) {
        const gameContainer = document.getElementById('game-container');
        if (!gameContainer) return;

        gameContainer.innerHTML = `
            <div class="game-unavailable">
                <div class="unavailable-content">
                    <div class="unavailable-icon">🚧</div>
                    <h3 class="unavailable-title">游戏暂不可用</h3>
                    <p class="unavailable-message">${message}</p>
                    <div class="unavailable-actions">
                        <button class="btn btn-primary" onclick="window.location.reload()">
                            <span>🔄</span>
                            <span>刷新页面</span>
                        </button>
                        <button class="btn btn-secondary" onclick="this._showAlternativeGames()">
                            <span>🎮</span>
                            <span>查看其他游戏</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 显示替代游戏
     * @private
     */
    _showAlternativeGames() {
        // 获取同类游戏作为替代
        if (this.currentGame && this.currentGame.category) {
            const alternatives = gameManager.games
                .filter(game => 
                    game.category === this.currentGame.category && 
                    game.id !== this.currentGame.id &&
                    game.gameUrl
                )
                .slice(0, 3);

            if (alternatives.length > 0) {
                showNotification('为您推荐了一些类似的游戏', 'info');
                // 可以在这里显示替代游戏的界面
            }
        }
        
        // 默认跳转到首页
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    /**
     * 刷新游戏
     * @private
     */
    _refreshGame() {
        console.log('刷新游戏');
        
        // 重置游戏错误状态
        if (this.currentGame) {
            gameErrorHandler.resetGameState(this.currentGame.gameUrl, this.currentGame.title);
        }
        
        // 重新启动游戏
        this.startGame();
    }

    /**
     * 切换全屏模式
     * @private
     */
    _toggleFullscreen() {
        const iframe = document.querySelector('.game-frame');
        if (!iframe) return;

        if (!document.fullscreenElement) {
            iframe.requestFullscreen().catch(err => {
                console.warn('无法进入全屏模式:', err);
                showNotification('您的浏览器不支持全屏模式', 'warning');
            });
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * 记录游戏游玩历史
     * @private
     */
    _recordGamePlay() {
        try {
            // 使用HistoryManager记录游戏游玩
            historyManager.addToHistory(this.currentGame);
            console.log('游戏游玩记录已更新');
        } catch (error) {
            console.error('记录游戏游玩失败:', error);
        }
    }

    /**
     * 切换收藏状态
     * @param {number} gameId - 游戏ID
     */
    toggleFavorite(gameId) {
        try {
            const game = gameManager.getGameById(gameId);
            if (!game) {
                showNotification('游戏不存在', 'error');
                return;
            }

            const isFavorited = favoritesManager.toggleFavorite(game);
            console.log('收藏状态已更新:', isFavorited);

            // 更新按钮状态
            this._updateFavoriteButton(gameId, isFavorited);

        } catch (error) {
            console.error('切换收藏状态失败:', error);
            showNotification('操作失败，请重试', 'error');
        }
    }

    /**
     * 更新收藏按钮状态
     * @private
     * @param {number} gameId - 游戏ID
     * @param {boolean} isFavorited - 是否已收藏
     */
    _updateFavoriteButton(gameId, isFavorited) {
        const favoriteBtn = document.querySelector(`[onclick="toggleFavorite(${gameId})"]`);
        if (favoriteBtn) {
            favoriteBtn.innerHTML = isFavorited ? '❤️ 已收藏' : '♥ 收藏';
            favoriteBtn.classList.toggle('favorited', isFavorited);
        }
    }

    /**
     * 分享游戏
     * @param {number} gameId - 游戏ID
     */
    shareGame(gameId) {
        const game = gameManager.getGameById(gameId);
        if (!game) return;

        const shareData = {
            title: `${game.title} - US Game Hub`,
            text: `来玩这个有趣的游戏：${game.title}`,
            url: window.location.href
        };

        if (navigator.share) {
            // 使用原生分享API
            navigator.share(shareData).then(() => {
                console.log('分享成功');
            }).catch(error => {
                console.error('分享失败:', error);
                this._fallbackShare(shareData);
            });
        } else {
            // 降级到复制链接
            this._fallbackShare(shareData);
        }
    }

    /**
     * 降级分享方法
     * @private
     * @param {Object} shareData - 分享数据
     */
    _fallbackShare(shareData) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareData.url).then(() => {
                showNotification('游戏链接已复制到剪贴板', 'success');
            }).catch(error => {
                console.error('复制链接失败:', error);
                showNotification('分享失败，请手动复制链接', 'error');
            });
        } else {
            // 创建临时输入框复制链接
            const tempInput = document.createElement('input');
            tempInput.value = shareData.url;
            document.body.appendChild(tempInput);
            tempInput.select();
            
            try {
                document.execCommand('copy');
                showNotification('游戏链接已复制到剪贴板', 'success');
            } catch (error) {
                console.error('复制链接失败:', error);
                showNotification('分享失败，请手动复制链接', 'error');
            }
            
            document.body.removeChild(tempInput);
        }
    }

    /**
     * 显示错误信息
     * @private
     * @param {string} message - 错误消息
     */
    _showError(message) {
        // 使用InteractionManager显示错误对话框
        interactionManager.showErrorDialog(
            '游戏加载失败',
            message,
            {
                showRetry: false,
                showHome: true
            }
        );
    }

    /**
     * 处理游戏加载错误
     * @param {string} gameName - 游戏名称
     */
    _handleGameLoadError(gameName) {
        console.error('游戏加载失败:', gameName);
        uiManager.showGameError(`游戏 "${gameName}" 加载失败，请检查网络连接或稍后重试`);
    }

    /**
     * 检查游戏URL有效性
     * @param {string} gameUrl - 游戏URL
     * @returns {Promise<boolean>} URL是否有效
     */
    async _validateGameUrl(gameUrl) {
        try {
            // 检查URL格式
            new URL(gameUrl, window.location.origin);
            
            // 尝试获取资源头信息
            const response = await fetch(gameUrl, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            console.warn('游戏URL验证失败:', error);
            return false;
        }
    }

    /**
     * 获取当前游戏信息
     * @returns {Object|null} 当前游戏对象
     */
    getCurrentGame() {
        return this.currentGame;
    }
}

// 全局函数，供HTML中的onclick事件使用
window.startGame = function() {
    if (window.gameApp) {
        window.gameApp.startGame();
    }
};

window.toggleFavorite = function(gameId) {
    if (window.gameApp) {
        window.gameApp.toggleFavorite(gameId);
    }
};

window.shareGame = function(gameId) {
    if (window.gameApp) {
        window.gameApp.shareGame(gameId);
    }
};

// 游戏错误处理相关的全局函数
window.refreshGame = function() {
    if (window.gameApp) {
        window.gameApp._refreshGame();
    }
};

window.toggleFullscreen = function() {
    if (window.gameApp) {
        window.gameApp._toggleFullscreen();
    }
};

window.showAlternativeGames = function() {
    if (window.gameApp) {
        window.gameApp._showAlternativeGames();
    }
};

window.retryGameLoad = function(gameUrl, gameTitle, container) {
    if (gameErrorHandler) {
        gameErrorHandler._retryGameLoad(gameUrl, gameTitle, container);
    }
};

window.continueWaiting = function(gameUrl, gameTitle, container) {
    if (gameErrorHandler) {
        gameErrorHandler._continueWaiting(gameUrl, gameTitle, container);
    }
};

window.tryAlternativeGame = function(originalGameTitle) {
    if (gameErrorHandler) {
        gameErrorHandler._tryAlternativeGame(originalGameTitle);
    }
};

window.openGame = function(gameId) {
    console.log('打开推荐游戏，ID:', gameId);
    
    // 获取游戏信息并添加到历史记录
    const game = gameManager.getGameById(gameId);
    if (game) {
        historyManager.addToHistory(game);
    }
    
    window.location.href = `game.html?id=${gameId}`;
};

// 创建游戏应用实例
const gameApp = new GameApp();

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('游戏详情页DOM加载完成，开始初始化...');
    gameApp.init().catch(error => {
        console.error('游戏详情页初始化失败:', error);
    });
});

// 导出应用实例（用于调试和全局访问）
window.gameApp = gameApp;

export default gameApp;