import { Node } from './telegraph';
export declare class MarkdownConverter {
    constructor();
    private setupRenderer;
    convertToTelegraphNodes(markdown: string): Node[];
    private htmlToTelegraphNodes;
    private removeFrontmatter;
    private convertHtmlNodeToTelegraphNode;
    private mapHtmlTagToTelegraph;
    convertToTelegraphNodesSimple(markdown: string, basePath?: string, linkResolver?: (link: string) => string): Node[];
    private processInlineMarkdown;
    private resolveLink;
}
