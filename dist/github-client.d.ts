export interface GitHubRepository {
    owner: string;
    repo: string;
    description?: string;
}
export declare class GitHubClient {
    private octokit;
    private context;
    constructor();
    /**
     * Get current repository information
     */
    getCurrentRepository(): GitHubRepository;
    /**
     * Get repository details including current description
     */
    getRepository(): Promise<GitHubRepository>;
    /**
     * Update repository description
     */
    updateRepositoryDescription(description: string): Promise<void>;
    /**
     * Check if the current GitHub token has the necessary permissions
     */
    checkPermissions(): Promise<boolean>;
}
