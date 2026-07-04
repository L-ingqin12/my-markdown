import React, { useState, useEffect, useCallback } from 'react'

interface FileNode {
  name: string
  path: string
  isDirectory: boolean
  children?: FileNode[]
}

interface FileTreeProps {
  rootPath?: string
  onFileClick?: (path: string) => void
  activeFile?: string | null
}

export function FileTree({ rootPath, onFileClick, activeFile }: FileTreeProps) {
  const [tree, setTree] = useState<FileNode[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const loadDirectory = useCallback(async (dirPath: string): Promise<FileNode[]> => {
    try {
      // Use the file open dialog directory to get files
      // In Electron with contextIsolation, we read via IPC
      const response = await fetch(`file://${dirPath}`)
      return []
    } catch {
      return []
    }
  }, [])

  // For now, build a tree from recent files
  useEffect(() => {
    async function buildTree() {
      setLoading(true)
      try {
        const recentFiles = await window.api.getRecentFiles()
        const nodes: FileNode[] = []
        const dirMap = new Map<string, FileNode>()

        for (const filePath of recentFiles) {
          const parts = filePath.split(/[/\\]/)
          const fileName = parts.pop() || ''
          const dirPath = parts.join('/')

          if (!dirMap.has(dirPath)) {
            const dirNode: FileNode = {
              name: parts[parts.length - 1] || dirPath,
              path: dirPath,
              isDirectory: true,
              children: []
            }
            dirMap.set(dirPath, dirNode)
            nodes.push(dirNode)
          }

          const dirNode = dirMap.get(dirPath)!
          if (!dirNode.children?.find(c => c.path === filePath)) {
            dirNode.children!.push({
              name: fileName,
              path: filePath,
              isDirectory: false
            })
          }
        }

        setTree(nodes)
      } finally {
        setLoading(false)
      }
    }

    buildTree()
  }, [])

  const toggleExpand = (path: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const renderNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expanded.has(node.path)
    const isActive = activeFile === node.path

    if (node.isDirectory) {
      return (
        <div key={node.path}>
          <div
            className="file-tree-item directory"
            style={{ paddingLeft: depth * 16 + 8 }}
            onClick={() => toggleExpand(node.path)}
          >
            <span className="file-tree-icon">{isExpanded ? '▾' : '▸'}</span>
            <span className="file-tree-name">{node.name}</span>
            <span className="file-tree-count">{node.children?.length || 0}</span>
          </div>
          {isExpanded && node.children?.map(child => renderNode(child, depth + 1))}
        </div>
      )
    }

    return (
      <div
        key={node.path}
        className={`file-tree-item file ${isActive ? 'active' : ''}`}
        style={{ paddingLeft: depth * 16 + 28 }}
        onClick={() => onFileClick?.(node.path)}
      >
        <span className="file-tree-icon">📄</span>
        <span className="file-tree-name">{node.name}</span>
      </div>
    )
  }

  return (
    <div className="file-tree">
      {loading ? (
        <div style={{ padding: '16px', color: '#aaa', fontSize: '13px', textAlign: 'center' }}>
          Loading...
        </div>
      ) : tree.length === 0 ? (
        <div style={{ padding: '16px', color: '#aaa', fontSize: '13px', textAlign: 'center' }}>
          No files yet. Open a file to see it here.
        </div>
      ) : (
        tree.map(node => renderNode(node))
      )}
    </div>
  )
}
