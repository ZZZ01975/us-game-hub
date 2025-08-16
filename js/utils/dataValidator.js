/**
 * 游戏数据验证器
 * 用于验证games.json数据的完整性和正确性
 */

class DataValidator {
    constructor() {
        // 必需字段定义
        this.requiredFields = [
            'id', 'title', 'description', 'category', 'categoryName',
            'coverImage', 'gameUrl', 'rating', 'playCount', 'tags',
            'addedDate', 'lastUpdated', 'status', 'metadata'
        ];

        // 元数据必需字段
        this.requiredMetadataFields = [
            'developer', 'version', 'size', 'controls', 'difficulty',
            'minAge', 'maxPlayers', 'estimatedPlayTime', 'languages',
            'platform', 'technology'
        ];

        // 有效的分类
        this.validCategories = ['action', 'puzzle', 'arcade', 'casual'];

        // 有效的状态
        this.validStatuses = ['active', 'inactive', 'maintenance'];

        // 有效的难度等级
        this.validDifficulties = ['easy', 'medium', 'hard'];

        // 支持的语言
        this.supportedLanguages = ['en', 'zh', 'es', 'fr'];

        // 验证错误收集
        this.errors = [];
        this.warnings = [];
    }

    /**
     * 验证完整的游戏数据结构
     * @param {Object} data - 游戏数据对象
     * @returns {Object} 验证结果
     */
    validateGameData(data) {
        this.errors = [];
        this.warnings = [];

        // 验证根级别结构
        if (!data || typeof data !== 'object') {
            this.errors.push('数据必须是一个有效的对象');
            return this.getValidationResult();
        }

        // 验证版本信息
        this.validateVersion(data);

        // 验证游戏数组
        if (!Array.isArray(data.games)) {
            this.errors.push('games字段必须是一个数组');
            return this.getValidationResult();
        }

        // 验证每个游戏
        data.games.forEach((game, index) => {
            this.validateGame(game, index);
        });

        // 检查ID唯一性
        this.validateUniqueIds(data.games);

        return this.getValidationResult();
    }

    /**
     * 验证版本信息
     * @param {Object} data - 数据对象
     */
    validateVersion(data) {
        if (!data.version) {
            this.warnings.push('缺少版本信息');
        }

        if (!data.lastUpdated) {
            this.warnings.push('缺少最后更新时间');
        } else if (!this.isValidDate(data.lastUpdated)) {
            this.errors.push('lastUpdated必须是有效的ISO日期格式');
        }
    }

    /**
     * 验证单个游戏数据
     * @param {Object} game - 游戏对象
     * @param {number} index - 游戏在数组中的索引
     */
    validateGame(game, index) {
        const gamePrefix = `游戏[${index}]`;

        // 检查必需字段
        this.requiredFields.forEach(field => {
            if (!(field in game)) {
                this.errors.push(`${gamePrefix}: 缺少必需字段 "${field}"`);
            }
        });

        // 验证ID
        if (game.id && typeof game.id !== 'string') {
            this.errors.push(`${gamePrefix}: ID必须是字符串类型`);
        }

        // 验证多语言字段
        this.validateMultiLanguageField(game.title, `${gamePrefix}.title`);
        this.validateMultiLanguageField(game.description, `${gamePrefix}.description`);
        this.validateMultiLanguageField(game.categoryName, `${gamePrefix}.categoryName`);

        // 验证分类
        if (game.category && !this.validCategories.includes(game.category)) {
            this.errors.push(`${gamePrefix}: 无效的分类 "${game.category}"`);
        }

        // 验证评分
        if (game.rating !== undefined) {
            if (typeof game.rating !== 'number' || game.rating < 0 || game.rating > 5) {
                this.errors.push(`${gamePrefix}: 评分必须是0-5之间的数字`);
            }
        }

        // 验证播放次数
        if (game.playCount !== undefined) {
            if (typeof game.playCount !== 'number' || game.playCount < 0) {
                this.errors.push(`${gamePrefix}: 播放次数必须是非负数`);
            }
        }

        // 验证标签
        if (game.tags && !Array.isArray(game.tags)) {
            this.errors.push(`${gamePrefix}: 标签必须是数组`);
        }

        // 验证日期
        if (game.addedDate && !this.isValidDate(game.addedDate)) {
            this.errors.push(`${gamePrefix}: addedDate必须是有效的ISO日期格式`);
        }

        if (game.lastUpdated && !this.isValidDate(game.lastUpdated)) {
            this.errors.push(`${gamePrefix}: lastUpdated必须是有效的ISO日期格式`);
        }

        // 验证状态
        if (game.status && !this.validStatuses.includes(game.status)) {
            this.errors.push(`${gamePrefix}: 无效的状态 "${game.status}"`);
        }

        // 验证URL
        if (game.gameUrl && !this.isValidUrl(game.gameUrl)) {
            this.warnings.push(`${gamePrefix}: gameUrl可能不是有效的URL`);
        }

        if (game.coverImage && !this.isValidUrl(game.coverImage)) {
            this.warnings.push(`${gamePrefix}: coverImage可能不是有效的URL`);
        }

        // 验证元数据
        if (game.metadata) {
            this.validateMetadata(game.metadata, gamePrefix);
        }
    }

    /**
     * 验证多语言字段
     * @param {Object} field - 多语言字段对象
     * @param {string} fieldName - 字段名称
     */
    validateMultiLanguageField(field, fieldName) {
        if (!field || typeof field !== 'object') {
            this.errors.push(`${fieldName}: 必须是包含多语言文本的对象`);
            return;
        }

        // 检查是否包含所有支持的语言
        this.supportedLanguages.forEach(lang => {
            if (!field[lang]) {
                this.warnings.push(`${fieldName}: 缺少 "${lang}" 语言版本`);
            }
        });

        // 检查是否有无效的语言代码
        Object.keys(field).forEach(lang => {
            if (!this.supportedLanguages.includes(lang)) {
                this.warnings.push(`${fieldName}: 包含不支持的语言代码 "${lang}"`);
            }
        });
    }

    /**
     * 验证游戏元数据
     * @param {Object} metadata - 元数据对象
     * @param {string} gamePrefix - 游戏前缀
     */
    validateMetadata(metadata, gamePrefix) {
        const metadataPrefix = `${gamePrefix}.metadata`;

        // 检查必需的元数据字段
        this.requiredMetadataFields.forEach(field => {
            if (!(field in metadata)) {
                this.warnings.push(`${metadataPrefix}: 缺少推荐字段 "${field}"`);
            }
        });

        // 验证难度
        if (metadata.difficulty && !this.validDifficulties.includes(metadata.difficulty)) {
            this.errors.push(`${metadataPrefix}: 无效的难度等级 "${metadata.difficulty}"`);
        }

        // 验证年龄限制
        if (metadata.minAge !== undefined) {
            if (typeof metadata.minAge !== 'number' || metadata.minAge < 0 || metadata.minAge > 18) {
                this.errors.push(`${metadataPrefix}: 最小年龄必须是0-18之间的数字`);
            }
        }

        // 验证最大玩家数
        if (metadata.maxPlayers !== undefined) {
            if (typeof metadata.maxPlayers !== 'number' || metadata.maxPlayers < 1) {
                this.errors.push(`${metadataPrefix}: 最大玩家数必须是正整数`);
            }
        }

        // 验证控制方式
        if (metadata.controls && !Array.isArray(metadata.controls)) {
            this.errors.push(`${metadataPrefix}: 控制方式必须是数组`);
        }

        // 验证支持的语言
        if (metadata.languages && !Array.isArray(metadata.languages)) {
            this.errors.push(`${metadataPrefix}: 支持的语言必须是数组`);
        }
    }

    /**
     * 验证ID唯一性
     * @param {Array} games - 游戏数组
     */
    validateUniqueIds(games) {
        const ids = new Set();
        const duplicates = new Set();

        games.forEach((game, index) => {
            if (game.id) {
                if (ids.has(game.id)) {
                    duplicates.add(game.id);
                } else {
                    ids.add(game.id);
                }
            }
        });

        duplicates.forEach(id => {
            this.errors.push(`发现重复的游戏ID: "${id}"`);
        });
    }

    /**
     * 检查是否为有效日期
     * @param {string} dateString - 日期字符串
     * @returns {boolean} 是否有效
     */
    isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date) && dateString.includes('T');
    }

    /**
     * 检查是否为有效URL
     * @param {string} url - URL字符串
     * @returns {boolean} 是否有效
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            // 检查相对路径
            return url.startsWith('/') || url.startsWith('./') || url.startsWith('../') || 
                   url.includes('/') || url.startsWith('http');
        }
    }

    /**
     * 获取验证结果
     * @returns {Object} 验证结果对象
     */
    getValidationResult() {
        return {
            isValid: this.errors.length === 0,
            errors: [...this.errors],
            warnings: [...this.warnings],
            errorCount: this.errors.length,
            warningCount: this.warnings.length
        };
    }

    /**
     * 生成验证报告
     * @param {Object} result - 验证结果
     * @returns {string} 格式化的报告
     */
    generateReport(result) {
        let report = '=== 游戏数据验证报告 ===\n\n';
        
        if (result.isValid) {
            report += '✅ 数据验证通过！\n';
        } else {
            report += '❌ 数据验证失败！\n';
        }

        report += `错误数量: ${result.errorCount}\n`;
        report += `警告数量: ${result.warningCount}\n\n`;

        if (result.errors.length > 0) {
            report += '🔴 错误列表:\n';
            result.errors.forEach((error, index) => {
                report += `${index + 1}. ${error}\n`;
            });
            report += '\n';
        }

        if (result.warnings.length > 0) {
            report += '🟡 警告列表:\n';
            result.warnings.forEach((warning, index) => {
                report += `${index + 1}. ${warning}\n`;
            });
            report += '\n';
        }

        report += '=== 报告结束 ===';
        return report;
    }
}

// 导出验证器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataValidator;
} else {
    window.DataValidator = DataValidator;
}