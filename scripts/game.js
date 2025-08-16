// 游戏详情页的JavaScript功能

// 当前游戏数据
let currentGame = null;
let allGames = [];

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('游戏详情页加载完成...');
    
    // 获取游戏ID
    const gameId = getUrlParameter('id');
    
    if (!gameId) {
        console.error('未找到游戏ID');
        showError('游戏不存在');
        return;
    }
    
    console.log('游戏ID:', gameId);
    
    // 加载游戏数据
    loadGameData(parseInt(gameId));
});

// 加载游戏数据
async function loadGameData(gameId) {
    console.log('加载游戏数据，ID:', gameId);
    
    try {
        // 从JSON文件获取游戏数据
        const response = await fetch('data/games.json');
        
        if (!response.ok) {
            throw new Error('无法加载游戏数据');
        }
        
        const data = await response.json();
        allGames = data.games;
        
        // 查找指定的游戏
        currentGame = allGames.find(game => game.id === gameId);
        
        if (!currentGame) {
            throw new Error('游戏不存在');
        }
        
        console.log('找到游戏:', currentGame.title);
        
        // 显示游戏信息
        displayGameInfo();
        
        // 显示推荐游戏
        displayRecommendedGames();
        
    } catch (error) {
        console.error('加载游戏数据失败:', error);
        showError('加载失败，请刷新页面重试');
    }
}

// 显示游戏信息
function displayGameInfo() {
    console.log('显示游戏信息...');
    
    const gameInfoContainer = document.getElementById('game-info');
    
    // 更新页面标题
    document.title = `${currentGame.title} - US Game Hub`;
    
    // 生成游戏信息HTML
    const gameInfoHTML = `
        <div class="game-header">
            <img src="${currentGame.image}" alt="${currentGame.title}" class="game-cover"
                 onerror="this.src='https://via.placeholder.com/300x200/666/white?text=游戏图片'">
            <div class="game-details">
                <h1>${currentGame.title}</h1>
                <div class="game-meta">
                    <span class="game-category-tag">${currentGame.categoryName}</span>
                </div>
                <p class="game-description">${currentGame.description}</p>
                <button class="play-button" onclick="startGame()">🎮 开始游戏</button>
            </div>
        </div>
    `;
    
    gameInfoContainer.innerHTML = gameInfoHTML;
}

// 开始游戏
function startGame() {
    console.log('开始游戏:', currentGame.title);
    
    const gameContainer = document.getElementById('game-container');
    
    // 检查游戏URL是否存在
    if (!currentGame.gameUrl) {
        gameContainer.innerHTML = `
            <div class="loading">
                <h3>游戏即将上线</h3>
                <p>这个游戏正在开发中，敬请期待！</p>
                <button class="play-button" onclick="window.location.href='index.html'">返回首页</button>
            </div>
        `;
        return;
    }
    
    // 显示游戏加载状态
    gameContainer.innerHTML = '<div class="loading">正在加载游戏...</div>';
    
    // 创建游戏iframe
    setTimeout(() => {
        const gameHTML = `
            <h3>正在游玩: ${currentGame.title}</h3>
            <iframe src="${currentGame.gameUrl}" class="game-frame" 
                    onload="console.log('游戏加载完成')"
                    onerror="showGameError()">
            </iframe>
            <p style="margin-top: 1rem; color: #666;">
                如果游戏无法正常显示，请检查网络连接或尝试刷新页面
            </p>
        `;
        
        gameContainer.innerHTML = gameHTML;
    }, 1000);
}

// 显示游戏加载错误
function showGameError() {
    console.error('游戏加载失败');
    
    const gameContainer = document.getElementById('game-container');
    gameContainer.innerHTML = `
        <div class="loading">
            <h3>游戏加载失败</h3>
            <p>抱歉，游戏暂时无法加载。可能的原因：</p>
            <ul style="text-align: left; margin: 1rem 0;">
                <li>网络连接问题</li>
                <li>游戏文件不存在</li>
                <li>浏览器兼容性问题</li>
            </ul>
            <button class="play-button" onclick="startGame()">重试</button>
            <button class="play-button" onclick="window.location.href='index.html'" 
                    style="margin-left: 1rem; background: #666;">返回首页</button>
        </div>
    `;
}

// 显示推荐游戏
function displayRecommendedGames() {
    console.log('显示推荐游戏...');
    
    const recommendedContainer = document.getElementById('recommended-list');
    
    // 获取同类型的其他游戏，最多显示4个
    let recommendedGames = allGames
        .filter(game => game.id !== currentGame.id && game.category === currentGame.category)
        .slice(0, 4);
    
    // 如果同类型游戏不够，添加其他热门游戏
    if (recommendedGames.length < 4) {
        const otherGames = allGames
            .filter(game => game.id !== currentGame.id && game.category !== currentGame.category && game.featured)
            .slice(0, 4 - recommendedGames.length);
        
        recommendedGames = [...recommendedGames, ...otherGames];
    }
    
    if (recommendedGames.length === 0) {
        recommendedContainer.innerHTML = '<p>暂无推荐游戏</p>';
        return;
    }
    
    // 生成推荐游戏HTML
    const recommendedHTML = recommendedGames.map(game => `
        <div class="recommended-card" onclick="openGame(${game.id})">
            <img src="${game.image}" alt="${game.title}" class="recommended-image"
                 onerror="this.src='https://via.placeholder.com/200x120/666/white?text=游戏图片'">
            <div class="recommended-info">
                <h4 class="recommended-title">${game.title}</h4>
                <span class="recommended-category">${game.categoryName}</span>
            </div>
        </div>
    `).join('');
    
    recommendedContainer.innerHTML = recommendedHTML;
}

// 打开推荐游戏
function openGame(gameId) {
    console.log('打开推荐游戏，ID:', gameId);
    
    // 跳转到新的游戏详情页
    window.location.href = `game.html?id=${gameId}`;
}

// 显示错误信息
function showError(message) {
    const gameInfoContainer = document.getElementById('game-info');
    gameInfoContainer.innerHTML = `
        <div class="loading">
            <h3>出错了</h3>
            <p>${message}</p>
            <button class="play-button" onclick="window.location.href='index.html'">返回首页</button>
        </div>
    `;
}

// 工具函数：获取URL参数（复用main.js中的函数）
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}