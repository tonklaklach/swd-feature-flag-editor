import { z } from 'zod'
import type { Node } from './flag'
import { parseValue } from './flag-value'

export const conditionSchema = z
  .object({
    id: z.string().min(1),
    kind: z.literal('condition'),
    attribute: z
      .string()
      .regex(
        /^[A-Za-z_][A-Za-z0-9_.]*$/,
        'Use an attribute such as role, group or user.country',
      ),
    operator: z.enum(['eq', 'ne', 'gt', 'lt']),
    type: z.enum(['string', 'number', 'boolean']),
    value: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'string' && !value.value.trim())
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: 'Enter a match value',
      })
    try {
      parseValue(value.value, value.type)
    } catch {
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: `Enter a valid ${value.type} value`,
      })
    }
    if (
      (value.operator === 'gt' || value.operator === 'lt') &&
      value.type !== 'number'
    )
      ctx.addIssue({
        code: 'custom',
        path: ['operator'],
        message: 'Greater/less than requires a number',
      })
  })
const nodeSchema: z.ZodType<Node> = z.lazy(() =>
  z.discriminatedUnion('kind', [conditionSchema, groupSchema]),
)
const groupSchema = z.object({
  id: z.string().min(1),
  kind: z.literal('group'),
  operator: z.enum(['and', 'or']),
  children: z
    .array(nodeSchema)
    .min(1, 'Add at least one condition to this group'),
})

export const flagSchema = z
  .object({
    key: z
      .string()
      .regex(
        /^[A-Za-z0-9][A-Za-z0-9_-]*$/,
        'Flag key must use letters, numbers, hyphens or underscores',
      ),
    description: z.string(),
    enabled: z.boolean(),
    trackEvents: z.boolean(),
    valueType: z.enum(['boolean', 'string', 'number', 'json']),
    variations: z
      .array(
        z.object({
          id: z.string().min(1),
          name: z
            .string()
            .regex(
              /^[A-Za-z0-9][A-Za-z0-9_-]*$/,
              'Enter a name using letters, numbers, hyphens or underscores',
            ),
          value: z.string(),
        }),
      )
      .min(1, 'At least one variation is required'),
    rules: z.array(
      z.object({
        id: z.string().min(1),
        name: z.string().trim().min(1, 'Enter a rule name'),
        variationId: z.string(),
        percentage: z
          .string()
          .refine(
            (v) =>
              v.trim() !== '' &&
              Number.isFinite(Number(v)) &&
              Number(v) >= 0 &&
              Number(v) <= 100,
            'Percentage must be between 0 and 100',
          ),
        group: z.unknown().pipe(groupSchema),
      }),
    ),
    defaultVariationId: z.string(),
  })
  .superRefine((form, ctx) => {
    const names = new Set<string>()
    form.variations.forEach((variation, index) => {
      if (names.has(variation.name))
        ctx.addIssue({
          code: 'custom',
          path: ['variations', index, 'name'],
          message: 'Variation names must be unique',
        })
      names.add(variation.name)
      try {
        parseValue(variation.value, form.valueType)
      } catch {
        ctx.addIssue({
          code: 'custom',
          path: ['variations', index, 'value'],
          message: `Enter a valid ${form.valueType} value`,
        })
      }
    })
    const exists = (id: string) => form.variations.some((v) => v.id === id)
    if (!exists(form.defaultVariationId))
      ctx.addIssue({
        code: 'custom',
        path: ['defaultVariationId'],
        message: 'Choose an existing default variation',
      })
    form.rules.forEach((rule, index) => {
      if (!exists(rule.variationId))
        ctx.addIssue({
          code: 'custom',
          path: ['rules', index, 'variationId'],
          message: 'Choose an existing variation',
        })
    })
  })
