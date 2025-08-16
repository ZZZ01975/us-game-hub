#!/usr/bin/env node

/**
 * 部署前检查脚本
 * 验证网站文件的完整性和正确性
 */

const fs = require('fs');
const path = require('path');

class DeploymentChecker {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.rootDir = path.join(__dirname, '..');
    }

    // 检查必要文件是否存在
    checkRequiredFiles() {
        console.log('🔍 检查必要文件...');
        
        const requiredFiles = [
            'index.html',
            'game.html',
            'data/games.json',
            'css/main.css',
            'js/main.js',
            'manifest.json',
            'robots.txt',
            'sitemap.xml'
        ];

        requiredFiles.forEach(file => {
            const filePath = path.join(this.rootDir, file);
            if (!fs.existsSync(filePath)) {
                this.errors.push(`缺少必要文件: ${file}`);
            }
        });
    }

    // 检查语言文件
    checkLanguageFiles() {
        console.log('🌍 检查多语言文件...');
        
        const languages = ['en', 'zh', 'es', 'fr'];
        languages.forEach(lang => {
            const langFile = path.join(this.rootDir, `languages/${lang}.json`);
            if (!fs.existsSync(langFile)) {
                this.errors.push(`缺少语言文件: languages/${lang}.json`);
            } else {
                try {
                    const content = fs.readFileSync(langFile, 'utf8');
                    JSON.parse(content);
                } catch (error) {
                    this.errors.push(`语言文件格式错误: languages/${lang}.json - ${error.message}`);
                }
            }
        });
    }

    // 检查游戏数据文件
    checkGameData() {
        console.log('🎮 检查游戏数据...');
        
        const gamesFile = path.join(this.rootDir, 'data/games.json');
        if (fs.existsSync(gamesFile)) {
            try {
                const content = fs.readFileSync(gamesFile, 'utf8');
                const data = JSON.parse(content);
                
                if (!data.games || !Array.isArray(data.games)) {
                    this.errors.push('games.json 格式错误：缺少games数组');
                } else if (data.games.length === 0) {
                    this.warnings.push('games.json 中没有游戏数据');
                } else {
                    console.log(`✅ 找到 ${data.games.length} 个游戏`);
                    
                    // 检查游戏数据完整性
                    data.games.forEach((game, index) => {
                        if (!game.id) {
                            this.errors.push(`游戏 ${index + 1} 缺少id字段`);
                        }
                        if (!game.title || !game.title.en) {
                            this.errors.push(`游戏 ${game.id || index + 1} 缺少英文标题`);
                        }
                        if (!game.coverImage) {
                            this.warnings.push(`游戏 ${game.id || index + 1} 缺少封面图片`);
                        }
                    });
                }
            } catch (error) {
                this.errors.push(`games.json 解析错误: ${error.message}`);
            }
        }
    }

    // 检查图片资源
    checkImageResources() {
        console.log('🖼️ 检查图片资源...');
        
        const imageDir = path.join(this.rootDir, 'assets/images');
        if (!fs.existsSync(imageDir)) {
            this.warnings.push('assets/images 目录不存在');
            return;
        }

        const requiredImages = [
            'logo.svg',
            'og-image.svg',
            'twitter-card.svg'
        ];

        requiredImages.forEach(image => {
            const imagePath = path.join(imageDir, image);
            if (!fs.existsSync(imagePath)) {
                this.warnings.push(`缺少图片资源: assets/images/${image}`);
            }
        });
    }

    // 检查HTML文件的基本结构
    checkHTMLStructure() {
        console.log('📄 检查HTML文件结构...');
        
        const htmlFiles = ['index.html', 'game.html'];
        
        htmlFiles.forEach(file => {
            const filePath = path.join(this.rootDir, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // 检查基本HTML结构
                if (!content.includes('<!DOCTYPE html>')) {
                    this.warnings.push(`${file} 缺少DOCTYPE声明`);
                }
                if (!content.includes('<html lang=')) {
                    this.warnings.push(`${file} 缺少语言属性`);
                }
                if (!content.includes('<meta charset=')) {
                    this.warnings.push(`${file} 缺少字符编码声明`);
                }
                if (!content.includes('<meta name="viewport"')) {
                    this.warnings.push(`${file} 缺少viewport meta标签`);
                }
            }
        });
    }

    // 检查Service Worker
    checkServiceWorker() {
        console.log('⚙️ 检查Service Worker...');
        
        const swFile = path.join(this.rootDir, 'sw.js');
        if (fs.existsSync(swFile)) {
            const content = fs.readFileSync(swFile, 'utf8');
            if (!content.includes('CACHE_NAME')) {
                this.warnings.push('Service Worker 可能配置不完整');
            }
        } else {
            this.warnings.push('缺少Service Worker文件 (sw.js)');
        }
    }

    // 运行所有检查
    runAllChecks() {
        console.log('🚀 开始部署前检查...\n');
        
        this.checkRequiredFiles();
        this.checkLanguageFiles();
        this.checkGameData();
        this.checkImageResources();
        this.checkHTMLStructure();
        this.checkServiceWorker();
        
        this.printResults();
        
        return this.errors.length === 0;
    }

    // 打印检查结果
    printResults() {
        console.log('\n📊 检查结果:');
        console.log('='.repeat(50));
        
        if (this.errors.length === 0) {
            console.log('✅ 没有发现错误');
        } else {
            console.log(`❌ 发现 ${this.errors.length} 个错误:`);
            this.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }
        
        if (this.warnings.length > 0) {
            console.log(`\n⚠️  发现 ${this.warnings.length} 个警告:`);
            this.warnings.forEach((warning, index) => {
                console.log(`   ${index + 1}. ${warning}`);
            });
        }
        
        console.log('='.repeat(50));
        
        if (this.errors.length === 0) {
            console.log('🎉 网站已准备好部署！');
        } else {
            console.log('❌ 请修复错误后再进行部署');
        }
    }
}

// 运行检查
if (require.main === module) {
    const checker = new DeploymentChecker();
    const success = checker.runAllChecks();
    process.exit(success ? 0 : 1);
}

module.exports = DeploymentChecker;