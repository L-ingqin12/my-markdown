import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

interface ThemeContextValue {
  theme: string
  themeCss: string
  themeList: { name: string; displayName: string; isBuiltin: boolean }[]
  setTheme: (name: string) => Promise<void>
  refreshThemeList: () => Promise<void>
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'github',
  themeCss: '',
  themeList: [],
  setTheme: async () => {},
  refreshThemeList: async () => {}
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState('github')
  const [themeCss, setThemeCss] = useState('')
  const [themeList, setThemeList] = useState<ThemeContextValue['themeList']>([])

  const refreshThemeList = useCallback(async () => {
    try {
      const list = await window.api.getThemeList()
      setThemeList(list)
    } catch {
      setThemeList([])
    }
  }, [])

  const loadTheme = useCallback(async (name: string) => {
    try {
      const css = await window.api.loadThemeCss(name)
      // Inject raw CSS — Typora themes use #write prefix by convention
      // App chrome is protected by our own CSS specificity
      setThemeCss(css)
      setThemeState(name)
    } catch {
      // Theme not found
    }
  }, [])

  const setTheme = useCallback(async (name: string) => {
    await loadTheme(name)
    await window.api.setCurrentTheme(name)
  }, [loadTheme])

  useEffect(() => {
    async function init() {
      await refreshThemeList()
      const current = await window.api.getCurrentTheme()
      await loadTheme(current)
    }
    init()
  }, [loadTheme, refreshThemeList])

  const themeValue = useMemo(() => ({
      theme, themeCss, themeList, setTheme, refreshThemeList
    }), [theme, themeCss, themeList, setTheme, refreshThemeList])

  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
