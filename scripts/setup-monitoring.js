#!/usr/bin/env node

/**
 * 监控设置助手脚本
 * 帮助用户配置各种监控和分析工具
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class MonitoringSetup {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.config = {};
        this.monitoringConfig = {};
    }

    /**
     * 询问用户输入
     */
    async askQuestion(question) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer.trim());
            });
        });
    }

    /**
     * 收集基本信息
     */
    async collectBasicInfo() {
        console.log('📊 监控和分析工具设置助手');
        console.log('='.repeat(50));
        
        this.config.domain = await this.askQuestion('请输入您的域名（例如：yourdomain.com）: ');
        this.config.email = await this.askQuestion('请输入管理员邮箱（用于接收告警）: ');
        
        if (!this.config.domain || !this.config.email) {
            console.log('❌ 域名和邮箱不能为空');
            process.exit(1);
        }
    }

    /**
     * 配置Google Analytics
     */
    async setupGoogleAnalytics() {
        console.log('\n📈 Google Analytics 配置');
        console.log('-'.repeat(30));
        
        const useGA = await this.askQuestion('是否配置Google Analytics？(y/n): ');
        
        if (useGA.toLowerCase() === 'y') {
            console.log('\n📋 Google Analytics 设置步骤：');
            console.log('1. 访问 https://analytics.google.com');
            console.log('2. 创建新的GA4属性');
            console.log('3. 获取测量ID（格式：G-XXXXXXXXXX）');
            
            const trackingId = await this.askQuestion('\n请输入您的Google Analytics测量ID: ');
            
            if (trackingId) {
                this.config.googleAnalytics = trackingId;
                this.updateHTMLWithGA(trackingId);
                console.log('✅ Google Analytics配置已添加');
            }
        }
    }

    /**
     * 配置错误监控
     */
    async setupErrorMonitoring() {
        console.log('\n🛡️ 错误监控配置');
        console.log('-'.repeat(30));
        
        const useSentry = await this.askQuestion('是否配置Sentry错误监控？(y/n): ');
        
        if (useSentry.toLowerCase() === 'y') {
            console.log('\n📋 Sentry 设置步骤：');
            console.log('1. 访问 https://sentry.io 注册账户');
            console.log('2. 创建新项目，选择JavaScript平台');
            console.log('3. 获取DSN（数据源名称）');
            
            const sentryDsn = await this.askQuestion('\n请输入Sentry DSN: ');
            
            if (sentryDsn) {
                this.config.sentryDsn = sentryDsn;
                this.createSentryConfig(sentryDsn);
                console.log('✅ Sentry配置已添加');
            }
        }
    }

    /**
     * 配置网站监控
     */
    async setupUptimeMonitoring() {
        console.log('\n⏰ 网站可用性监控配置');
        console.log('-'.repeat(30));
        
        console.log('推荐的免费监控服务：');
        console.log('1. UptimeRobot (50个监控器)');
        console.log('2. Pingdom (1个监控器)');
        console.log('3. StatusCake (10个监控器)');
        
        const service = await this.askQuestion('\n选择监控服务 (1-3): ');
        
        const services = {
            '1': 'uptimerobot',
            '2': 'pingdom',
            '3': 'statuscake'
        };
        
        if (services[service]) {
            this.config.uptimeService = services[service];
            this.generateUptimeInstructions(services[service]);
        }
    }

    /**
     * 配置性能监控
     */
    async setupPerformanceMonitoring() {
        console.log('\n⚡ 性能监控配置');
        console.log('-'.repeat(30));
        
        const usePerformance = await this.askQuestion('是否启用自动性能监控？(y/n): ');
        
        if (usePerformance.toLowerCase() === 'y') {
            this.config.performanceMonitoring = true;
            this.createPerformanceScript();
            console.log('✅ 性能监控脚本已创建');
        }
    }

    /**
     * 更新HTML文件添加Google Analytics
     */
    updateHTMLWithGA(trackingId) {
        const htmlFiles = ['index.html', 'game.html'];
        
        htmlFiles.forEach(file => {
            const filePath = path.join(__dirname, '..', file);
            if (fs.existsSync(filePath)) {
                let content = fs.readFileSync(filePath, 'utf8');
                
                // 添加GA meta标签
                const metaTag = `  <meta name="google-analytics" content="${trackingId}">`;
                content = content.replace(
                    /<meta name="viewport"[^>]*>/,
                    `$&\n${metaTag}`
                );
                
                // 添加GA脚本（如果还没有）
                if (!content.includes('gtag')) {
                    const gaScript = `
  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${trackingId}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${trackingId}', {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
  </script>`;
                    
                    content = content.replace('</head>', `${gaScript}\n</head>`);
                }
                
                fs.writeFileSync(filePath, content);
            }
        });
    }

    /**
     * 创建Sentry配置
     */
    createSentryConfig(dsn) {
        const sentryConfig = `
/**
 * Sentry错误监控配置
 */

// 加载Sentry SDK
const script = document.createElement('script');
script.src = 'https://browser.sentry-cdn.com/7.0.0/bundle.min.js';
script.onload = function() {
    Sentry.init({
        dsn: '${dsn}',
        environment: '${this.config.domain.includes('localhost') ? 'development' : 'production'}',
        integrations: [
            new Sentry.BrowserTracing(),
        ],
        tracesSampleRate: 1.0,
        beforeSend(event) {
            // 过滤掉一些不重要的错误
            if (event.exception) {
                const error = event.exception.values[0];
                if (error.value && error.value.includes('ResizeObserver')) {
                    return null;
                }
            }
            return event;
        }
    });
    
    console.log('✅ Sentry错误监控已启用');
};
document.head.appendChild(script);
`;

        const configPath = path.join(__dirname, '..', 'js', 'config', 'sentry.js');
        const configDir = path.dirname(configPath);
        
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        
        fs.writeFileSync(configPath, sentryConfig);
    }

    /**
     * 生成网站监控说明
     */
    generateUptimeInstructions(service) {
        const instructions = {
            uptimerobot: {
                name: 'UptimeRobot',
                url: 'https://uptimerobot.com',
                steps: [
                    '1. 注册UptimeRobot账户',
                    '2. 点击"Add New Monitor"',
                    '3. 选择"HTTP(s)"类型',
                    `4. 输入URL: https://${this.config.domain}`,
                    '5. 设置监控间隔为5分钟',
                    '6. 添加邮箱告警联系人',
                    '7. 可选：添加关键词监控"US Game Hub"'
                ]
            },
            pingdom: {
                name: 'Pingdom',
                url: 'https://www.pingdom.com',
                steps: [
                    '1. 注册Pingdom账户',
                    '2. 创建新的Uptime Check',
                    `3. 输入URL: https://${this.config.domain}`,
                    '4. 选择检查位置',
                    '5. 设置告警联系人',
                    '6. 启用性能监控'
                ]
            },
            statuscake: {
                name: 'StatusCake',
                url: 'https://www.statuscake.com',
                steps: [
                    '1. 注册StatusCake账户',
                    '2. 创建新的Uptime Test',
                    `3. 输入URL: https://${this.config.domain}`,
                    '4. 设置检查间隔',
                    '5. 配置告警设置',
                    '6. 可选：添加SSL监控'
                ]
            }
        };

        const instruction = instructions[service];
        if (instruction) {
            console.log(`\n📋 ${instruction.name} 设置步骤：`);
            console.log(`访问: ${instruction.url}`);
            instruction.steps.forEach(step => console.log(step));
        }
    }

    /**
     * 创建性能监控脚本
     */
    createPerformanceScript() {
        const script = `#!/bin/bash

# 自动性能监控脚本
# 定期检查网站性能并生成报告

DOMAIN="${this.config.domain}"
EMAIL="${this.config.email}"
LOG_FILE="performance-log.txt"

echo "🚀 开始性能检查: \$(date)" >> \$LOG_FILE

# 使用curl检查响应时间
RESPONSE_TIME=\$(curl -o /dev/null -s -w '%{time_total}' https://\$DOMAIN)
echo "响应时间: \${RESPONSE_TIME}s" >> \$LOG_FILE

# 检查HTTP状态码
STATUS_CODE=\$(curl -o /dev/null -s -w '%{http_code}' https://\$DOMAIN)
echo "状态码: \$STATUS_CODE" >> \$LOG_FILE

# 如果响应时间过长或状态码异常，发送告警
if (( \$(echo "\$RESPONSE_TIME > 5.0" | bc -l) )) || [ "\$STATUS_CODE" != "200" ]; then
    echo "⚠️ 性能告警: 响应时间 \${RESPONSE_TIME}s, 状态码 \$STATUS_CODE" >> \$LOG_FILE
    # 这里可以添加邮件发送逻辑
fi

echo "检查完成: \$(date)" >> \$LOG_FILE
echo "---" >> \$LOG_FILE
`;

        const scriptPath = path.join(__dirname, 'performance-check.sh');
        fs.writeFileSync(scriptPath, script);
        fs.chmodSync(scriptPath, '755');
        
        console.log('📝 性能监控脚本已创建: scripts/performance-check.sh');
        console.log('💡 可以使用cron定期运行: */15 * * * * /path/to/performance-check.sh');
    }

    /**
     * 生成监控仪表板HTML
     */
    generateDashboard() {
        const dashboardHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>US Game Hub - 监控仪表板</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .card h3 { margin-top: 0; color: #333; }
        .status { padding: 5px 10px; border-radius: 4px; color: white; font-weight: bold; }
        .status.online { background: #4CAF50; }
        .status.offline { background: #f44336; }
        .metric { display: flex; justify-content: space-between; margin: 10px 0; }
        .metric-value { font-weight: bold; color: #2196F3; }
    </style>
</head>
<body>
    <h1>🎮 US Game Hub 监控仪表板</h1>
    
    <div class="dashboard">
        <div class="card">
            <h3>🌐 网站状态</h3>
            <div class="metric">
                <span>主站状态:</span>
                <span class="status online" id="main-status">在线</span>
            </div>
            <div class="metric">
                <span>响应时间:</span>
                <span class="metric-value" id="response-time">加载中...</span>
            </div>
            <div class="metric">
                <span>最后检查:</span>
                <span id="last-check">加载中...</span>
            </div>
        </div>
        
        <div class="card">
            <h3>📊 今日统计</h3>
            <div class="metric">
                <span>页面浏览量:</span>
                <span class="metric-value" id="page-views">-</span>
            </div>
            <div class="metric">
                <span>独立访客:</span>
                <span class="metric-value" id="unique-visitors">-</span>
            </div>
            <div class="metric">
                <span>游戏启动次数:</span>
                <span class="metric-value" id="game-starts">-</span>
            </div>
        </div>
        
        <div class="card">
            <h3>⚡ 性能指标</h3>
            <div class="metric">
                <span>平均加载时间:</span>
                <span class="metric-value" id="avg-load-time">-</span>
            </div>
            <div class="metric">
                <span>首字节时间:</span>
                <span class="metric-value" id="ttfb">-</span>
            </div>
            <div class="metric">
                <span>可用性:</span>
                <span class="metric-value" id="uptime">-</span>
            </div>
        </div>
        
        <div class="card">
            <h3>🛡️ 错误监控</h3>
            <div class="metric">
                <span>今日错误数:</span>
                <span class="metric-value" id="error-count">-</span>
            </div>
            <div class="metric">
                <span>错误率:</span>
                <span class="metric-value" id="error-rate">-</span>
            </div>
            <div class="metric">
                <span>最后错误:</span>
                <span id="last-error">无</span>
            </div>
        </div>
    </div>
    
    <script>
        // 简单的监控数据获取
        async function updateMetrics() {
            try {
                const start = Date.now();
                const response = await fetch('https://${this.config.domain}');
                const responseTime = Date.now() - start;
                
                document.getElementById('response-time').textContent = responseTime + 'ms';
                document.getElementById('last-check').textContent = new Date().toLocaleString();
                
                if (response.ok) {
                    document.getElementById('main-status').textContent = '在线';
                    document.getElementById('main-status').className = 'status online';
                } else {
                    document.getElementById('main-status').textContent = '异常';
                    document.getElementById('main-status').className = 'status offline';
                }
            } catch (error) {
                document.getElementById('main-status').textContent = '离线';
                document.getElementById('main-status').className = 'status offline';
                document.getElementById('response-time').textContent = '超时';
            }
        }
        
        // 初始加载和定期更新
        updateMetrics();
        setInterval(updateMetrics, 60000); // 每分钟更新一次
    </script>
</body>
</html>`;

        const dashboardPath = path.join(__dirname, '..', 'monitoring', 'dashboard.html');
        const monitoringDir = path.dirname(dashboardPath);
        
        if (!fs.existsSync(monitoringDir)) {
            fs.mkdirSync(monitoringDir, { recursive: true });
        }
        
        fs.writeFileSync(dashboardPath, dashboardHTML);
        console.log('✅ 监控仪表板已创建: monitoring/dashboard.html');
    }

    /**
     * 生成配置总结
     */
    generateSummary() {
        console.log('\n📋 配置总结');
        console.log('='.repeat(50));
        console.log(`域名: ${this.config.domain}`);
        console.log(`管理员邮箱: ${this.config.email}`);
        
        if (this.config.googleAnalytics) {
            console.log(`Google Analytics: ${this.config.googleAnalytics}`);
        }
        
        if (this.config.sentryDsn) {
            console.log('Sentry错误监控: 已配置');
        }
        
        if (this.config.uptimeService) {
            console.log(`网站监控: ${this.config.uptimeService}`);
        }
        
        if (this.config.performanceMonitoring) {
            console.log('性能监控: 已启用');
        }
    }

    /**
     * 显示后续步骤
     */
    showNextSteps() {
        console.log('\n🚀 后续步骤');
        console.log('='.repeat(50));
        console.log('1. 提交并推送配置文件到GitHub');
        console.log('   git add .');
        console.log('   git commit -m "添加监控和分析配置"');
        console.log('   git push');
        console.log('');
        console.log('2. 根据上面的说明配置各项监控服务');
        console.log('');
        console.log('3. 测试监控配置');
        console.log('   node scripts/performance-monitor.js ' + this.config.domain);
        console.log('');
        console.log('4. 访问监控仪表板');
        console.log('   打开 monitoring/dashboard.html');
        console.log('');
        console.log('5. 设置定期检查（可选）');
        console.log('   配置cron任务运行性能检查脚本');
    }

    /**
     * 运行设置流程
     */
    async run() {
        try {
            await this.collectBasicInfo();
            await this.setupGoogleAnalytics();
            await this.setupErrorMonitoring();
            await this.setupUptimeMonitoring();
            await this.setupPerformanceMonitoring();
            
            this.generateDashboard();
            this.generateSummary();
            this.showNextSteps();
            
        } catch (error) {
            console.error('❌ 设置过程中出现错误:', error.message);
        } finally {
            this.rl.close();
        }
    }
}

// 运行脚本
if (require.main === module) {
    const setup = new MonitoringSetup();
    setup.run();
}

module.exports = MonitoringSetup;