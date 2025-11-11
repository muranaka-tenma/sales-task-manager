// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * E2E Test Configuration for Sales Task Manager
 * 本番環境（Netlify）での自動テスト
 */
module.exports = defineConfig({
  testDir: './e2e',

  // テストタイムアウト
  timeout: 30000,

  // 並列実行（本番環境なので慎重に1つずつ）
  fullyParallel: false,
  workers: 1,

  // 失敗時のリトライ
  retries: 1,

  // レポート
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  use: {
    // 本番環境URL
    baseURL: 'https://stellar-biscochitos-e19cb4.netlify.app',

    // タイムアウト
    actionTimeout: 10000,
    navigationTimeout: 30000,

    // スクリーンショット・動画
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    // ヘッドレスモード
    headless: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
