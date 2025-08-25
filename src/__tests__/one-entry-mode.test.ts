import { describe, test, expect, beforeEach, mock } from "bun:test";
import { getConfig } from "../utils";

// Mock @actions/core
const mockGetInput = mock(() => "");
const mockInfo = mock(() => {});
const mockWarning = mock(() => {});
const mockError = mock(() => {});
const mockSetFailed = mock(() => {});
const mockSetOutput = mock(() => {});

mock.module("@actions/core", () => ({
  info: mockInfo,
  warning: mockWarning,
  error: mockError,
  setFailed: mockSetFailed,
  getInput: mockGetInput,
  setOutput: mockSetOutput,
}));

describe("One Entry Mode Configuration", () => {
  beforeEach(() => {
    mockGetInput.mockRestore();
  });

  test("should enable one entry mode when input is true", () => {
    mockGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "one-entry-mode": "true",
      };
      return inputs[name] || "";
    });

    const config = getConfig();

    expect(config.oneEntryMode).toBe(true);
  });

  test("should disable one entry mode when input is false", () => {
    mockGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "one-entry-mode": "false",
      };
      return inputs[name] || "";
    });

    const config = getConfig();

    expect(config.oneEntryMode).toBe(false);
  });

  test("should disable one entry mode when input is empty (default)", () => {
    mockGetInput.mockReturnValue("");

    const config = getConfig();

    expect(config.oneEntryMode).toBe(false);
  });

  test("should disable one entry mode when input is any other value", () => {
    mockGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "one-entry-mode": "yes",
      };
      return inputs[name] || "";
    });

    const config = getConfig();

    expect(config.oneEntryMode).toBe(false);
  });
});
