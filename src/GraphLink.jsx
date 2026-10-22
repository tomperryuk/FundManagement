import { graphIds, slug } from './graphRoutes.js'

// Small "Explore connections" link for a blueprint item. Renders nothing when the graph has no matching node.
export default function GraphLink({ kind, name, className = '' }) {
  const id = `${kind}:${slug(String(name))}`
  if (!graphIds.has(id)) return null
  return <a className={`graph-link ${className}`.trim()} href={`#/graph/${id}`} title="See what this is connected to">◎ Connections</a>
}
