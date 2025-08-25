import { test, expect, mock } from "bun:test";

// Mock console functions
global.console = {
  ...console,
  log: mock(() => {}),
  debug: mock(() => {}),
  info: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {}),
};

test("Setup - should have console mocks", () => {
  expect(typeof console.log).toBe("function");
});
