import React, { useEffect, useRef } from 'react'
import { Transformer } from 'markmap-lib'
import { Markmap } from 'markmap-view'

interface MindMapViewProps {
  content: string
}

export function MindMapView({ content }: MindMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const mmRef = useRef<Markmap | null>(null)

  useEffect(() => {
    if (!svgRef.current) return

    try {
      const transformer = new Transformer()
      const { root } = transformer.transform(content || '# Empty')

      if (!mmRef.current) {
        mmRef.current = Markmap.create(svgRef.current, {
          autoFit: true,
          duration: 300
        } as any)
      }

      mmRef.current.setData(root)
      requestAnimationFrame(() => mmRef.current?.fit())
    } catch (err) {
      console.error('MindMap render error:', err)
    }
  }, [content])

  // ResizeObserver to re-fit when container size changes
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let raf = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => mmRef.current?.fit())
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  )
}
