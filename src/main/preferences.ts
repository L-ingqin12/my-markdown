import { appStore } from './store'

export function loadPreferences() {
  return {
    windowBounds: appStore.get('windowBounds'),
    theme: appStore.get('theme'),
    preferences: appStore.get('preferences')
  }
}

export function getPreferences() {
  return appStore.get('preferences')
}

export function setPreferences(partial: Record<string, unknown>): void {
  const current = appStore.get('preferences')
  appStore.set('preferences', { ...current, ...partial })
}

export function getTheme(): string {
  return appStore.get('theme', 'github')
}

export function setTheme(theme: string): void {
  appStore.set('theme', theme)
}
