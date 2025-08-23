export interface MarkdownFile {
    filePath: string;
    relativePath: string;
    content: string;
    title?: string;
}
export declare class MarkdownProcessor {
    private workspaceRoot;
    private includePatterns;
    private excludePatterns;
    constructor(workspaceRoot: string, includePatterns?: string[], excludePatterns?: string[]);
    findMarkdownFiles(): Promise<MarkdownFile[]>;
    private extractTitle;
    readMarkdownFile(filePath: string): Promise<MarkdownFile>;
    setIncludePatterns(patterns: string[]): void;
    setExcludePatterns(patterns: string[]): void;
}
