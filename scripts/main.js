// 主要的JavaScript功能文件

// 全局变量
let allGames = []; // 存储所有游戏数据
let currentCategory = 'all'; // 当前选中的分类

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，开始初始化...');
    
    // 初始化各种功能
    initNavigation(); // 初始化导航功能
    loadGames(); // 加载游戏数据
    initBackToTop(); // 初始化返回顶部按钮
});

// 初始化导航功能
function initNavigation() {
    console.log('初始化导航功能...');
    
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); // 阻止默认链接行为
            
            // 移除所有链接的active类
            navLinks.forEach(l => l.classList.remove('active'));
            
            // 给当前点击的链接添加active类
            this.classList.add('active');
            
            // 获取选中的分类
            currentCategory = this.getAttribute('data-category');
            console.log('切换到分类:', currentCategory);
            
            // 过滤并显示游戏
            filterGames(currentCategory);
        });
    });
}

// 加载游戏数据
async function loadGames() {
    console.log('开始加载游戏数据...');
    
    const gamesContainer = document.getElementById('games-container');
    
    // 显示加载状态
    gamesContainer.innerHTML = '<div class="loading">正在加载游戏...</div>';
    
    try {
        // 从JSON文件获取游戏数据
        const response = await fetch('data/games.json');
        
        if (!response.ok) {
            throw new Error('无法加载游戏数据');
        }
        
        const data = await response.json();
        allGames = data.games;
        
        console.log('成功加载', allGames.length, '个游戏');
        
        // 显示所有游戏
        displayGames(allGames);
        
    } catch (error) {
        console.error('加载游戏数据失败:', error);
        gamesContainer.innerHTML = '<div class="loading">加载失败，请刷新页面重试</div>';
    }
}

// 显示游戏列表
function displayGames(games) {
    console.log('显示', games.length, '个游戏');
    
    const gamesContainer = document.getElementById('games-container');
    
    if (games.length === 0) {
        gamesContainer.innerHTML = '<div class="loading">暂无游戏</div>';
        return;
    }
    
    // 生成游戏卡片HTML
    const gamesHTML = games.map(game => `
        <div class="game-card" onclick="openGame(${game.id})">
            <img src="${game.image}" alt="${game.title}" class="game-image" 
                 onerror="this.src='https://via.placeholder.com/300x200/666/white?text=游戏图片'">
            <div class="game-info">
                <h3 class="game-title">${game.title}</h3>
                <p class="game-description">${game.description}</p>
                <span class="game-category">${game.categoryName}</span>
            </div>
        </div>
    `).join('');
    
    gamesContainer.innerHTML = gamesHTML;
}

// 根据分类过滤游戏
function filterGames(category) {
    console.log('过滤游戏，分类:', category);
    
    let filteredGames;
    
    if (category === 'all') {
        filteredGames = allGames;
    } else {
        filteredGames = allGames.filter(game => game.category === category);
    }
    
    displayGames(filteredGames);
}

// 打开游戏详情页
function openGame(gameId) {
    console.log('打开游戏，ID:', gameId);
    
    // 跳转到游戏详情页，传递游戏ID
    window.location.href = `game.html?id=${gameId}`;
}

// 初始化返回顶部按钮
function initBackToTop() {
    console.log('初始化返回顶部按钮...');
    
    const backToTopBtn = document.getElementById('back-to-top');
    
    if (!backToTopBtn) {
        console.log('未找到返回顶部按钮');
        return;
    }
    
    // 监听页面滚动
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });
    
    // 点击返回顶部
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // 平滑滚动
        });
    });
}

// 工具函数：获取URL参数
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}