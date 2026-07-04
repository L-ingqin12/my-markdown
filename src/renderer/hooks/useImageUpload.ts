import { useState, useCallback } from 'react'
import { useEditor } from '../contexts/EditorContext'

export function useImageUpload() {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const { editorRef } = useEditor()

  const uploadImages = useCallback(async (imagePaths: string[]) => {
    setUploading(true)
    setUploadProgress(`Uploading ${imagePaths.length} image(s)...`)

    try {
      const urls = await window.api.uploadImages(imagePaths)
      // Insert URLs into document
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i]
        if (url.startsWith('http://') || url.startsWith('https://')) {
          editorRef.current?.insertText(`![](${url})`)
        }
      }
      setUploadProgress(`Uploaded ${urls.length} image(s) successfully`)
      setTimeout(() => setUploadProgress(''), 3000)
    } catch (err: any) {
      setUploadProgress(`Upload failed: ${err.message}`)
      setTimeout(() => setUploadProgress(''), 5000)
    } finally {
      setUploading(false)
    }
  }, [editorRef])

  const uploadAllLocalImages = useCallback(async () => {
    const content = editorRef.current?.getContent()
    if (!content) return

    // Find all local image references
    const localImgRegex = /!\[.*?\]\((?!https?:\/\/)(?!data:)([^)]+)\)/g
    const localPaths: string[] = []
    let match
    while ((match = localImgRegex.exec(content)) !== null) {
      localPaths.push(match[1])
    }

    if (localPaths.length === 0) {
      setUploadProgress('No local images found')
      setTimeout(() => setUploadProgress(''), 3000)
      return
    }

    setUploading(true)
    setUploadProgress(`Uploading ${localPaths.length} local image(s)...`)

    try {
      const urls = await window.api.uploadImages(localPaths)
      let newContent = content
      for (let i = 0; i < localPaths.length; i++) {
        if (urls[i]?.startsWith('http')) {
          newContent = newContent.replace(`](${localPaths[i]})`, `](${urls[i]})`)
        }
      }
      editorRef.current?.setContent(newContent)
      setUploadProgress(`Replaced ${urls.length} local image(s) with remote URLs`)
      setTimeout(() => setUploadProgress(''), 3000)
    } catch (err: any) {
      setUploadProgress(`Upload all failed: ${err.message}`)
      setTimeout(() => setUploadProgress(''), 5000)
    } finally {
      setUploading(false)
    }
  }, [editorRef])

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const blob = item.getAsFile()
        if (!blob) continue

        const buffer = await blob.arrayBuffer()
        const ext = blob.type.split('/')[1] || 'png'
        const tempPath = await window.api.writeTempImage(buffer, ext)

        await uploadImages([tempPath])
      }
    }
  }, [uploadImages])

  const handleDrop = useCallback(async (e: DragEvent) => {
    const files = e.dataTransfer?.files
    if (!files) return

    const imagePaths: string[] = []
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        e.preventDefault()
        const buffer = await file.arrayBuffer()
        const ext = file.type.split('/')[1] || 'png'
        const tempPath = await window.api.writeTempImage(buffer, ext)
        imagePaths.push(tempPath)
      }
    }

    if (imagePaths.length > 0) {
      await uploadImages(imagePaths)
    }
  }, [uploadImages])

  return {
    uploading,
    uploadProgress,
    uploadImages,
    uploadAllLocalImages,
    handlePaste,
    handleDrop
  }
}
