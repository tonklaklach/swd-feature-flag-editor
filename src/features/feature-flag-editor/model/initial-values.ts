import type { Condition, Group, FlagForm } from './flag'

export function newCondition(): Condition {
  return {
    id: crypto.randomUUID(),
    kind: 'condition',
    attribute: 'role',
    operator: 'eq',
    type: 'string',
    value: '',
  }
}
export function newGroup(): Group {
  return {
    id: crypto.randomUUID(),
    kind: 'group',
    operator: 'and',
    children: [newCondition()],
  }
}
export function initialValues(): FlagForm {
  return {
    key: 'new-checkout',
    description: 'A simpler checkout for our beta community.',
    enabled: true,
    trackEvents: false,
    valueType: 'boolean',
    variations: [
      { id: 'on', name: 'on', value: 'true' },
      { id: 'off', name: 'off', value: 'false' },
    ],
    defaultVariationId: 'off',
    rules: [
      {
        id: 'beta',
        name: 'Beta community',
        variationId: 'on',
        percentage: '100',
        group: {
          id: 'root',
          kind: 'group',
          operator: 'and',
          children: [
            {
              id: 'country',
              kind: 'condition',
              attribute: 'country',
              operator: 'eq',
              type: 'string',
              value: 'TH',
            },
            {
              id: 'audience',
              kind: 'group',
              operator: 'or',
              children: [
                {
                  id: 'role',
                  kind: 'condition',
                  attribute: 'role',
                  operator: 'eq',
                  type: 'string',
                  value: 'admin',
                },
                {
                  id: 'group',
                  kind: 'condition',
                  attribute: 'group',
                  operator: 'eq',
                  type: 'string',
                  value: 'beta',
                },
              ],
            },
          ],
        },
      },
    ],
  }
}
