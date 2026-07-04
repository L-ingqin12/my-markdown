import React, { useRef, useEffect, useCallback, useState } from 'react'
import { buildGraphData, runSimulation, GraphNode, GraphEdge } from '../../utils/graph'

interface KnowledgeGraphProps {
  documents: Array<{ path: string; content: string }>
  currentPath?: string
  onNodeClick?: (path: string) => void
  width?: number
  height?: number
}

export function KnowledgeGraph({
  documents,
  currentPath,
  onNodeClick,
  width = 800,
  height = 500
}: KnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const simRef = useRef<any>(null)
  const nodesRef = useRef<GraphNode[]>([])
  const edgesRef = useRef<GraphEdge[]>([])
  const transformRef = useRef({ x: 0, y: 0, k: 1 })
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)

  useEffect(() => {
    const { nodes, edges } = buildGraphData(documents, currentPath)
    nodesRef.current = nodes
    edgesRef.current = edges

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Setup dpi
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    ctx.scale(dpr, dpr)

    if (simRef.current) simRef.current.stop()

    const simulation = runSimulation(nodes, edges, width, height, () => {
      renderCanvas(ctx, nodes, edges, transformRef.current, hoveredNode, selectedNode)
    })

    simRef.current = simulation

    return () => {
      simulation.stop()
    }
  }, [documents, currentPath, width, height])

  const renderCanvas = (
    ctx: CanvasRenderingContext2D,
    nodes: GraphNode[],
    edges: GraphEdge[],
    transform: { x: number; y: number; k: number },
    hovered: GraphNode | null,
    selected: GraphNode | null
  ) => {
    ctx.save()
    ctx.clearRect(0, 0, width, height)
    ctx.translate(transform.x, transform.y)
    ctx.scale(transform.k, transform.k)

    // Draw edges
    edges.forEach(edge => {
      const source = typeof edge.source === 'string'
        ? nodes.find(n => n.id === edge.source)
        : edge.source as GraphNode
      const target = typeof edge.target === 'string'
        ? nodes.find(n => n.id === edge.target)
        : edge.target as GraphNode

      if (source?.x != null && source?.y != null && target?.x != null && target?.y != null) {
        ctx.beginPath()
        ctx.moveTo(source.x, source.y)
        ctx.lineTo(target.x, target.y)
        ctx.strokeStyle = '#ccc'
        ctx.lineWidth = 1
        ctx.stroke()
      }
    })

    // Draw nodes
    nodes.forEach(node => {
      if (node.x == null || node.y == null) return
      const r = node.isCurrent ? 8 : 6

      ctx.beginPath()
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)

      if (node === selected) {
        ctx.fillStyle = '#ff6b6b'
      } else if (node === hovered) {
        ctx.fillStyle = '#ffd93d'
      } else if (node.isCurrent) {
        ctx.fillStyle = '#428bca'
      } else if (node.tags.length > 0) {
        const colors = ['#a5d8ff', '#69db7c', '#ffd43b', '#ff8787', '#da77f2']
        ctx.fillStyle = colors[node.tags.length % colors.length]
      } else {
        ctx.fillStyle = '#bbb'
      }

      ctx.fill()
      ctx.strokeStyle = '#888'
      ctx.lineWidth = 1
      ctx.stroke()

      // Label
      ctx.fillStyle = '#333'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(node.label.slice(0, 20), node.x, node.y + 16)
    })

    ctx.restore()
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - transformRef.current.x) / transformRef.current.k
    const y = (e.clientY - rect.top - transformRef.current.y) / transformRef.current.k

    const near = nodesRef.current.find(n => {
      if (n.x == null || n.y == null) return false
      return Math.hypot(n.x - x, n.y - y) < 10
    })
    setHoveredNode(near || null)
  }, [])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (hoveredNode) {
      setSelectedNode(hoveredNode)
      onNodeClick?.(hoveredNode.path)
    }
  }, [hoveredNode, onNodeClick])

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    transformRef.current.k = Math.max(0.1, Math.min(3, transformRef.current.k * delta))
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) renderCanvas(ctx, nodesRef.current, edgesRef.current, transformRef.current, hoveredNode, selectedNode)
    }
  }, [hoveredNode, selectedNode])

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ cursor: hoveredNode ? 'pointer' : 'grab', background: 'var(--bg-color)', borderRadius: '4px' }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onWheel={handleWheel}
      />
      {hoveredNode && (
        <div style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          background: '#333',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          pointerEvents: 'none'
        }}>
          {hoveredNode.label}
          {hoveredNode.tags.length > 0 && (
            <span style={{ color: '#aaa', marginLeft: '8px' }}>
              {hoveredNode.tags.join(', ')}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
