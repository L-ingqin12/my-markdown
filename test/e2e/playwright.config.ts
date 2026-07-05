import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  timeout: 30000,
  retries: 1,
  use: {
    screenshot: 'on',
    video: 'retain-on-failure'
  }
})
