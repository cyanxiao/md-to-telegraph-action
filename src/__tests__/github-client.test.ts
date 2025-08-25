import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { GitHubClient } from "../github-client";
import * as github from "@actions/github";
import * as core from "@actions/core";

mock.module("@actions/github", () => ({
  getOctokit: mock(() => {}),
  context: {
    repo: {
      owner: "test-owner",
      repo: "test-repo",
    },
  },
}));

mock.module("@actions/core", () => ({
  info: mock(() => {}),
  warning: mock(() => {}),
  error: mock(() => {}),
  setFailed: mock(() => {}),
  getInput: mock(() => {}),
  setOutput: mock(() => {}),
}));

const mockOctokit = {
  rest: {
    repos: {
      get: mock(() => {}),
      update: mock(() => {}),
    },
  },
};

describe("GitHubClient", () => {
  let client: GitHubClient;
  const originalEnv = process.env;

  beforeEach(() => {
    mock.restore();
    process.env = { ...originalEnv, GITHUB_TOKEN: "test-token" };
    (github.getOctokit as any).mockReturnValue(mockOctokit);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("constructor", () => {
    test("should initialize with GITHUB_TOKEN from environment", () => {
      client = new GitHubClient();
      expect(github.getOctokit).toHaveBeenCalledWith("test-token");
    });

    test("should initialize with github-token from input if GITHUB_TOKEN not available", () => {
      delete process.env.GITHUB_TOKEN;
      (core.getInput as any).mockReturnValue("input-token");

      client = new GitHubClient();
      expect(github.getOctokit).toHaveBeenCalledWith("input-token");
    });

    test("should throw error when no token is available", () => {
      delete process.env.GITHUB_TOKEN;
      (core.getInput as any).mockReturnValue("");

      expect(() => new GitHubClient()).toThrow("GitHub token is required");
    });
  });

  describe("getCurrentRepository", () => {
    beforeEach(() => {
      client = new GitHubClient();
    });

    test("should return current repository info from context", () => {
      const result = client.getCurrentRepository();

      expect(result).toEqual({
        owner: "test-owner",
        repo: "test-repo",
      });
    });
  });

  describe("getRepository", () => {
    beforeEach(() => {
      client = new GitHubClient();
    });

    test("should get repository details successfully", async () => {
      const mockRepoData = {
        data: {
          description: "Test repository description",
          name: "test-repo",
          owner: { login: "test-owner" },
        },
      };

      mockOctokit.rest.repos.get.mockResolvedValue(mockRepoData);

      const result = await client.getRepository();

      expect(mockOctokit.rest.repos.get).toHaveBeenCalledWith({
        owner: "test-owner",
        repo: "test-repo",
      });

      expect(result).toEqual({
        owner: "test-owner",
        repo: "test-repo",
        description: "Test repository description",
      });
    });

    test("should handle repository with no description", async () => {
      const mockRepoData = {
        data: {
          description: null,
          name: "test-repo",
          owner: { login: "test-owner" },
        },
      };

      mockOctokit.rest.repos.get.mockResolvedValue(mockRepoData);

      const result = await client.getRepository();

      expect(result).toEqual({
        owner: "test-owner",
        repo: "test-repo",
        description: undefined,
      });
    });

    test("should handle API errors", async () => {
      const error = new Error("Repository not found");
      mockOctokit.rest.repos.get.mockRejectedValue(error);

      await expect(client.getRepository()).rejects.toThrow(
        "Repository not found"
      );
      expect(core.error).toHaveBeenCalledWith(
        "Failed to get repository information: Error: Repository not found"
      );
    });
  });

  describe("updateRepositoryDescription", () => {
    beforeEach(() => {
      client = new GitHubClient();
    });

    test("should update repository description successfully", async () => {
      const description = "https://telegra.ph/My-Page-123";

      mockOctokit.rest.repos.update.mockResolvedValue({});

      await client.updateRepositoryDescription(description);

      expect(mockOctokit.rest.repos.update).toHaveBeenCalledWith({
        owner: "test-owner",
        repo: "test-repo",
        description,
      });

      expect(core.info).toHaveBeenCalledWith(
        `Updating repository description to: ${description}`
      );
      expect(core.info).toHaveBeenCalledWith(
        "✅ Repository description updated successfully"
      );
    });

    test("should handle update errors", async () => {
      const description = "https://telegra.ph/My-Page-123";
      const error = new Error("Insufficient permissions");

      mockOctokit.rest.repos.update.mockRejectedValue(error);

      await expect(
        client.updateRepositoryDescription(description)
      ).rejects.toThrow("Insufficient permissions");
      expect(core.error).toHaveBeenCalledWith(
        "Failed to update repository description: Error: Insufficient permissions"
      );
    });
  });

  describe("updateRepositoryHomepage", () => {
    beforeEach(() => {
      client = new GitHubClient();
    });

    test("should update repository homepage URL successfully", async () => {
      const homepageUrl = "https://telegra.ph/My-Page-123";

      mockOctokit.rest.repos.update.mockResolvedValue({});

      await client.updateRepositoryHomepage(homepageUrl);

      expect(mockOctokit.rest.repos.update).toHaveBeenCalledWith({
        owner: "test-owner",
        repo: "test-repo",
        homepage: homepageUrl,
      });

      expect(core.info).toHaveBeenCalledWith(
        `Updating repository homepage URL to: ${homepageUrl}`
      );
      expect(core.info).toHaveBeenCalledWith(
        "✅ Repository homepage URL updated successfully"
      );
    });

    test("should handle update errors", async () => {
      const homepageUrl = "https://telegra.ph/My-Page-123";
      const error = new Error("Insufficient permissions");

      mockOctokit.rest.repos.update.mockRejectedValue(error);

      await expect(
        client.updateRepositoryHomepage(homepageUrl)
      ).rejects.toThrow("Insufficient permissions");
      expect(core.error).toHaveBeenCalledWith(
        "Failed to update repository homepage URL: Error: Insufficient permissions"
      );
    });
  });

  describe("checkPermissions", () => {
    beforeEach(() => {
      client = new GitHubClient();
    });

    test("should return true when permissions are sufficient", async () => {
      mockOctokit.rest.repos.get.mockResolvedValue({});

      const result = await client.checkPermissions();

      expect(result).toBe(true);
      expect(mockOctokit.rest.repos.get).toHaveBeenCalledWith({
        owner: "test-owner",
        repo: "test-repo",
      });
    });

    test("should return false when permissions are insufficient", async () => {
      const error = new Error("Forbidden");
      mockOctokit.rest.repos.get.mockRejectedValue(error);

      const result = await client.checkPermissions();

      expect(result).toBe(false);
      expect(core.warning).toHaveBeenCalledWith(
        "GitHub API permission check failed: Error: Forbidden"
      );
    });
  });
});
