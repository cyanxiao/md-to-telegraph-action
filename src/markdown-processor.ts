import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import * as core from '@actions/core';

export interface MarkdownFile {
  filePath: string;
  relativePath: string;
  content: string;
  title?: string;
}

export class MarkdownProcessor {
  private workspaceRoot: string;
  private includePatterns: string[];
  private excludePatterns: string[];

  constructor(workspaceRoot: string, includePatterns: string[] = ['**/*.md'], excludePatterns: string[] = []) {
    this.workspaceRoot = workspaceRoot;
    this.includePatterns = includePatterns;
    this.excludePatterns = excludePatterns;
  }

  async findMarkdownFiles(): Promise<MarkdownFile[]> {
    const files: MarkdownFile[] = [];

    for (const pattern of this.includePatterns) {
      try {
        const matchedFiles = await glob(pattern, {
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
      } catch (error) {
        core.warning(`Failed to process pattern ${pattern}: ${error}`);
      }
    }

    core.info(`Found ${files.length} markdown files`);
    return files;
  }

  private extractTitle(content: string, filePath: string): string {
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

  async readMarkdownFile(filePath: string): Promise<MarkdownFile> {
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
    } catch (error) {
      core.error(`Failed to read markdown file ${filePath}: ${error}`);
      throw error;
    }
  }

  setIncludePatterns(patterns: string[]): void {
    this.includePatterns = patterns;
  }

  setExcludePatterns(patterns: string[]): void {
    this.excludePatterns = patterns;
  }
}