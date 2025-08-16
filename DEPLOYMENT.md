# US Game Hub 部署指南

本文档详细说明如何将US Game Hub部署到GitHub Pages。

## 📋 部署前准备

### 1. 检查系统要求
- GitHub账户
- Git已安装
- Node.js 18+ (用于构建脚本)

### 2. 验证文件完整性
运行部署前检查：
```bash
cd scripts
npm install
node deploy-check.js
```

## 🚀 GitHub Pages部署步骤

### 步骤1：创建GitHub仓库

1. 登录GitHub账户
2. 点击右上角的"+"按钮，选择"New repository"
3. 仓库名称：`us-game-hub`
4. 设置为Public（GitHub Pages免费版需要公开仓库）
5. 不要初始化README、.gitignore或license（我们已经有了）

### 步骤2：上传代码到GitHub

```bash
# 初始化Git仓库（如果还没有）
git init

# 添加远程仓库（替换yourusername为您的GitHub用户名）
git remote add origin https://github.com/yourusername/us-game-hub.git

# 添加所有文件
git add .

# 提交代码
git commit -m "初始提交：US Game Hub网站"

# 推送到GitHub
git push -u origin main
```

### 步骤3：启用GitHub Pages

1. 进入GitHub仓库页面
2. 点击"Settings"标签
3. 在左侧菜单中找到"Pages"
4. 在"Source"部分选择"GitHub Actions"
5. 保存设置

### 步骤4：配置自动部署

GitHub Actions会自动运行部署流程：

1. 代码推送到main分支时自动触发
2. 运行资源优化脚本
3. 验证网站文件完整性
4. 部署到GitHub Pages

### 步骤5：访问网站

部署完成后，您的网站将在以下地址可用：
```
https://yourusername.github.io/us-game-hub/
```

## 🔧 配置说明

### 修改配置文件

编辑 `_config.yml` 文件：

```yaml
# 修改这些设置为您的信息
url: "https://yourusername.github.io"  # 您的GitHub用户名
baseurl: "/us-game-hub"  # 您的仓库名
```

### 自定义域名（可选）

如果您有自定义域名：

1. 在仓库根目录创建 `CNAME` 文件
2. 文件内容为您的域名，例如：`yourdomain.com`
3. 在域名DNS设置中添加CNAME记录指向 `yourusername.github.io`

## 📊 部署监控

### 查看部署状态

1. 进入GitHub仓库
2. 点击"Actions"标签
3. 查看最新的部署任务状态

### 部署失败排查

如果部署失败：

1. 检查Actions日志中的错误信息
2. 运行本地检查脚本：`node scripts/deploy-check.js`
3. 修复错误后重新推送代码

## 🔄 更新网站

### 日常更新流程

1. 修改代码或内容
2. 提交更改：
   ```bash
   git add .
   git commit -m "更新描述"
   git push
   ```
3. GitHub Actions自动部署更新

### 添加新游戏

1. 将游戏文件放入 `games/` 目录
2. 更新 `data/games.json` 文件
3. 添加游戏封面图片到 `assets/images/covers/`
4. 提交并推送更改

## 🛠️ 故障排除

### 常见问题

**问题1：页面显示404错误**
- 检查仓库是否为Public
- 确认GitHub Pages已启用
- 检查_config.yml中的baseurl设置

**问题2：CSS/JS文件加载失败**
- 检查文件路径是否正确
- 确认baseurl配置正确
- 清除浏览器缓存

**问题3：游戏无法加载**
- 检查games.json文件格式
- 确认游戏文件路径正确
- 检查浏览器控制台错误信息

**问题4：多语言切换不工作**
- 检查languages目录下的JSON文件
- 确认文件格式正确
- 检查JavaScript控制台错误

### 获取帮助

如果遇到问题：

1. 查看GitHub Actions日志
2. 运行本地检查脚本
3. 检查浏览器开发者工具
4. 参考GitHub Pages官方文档

## 📈 性能优化

### 自动优化

部署过程会自动进行：
- 图片压缩和WebP转换
- CSS/JS文件压缩
- 资源缓存优化

### 手动优化

运行优化脚本：
```bash
cd scripts
npm install
npm run optimize
```

## 🔒 安全设置

### HTTPS

GitHub Pages自动提供HTTPS支持，确保：
- 所有资源使用HTTPS链接
- 混合内容警告已解决

### 内容安全策略

网站包含基本的CSP设置，防止XSS攻击。

## 📱 移动端优化

网站已针对移动设备优化：
- 响应式设计
- 触摸友好的界面
- 快速加载时间

## 🌍 国际化

网站支持多语言：
- 英文（默认）
- 中文
- 西班牙文
- 法文

添加新语言：
1. 在 `languages/` 目录创建新的JSON文件
2. 更新语言选择器
3. 测试所有页面的翻译

---

**注意：** 请将文档中的 `yourusername` 替换为您的实际GitHub用户名。