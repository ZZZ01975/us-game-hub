/**
 * 自动化测试运行脚本
 * 使用Node.js和Puppeteer运行无头浏览器测试
 */

const fs = require('fs');
const path = require('path');

// 检查是否安装了puppeteer
let puppeteer;
try {
    puppeteer = require('puppeteer');
} catch (error) {
    console.error('请先安装puppeteer: npm install puppeteer');
    process.exit(1);
}

class TestRunner {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            unit: null,
            integration: null
        };
    }

    /**
     * 初始化浏览器
     */
    async init() {
        console.log('启动浏览器...');
        this.browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        
        // 设置视口大小
        await this.page.setViewport({ width: 1280, height: 720 });
        
        // 监听控制台输出
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error('浏览器错误:', msg.text());
            }
        });
    }

    /**
     * 运行单元测试
     */
    async runUnitTests() {
        console.log('运行单元测试...');
        
        const testUrl = `file://${path.resolve(__dirname, 'unit/test-runner.html')}`;
        await this.page.goto(testUrl, { waitUntil: 'networkidle0' });
        
        // 等待测试框架加载
        await this.page.waitForSelector('#run-all-btn', { timeout: 10000 });
        
        // 点击运行所有测试按钮
        await this.page.click('#run-all-btn');
        
        // 等待测试完成
        await this.page.waitForFunction(() => {
            const button = document.getElementById('run-all-btn');
            return button && !button.disabled;
        }, { timeout: 60000 });
        
        // 获取测试结果
        const results = await this.page.evaluate(() => {
            const totalTests = parseInt(document.getElementById('total-tests').textContent) || 0;
            const passedTests = parseInt(document.getElementById('passed-tests').textContent) || 0;
            const failedTests = parseInt(document.getElementById('failed-tests').textContent) || 0;
            const duration = document.getElementById('test-duration').textContent || '0ms';
            
            // 获取失败的测试详情
            const failedTestDetails = [];
            document.querySelectorAll('.test-case').forEach(testCase => {
                const status = testCase.querySelector('.test-status');
                if (status && status.classList.contains('status-fail')) {
                    const name = testCase.querySelector('.test-name').textContent;
                    const error = testCase.querySelector('.test-error');
                    failedTestDetails.push({
                        name,
                        error: error ? error.textContent : '未知错误'
                    });
                }
            });
            
            return {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                duration,
                failedTests: failedTestDetails
            };
        });
        
        this.results.unit = results;
        return results;
    }

    /**
     * 运行集成测试
     */
    async runIntegrationTests() {
        console.log('运行集成测试...');
        
        const testUrl = `file://${path.resolve(__dirname, 'integration/integration-test.html')}`;
        await this.page.goto(testUrl, { waitUntil: 'networkidle0' });
        
        // 等待测试框架加载
        await this.page.waitForSelector('#run-all-btn', { timeout: 10000 });
        
        // 点击运行所有测试按钮
        await this.page.click('#run-all-btn');
        
        // 等待测试完成（集成测试可能需要更长时间）
        await this.page.waitForFunction(() => {
            const summary = document.querySelector('.summary');
            return summary !== null;
        }, { timeout: 120000 });
        
        // 获取测试结果
        const results = await this.page.evaluate(() => {
            const summary = document.querySelector('.summary');
            if (!summary) return null;
            
            const stats = summary.querySelectorAll('.stat-number');
            const total = parseInt(stats[0]?.textContent) || 0;
            const passed = parseInt(stats[1]?.textContent) || 0;
            const failed = parseInt(stats[2]?.textContent) || 0;
            
            // 获取失败的测试详情
            const failedTestDetails = [];
            document.querySelectorAll('.test-item').forEach(testItem => {
                const status = testItem.querySelector('.test-status');
                if (status && status.classList.contains('status-fail')) {
                    const name = testItem.querySelector('.test-name').textContent;
                    const details = testItem.querySelector('.test-details.error-details');
                    failedTestDetails.push({
                        name,
                        error: details ? details.textContent : '未知错误'
                    });
                }
            });
            
            return {
                total,
                passed,
                failed,
                failedTests: failedTestDetails
            };
        });
        
        this.results.integration = results;
        return results;
    }

    /**
     * 生成测试报告
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                unitTests: this.results.unit,
                integrationTests: this.results.integration
            },
            overall: {
                totalTests: (this.results.unit?.total || 0) + (this.results.integration?.total || 0),
                totalPassed: (this.results.unit?.passed || 0) + (this.results.integration?.passed || 0),
                totalFailed: (this.results.unit?.failed || 0) + (this.results.integration?.failed || 0)
            }
        };
        
        // 计算成功率
        report.overall.successRate = report.overall.totalTests > 0 ? 
            Math.round((report.overall.totalPassed / report.overall.totalTests) * 100) : 0;
        
        return report;
    }

    /**
     * 保存测试报告
     */
    async saveReport(report) {
        const reportPath = path.join(__dirname, 'test-report.json');
        await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(`测试报告已保存到: ${reportPath}`);
        
        // 生成HTML报告
        const htmlReport = this.generateHTMLReport(report);
        const htmlReportPath = path.join(__dirname, 'test-report.html');
        await fs.promises.writeFile(htmlReportPath, htmlReport);
        console.log(`HTML测试报告已保存到: ${htmlReportPath}`);
    }

    /**
     * 生成HTML测试报告
     */
    generateHTMLReport(report) {
        return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>US Game Hub 测试报告</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .summary {
            padding: 30px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #667eea;
        }
        .stat-card.success {
            border-left-color: #28a745;
        }
        .stat-card.danger {
            border-left-color: #dc3545;
        }
        .stat-number {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-label {
            color: #666;
            font-size: 14px;
        }
        .section {
            padding: 30px;
            border-top: 1px solid #eee;
        }
        .section h2 {
            margin: 0 0 20px 0;
            color: #333;
        }
        .test-results {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        .test-group {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
        }
        .test-group h3 {
            margin: 0 0 15px 0;
            color: #495057;
        }
        .test-item {
            padding: 10px 0;
            border-bottom: 1px solid #dee2e6;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .test-item:last-child {
            border-bottom: none;
        }
        .status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }
        .status-pass {
            background: #d4edda;
            color: #155724;
        }
        .status-fail {
            background: #f8d7da;
            color: #721c24;
        }
        .failed-tests {
            margin-top: 20px;
        }
        .failed-test {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 10px;
        }
        .failed-test h4 {
            margin: 0 0 10px 0;
            color: #721c24;
        }
        .failed-test pre {
            background: #fff;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 12px;
            margin: 0;
        }
        .footer {
            padding: 20px 30px;
            background: #f8f9fa;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        @media (max-width: 768px) {
            .test-results {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>US Game Hub 测试报告</h1>
            <p>生成时间: ${new Date(report.timestamp).toLocaleString('zh-CN')}</p>
        </div>
        
        <div class="summary">
            <div class="stat-card">
                <div class="stat-number">${report.overall.totalTests}</div>
                <div class="stat-label">总测试数</div>
            </div>
            <div class="stat-card success">
                <div class="stat-number">${report.overall.totalPassed}</div>
                <div class="stat-label">通过测试</div>
            </div>
            <div class="stat-card danger">
                <div class="stat-number">${report.overall.totalFailed}</div>
                <div class="stat-label">失败测试</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.overall.successRate}%</div>
                <div class="stat-label">成功率</div>
            </div>
        </div>
        
        <div class="section">
            <h2>测试结果详情</h2>
            <div class="test-results">
                <div class="test-group">
                    <h3>单元测试</h3>
                    <div class="test-item">
                        <span>总测试数</span>
                        <span>${report.summary.unitTests?.total || 0}</span>
                    </div>
                    <div class="test-item">
                        <span>通过</span>
                        <span class="status-badge status-pass">${report.summary.unitTests?.passed || 0}</span>
                    </div>
                    <div class="test-item">
                        <span>失败</span>
                        <span class="status-badge status-fail">${report.summary.unitTests?.failed || 0}</span>
                    </div>
                    <div class="test-item">
                        <span>耗时</span>
                        <span>${report.summary.unitTests?.duration || '0ms'}</span>
                    </div>
                </div>
                
                <div class="test-group">
                    <h3>集成测试</h3>
                    <div class="test-item">
                        <span>总测试数</span>
                        <span>${report.summary.integrationTests?.total || 0}</span>
                    </div>
                    <div class="test-item">
                        <span>通过</span>
                        <span class="status-badge status-pass">${report.summary.integrationTests?.passed || 0}</span>
                    </div>
                    <div class="test-item">
                        <span>失败</span>
                        <span class="status-badge status-fail">${report.summary.integrationTests?.failed || 0}</span>
                    </div>
                </div>
            </div>
        </div>
        
        ${this.generateFailedTestsSection(report)}
        
        <div class="footer">
            <p>US Game Hub 自动化测试报告 - 由测试框架自动生成</p>
        </div>
    </div>
</body>
</html>`;
    }

    /**
     * 生成失败测试部分
     */
    generateFailedTestsSection(report) {
        const unitFailures = report.summary.unitTests?.failedTests || [];
        const integrationFailures = report.summary.integrationTests?.failedTests || [];
        
        if (unitFailures.length === 0 && integrationFailures.length === 0) {
            return '';
        }

        let html = '<div class="section"><h2>失败测试详情</h2><div class="failed-tests">';
        
        if (unitFailures.length > 0) {
            html += '<h3>单元测试失败</h3>';
            unitFailures.forEach(test => {
                html += `
                    <div class="failed-test">
                        <h4>${test.name}</h4>
                        <pre>${test.error}</pre>
                    </div>
                `;
            });
        }
        
        if (integrationFailures.length > 0) {
            html += '<h3>集成测试失败</h3>';
            integrationFailures.forEach(test => {
                html += `
                    <div class="failed-test">
                        <h4>${test.name}</h4>
                        <pre>${test.error}</pre>
                    </div>
                `;
            });
        }
        
        html += '</div></div>';
        return html;
    }

    /**
     * 打印测试结果
     */
    printResults(report) {
        console.log('\n=== 测试结果摘要 ===');
        console.log(`总测试数: ${report.overall.totalTests}`);
        console.log(`通过: ${report.overall.totalPassed}`);
        console.log(`失败: ${report.overall.totalFailed}`);
        console.log(`成功率: ${report.overall.successRate}%`);
        
        if (report.summary.unitTests) {
            console.log('\n--- 单元测试 ---');
            console.log(`总数: ${report.summary.unitTests.total}`);
            console.log(`通过: ${report.summary.unitTests.passed}`);
            console.log(`失败: ${report.summary.unitTests.failed}`);
            console.log(`耗时: ${report.summary.unitTests.duration}`);
        }
        
        if (report.summary.integrationTests) {
            console.log('\n--- 集成测试 ---');
            console.log(`总数: ${report.summary.integrationTests.total}`);
            console.log(`通过: ${report.summary.integrationTests.passed}`);
            console.log(`失败: ${report.summary.integrationTests.failed}`);
        }
        
        // 打印失败的测试
        const allFailures = [
            ...(report.summary.unitTests?.failedTests || []),
            ...(report.summary.integrationTests?.failedTests || [])
        ];
        
        if (allFailures.length > 0) {
            console.log('\n--- 失败的测试 ---');
            allFailures.forEach(test => {
                console.log(`❌ ${test.name}`);
                console.log(`   错误: ${test.error}`);
            });
        }
    }

    /**
     * 清理资源
     */
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    /**
     * 运行所有测试
     */
    async runAll() {
        try {
            await this.init();
            
            // 运行单元测试
            await this.runUnitTests();
            console.log('✅ 单元测试完成');
            
            // 运行集成测试
            await this.runIntegrationTests();
            console.log('✅ 集成测试完成');
            
            // 生成报告
            const report = this.generateReport();
            await this.saveReport(report);
            
            // 打印结果
            this.printResults(report);
            
            // 返回退出码
            return report.overall.totalFailed === 0 ? 0 : 1;
            
        } catch (error) {
            console.error('测试运行失败:', error);
            return 1;
        } finally {
            await this.cleanup();
        }
    }
}

// 主函数
async function main() {
    const runner = new TestRunner();
    const exitCode = await runner.runAll();
    process.exit(exitCode);
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(error => {
        console.error('运行测试时发生错误:', error);
        process.exit(1);
    });
}

module.exports = TestRunner;