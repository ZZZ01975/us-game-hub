# 🎮 US Game Hub

![HTML5 Games](https://img.shields.io/badge/HTML5-Games-orange)
![Free to Play](https://img.shields.io/badge/Free-to%20Play-green)
![Unblocked](https://img.shields.io/badge/School-Unblocked-blue)

**Play trending games like Sprunki Incredibox, Cookie Clicker, Geometry Dash unblocked, 1v1.LOL and Fireboy Watergirl. Free online browser games for school and home.**

## 🕹️ Featured Games

### 🔥 Trending Now
- **Sprunki Incredibox** - Create unique music with colorful characters
- **Cookie Clicker** - Build your cookie empire with addictive clicking  
- **Geometry Dash** - Rhythm-based platformer challenge
- **1v1.LOL** - Battle royale building game
- **Fireboy and Watergirl** - Cooperative puzzle adventure

### 🎯 Classic Games
- **Snake** - Classic arcade snake game
- **Tetris** - Timeless block puzzle  
- **2048** - Number sliding puzzle
- **Breakout** - Paddle ball brick breaker

## 📱 Features

- **100% Free** - No payments, no subscriptions
- **Unblocked** - Works at school and office
- **Mobile Friendly** - Play on any device  
- **No Downloads** - Instant browser gameplay
- **Multilingual** - English, Chinese, Spanish, French support

## 技术栈

- **前端**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **样式**: CSS Grid, Flexbox, CSS Variables
- **架构**: 模块化设计，组件化开发
- **部署**: GitHub Pages
- **工具**: Git, VS Code

## 项目结构

```
us-game-hub/
├── assets/                 # 静态资源
│   ├── images/             # 图片资源
│   └── icons/              # 图标资源
├── css/                    # 样式文件
│   ├── base/               # 基础样式
│   │   ├── reset.css       # 样式重置
│   │   ├── variables.css   # CSS变量
│   │   ├── typography.css  # 字体排版
│   │   └── utilities.css   # 工具类
│   ├── components/         # 组件样式
│   │   ├── header.css      # 头部导航
│   │   ├── game-card.css   # 游戏卡片
│   │   └── buttons.css     # 按钮组件
│   ├── main.css           # 主样式文件
│   └── game.css           # 游戏详情页样式
├── js/                     # JavaScript文件
│   ├── modules/            # 功能模块
│   │   ├── GameManager.js  # 游戏管理器
│   │   └── UIManager.js    # UI管理器
│   ├── utils/              # 工具函数
│   │   ├── constants.js    # 常量定义
│   │   └── helpers.js      # 辅助函数
│   ├── main.js            # 主应用文件
│   └── game.js            # 游戏详情页文件
├── data/                   # 数据文件
│   └── games.json         # 游戏数据
├── games/                  # 游戏文件
│   └── snake/             # 贪吃蛇游戏
├── languages/              # 多语言文件
├── index.html             # 首页
├── game.html              # 游戏详情页
└── README.md              # 项目说明

# 已废弃的旧文件结构
scripts/                   # 旧的JavaScript文件（已重构）
styles/                    # 旧的CSS文件（已重构）
```

## 开发指南

### 本地开发

1. 克隆项目到本地
2. 使用Live Server或其他本地服务器运行项目
3. 在浏览器中访问 `http://localhost:3000`

### 添加新游戏

1. 在 `games/` 目录下创建游戏文件夹
2. 在 `data/games.json` 中添加游戏信息
3. 确保游戏封面图片已添加到相应位置

### 样式开发

- 基础样式放在 `css/base/` 目录
- 组件样式放在 `css/components/` 目录
- 使用CSS变量保持样式一致性
- 遵循BEM命名规范

### JavaScript开发

- 使用ES6+模块化开发
- 功能模块放在 `js/modules/` 目录
- 工具函数放在 `js/utils/` 目录
- 保持代码的可读性和可维护性

## 浏览器支持

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## 部署

项目使用GitHub Pages进行部署：

1. 推送代码到GitHub仓库
2. 在仓库设置中启用GitHub Pages
3. 选择主分支作为发布源
4. 访问生成的网站链接

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 更新日志

### v2.0.0 (当前版本)
- 🔄 **重构项目结构** - 采用现代化的文件组织方式
- 🎨 **全新UI设计** - 使用CSS变量和组件化样式
- 📦 **模块化JavaScript** - ES6模块化架构
- 🚀 **性能优化** - 图片懒加载和代码优化
- 📱 **响应式改进** - 更好的移动端体验

### v1.0.0
- 🎮 基础游戏平台功能
- 🔍 游戏搜索和分类
- 📄 游戏详情页面
- 💾 本地数据存储

## 联系方式

如有问题或建议，请通过以下方式联系：

- 项目Issues: [GitHub Issues](https://github.com/username/us-game-hub/issues)
- 邮箱: your-email@example.com

---

**US Game Hub** - 让游戏更有趣！ 🎮