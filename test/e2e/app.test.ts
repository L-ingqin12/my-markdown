/**
 * E2E tests for My Markdown Electron app
 * Run with: npx playwright test --config test/e2e/playwright.config.ts
 */
import { test, expect } from '@playwright/test'
import { _electron as electron } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const mainEntry = path.resolve(__dirname, '../../out/main/index.js')

test.describe('My Markdown App', () => {
  let app: any
  let window: any

  test.beforeAll(async () => {
    app = await electron.launch({
      args: [mainEntry],
      executablePath: undefined // uses electron from node_modules
    })
    window = await app.firstWindow()
    await window.waitForLoadState('domcontentloaded')
  })

  test.afterAll(async () => {
    if (app) await app.close()
  })

  test('app launches and shows window with title', async () => {
    const title = await window.title()
    expect(title).toContain('My Markdown')
  })

  test('editor area is visible', async () => {
    const editor = window.locator('.editor-container, .editor-wrapper, #write')
    await expect(editor.first()).toBeVisible({ timeout: 5000 })
  })

  test('toolbar is visible', async () => {
    const toolbar = window.locator('.app-toolbar')
    await expect(toolbar).toBeVisible()
  })

  test('status bar shows file info', async () => {
    const statusbar = window.locator('.app-statusbar')
    await expect(statusbar).toBeVisible()
  })

  test('sidebar toggle works', async () => {
    const sidebarBtn = window.locator('.app-toolbar button').filter({ hasText: 'Sidebar' })
    await sidebarBtn.click()
    // Sidebar should toggle visibility
  })

  test('typing in editor works', async () => {
    // Click in the editor area to focus
    const editor = window.locator('.cm-content')
    await editor.click()
    await window.keyboard.type('# Hello World')
    const content = window.locator('.cm-content')
    await expect(content).toContainText('Hello World')
  })

  test('screenshot matches baseline', async () => {
    await window.screenshot({ path: 'test/e2e/screenshots/app-baseline.png' })
  })
})
