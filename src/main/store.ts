import Store from 'electron-store'

interface StoreSchema {
  recentFiles: string[]
  windowBounds: {
    width: number
    height: number
    x?: number
    y?: number
    isMaximized: boolean
  } | null
  theme: string
  preferences: {
    fontSize: number
    fontFamily: string
    tabWidth: number
    wordWrap: boolean
    autoSave: boolean
    autoSaveInterval: number
    showLineNumbers: boolean
    spellCheck: boolean
  }
}

export const appStore = new Store<StoreSchema>({
  defaults: {
    recentFiles: [],
    windowBounds: null,
    theme: 'github',
    preferences: {
      fontSize: 16,
      fontFamily: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
      tabWidth: 4,
      wordWrap: true,
      autoSave: true,
      autoSaveInterval: 2000,
      showLineNumbers: false,
      spellCheck: false
    }
  }
})

export const recentFilesStore = {
  addRecent(filePath: string): void {
    const files = appStore.get('recentFiles', [])
    const filtered = files.filter((f: string) => f !== filePath)
    filtered.unshift(filePath)
    appStore.set('recentFiles', filtered.slice(0, 15))
  },
  getRecent(): string[] {
    return appStore.get('recentFiles', [])
  }
}
