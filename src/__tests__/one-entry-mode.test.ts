import { getConfig } from "../utils";
import * as core from "@actions/core";

jest.mock("@actions/core", () => ({
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
  setFailed: jest.fn(),
  getInput: jest.fn(),
  setOutput: jest.fn(),
}));

const mockedCore = core as jest.Mocked<typeof core>;

describe("One Entry Mode Configuration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it("should disable one entry mode when input is false", () => {
    mockedCore.getInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "one-entry-mode": "false",
      };
      return inputs[name] || "";
    });

    const config = getConfig();

    expect(config.oneEntryMode).toBe(false);
  });

  it("should disable one entry mode when input is empty (default)", () => {
    mockedCore.getInput.mockReturnValue("");

    const config = getConfig();

    expect(config.oneEntryMode).toBe(false);
  });

  it("should disable one entry mode when input is any other value", () => {
    mockedCore.getInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "one-entry-mode": "yes",
      };
      return inputs[name] || "";
    });

    const config = getConfig();

    expect(config.oneEntryMode).toBe(false);
  });
});
