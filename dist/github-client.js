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
exports.GitHubClient = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
class GitHubClient {
    constructor() {
        const token = process.env.GITHUB_TOKEN || core.getInput("github-token");
        if (!token) {
            throw new Error("GitHub token is required. Please provide GITHUB_TOKEN environment variable or github-token input.");
        }
        this.octokit = github.getOctokit(token);
        this.context = github.context;
    }
    /**
     * Get current repository information
     */
    getCurrentRepository() {
        const { owner, repo } = this.context.repo;
        return { owner, repo };
    }
    /**
     * Get repository details including current description
     */
    async getRepository() {
        try {
            const { owner, repo } = this.getCurrentRepository();
            const response = await this.octokit.rest.repos.get({
                owner,
                repo,
            });
            return {
                owner,
                repo,
                description: response.data.description || undefined,
            };
        }
        catch (error) {
            core.error(`Failed to get repository information: ${error}`);
            throw error;
        }
    }
    /**
     * Update repository description
     */
    async updateRepositoryDescription(description) {
        try {
            const { owner, repo } = this.getCurrentRepository();
            core.info(`Updating repository description to: ${description}`);
            await this.octokit.rest.repos.update({
                owner,
                repo,
                description,
            });
            core.info(`✅ Repository description updated successfully`);
        }
        catch (error) {
            core.error(`Failed to update repository description: ${error}`);
            throw error;
        }
    }
    /**
     * Update repository homepage URL
     */
    async updateRepositoryHomepage(homepageUrl) {
        try {
            const { owner, repo } = this.getCurrentRepository();
            core.info(`Updating repository homepage URL to: ${homepageUrl}`);
            await this.octokit.rest.repos.update({
                owner,
                repo,
                homepage: homepageUrl,
            });
            core.info(`✅ Repository homepage URL updated successfully`);
        }
        catch (error) {
            core.error(`Failed to update repository homepage URL: ${error}`);
            throw error;
        }
    }
    /**
     * Check if the current GitHub token has the necessary permissions
     */
    async checkPermissions() {
        try {
            const { owner, repo } = this.getCurrentRepository();
            // Try to get the repository to check if we have read access
            await this.octokit.rest.repos.get({
                owner,
                repo,
            });
            return true;
        }
        catch (error) {
            core.warning(`GitHub API permission check failed: ${error}`);
            return false;
        }
    }
}
exports.GitHubClient = GitHubClient;
//# sourceMappingURL=github-client.js.map