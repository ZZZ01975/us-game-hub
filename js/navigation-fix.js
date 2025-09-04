/**
 * 导航修复脚本 - 确保分类导航正常工作
 * 这是一个独立的脚本，不依赖ES6模块
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('导航修复脚本已加载');

    // 获取所有分类链接
    const categoryLinks = document.querySelectorAll('.category-link, .mobile-category-link');
    const gameCardsContainer = document.querySelector('.games-grid');
    
    if (!categoryLinks.length) {
        console.warn('未找到分类链接');
        return;
    }

    // 为每个分类链接添加点击事件
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const category = this.getAttribute('data-category');
            console.log('点击分类:', category);
            
            // 移除所有链接的active状态
            categoryLinks.forEach(l => l.classList.remove('active'));
            
            // 添加当前链接的active状态
            this.classList.add('active');
            
            // 过滤游戏
            filterGamesByCategory(category);
            
            // 关闭移动端菜单（如果打开的话）
            const mobileMenu = document.querySelector('.mobile-nav-menu');
            if (mobileMenu && mobileMenu.classList.contains('active')) {
                mobileMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
    });

    /**
     * 根据分类过滤游戏
     */
    function filterGamesByCategory(category) {
        console.log('过滤游戏分类:', category);
        
        // 尝试调用原始的游戏管理器
        if (window.gameManager && window.uiManager) {
            console.log('使用原始游戏管理器');
            try {
                const filteredGames = category === 'all' 
                    ? window.gameManager.getAllGames() 
                    : window.gameManager.filterByCategory(category);
                window.uiManager.renderGamesList(filteredGames);
                return;
            } catch (error) {
                console.warn('原始游戏管理器失败，使用备用方案:', error);
            }
        }
        
        // 备用方案：直接操作DOM
        const gameCards = document.querySelectorAll('.game-card, [data-category]');
        console.log('找到', gameCards.length, '个游戏卡片');
        
        gameCards.forEach(card => {
            const gameCategory = card.getAttribute('data-category') || '';
            
            if (category === 'all' || gameCategory === category) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
        
        // 如果没有找到游戏卡片，尝试重新加载游戏数据
        if (gameCards.length === 0) {
            console.log('未找到游戏卡片，尝试加载游戏数据');
            loadGamesData(category);
        }
        
        // 更新页面标题
        updatePageTitle(category);
        
        // 滚动到游戏区域
        const gamesSection = document.querySelector('.games-section, .games-container');
        if (gamesSection) {
            gamesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /**
     * 加载游戏数据（备用方案）
     */
    async function loadGamesData(category) {
        try {
            const response = await fetch('data/games.json');
            const data = await response.json();
            
            console.log('加载游戏数据:', data.games.length, '个游戏');
            
            const filteredGames = category === 'all' 
                ? data.games 
                : data.games.filter(game => game.category === category);
            
            renderGameCards(filteredGames);
        } catch (error) {
            console.error('加载游戏数据失败:', error);
        }
    }

    /**
     * 渲染游戏卡片（简化版本）
     */
    function renderGameCards(games) {
        const container = document.querySelector('#games-container, .games-container');
        if (!container) {
            console.error('未找到游戏容器');
            return;
        }
        
        const gamesHTML = games.map(game => `
            <div class="game-card" data-category="${game.category}" onclick="openGame('${game.id}')">
                <div class="game-image">
                    <img src="${game.coverImage || 'https://via.placeholder.com/300x200?text=' + encodeURIComponent(game.title.en)}" 
                         alt="${game.title.en}" 
                         onerror="this.src='https://via.placeholder.com/300x200?text=' + encodeURIComponent('${game.title.en}')">
                </div>
                <div class="game-info">
                    <h3 class="game-title">${game.title.en}</h3>
                    <p class="game-description">${game.description.en}</p>
                    <div class="game-meta">
                        <span class="game-category">${game.category}</span>
                        <span class="game-rating">★ ${game.rating || '4.0'}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = gamesHTML;
        console.log('渲染了', games.length, '个游戏');
    }

    /**
     * 更新页面标题
     */
    function updatePageTitle(category) {
        const titles = {
            'all': 'All Games',
            'action': 'Action Games',
            'puzzle': 'Puzzle Games', 
            'arcade': 'Arcade Games',
            'casual': 'Casual Games',
            'sports': 'Sports Games',
            'racing': 'Racing Games'
        };
        
        const title = titles[category] || 'Games';
        
        // 更新页面标题
        const titleElement = document.querySelector('.page-title, .section-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    // 初始化 - 默认显示所有游戏
    filterGamesByCategory('all');
    
    console.log('导航修复完成，已绑定', categoryLinks.length, '个分类链接');
});

/**
 * 打开游戏页面
 */
window.openGame = function(gameId) {
    console.log('打开游戏:', gameId);
    window.location.href = `game.html?id=${gameId}`;
};