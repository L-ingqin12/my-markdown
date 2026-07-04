// Graph data builder using d3-force for knowledge graph visualization
import {
  forceSimulation, forceLink, forceManyBody, forceCenter,
  forceCollide, SimulationNodeDatum, SimulationLinkDatum
} from 'd3-force'
import { extractWikiLinks, extractTags, resolveWikiLinkTarget } from './wikilink'

export interface GraphNode extends SimulationNodeDatum {
  id: string
  label: string
  path: string
  tags: string[]
  isCurrent: boolean
  x?: number
  y?: number
}

export interface GraphEdge extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode
  target: string | GraphNode
  id: string
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export function buildGraphData(
  documents: Array<{ path: string; content: string }>,
  currentPath?: string
): GraphData {
  const nodes: GraphNode[] = documents.map((doc, i) => {
    const fileName = doc.path.split(/[/\\]/).pop()?.replace(/\.md$/, '') || doc.path
    return {
      id: `node-${i}`,
      label: fileName,
      path: doc.path,
      tags: extractTags(doc.content),
      isCurrent: doc.path === currentPath
    }
  })

  const pathToNode = new Map<string, GraphNode>()
  nodes.forEach(n => pathToNode.set(n.path, n))

  const nameToPaths = new Map<string, string[]>()
  nodes.forEach(n => {
    const name = n.label.toLowerCase()
    if (!nameToPaths.has(name)) nameToPaths.set(name, [])
    nameToPaths.get(name)!.push(n.path)
  })

  const edges: GraphEdge[] = []
  const seen = new Set<string>()

  documents.forEach((doc, i) => {
    const links = extractWikiLinks(doc.content)
    links.forEach(linkText => {
      const { fileName } = resolveWikiLinkTarget(linkText)
      const targetPaths = nameToPaths.get(fileName.toLowerCase())
      if (targetPaths) {
        targetPaths.forEach(targetPath => {
          const j = nodes.findIndex(n => n.path === targetPath)
          if (j >= 0 && j !== i) {
            const edgeId = `${i}-${j}`
            if (!seen.has(edgeId)) {
              seen.add(edgeId)
              edges.push({
                source: `node-${i}`,
                target: `node-${j}`,
                id: edgeId
              })
            }
          }
        })
      }
    })
  })

  return { nodes, edges }
}

export function runSimulation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  onTick: () => void
) {
  return forceSimulation<GraphNode>(nodes)
    .force('link', forceLink<GraphNode, GraphEdge>(edges).id(d => (d as GraphNode).id).distance(80))
    .force('charge', forceManyBody().strength(-300))
    .force('center', forceCenter(width / 2, height / 2))
    .force('collide', forceCollide(30))
    .on('tick', onTick)
}
