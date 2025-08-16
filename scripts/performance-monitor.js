#!/usr/bin/env node

/**
 * 网站性能监控脚本
 * 检查网站的加载速度、CDN性能等指标
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

class PerformanceMonitor {
    constructor(domain) {
        this.domain = domain;
        this.results = {
            dns: null,
            ssl: null,
            ttfb: null,
            loadTime: null,
            contentSize: null,
            cacheHeaders: {},
            errors: []
        };
    }

    // 测试DNS解析时间
    async testDNS() {
        const start = Date.now();
        return new Promise((resolve) => {
            const dns = require('dns');
            dns.lookup(this.domain, (err, address) => {
                const time = Date.now() - start;
                if (err) {
                    this.results.errors.push(`DNS解析失败: ${err.message}`);
                    this.results.dns = null;
                } else {
                    this.results.dns = time;
                    console.log(`✅ DNS解析时间: ${time}ms (${address})`);
                }
                resolve();
            });
        });
    }

    // 测试HTTPS连接和SSL
    async testHTTPS() {
        return new Promise((resolve) => {
            const start = Date.now();
            const url = `https://${this.domain}`;
            
            const req = https.get(url, (res) => {
                const sslTime = Date.now() - start;
                this.results.ssl = sslTime;
                
                console.log(`✅ SSL连接时间: ${sslTime}ms`);
                console.log(`📋 SSL证书信息:`);
                
                if (res.socket.getPeerCertificate) {
                    const cert = res.socket.getPeerCertificate();
                    console.log(`   颁发者: ${cert.issuer.O || 'Unknown'}`);
                    console.log(`   有效期至: ${cert.valid_to}`);
                }
                
                res.destroy();
                resolve();
            });
            
            req.on('error', (err) => {
                this.results.errors.push(`HTTPS连接失败: ${err.message}`);
                console.log(`❌ HTTPS连接失败: ${err.message}`);
                resolve();
            });
            
            req.setTimeout(10000, () => {
                req.destroy();
                this.results.errors.push('HTTPS连接超时');
                console.log('❌ HTTPS连接超时');
                resolve();
            });
        });
    }

    // 测试首字节时间(TTFB)和页面加载
    async testPageLoad() {
        return new Promise((resolve) => {
            const start = Date.now();
            const url = `https://${this.domain}`;
            
            const req = https.get(url, (res) => {
                const ttfb = Date.now() - start;
                this.results.ttfb = ttfb;
                
                console.log(`✅ 首字节时间(TTFB): ${ttfb}ms`);
                console.log(`📊 HTTP状态码: ${res.statusCode}`);
                
                // 检查缓存头部
                this.checkCacheHeaders(res.headers);
                
                let data = '';
                let firstChunk = true;
                
                res.on('data', (chunk) => {
                    if (firstChunk) {
                        firstChunk = false;
                        console.log(`📦 开始接收数据: ${Date.now() - start}ms`);
                    }
                    data += chunk;
                });
                
                res.on('end', () => {
                    const loadTime = Date.now() - start;
                    this.results.loadTime = loadTime;
                    this.results.contentSize = Buffer.byteLength(data, 'utf8');
                    
                    console.log(`✅ 页面加载完成: ${loadTime}ms`);
                    console.log(`📏 内容大小: ${(this.results.contentSize / 1024).toFixed(2)} KB`);
                    
                    resolve();
                });
            });
            
            req.on('error', (err) => {
                this.results.errors.push(`页面加载失败: ${err.message}`);
                console.log(`❌ 页面加载失败: ${err.message}`);
                resolve();
            });
            
            req.setTimeout(30000, () => {
                req.destroy();
                this.results.errors.push('页面加载超时');
                console.log('❌ 页面加载超时');
                resolve();
            });
        });
    }

    // 检查缓存头部
    checkCacheHeaders(headers) {
        console.log('🗂️ 缓存头部信息:');
        
        const cacheHeaders = [
            'cache-control',
            'expires',
            'etag',
            'last-modified',
            'cf-cache-status',
            'cf-ray'
        ];
        
        cacheHeaders.forEach(header => {
            if (headers[header]) {
                this.results.cacheHeaders[header] = headers[header];
                console.log(`   ${header}: ${headers[header]}`);
            }
        });
        
        // 检查是否使用了Cloudflare
        if (headers['cf-ray']) {
            console.log('✅ 检测到Cloudflare CDN');
        }
        
        // 检查压缩
        if (headers['content-encoding']) {
            console.log(`✅ 内容压缩: ${headers['content-encoding']}`);
        }
    }

    // 测试静态资源加载
    async testStaticResources() {
        console.log('🎨 测试静态资源加载...');
        
        const resources = [
            '/css/main.css',
            '/js/main.js',
            '/data/games.json',
            '/manifest.json'
        ];
        
        for (const resource of resources) {
            await this.testResource(resource);
        }
    }

    // 测试单个资源
    async testResource(path) {
        return new Promise((resolve) => {
            const start = Date.now();
            const url = `https://${this.domain}${path}`;
            
            const req = https.get(url, (res) => {
                const loadTime = Date.now() - start;
                
                if (res.statusCode === 200) {
                    console.log(`✅ ${path}: ${loadTime}ms (${res.statusCode})`);
                } else {
                    console.log(`⚠️ ${path}: ${loadTime}ms (${res.statusCode})`);
                }
                
                res.destroy();
                resolve();
            });
            
            req.on('error', (err) => {
                console.log(`❌ ${path}: 加载失败 - ${err.message}`);
                resolve();
            });
            
            req.setTimeout(10000, () => {
                req.destroy();
                console.log(`❌ ${path}: 加载超时`);
                resolve();
            });
        });
    }

    // 生成性能报告
    generateReport() {
        console.log('\n📊 性能报告');
        console.log('='.repeat(50));
        
        // 评分系统
        let score = 100;
        const recommendations = [];
        
        // DNS评分
        if (this.results.dns) {
            if (this.results.dns > 200) {
                score -= 10;
                recommendations.push('DNS解析时间较慢，考虑更换DNS服务商');
            }
            console.log(`DNS解析: ${this.results.dns}ms ${this.results.dns < 100 ? '🟢' : this.results.dns < 200 ? '🟡' : '🔴'}`);
        }
        
        // SSL评分
        if (this.results.ssl) {
            if (this.results.ssl > 1000) {
                score -= 15;
                recommendations.push('SSL握手时间较慢，检查证书配置');
            }
            console.log(`SSL连接: ${this.results.ssl}ms ${this.results.ssl < 500 ? '🟢' : this.results.ssl < 1000 ? '🟡' : '🔴'}`);
        }
        
        // TTFB评分
        if (this.results.ttfb) {
            if (this.results.ttfb > 800) {
                score -= 20;
                recommendations.push('首字节时间较慢，考虑启用CDN或优化服务器');
            }
            console.log(`首字节时间: ${this.results.ttfb}ms ${this.results.ttfb < 200 ? '🟢' : this.results.ttfb < 800 ? '🟡' : '🔴'}`);
        }
        
        // 页面加载评分
        if (this.results.loadTime) {
            if (this.results.loadTime > 3000) {
                score -= 25;
                recommendations.push('页面加载时间过长，需要优化资源大小');
            }
            console.log(`页面加载: ${this.results.loadTime}ms ${this.results.loadTime < 1000 ? '🟢' : this.results.loadTime < 3000 ? '🟡' : '🔴'}`);
        }
        
        // 内容大小评分
        if (this.results.contentSize) {
            const sizeKB = this.results.contentSize / 1024;
            if (sizeKB > 500) {
                score -= 10;
                recommendations.push('页面内容较大，考虑压缩或延迟加载');
            }
            console.log(`内容大小: ${sizeKB.toFixed(2)} KB ${sizeKB < 100 ? '🟢' : sizeKB < 500 ? '🟡' : '🔴'}`);
        }
        
        // CDN检查
        if (this.results.cacheHeaders['cf-ray']) {
            console.log('CDN状态: Cloudflare 🟢');
        } else {
            score -= 15;
            recommendations.push('未检测到CDN，建议启用CDN加速');
            console.log('CDN状态: 未启用 🔴');
        }
        
        // 总分
        score = Math.max(0, score);
        console.log(`\n总体评分: ${score}/100 ${score >= 90 ? '🟢 优秀' : score >= 70 ? '🟡 良好' : '🔴 需要改进'}`);
        
        // 优化建议
        if (recommendations.length > 0) {
            console.log('\n💡 优化建议:');
            recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }
        
        // 错误信息
        if (this.results.errors.length > 0) {
            console.log('\n❌ 发现的问题:');
            this.results.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }
    }

    // 运行完整测试
    async runFullTest() {
        console.log(`🚀 开始性能测试: ${this.domain}`);
        console.log('='.repeat(50));
        
        await this.testDNS();
        await this.testHTTPS();
        await this.testPageLoad();
        await this.testStaticResources();
        
        this.generateReport();
    }
}

// 命令行使用
if (require.main === module) {
    const domain = process.argv[2];
    
    if (!domain) {
        console.log('使用方法: node performance-monitor.js <domain>');
        console.log('例如: node performance-monitor.js yourdomain.com');
        process.exit(1);
    }
    
    const monitor = new PerformanceMonitor(domain);
    monitor.runFullTest().catch(console.error);
}

module.exports = PerformanceMonitor;