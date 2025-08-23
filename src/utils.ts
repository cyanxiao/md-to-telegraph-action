import * as core from "@actions/core";
import * as fs from "fs";

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

export function getConfig(): ActionConfig {
  const includeInput = core.getInput("include-patterns");
  const excludeInput = core.getInput("exclude-patterns");
  const oneEntryModeInput = core.getInput("one-entry-mode");
  const replaceExistingPagesInput = core.getInput("replace-existing-pages");

  return {
    accountName: core.getInput("account-name") || "GitHub Action",
    authorName: core.getInput("author-name") || "GitHub Action",
    authorUrl: core.getInput("author-url") || undefined,
    includePatterns: includeInput
      ? includeInput.split(",").map((p) => p.trim())
      : ["**/*.md"],
    excludePatterns: excludeInput
      ? excludeInput.split(",").map((p) => p.trim())
      : ["node_modules/**"],
    outputFile: core.getInput("output-file") || "telegraph-pages.json",
    accessToken: core.getInput("telegraph-token") || undefined,
    oneEntryMode: oneEntryModeInput === "true",
    replaceExistingPages: replaceExistingPagesInput === "true",
  };
}

export function loadPageMappings(filePath: string): PageMapping[] {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    core.warning(`Failed to load existing mappings from ${filePath}: ${error}`);
  }
  return [];
}

export function savePageMappings(
  filePath: string,
  mappings: PageMapping[]
): void {
  try {
    const content = JSON.stringify(mappings, null, 2);
    fs.writeFileSync(filePath, content, "utf-8");
    core.info(`Saved page mappings to ${filePath}`);
  } catch (error) {
    core.error(`Failed to save mappings to ${filePath}: ${error}`);
    throw error;
  }
}
