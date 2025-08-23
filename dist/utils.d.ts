export interface ActionConfig {
    accountName: string;
    authorName: string;
    authorUrl?: string;
    includePatterns: string[];
    excludePatterns: string[];
    outputFile: string;
    accessToken?: string;
    oneEntryMode: boolean;
    replaceExistingPages: boolean;
}
export interface PageMapping {
    filePath: string;
    telegraphPath: string;
    telegraphUrl: string;
    lastModified: string;
}
export declare function getConfig(): ActionConfig;
export declare function loadPageMappings(filePath: string): PageMapping[];
export declare function savePageMappings(filePath: string, mappings: PageMapping[]): void;
