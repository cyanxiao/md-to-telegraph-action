import { getConfig, loadPageMappings, savePageMappings } from "../utils";
import * as core from "@actions/core";
import * as fs from "fs";

jest.mock("@actions/core", () => ({
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
  setFailed: jest.fn(),
  getInput: jest.fn(),
  setOutput: jest.fn(),
}));
jest.mock("fs");

const mockedCore = core as jest.Mocked<typeof core>;
const mockedFs = fs as jest.Mocked<typeof fs>;

describe("Integration functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getConfig", () => {
    it("should return config with provided inputs", () => {
      mockedCore.getInput.mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          "account-name": "Test Account",
          "author-name": "Test Author",
          "author-url": "https://example.com",
          "include-patterns": "docs/**/*.md, *.md",
          "exclude-patterns": "build/**, dist/**",
          "output-file": "pages.json",
          "telegraph-token": "token-123",
        };
        return inputs[name] || "";
      });

      const config = getConfig();

      expect(config).toEqual({
        accountName: "Test Account",
        authorName: "Test Author",
        authorUrl: "https://example.com",
        includePatterns: ["docs/**/*.md", "*.md"],
        excludePatterns: ["build/**", "dist/**"],
        outputFile: "pages.json",
        accessToken: "token-123",
        oneEntryMode: false,
        replaceExistingPages: false,
      });
    });

    it("should use default values when inputs are empty", () => {
      mockedCore.getInput.mockReturnValue("");

      const config = getConfig();

      expect(config).toEqual({
        accountName: "GitHub Action",
        authorName: "GitHub Action",
        authorUrl: undefined,
        includePatterns: ["**/*.md"],
        excludePatterns: ["node_modules/**"],
        outputFile: "telegraph-pages.json",
        accessToken: undefined,
        oneEntryMode: false,
        replaceExistingPages: false,
      });
    });
  });

  describe("loadPageMappings", () => {
    it("should load existing mappings", () => {
      const mockMappings = [
        {
          filePath: "README.md",
          telegraphPath: "test-123",
          telegraphUrl: "https://telegra.ph/test-123",
          lastModified: "2023-01-01T00:00:00.000Z",
        },
      ];

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockMappings));

      const result = loadPageMappings("test.json");

      expect(result).toEqual(mockMappings);
    });

    it("should return empty array when file does not exist", () => {
      mockedFs.existsSync.mockReturnValue(false);

      const result = loadPageMappings("nonexistent.json");

      expect(result).toEqual([]);
    });
  });

  describe("savePageMappings", () => {
    it("should save mappings to file", () => {
      const mappings = [
        {
          filePath: "README.md",
          telegraphPath: "test-123",
          telegraphUrl: "https://telegra.ph/test-123",
          lastModified: "2023-01-01T00:00:00.000Z",
        },
      ];

      savePageMappings("test.json", mappings);

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        "test.json",
        JSON.stringify(mappings, null, 2),
        "utf-8"
      );
    });

    it("should enable one entry mode when input is true", () => {
      mockedCore.getInput.mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          "one-entry-mode": "true",
        };
        return inputs[name] || "";
      });

      const config = getConfig();

      expect(config.oneEntryMode).toBe(true);
    });

    it("should disable one entry mode when input is false or empty", () => {
      mockedCore.getInput.mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          "one-entry-mode": "false",
        };
        return inputs[name] || "";
      });

      const config = getConfig();

      expect(config.oneEntryMode).toBe(false);
    });

    it("should enable replace existing pages when input is true", () => {
      mockedCore.getInput.mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          "replace-existing-pages": "true",
        };
        return inputs[name] || "";
      });

      const config = getConfig();

      expect(config.replaceExistingPages).toBe(true);
    });

    it("should disable replace existing pages when input is false or empty", () => {
      mockedCore.getInput.mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          "replace-existing-pages": "false",
        };
        return inputs[name] || "";
      });

      const config = getConfig();

      expect(config.replaceExistingPages).toBe(false);
    });
  });
});
