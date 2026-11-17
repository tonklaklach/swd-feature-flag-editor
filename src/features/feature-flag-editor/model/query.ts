import type { Node } from './flag'
import { parseValue } from './flag-value'

export function compileQuery(node: Node): string {
  if (node.kind === 'group')
    return `(${node.children.map(compileQuery).join(` ${node.operator} `)})`
  return `${node.attribute} ${node.operator} ${JSON.stringify(parseValue(node.value, node.type))}`
}
