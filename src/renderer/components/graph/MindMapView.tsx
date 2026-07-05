import React, { useEffect, useRef, useCallback } from 'react'
import { Transformer } from 'markmap-lib'
import { Markmap } from 'markmap-view'

interface MindMapViewProps {
  content: string
}

export function MindMapView({ content }: MindMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const markmapRef = useRef<Markmap | null>(null)

  useEffect(() => {
    if (!svgRef.current) return

    try {
      const transformer = new Transformer()
      const { root } = transformer.transform(content)

      if (!markmapRef.current) {
        markmapRef.current = Markmap.create(svgRef.current, {
          autoFit: true,
          duration: 300
        } as any)
      }

      markmapRef.current.setData(root)
      markmapRef.current.fit()
    } catch (err) {
      console.error('MindMap render error:', err)
    }
  }, [content])

  // ResizeObserver: re-fit when container size changes
  useEffect(() => {
    const container = containerRef.current
    if (!container || !markmapRef.current) return

    const observer = new ResizeObserver(() => {
      markmapRef.current?.fit()
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '400px' }}>
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
