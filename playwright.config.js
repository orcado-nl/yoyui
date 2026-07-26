const { defineConfig, devices } = require('@playwright/test');

const visualPort = 3100;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${visualPort}`;

module.exports = defineConfig({
    testDir: './tests/visual',
    timeout: 90_000,
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 4 : undefined,
    reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'line',
    snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{projectName}/{arg}{ext}',
    expect: {
        timeout: 10_000,
        toHaveScreenshot: {
            animations: 'disabled',
            caret: 'hide',
            maxDiffPixelRatio: 0.001,
            threshold: 0.2
        }
    },
    use: {
        baseURL,
        colorScheme: 'light',
        serviceWorkers: 'block',
        trace: 'retain-on-failure'
    },
    webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
        ? undefined
        : {
              command: process.env.CI ? 'npm run start:visual' : 'npm run dev:visual',
              reuseExistingServer: !process.env.CI,
              timeout: 120_000,
              url: baseURL
          },
    projects: [
        {
            name: 'desktop-chromium',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1440, height: 900 }
            }
        },
        {
            name: 'tablet-chromium',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1024, height: 768 }
            }
        },
        {
            name: 'mobile-chromium',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 390, height: 844 }
            }
        }
    ]
});
