export type ValueType = 'boolean' | 'string' | 'number' | 'json'
export type Condition = {
  id: string
  kind: 'condition'
  attribute: string
  operator: 'eq' | 'ne' | 'gt' | 'lt'
  type: 'string' | 'number' | 'boolean'
  value: string
}
export type Group = {
  id: string
  kind: 'group'
  operator: 'and' | 'or'
  children: Node[]
}
export type Node = Condition | Group
export type Variation = { id: string; name: string; value: string }
export type Rule = {
  id: string
  name: string
  variationId: string
  percentage: string
  group: Group
}
export type FlagForm = {
  key: string
  description: string
  enabled: boolean
  trackEvents: boolean
  valueType: ValueType
  variations: Variation[]
  rules: Rule[]
  defaultVariationId: string
}
