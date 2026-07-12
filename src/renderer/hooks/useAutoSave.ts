import { useEffect, useRef } from 'react'
import { useFileSystem } from './useFileSystem'

export function useAutoSave(content: string, filePath: string | null, isModified: boolean, interval: number = 2000) {
  const { saveFile } = useFileSystem()
  const lastSavedContent = useRef(content)

  useEffect(() => {
    if (!filePath || !isModified) return
    if (content === lastSavedContent.current) return

    const timer = setTimeout(async () => {
      const ok = await saveFile()
      if (ok) {
        lastSavedContent.current = content
      }
    }, interval)

    return () => clearTimeout(timer)
  }, [content, filePath, isModified, interval, saveFile])
}
