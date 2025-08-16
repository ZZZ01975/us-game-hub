# Cloudflare CDN 配置指南

本文档详细说明如何为US Game Hub配置Cloudflare CDN加速和安全防护。

## 🌐 为什么使用Cloudflare

### 优势
- **全球CDN加速**：200+个数据中心，提升访问速度
- **DDoS防护**：自动防御网络攻击
- **SSL证书**：免费SSL/TLS加密
- **缓存优化**：智能缓存静态资源
- **中国访问优化**：通过CDN改善中国用户访问体验

### 免费版功能
- 无限带宽
- 全球CDN
- DDoS防护
- SSL证书
- 基础分析

## 🚀 配置步骤

### 步骤1：注册Cloudflare账户

1. 访问 [cloudflare.com](https://www.cloudflare.com)
2. 点击"Sign Up"注册账户
3. 验证邮箱地址

### 步骤2：添加网站

1. 登录Cloudflare控制台
2. 点击"Add a Site"
3. 输入您的域名（例如：yourdomain.com）
4. 选择"Free"计划
5. 点击"Continue"

### 步骤3：配置DNS记录

添加以下DNS记录：

#### 主域名记录
```
类型: CNAME
名称: @
内容: yourusername.github.io
代理状态: 已代理（橙色云朵）
```

#### www子域名记录
```
类型: CNAME
名称: www
内容: yourusername.github.io
代理状态: 已代理（橙色云朵）
```

#### GitHub Pages验证记录（如果需要）
```
类型: TXT
名称: @
内容: github-pages-verification=your-verification-code
```

### 步骤4：更新域名服务器

1. 复制Cloudflare提供的名称服务器
2. 登录您的域名注册商控制面板
3. 将域名的名称服务器更改为Cloudflare的服务器
4. 等待DNS传播（通常24-48小时）

### 步骤5：SSL/TLS配置

1. 进入"SSL/TLS"标签
2. 选择"Full (strict)"加密模式
3. 启用"Always Use HTTPS"
4. 启用"Automatic HTTPS Rewrites"

## ⚙️ 性能优化设置

### 缓存配置

进入"Caching"标签：

1. **缓存级别**：选择"Standard"
2. **浏览器缓存TTL**：选择"4 hours"
3. **开发模式**：部署时关闭

### 页面规则设置

创建以下页面规则（Page Rules）：

#### 规则1：静态资源缓存
```
URL模式: yourdomain.com/assets/*
设置:
- 缓存级别: Cache Everything
- 边缘缓存TTL: 1 month
- 浏览器缓存TTL: 1 month
```

#### 规则2：游戏文件缓存
```
URL模式: yourdomain.com/games/*
设置:
- 缓存级别: Cache Everything
- 边缘缓存TTL: 1 week
- 浏览器缓存TTL: 1 week
```

#### 规则3：HTML文件缓存
```
URL模式: yourdomain.com/*.html
设置:
- 缓存级别: Cache Everything
- 边缘缓存TTL: 2 hours
- 浏览器缓存TTL: 2 hours
```

### Speed优化

进入"Speed"标签：

1. **Auto Minify**：启用HTML、CSS、JavaScript
2. **Brotli**：启用压缩
3. **Early Hints**：启用（如果可用）

## 🛡️ 安全设置

### 防火墙规则

进入"Security"标签：

1. **安全级别**：选择"Medium"
2. **挑战通过时间**：选择"30 minutes"

### Bot Fight Mode

启用"Bot Fight Mode"以防止恶意机器人。

### 热链接保护

启用"Hotlink Protection"防止图片被盗链。

## 📊 分析和监控

### Analytics

Cloudflare提供免费的网站分析：

1. 访问量统计
2. 带宽使用情况
3. 威胁阻止统计
4. 性能指标

### 实时日志

查看实时访问日志和安全事件。

## 🇨🇳 中国访问优化

### 特殊配置

由于网络环境特殊，为中国用户优化：

1. **启用中国网络**：如果有企业版，可启用中国数据中心
2. **优化路由**：使用Argo Smart Routing（付费功能）
3. **本地化内容**：考虑使用中国CDN服务商作为补充

### 备用方案

如果Cloudflare在某些地区访问不佳：

1. 使用多个CDN提供商
2. 配置智能DNS解析
3. 提供直连GitHub Pages的备用链接

## 🔧 高级配置

### Workers脚本

创建Cloudflare Workers脚本进行高级优化：

```javascript
// 示例：添加安全头部
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const response = await fetch(request)
  
  // 添加安全头部
  const newHeaders = new Headers(response.headers)
  newHeaders.set('X-Frame-Options', 'DENY')
  newHeaders.set('X-Content-Type-Options', 'nosniff')
  newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  })
}
```

### 自定义错误页面

上传自定义的404、500等错误页面。

## 📱 移动端优化

### AMP支持

如果使用AMP页面，启用AMP缓存。

### 图片优化

启用"Polish"功能自动优化图片（付费功能）。

## 🔍 故障排除

### 常见问题

**问题1：网站无法访问**
- 检查DNS记录是否正确
- 确认代理状态已启用
- 等待DNS传播完成

**问题2：SSL证书错误**
- 检查SSL/TLS模式设置
- 确认GitHub Pages支持HTTPS
- 清除浏览器缓存

**问题3：缓存问题**
- 使用"Purge Cache"清除缓存
- 检查页面规则配置
- 确认缓存设置正确

### 测试工具

使用以下工具测试配置：

1. **DNS检查**：`nslookup yourdomain.com`
2. **SSL测试**：SSL Labs SSL Test
3. **速度测试**：GTmetrix、PageSpeed Insights
4. **CDN测试**：CDN Planet

## 📈 性能监控

### 关键指标

监控以下性能指标：

1. **页面加载时间**：目标 < 3秒
2. **首字节时间(TTFB)**：目标 < 200ms
3. **缓存命中率**：目标 > 90%
4. **带宽节省**：通过压缩和缓存

### 优化建议

1. 定期检查缓存命中率
2. 监控错误日志
3. 分析访问模式
4. 根据数据调整配置

## 💰 成本考虑

### 免费版限制

- 页面规则：3个
- Workers请求：100,000/天
- 分析数据：24小时

### 升级建议

考虑升级Pro版本如果需要：
- 更多页面规则
- 图片优化
- 高级分析
- 优先支持

---

**注意：** 请将所有示例中的域名和用户名替换为您的实际信息。