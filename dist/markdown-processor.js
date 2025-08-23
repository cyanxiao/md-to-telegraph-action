"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownProcessor = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const glob_1 = require("glob");
const core = __importStar(require("@actions/core"));
class MarkdownProcessor {
    constructor(workspaceRoot, includePatterns = ['**/*.md'], excludePatterns = []) {
        this.workspaceRoot = workspaceRoot;
        this.includePatterns = includePatterns;
        this.excludePatterns = excludePatterns;
    }
    async findMarkdownFiles() {
        const files = [];
        for (const pattern of this.includePatterns) {
            try {
                const matchedFiles = await (0, glob_1.glob)(pattern, {
                    cwd: this.workspaceRoot,
                    ignore: this.excludePatterns,
                    absolute: false,
                });
                for (const file of matchedFiles) {
                    const filePath = path.join(this.workspaceRoot, file);
                    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                        const content = fs.readFileSync(filePath, 'utf-8');
                        const title = this.extractTitle(content, file);
                        files.push({
                            filePath,
                            relativePath: file,
                            content,
                            title,
                        });
                    }
                }
            }
            catch (error) {
                core.warning(`Failed to process pattern ${pattern}: ${error}`);
            }
        }
        core.info(`Found ${files.length} markdown files`);
        return files;
    }
    extractTitle(content, filePath) {
        const lines = content.split('\n');
        // Look for H1 header
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('# ')) {
                return trimmed.substring(2).trim();
            }
        }
        // Look for frontmatter title
        if (content.startsWith('---')) {
            const frontmatterEnd = content.indexOf('---', 3);
            if (frontmatterEnd !== -1) {
                const frontmatter = content.substring(3, frontmatterEnd);
                const titleMatch = frontmatter.match(/^title:\s*(.+)$/m);
                if (titleMatch) {
                    return titleMatch[1].trim().replace(/^['"]|['"]$/g, '');
                }
            }
        }
        // Fallback to filename
        return path.basename(filePath, '.md')
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    async readMarkdownFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const relativePath = path.relative(this.workspaceRoot, filePath);
            const title = this.extractTitle(content, filePath);
            return {
                filePath,
                relativePath,
                content,
                title,
            };
        }
        catch (error) {
            core.error(`Failed to read markdown file ${filePath}: ${error}`);
            throw error;
        }
    }
    setIncludePatterns(patterns) {
        this.includePatterns = patterns;
    }
    setExcludePatterns(patterns) {
        this.excludePatterns = patterns;
    }
}
exports.MarkdownProcessor = MarkdownProcessor;
//# sourceMappingURL=markdown-processor.js.map