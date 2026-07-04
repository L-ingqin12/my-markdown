import React, { useEffect, useRef } from 'react'
import { Transformer } from 'markmap-lib'
import { Markmap } from 'markmap-view'

interface MindMapViewProps {
  content: string
}

export function MindMapView({ content }: MindMapViewProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const markmapRef = useRef<Markmap | null>(null)

  useEffect(() => {
    if (!svgRef.current) return

    try {
      const transformer = new Transformer()
      const { root, features } = transformer.transform(content)

      if (!markmapRef.current) {
        markmapRef.current = Markmap.create(svgRef.current, {
          autoFit: true,
          colorFreezeLevel: 3,
          duration: 300
        })
      }

      markmapRef.current.setData(root)
      markmapRef.current.fit()
    } catch (err) {
      console.error('MindMap render error:', err)
    }

    return () => {
      // Don't destroy on each content change, just update
    }
  }, [content])

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '400px' }}>
      <svg
        ref={svgRef}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
