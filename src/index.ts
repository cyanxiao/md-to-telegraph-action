import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";
import { TelegraphClient } from "./telegraph";
import { MarkdownProcessor } from "./markdown-processor";
import { MarkdownConverter } from "./markdown-converter";
import { GitHubClient } from "./github-client";
import {
  getConfig,
  loadPageMappings,
  savePageMappings,
  PageMapping,
} from "./utils";
import { MarkdownFile } from "./markdown-processor";

export async function run(): Promise<void> {
  try {
    core.info("Starting MD to Telegraph Action...");

    const config = getConfig();
    const workspaceRoot = process.env.GITHUB_WORKSPACE || process.cwd();

    core.info(`Workspace root: ${workspaceRoot}`);
    core.info(`Account name: ${config.accountName}`);
    core.info(`Include patterns: ${config.includePatterns.join(", ")}`);
    core.info(`Exclude patterns: ${config.excludePatterns.join(", ")}`);
    core.info(`One entry mode: ${config.oneEntryMode}`);
    core.info(`Replace existing pages: ${config.replaceExistingPages}`);

    // Validate configuration
    if (config.replaceExistingPages && !config.accessToken) {
      throw new Error(
        "replace-existing-pages mode requires a consistent telegraph-token. " +
          "Please provide a telegraph-token input to reuse existing pages."
      );
    }

    // Initialize clients
    const telegraphClient = new TelegraphClient();
    const markdownProcessor = new MarkdownProcessor(
      workspaceRoot,
      config.includePatterns,
      config.excludePatterns
    );
    const markdownConverter = new MarkdownConverter();

    // Create or use existing Telegraph account
    if (config.accessToken) {
      core.info("Using existing Telegraph access token");
      telegraphClient.setAccessToken(config.accessToken);
    } else {
      core.info("Creating new Telegraph account...");
      await telegraphClient.createAccount(
        config.accountName,
        config.authorName,
        config.authorUrl
      );
    }

    // Load existing page mappings
    const mappingFile = path.join(workspaceRoot, config.outputFile);
    const existingMappings = loadPageMappings(mappingFile);
    const newMappings: PageMapping[] = [];

    // Find all markdown files
    const markdownFiles = await markdownProcessor.findMarkdownFiles();

    if (markdownFiles.length === 0) {
      core.warning("No markdown files found matching the specified patterns");
      return;
    }

    core.info(`Processing ${markdownFiles.length} markdown files...`);

    // Process each markdown file
    for (const file of markdownFiles) {
      try {
        core.info(`Processing: ${file.relativePath}`);

        // Check if file has been modified since last run
        const stats = fs.statSync(file.filePath);
        const lastModified = stats.mtime.toISOString();
        const existingMapping = existingMappings.find(
          (m) => m.filePath === file.relativePath
        );

        if (existingMapping && existingMapping.lastModified === lastModified) {
          core.info(`Skipping unchanged file: ${file.relativePath}`);
          newMappings.push(existingMapping);
          continue;
        }

        // First pass: Convert markdown to Telegraph nodes without resolving internal links
        const nodes = markdownConverter.convertToTelegraphNodesSimple(
          file.content
        );

        if (nodes.length === 0) {
          core.warning(`No content to convert in file: ${file.relativePath}`);
          continue;
        }

        // Create or update Telegraph page
        let telegraphPage;
        if (existingMapping) {
          core.info(
            `Updating existing Telegraph page: ${existingMapping.telegraphUrl}`
          );
          telegraphPage = await telegraphClient.editPage(
            existingMapping.telegraphPath,
            file.title || file.relativePath,
            nodes,
            config.authorName,
            config.authorUrl
          );
        } else if (config.replaceExistingPages && config.accessToken) {
          // Look for existing page with same title
          core.info(
            `Searching for existing Telegraph page with title: ${file.title || file.relativePath}`
          );
          const existingPage = await telegraphClient.findExistingPageByTitle(
            file.title || file.relativePath
          );

          if (existingPage) {
            core.info(
              `Found existing page "${existingPage.title}" at ${existingPage.url}. Replacing content...`
            );
            telegraphPage = await telegraphClient.editPage(
              existingPage.path,
              file.title || file.relativePath,
              nodes,
              config.authorName,
              config.authorUrl
            );
          } else {
            core.info(
              `No existing page found. Creating new Telegraph page for: ${file.relativePath}`
            );
            telegraphPage = await telegraphClient.createPage(
              file.title || file.relativePath,
              nodes,
              config.authorName,
              config.authorUrl
            );
          }
        } else {
          core.info(`Creating new Telegraph page for: ${file.relativePath}`);
          telegraphPage = await telegraphClient.createPage(
            file.title || file.relativePath,
            nodes,
            config.authorName,
            config.authorUrl
          );
        }

        // Add to mappings
        newMappings.push({
          filePath: file.relativePath,
          telegraphPath: telegraphPage.path,
          telegraphUrl: telegraphPage.url,
          lastModified,
        });

        core.info(`✅ ${file.relativePath} -> ${telegraphPage.url}`);
      } catch (error) {
        core.error(`Failed to process ${file.relativePath}: ${error}`);
        // Continue with other files
      }
    }

    // Second pass: Update pages with resolved internal links
    core.info("Resolving internal markdown links...");
    await resolveInternalLinks(
      markdownFiles,
      newMappings,
      markdownConverter,
      telegraphClient,
      config
    );

    // Save updated mappings
    savePageMappings(mappingFile, newMappings);

    // Handle one entry mode
    if (config.oneEntryMode && newMappings.length === 1) {
      try {
        core.info(
          "One entry mode enabled and exactly one page created. Updating repository homepage URL..."
        );

        const githubClient = new GitHubClient();
        const hasPermissions = await githubClient.checkPermissions();

        if (hasPermissions) {
          const singlePage = newMappings[0];
          await githubClient.updateRepositoryHomepage(singlePage.telegraphUrl);
          core.info(
            `✅ Repository homepage URL updated with Telegraph URL: ${singlePage.telegraphUrl}`
          );
        } else {
          core.warning(
            "GitHub token does not have sufficient permissions to update repository homepage URL. Please ensure the token has 'metadata: write' or 'contents: write' permissions."
          );
        }
      } catch (error) {
        core.warning(
          `Failed to update repository homepage URL in one entry mode: ${error}`
        );
        // Don't fail the entire action for this feature
      }
    } else if (config.oneEntryMode && newMappings.length !== 1) {
      core.info(
        `One entry mode enabled but ${newMappings.length} pages were created. Repository homepage URL will not be updated.`
      );
    }

    // Set outputs
    core.setOutput("pages-created", newMappings.length.toString());
    core.setOutput("mapping-file", config.outputFile);

    core.info(`✅ Successfully processed ${newMappings.length} files`);
  } catch (error) {
    core.setFailed(`Action failed: ${error}`);
  }
}

async function resolveInternalLinks(
  markdownFiles: MarkdownFile[],
  mappings: PageMapping[],
  markdownConverter: MarkdownConverter,
  telegraphClient: TelegraphClient,
  config: any
): Promise<void> {
  // Create lookup map for file path to Telegraph URL
  const pathToUrlMap = new Map<string, string>();
  mappings.forEach((mapping) => {
    pathToUrlMap.set(mapping.filePath, mapping.telegraphUrl);
  });

  // Create link resolver function
  const linkResolver = (filePath: string): string => {
    return pathToUrlMap.get(filePath) || filePath;
  };

  // Process each file again to resolve internal links
  for (const file of markdownFiles) {
    try {
      const mapping = mappings.find((m) => m.filePath === file.relativePath);
      if (!mapping) {
        continue; // Skip files that weren't processed in first pass
      }

      core.info(`Resolving internal links in: ${file.relativePath}`);

      // Convert markdown with link resolution
      const resolvedNodes = markdownConverter.convertToTelegraphNodesSimple(
        file.content,
        file.relativePath,
        linkResolver
      );

      // Update the Telegraph page
      await telegraphClient.editPage(
        mapping.telegraphPath,
        file.title || file.relativePath,
        resolvedNodes,
        config.authorName,
        config.authorUrl
      );

      core.info(`✅ Updated internal links in: ${mapping.telegraphUrl}`);
    } catch (error) {
      core.warning(
        `Failed to resolve internal links in ${file.relativePath}: ${error}`
      );
      // Continue with other files
    }
  }
}

// Run the action
if (require.main === module) {
  run();
}
