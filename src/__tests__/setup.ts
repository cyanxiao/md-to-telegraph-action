global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('Setup', () => {
  test('should have console mocks', () => {
    expect(jest.isMockFunction(console.log)).toBe(true);
  });
});