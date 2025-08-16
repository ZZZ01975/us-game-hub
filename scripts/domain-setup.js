#!/usr/bin/env node

/**
 * 域名配置助手脚本
 * 帮助用户配置自定义域名和CDN设置
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class DomainSetupHelper {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.config = {};
    }

    // 询问用户输入
    async askQuestion(question) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer.trim());
            });
        });
    }

    // 收集域名信息
    async collectDomainInfo() {
        console.log('🌐 域名配置助手');
        console.log('='.repeat(50));
        
        this.config.domain = await this.askQuestion('请输入您的域名（例如：yourdomain.com）: ');
        
        if (!this.config.domain) {
            console.log('❌ 域名不能为空');
            process.exit(1);
        }

        this.config.githubUsername = await this.askQuestion('请输入您的GitHub用户名: ');
        this.config.repoName = await this.askQuestion('请输入仓库名称（默认：us-game-hub）: ') || 'us-game-hub';
        
        const useCloudflare = await this.askQuestion('是否使用Cloudflare CDN？(y/n): ');
        this.config.useCloudflare = useCloudflare.toLowerCase() === 'y';
        
        if (this.config.useCloudflare) {
            console.log('\n📋 Cloudflare配置信息：');
            console.log('1. 请先在Cloudflare添加您的域名');
            console.log('2. 配置DNS记录指向GitHub Pages');
            console.log('3. 启用代理状态（橙色云朵）');
        }
    }

    // 创建CNAME文件
    createCNAMEFile() {
        const cnameContent = this.config.domain;
        const cnamePath = path.join(__dirname, '..', 'CNAME');
        
        fs.writeFileSync(cnamePath, cnameContent);
        console.log(`✅ 已创建CNAME文件: ${this.config.domain}`);
    }

    // 更新配置文件
    updateConfigFiles() {
        // 更新_config.yml
        const configPath = path.join(__dirname, '..', '_config.yml');
        if (fs.existsSync(configPath)) {
            let configContent = fs.readFileSync(configPath, 'utf8');
            
            // 更新URL
            configContent = configContent.replace(
                /url: ".*"/,
                `url: "https://${this.config.domain}"`
            );
            
            // 更新baseurl（自定义域名通常不需要baseurl）
            configContent = configContent.replace(
                /baseurl: ".*"/,
                'baseurl: ""'
            );
            
            fs.writeFileSync(configPath, configContent);
            console.log('✅ 已更新_config.yml配置');
        }

        // 更新部署文档
        this.updateDeploymentDocs();
    }

    // 更新部署文档
    updateDeploymentDocs() {
        const deploymentPath = path.join(__dirname, '..', 'DEPLOYMENT.md');
        if (fs.existsSync(deploymentPath)) {
            let content = fs.readFileSync(deploymentPath, 'utf8');
            
            // 替换示例域名
            content = content.replace(/yourdomain\.com/g, this.config.domain);
            content = content.replace(/yourusername/g, this.config.githubUsername);
            
            fs.writeFileSync(deploymentPath, content);
            console.log('✅ 已更新部署文档');
        }
    }

    // 生成DNS配置说明
    generateDNSInstructions() {
        console.log('\n📋 DNS配置说明：');
        console.log('='.repeat(50));
        
        if (this.config.useCloudflare) {
            console.log('Cloudflare DNS记录配置：');
            console.log(`类型: CNAME`);
            console.log(`名称: @`);
            console.log(`内容: ${this.config.githubUsername}.github.io`);
            console.log(`代理状态: 已代理（橙色云朵）`);
            console.log('');
            console.log(`类型: CNAME`);
            console.log(`名称: www`);
            console.log(`内容: ${this.config.githubUsername}.github.io`);
            console.log(`代理状态: 已代理（橙色云朵）`);
        } else {
            console.log('标准DNS记录配置：');
            console.log(`类型: CNAME`);
            console.log(`名称: @`);
            console.log(`内容: ${this.config.githubUsername}.github.io`);
            console.log('');
            console.log(`类型: CNAME`);
            console.log(`名称: www`);
            console.log(`内容: ${this.config.githubUsername}.github.io`);
        }
    }

    // 生成验证脚本
    generateVerificationScript() {
        const scriptContent = `#!/bin/bash

# 域名配置验证脚本
# 检查域名是否正确配置

echo "🔍 验证域名配置..."
echo "域名: ${this.config.domain}"
echo ""

# 检查DNS解析
echo "📡 检查DNS解析..."
nslookup ${this.config.domain}
echo ""

# 检查HTTPS访问
echo "🔒 检查HTTPS访问..."
curl -I https://${this.config.domain} 2>/dev/null | head -1
echo ""

# 检查重定向
echo "🔄 检查www重定向..."
curl -I https://www.${this.config.domain} 2>/dev/null | head -1
echo ""

echo "✅ 验证完成"
echo "如果看到200 OK响应，说明配置成功"
`;

        const scriptPath = path.join(__dirname, 'verify-domain.sh');
        fs.writeFileSync(scriptPath, scriptContent);
        fs.chmodSync(scriptPath, '755');
        
        console.log('✅ 已生成域名验证脚本: scripts/verify-domain.sh');
    }

    // 生成Cloudflare配置模板
    generateCloudflareConfig() {
        if (!this.config.useCloudflare) return;

        const configTemplate = {
            domain: this.config.domain,
            dns_records: [
                {
                    type: "CNAME",
                    name: "@",
                    content: `${this.config.githubUsername}.github.io`,
                    proxied: true
                },
                {
                    type: "CNAME",
                    name: "www",
                    content: `${this.config.githubUsername}.github.io`,
                    proxied: true
                }
            ],
            page_rules: [
                {
                    url: `${this.config.domain}/assets/*`,
                    settings: {
                        cache_level: "cache_everything",
                        edge_cache_ttl: 2592000,
                        browser_cache_ttl: 2592000
                    }
                },
                {
                    url: `${this.config.domain}/games/*`,
                    settings: {
                        cache_level: "cache_everything",
                        edge_cache_ttl: 604800,
                        browser_cache_ttl: 604800
                    }
                }
            ],
            security_settings: {
                ssl_mode: "full_strict",
                always_use_https: true,
                automatic_https_rewrites: true,
                security_level: "medium"
            }
        };

        const configPath = path.join(__dirname, 'cloudflare-config.json');
        fs.writeFileSync(configPath, JSON.stringify(configTemplate, null, 2));
        
        console.log('✅ 已生成Cloudflare配置模板: scripts/cloudflare-config.json');
    }

    // 显示后续步骤
    showNextSteps() {
        console.log('\n🚀 后续步骤：');
        console.log('='.repeat(50));
        console.log('1. 提交并推送CNAME文件到GitHub');
        console.log('   git add CNAME');
        console.log('   git commit -m "添加自定义域名配置"');
        console.log('   git push');
        console.log('');
        console.log('2. 在域名注册商配置DNS记录');
        console.log('   （参考上面的DNS配置说明）');
        console.log('');
        
        if (this.config.useCloudflare) {
            console.log('3. 在Cloudflare配置CDN和安全设置');
            console.log('   参考文档: docs/CLOUDFLARE_SETUP.md');
            console.log('');
        }
        
        console.log('4. 等待DNS传播（通常24-48小时）');
        console.log('');
        console.log('5. 验证配置是否成功');
        console.log('   bash scripts/verify-domain.sh');
        console.log('');
        console.log(`6. 访问您的网站: https://${this.config.domain}`);
    }

    // 运行配置流程
    async run() {
        try {
            await this.collectDomainInfo();
            
            console.log('\n⚙️ 生成配置文件...');
            this.createCNAMEFile();
            this.updateConfigFiles();
            this.generateDNSInstructions();
            this.generateVerificationScript();
            this.generateCloudflareConfig();
            
            this.showNextSteps();
            
        } catch (error) {
            console.error('❌ 配置过程中出现错误:', error.message);
        } finally {
            this.rl.close();
        }
    }
}

// 运行脚本
if (require.main === module) {
    const helper = new DomainSetupHelper();
    helper.run();
}

module.exports = DomainSetupHelper;