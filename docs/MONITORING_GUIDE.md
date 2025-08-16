# US Game Hub 监控和分析指南

本文档详细说明如何为US Game Hub配置完整的监控和分析系统。

## 📊 监控系统概览

我们的监控系统包含以下几个层面：

1. **用户行为分析** - Google Analytics 4
2. **错误监控** - 自定义错误收集 + Sentry（可选）
3. **性能监控** - 自动性能检测
4. **网站可用性监控** - UptimeRobot/Pingdom等
5. **安全监控** - Cloudflare安全功能

## 🚀 快速开始

### 1. 运行监控设置助手

```bash
cd scripts
node setup-monitoring.js
```

这个脚本会引导您完成所有监控工具的配置。

### 2. 手动配置步骤

如果您想手动配置，请按照以下步骤：

## 📈 Google Analytics 4 配置

### 设置步骤

1. **创建GA4属性**
   - 访问 [Google Analytics](https://analytics.google.com)
   - 创建新账户或选择现有账户
   - 创建新的GA4属性
   - 获取测量ID（格式：G-XXXXXXXXXX）

2. **配置网站**
   - 在HTML文件的`<head>`部分添加GA代码
   - 或者使用我们的AnalyticsManager自动集成

3. **自定义事件跟踪**
   
   我们的系统会自动跟踪以下事件：
   
   ```javascript
   // 游戏相关事件
   analyticsManager.trackGameEvent('start', gameId, gameTitle, category);
   analyticsManager.trackGameEvent('complete', gameId, gameTitle, category);
   
   // 用户交互事件
   analyticsManager.trackUserInteraction('click', 'favorite_button');
   analyticsManager.trackUserInteraction('search', 'search_box');
   
   // 搜索事件
   analyticsManager.trackSearch(searchTerm, resultsCount);
   
   // 语言切换
   analyticsManager.trackLanguageChange('en', 'zh');
   ```

### 重要指标

监控以下关键指标：

- **页面浏览量** - 总访问量
- **独立访客** - 唯一用户数
- **会话时长** - 用户停留时间
- **跳出率** - 单页面访问比例
- **游戏启动率** - 游戏点击转化率
- **搜索使用率** - 搜索功能使用情况

## 🛡️ 错误监控系统

### 内置错误监控

我们的ErrorMonitor类会自动收集：

- JavaScript运行时错误
- Promise拒绝错误
- 资源加载错误
- 网络请求错误
- 游戏加载错误

### Sentry集成（推荐）

1. **注册Sentry账户**
   - 访问 [Sentry.io](https://sentry.io)
   - 创建新项目，选择JavaScript平台

2. **获取DSN**
   - 复制项目的DSN（数据源名称）

3. **配置集成**
   ```javascript
   // 在页面加载时添加
   const script = document.createElement('script');
   script.src = 'https://browser.sentry-cdn.com/7.0.0/bundle.min.js';
   script.onload = function() {
       Sentry.init({
           dsn: 'YOUR_SENTRY_DSN',
           environment: 'production',
           tracesSampleRate: 1.0
       });
   };
   document.head.appendChild(script);
   ```

### 错误处理最佳实践

```javascript
// 记录自定义错误
errorMonitor.recordError('游戏加载失败', {
    gameId: 'snake-game',
    errorType: 'load_timeout',
    severity: 'high'
});

// 记录网络错误
errorMonitor.recordNetworkError('/api/games', 500, 'Internal Server Error');

// 记录游戏特定错误
errorMonitor.recordGameError('snake-game', 'crash', '游戏意外崩溃');
```

## ⚡ 性能监控

### 自动性能跟踪

我们的系统会自动监控：

- 页面加载时间
- 首字节时间(TTFB)
- DOM解析时间
- 资源加载时间
- 用户交互响应时间

### 性能监控脚本

使用我们提供的性能监控脚本：

```bash
# 检查网站性能
node scripts/performance-monitor.js yourdomain.com

# 定期运行（添加到cron）
*/15 * * * * /path/to/scripts/performance-monitor.js yourdomain.com
```

### 性能优化建议

基于监控数据的优化建议：

1. **响应时间 > 3秒**
   - 启用CDN加速
   - 压缩静态资源
   - 优化图片大小

2. **首字节时间 > 800ms**
   - 检查服务器配置
   - 启用缓存
   - 使用更快的DNS

3. **页面大小 > 2MB**
   - 压缩CSS/JS文件
   - 启用图片懒加载
   - 移除未使用的代码

## ⏰ 网站可用性监控

### 推荐服务

1. **UptimeRobot**（推荐）
   - 免费50个监控器
   - 5分钟检查间隔
   - 邮件/短信告警
   - 设置地址：https://uptimerobot.com

2. **Pingdom**
   - 免费1个监控器
   - 1分钟检查间隔
   - 性能监控
   - 设置地址：https://www.pingdom.com

3. **StatusCake**
   - 免费10个监控器
   - SSL证书监控
   - 设置地址：https://www.statuscake.com

### 监控配置

为以下URL设置监控：

```
主页: https://yourdomain.com
游戏页面: https://yourdomain.com/game.html
API端点: https://yourdomain.com/data/games.json
语言文件: https://yourdomain.com/languages/en.json
```

### 告警设置

配置以下告警条件：

- **响应时间** > 5秒
- **HTTP状态码** ≠ 200
- **关键词检查**：页面应包含"US Game Hub"
- **SSL证书**：30天内过期提醒

## 📊 监控仪表板

### 内置仪表板

访问 `monitoring/dashboard.html` 查看实时监控数据：

- 网站状态
- 响应时间
- 今日统计
- 错误监控

### 第三方仪表板

推荐使用以下服务创建综合仪表板：

1. **Google Data Studio**
   - 连接Google Analytics数据
   - 创建自定义报告
   - 免费使用

2. **Grafana**（高级用户）
   - 连接多个数据源
   - 高度可定制
   - 需要技术配置

## 🔔 告警配置

### 告警级别

- **严重**：网站完全无法访问
- **高**：响应时间 > 10秒，错误率 > 5%
- **中**：响应时间 > 5秒，错误率 > 1%
- **低**：性能下降，非关键错误

### 通知渠道

1. **邮件通知**
   - 所有级别的告警
   - 每日/周报告

2. **短信通知**（可选）
   - 仅严重和高级别告警
   - 使用Twilio等服务

3. **Webhook通知**
   - 集成Slack/Discord
   - 自动化响应

## 📈 数据分析和报告

### 关键指标(KPI)

监控以下关键指标：

1. **用户参与度**
   - 平均会话时长
   - 页面浏览深度
   - 游戏启动率

2. **技术性能**
   - 平均响应时间
   - 错误率
   - 可用性百分比

3. **业务指标**
   - 日活跃用户(DAU)
   - 用户留存率
   - 热门游戏排行

### 报告频率

- **实时监控**：网站状态、错误
- **每日报告**：流量、性能、错误汇总
- **每周报告**：趋势分析、用户行为
- **每月报告**：全面分析、优化建议

## 🔧 故障排除

### 常见问题

1. **Google Analytics数据不显示**
   - 检查测量ID是否正确
   - 确认代码已正确安装
   - 等待24小时数据处理

2. **错误监控不工作**
   - 检查控制台是否有JavaScript错误
   - 确认ErrorMonitor已正确初始化
   - 检查Sentry DSN配置

3. **性能监控异常**
   - 检查网络连接
   - 确认域名可访问
   - 检查防火墙设置

4. **告警过多**
   - 调整告警阈值
   - 过滤非关键错误
   - 设置告警频率限制

### 调试工具

1. **浏览器开发者工具**
   - Network标签：检查请求
   - Console标签：查看错误
   - Performance标签：性能分析

2. **在线工具**
   - PageSpeed Insights：性能评分
   - GTmetrix：详细性能分析
   - SSL Labs：SSL配置检查

## 🔒 隐私和合规

### GDPR合规

- 在隐私政策中说明数据收集
- 提供用户数据删除选项
- 匿名化IP地址

### 数据保护

```javascript
// Google Analytics隐私设置
gtag('config', 'GA_MEASUREMENT_ID', {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
});
```

## 📚 进阶配置

### 自定义指标

创建自定义指标跟踪业务特定数据：

```javascript
// 跟踪游戏完成率
analyticsManager.trackGameEvent('complete', gameId, gameTitle, category);

// 跟踪用户偏好
analyticsManager.setUserProperties({
    preferred_language: 'zh',
    favorite_category: 'puzzle'
});
```

### A/B测试

使用Google Optimize进行A/B测试：

1. 创建实验
2. 设置变体
3. 定义目标
4. 分析结果

### 高级分析

1. **用户路径分析**
   - 跟踪用户浏览路径
   - 识别流失点

2. **热力图分析**
   - 使用Hotjar或Clarity
   - 了解用户点击行为

3. **转化漏斗**
   - 分析用户转化路径
   - 优化关键步骤

---

## 📞 获取帮助

如果您在配置监控系统时遇到问题：

1. 查看浏览器控制台错误信息
2. 检查网络请求是否成功
3. 参考各服务的官方文档
4. 使用我们提供的调试工具

记住：良好的监控系统是网站成功运营的关键！