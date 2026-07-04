import { useCallback } from 'react'
import { useEditor } from '../contexts/EditorContext'

export function useFileSystem() {
  const {
    content, setContent,
    filePath, setFilePath,
    fileName, setFileName,
    isModified, setIsModified
  } = useEditor()

  const openFile = useCallback(async () => {
    const result = await window.api.openFile()
    if (result) {
      setContent(result.content)
      setFilePath(result.filePath)
      setFileName(result.fileName)
      setIsModified(false)
      window.api.setTitle(`My Markdown - ${result.fileName}`)
    }
  }, [setContent, setFilePath, setFileName, setIsModified])

  const saveFile = useCallback(async () => {
    if (!filePath) {
      return saveFileAs()
    }
    const ok = await window.api.saveFile(filePath, content)
    if (ok) {
      setIsModified(false)
      window.api.setTitle(`My Markdown - ${fileName}`)
    }
    return ok
  }, [filePath, content, fileName, setIsModified])

  const saveFileAs = useCallback(async () => {
    const newPath = await window.api.saveFileAs(content)
    if (newPath) {
      setFilePath(newPath)
      setFileName(newPath.split(/[/\\]/).pop() || 'Untitled')
      setIsModified(false)
      window.api.setTitle(`My Markdown - ${newPath.split(/[/\\]/).pop()}`)
      return true
    }
    return false
  }, [content, setFilePath, setFileName, setIsModified])

  const openFileByPath = useCallback(async (path: string) => {
    const result = await window.api.readFile(path)
    if (result) {
      setContent(result.content)
      setFilePath(result.filePath)
      setFileName(result.fileName)
      setIsModified(false)
      window.api.setTitle(`My Markdown - ${result.fileName}`)
    }
  }, [setContent, setFilePath, setFileName, setIsModified])

  return {
    openFile, saveFile, saveFileAs, openFileByPath,
    filePath, fileName, isModified
  }
}
