const { defineConfig } = require('@playwright/test');

if (!process.env.APP_TEST_URL) {
  throw new Error('Set APP_TEST_URL to the base URL of an isolated test instance before running browser tests.');
}

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.APP_TEST_URL,
    browserName: 'chromium',
    headless: true,
    trace: 'retain-on-failure',
  },
});
