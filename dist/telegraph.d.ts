export interface TelegraphAccount {
    short_name: string;
    author_name: string;
    author_url?: string;
    access_token: string;
    auth_url?: string;
    page_count?: number;
}
export interface TelegraphPage {
    path: string;
    url: string;
    title: string;
    description: string;
    author_name?: string;
    author_url?: string;
    image_url?: string;
    content?: Node[];
    views: number;
    can_edit?: boolean;
}
export interface TelegraphPageList {
    total_count: number;
    pages: TelegraphPage[];
}
export interface Node {
    tag?: string;
    attrs?: Record<string, any>;
    children?: Array<Node | string>;
}
export declare class TelegraphClient {
    private api;
    private accessToken?;
    constructor();
    createAccount(shortName: string, authorName: string, authorUrl?: string): Promise<TelegraphAccount>;
    createPage(title: string, content: Node[], authorName?: string, authorUrl?: string, returnContent?: boolean): Promise<TelegraphPage>;
    editPage(path: string, title: string, content: Node[], authorName?: string, authorUrl?: string, returnContent?: boolean): Promise<TelegraphPage>;
    getPage(path: string, returnContent?: boolean): Promise<TelegraphPage>;
    getPageList(offset?: number, limit?: number): Promise<TelegraphPageList>;
    findExistingPageByTitle(title: string): Promise<TelegraphPage | null>;
    setAccessToken(token: string): void;
}
