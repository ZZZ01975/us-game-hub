# US Game Hub 代码规范

本文档定义了US Game Hub项目的代码规范和最佳实践。

## 文件组织规范

### 目录结构
```
项目根目录/
├── assets/          # 静态资源（图片、图标等）
├── css/             # 样式文件
│   ├── base/        # 基础样式（重置、变量、工具类）
│   └── components/  # 组件样式
├── js/              # JavaScript文件
│   ├── modules/     # 功能模块
│   └── utils/       # 工具函数
├── data/            # 数据文件
├── games/           # 游戏文件
└── languages/       # 多语言文件
```

### 文件命名
- 使用kebab-case命名文件和文件夹：`game-manager.js`
- CSS文件使用描述性名称：`game-card.css`
- JavaScript模块使用PascalCase：`GameManager.js`
- 常量文件使用小写：`constants.js`

## HTML规范

### 基本规则
- 使用HTML5语义化标签
- 保持标签嵌套的正确性
- 使用双引号包围属性值
- 自闭合标签末尾添加斜杠

### 示例
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>页面标题</title>
</head>
<body>
    <header class="header">
        <nav class="navbar">
            <!-- 导航内容 -->
        </nav>
    </header>
    
    <main class="main-content">
        <section class="games-section">
            <!-- 主要内容 -->
        </section>
    </main>
    
    <footer class="footer">
        <!-- 页脚内容 -->
    </footer>
</body>
</html>
```

### 类名规范
- 使用BEM命名方法论
- 块（Block）：`.game-card`
- 元素（Element）：`.game-card__title`
- 修饰符（Modifier）：`.game-card--featured`

## CSS规范

### 基本规则
- 使用CSS变量定义颜色、字体、间距等
- 采用移动优先的响应式设计
- 使用Flexbox和Grid进行布局
- 避免使用!important

### CSS变量使用
```css
:root {
    --primary-color: #667eea;
    --text-primary: #333333;
    --spacing-md: 1rem;
    --border-radius-lg: 0.75rem;
}

.button {
    background: var(--primary-color);
    color: var(--text-primary);
    padding: var(--spacing-md);
    border-radius: var(--border-radius-lg);
}
```

### 组件样式结构
```css
/**
 * 组件名称样式
 * 组件功能描述
 */

/* 基础样式 */
.component {
    /* 定位 */
    position: relative;
    
    /* 盒模型 */
    display: flex;
    width: 100%;
    padding: var(--spacing-md);
    margin: var(--spacing-sm) 0;
    
    /* 视觉样式 */
    background: var(--bg-primary);
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-md);
    
    /* 动画 */
    transition: all var(--transition-normal);
}

/* 状态样式 */
.component:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}

/* 修饰符样式 */
.component--large {
    padding: var(--spacing-lg);
}

/* 响应式样式 */
@media (max-width: 768px) {
    .component {
        padding: var(--spacing-sm);
    }
}
```

## JavaScript规范

### 基本规则
- 使用ES6+语法
- 采用模块化开发
- 使用const和let，避免var
- 函数和变量使用camelCase命名
- 类名使用PascalCase命名
- 常量使用UPPER_SNAKE_CASE命名

### 模块结构
```javascript
/**
 * 模块名称
 * 模块功能描述
 */

import { CONSTANTS } from '../utils/constants.js';
import { helper } from '../utils/helpers.js';

class ModuleName {
    constructor() {
        this.property = null;
        this.isInitialized = false;
    }

    /**
     * 公共方法描述
     * @param {string} param - 参数描述
     * @returns {Promise<Array>} 返回值描述
     */
    async publicMethod(param) {
        try {
            const result = await this._privateMethod(param);
            return result;
        } catch (error) {
            console.error('方法执行失败:', error);
            throw error;
        }
    }

    /**
     * 私有方法描述
     * @private
     * @param {string} param - 参数描述
     * @returns {Array} 返回值描述
     */
    _privateMethod(param) {
        // 实现逻辑
        return [];
    }
}

export default ModuleName;
```

### 注释规范
```javascript
/**
 * 函数功能描述
 * @param {string} name - 参数名称描述
 * @param {number} age - 参数年龄描述
 * @param {Object} options - 选项对象
 * @param {boolean} options.active - 是否激活
 * @returns {Promise<Object>} 返回用户对象
 * @throws {Error} 当参数无效时抛出错误
 */
async function createUser(name, age, options = {}) {
    // 参数验证
    if (!name || typeof name !== 'string') {
        throw new Error('用户名必须是非空字符串');
    }

    // 业务逻辑
    const user = {
        name,
        age,
        active: options.active || false
    };

    return user;
}
```

### 错误处理
```javascript
// 使用try-catch处理异步错误
async function loadData() {
    try {
        const response = await fetch('/api/data');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('加载数据失败:', error);
        // 显示用户友好的错误信息
        showNotification('数据加载失败，请重试', 'error');
        throw error;
    }
}
```

## 性能优化规范

### 图片优化
- 使用适当的图片格式（WebP优先）
- 实现图片懒加载
- 提供占位符图片

### JavaScript优化
- 使用防抖和节流优化事件处理
- 避免内存泄漏
- 合理使用缓存

### CSS优化
- 避免深层嵌套选择器
- 使用CSS变量减少重复
- 合理使用动画和过渡

## 可访问性规范

### 基本要求
- 提供alt属性给图片
- 使用语义化HTML标签
- 确保键盘导航可用
- 提供足够的颜色对比度

### 示例
```html
<!-- 图片alt属性 -->
<img src="game-cover.jpg" alt="贪吃蛇游戏封面">

<!-- 按钮可访问性 -->
<button class="btn" aria-label="开始游戏" onclick="startGame()">
    🎮 开始游戏
</button>

<!-- 表单标签 -->
<label for="search-input">搜索游戏</label>
<input type="text" id="search-input" placeholder="输入游戏名称">
```

## 测试规范

### 单元测试
- 为核心功能编写单元测试
- 测试覆盖率目标：80%以上
- 使用描述性的测试名称

### 集成测试
- 测试用户主要使用流程
- 验证组件间的交互
- 测试错误处理逻辑

## Git提交规范

### 提交消息格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型说明
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 示例
```
feat(game): 添加游戏收藏功能

- 实现游戏收藏和取消收藏
- 添加收藏状态的本地存储
- 更新UI显示收藏状态

Closes #123
```

## 代码审查清单

### 功能性
- [ ] 代码实现了预期功能
- [ ] 错误处理完善
- [ ] 边界条件考虑周全

### 可读性
- [ ] 代码结构清晰
- [ ] 变量和函数命名有意义
- [ ] 注释充分且准确

### 性能
- [ ] 没有明显的性能问题
- [ ] 内存使用合理
- [ ] 网络请求优化

### 安全性
- [ ] 输入验证充分
- [ ] 没有XSS漏洞
- [ ] 敏感信息保护

### 兼容性
- [ ] 浏览器兼容性测试
- [ ] 移动端适配
- [ ] 可访问性支持

---

遵循这些规范有助于保持代码质量，提高团队协作效率，确保项目的可维护性。