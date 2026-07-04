import { readdir, readFile } from 'fs/promises'
import { join, extname } from 'path'
import { existsSync } from 'fs'
import { app } from 'electron'
import { appStore } from './store'

const BUILTIN_THEMES_DIR = join(__dirname, '../../themes')
const USER_THEMES_DIR = join(app.getPath('userData'), 'themes')

export interface ThemeInfo {
  name: string
  displayName: string
  css: string
  isBuiltin: boolean
}

function cssNameToDisplay(filename: string): string {
  return filename
    .replace(/\.css$/, '')
    .replace(/\.user$/, '')
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

async function scanThemesDir(dir: string, isBuiltin: boolean): Promise<string[]> {
  if (!existsSync(dir)) return []
  const files = await readdir(dir)
  return files
    .filter(f => extname(f) === '.css' && !f.endsWith('.user.css'))
    .map(f => join(dir, f))
}

export async function getThemeList(): Promise<{ name: string; displayName: string; isBuiltin: boolean }[]> {
  const builtinFiles = await scanThemesDir(BUILTIN_THEMES_DIR, true)
  const userFiles = await scanThemesDir(USER_THEMES_DIR, false)

  const all = [
    ...builtinFiles.map(f => ({ path: f, isBuiltin: true })),
    ...userFiles.map(f => ({ path: f, isBuiltin: false }))
  ]

  return all.map(({ path, isBuiltin }) => {
    const fileName = path.split(/[/\\]/).pop() || ''
    return {
      name: fileName.replace(/\.css$/, ''),
      displayName: cssNameToDisplay(fileName),
      isBuiltin
    }
  })
}

export async function loadThemeCss(themeName: string): Promise<string> {
  // Try user themes first, then builtin
  const userPath = join(USER_THEMES_DIR, `${themeName}.css`)
  const builtinPath = join(BUILTIN_THEMES_DIR, `${themeName}.css`)

  let cssPath: string | null = null
  if (existsSync(userPath)) cssPath = userPath
  else if (existsSync(builtinPath)) cssPath = builtinPath

  if (!cssPath) {
    throw new Error(`Theme "${themeName}" not found`)
  }

  let css = await readFile(cssPath, 'utf-8')

  // Load user overrides if they exist
  const baseUserPath = join(USER_THEMES_DIR, 'base.user.css')
  const themeUserPath = join(USER_THEMES_DIR, `${themeName}.user.css`)

  if (existsSync(baseUserPath)) {
    css += '\n' + await readFile(baseUserPath, 'utf-8')
  }
  if (existsSync(themeUserPath)) {
    css += '\n' + await readFile(themeUserPath, 'utf-8')
  }

  return css
}

export function getCurrentTheme(): string {
  return appStore.get('theme', 'github')
}
