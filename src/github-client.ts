import * as core from "@actions/core";
import * as github from "@actions/github";

export interface GitHubRepository {
  owner: string;
  repo: string;
  description?: string;
}

export class GitHubClient {
  private octokit;
  private context;

  constructor() {
    const token = process.env.GITHUB_TOKEN || core.getInput("github-token");

    if (!token) {
      throw new Error(
        "GitHub token is required. Please provide GITHUB_TOKEN environment variable or github-token input."
      );
    }

    this.octokit = github.getOctokit(token);
    this.context = github.context;
  }

  /**
   * Get current repository information
   */
  getCurrentRepository(): GitHubRepository {
    const { owner, repo } = this.context.repo;
    return { owner, repo };
  }

  /**
   * Get repository details including current description
   */
  async getRepository(): Promise<GitHubRepository> {
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
    } catch (error) {
      core.error(`Failed to get repository information: ${error}`);
      throw error;
    }
  }

  /**
   * Update repository description
   */
  async updateRepositoryDescription(description: string): Promise<void> {
    try {
      const { owner, repo } = this.getCurrentRepository();

      core.info(`Updating repository description to: ${description}`);

      await this.octokit.rest.repos.update({
        owner,
        repo,
        description,
      });

      core.info(`✅ Repository description updated successfully`);
    } catch (error) {
      core.error(`Failed to update repository description: ${error}`);
      throw error;
    }
  }

  /**
   * Check if the current GitHub token has the necessary permissions
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const { owner, repo } = this.getCurrentRepository();

      // Try to get the repository to check if we have read access
      await this.octokit.rest.repos.get({
        owner,
        repo,
      });

      return true;
    } catch (error) {
      core.warning(`GitHub API permission check failed: ${error}`);
      return false;
    }
  }
}
