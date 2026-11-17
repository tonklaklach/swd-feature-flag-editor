import { describe, expect, it } from 'vitest'
import { compileQuery } from './query'
import { flagSchema } from './validation'
import { parseValue } from './flag-value'
import { variationUsage } from './variation-usage'
import { initialValues } from './initial-values'
import { configurationSchema } from './flag-configuration'

describe('feature flag configuration', () => {
  it('serializes the assignment contract with nested precedence and no UI IDs', () => {
    const output = configurationSchema.parse(initialValues())
    expect(output.flags['new-checkout']).toMatchObject({
      variations: { on: true, off: false },
      targeting: [
        {
          query: '(country eq "TH" and (role eq "admin" or group eq "beta"))',
          percentage: 100,
          variation: 'on',
        },
      ],
      defaultRule: { variation: 'off' },
      disable: false,
    })
    expect(JSON.stringify(output)).not.toContain('variationId')
  })
  it('preserves references when a variation is renamed', () => {
    const form = initialValues()
    form.variations[0].name = 'beta'
    form.variations[1].name = 'control'
    const flag = configurationSchema.parse(form).flags['new-checkout']
    expect(flag.targeting[0].variation).toBe('beta')
    expect(flag.defaultRule.variation).toBe('control')
  })
  it('reports the consumers that prevent deleting a variation', () => {
    const form = initialValues()
    expect(variationUsage(form, 'off')).toEqual(['Default behavior'])
    expect(variationUsage(form, 'on')).toEqual(['Beta community'])
  })
  it('preserves explicit rule order', () => {
    const form = initialValues()
    form.rules.push({ ...form.rules[0], id: 'second', variationId: 'off' })
    form.rules.reverse()
    expect(
      configurationSchema
        .parse(form)
        .flags['new-checkout'].targeting.map((r) => r.variation),
    ).toEqual(['off', 'on'])
  })
  it.each(['', '  ', 'a b'])('rejects invalid flag key %j', (key) => {
    expect(flagSchema.safeParse({ ...initialValues(), key }).success).toBe(
      false,
    )
  })
  it('rejects duplicate variation names and dangling references', () => {
    const form = initialValues()
    form.variations[1].name = 'on'
    form.defaultVariationId = 'missing'
    form.rules[0].variationId = 'deleted'
    const result = flagSchema.safeParse(form)
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.map((i) => i.path.join('.'))).toEqual(
        expect.arrayContaining([
          'variations.1.name',
          'defaultVariationId',
          'rules.0.variationId',
        ]),
      )
  })
  it('rejects an empty nested group with a precise path', () => {
    const form = initialValues()
    const nested = form.rules[0].group.children[1]
    if (nested.kind === 'group') nested.children = []
    const result = flagSchema.safeParse(form)
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues[0].path.join('.')).toBe(
        'rules.0.group.children.1.children',
      )
  })
  it('rejects numeric comparison of strings', () => {
    const form = initialValues()
    const condition = form.rules[0].group.children[0]
    if (condition.kind === 'condition') condition.operator = 'gt'
    expect(flagSchema.safeParse(form).success).toBe(false)
  })
  it.each(['', '-1', '101', 'NaN', 'Infinity'])(
    'rejects invalid percentage %j',
    (percentage) => {
      const form = initialValues()
      form.rules[0].percentage = percentage
      expect(flagSchema.safeParse(form).success).toBe(false)
    },
  )
  it.each(['0', '25.5', '100'])(
    'accepts percentage boundary %j',
    (percentage) => {
      const form = initialValues()
      form.rules[0].percentage = percentage
      expect(flagSchema.safeParse(form).success).toBe(true)
    },
  )
  it('rejects incompatible values after a type change', () => {
    const form = initialValues()
    form.valueType = 'number'
    expect(flagSchema.safeParse(form).success).toBe(false)
  })
  it('escapes query values rather than interpolating user syntax', () => {
    expect(
      compileQuery({
        id: 'a',
        kind: 'condition',
        attribute: 'role',
        operator: 'eq',
        type: 'string',
        value: 'admin" or role eq "owner',
      }),
    ).toBe('role eq "admin\\" or role eq \\"owner"')
  })
  it('supports a flag with no targeting rules', () => {
    const form = initialValues()
    form.rules = []
    expect(
      configurationSchema.parse(form).flags['new-checkout'].targeting,
    ).toEqual([])
  })
})
describe('typed values', () => {
  it('preserves string, boolean, numeric and JSON values', () => {
    expect(parseValue('', 'string')).toBe('')
    expect(parseValue('false', 'boolean')).toBe(false)
    expect(parseValue('0', 'number')).toBe(0)
    expect(parseValue('{"enabled":true,"list":[1,null]}', 'json')).toEqual({
      enabled: true,
      list: [1, null],
    })
  })
  it.each(['', ' ', 'NaN', 'Infinity', '1e999'])(
    'rejects invalid numbers %j',
    (raw) => expect(() => parseValue(raw, 'number')).toThrow(),
  )
  it.each(['{', 'undefined', '{"value":1e999}'])(
    'rejects invalid JSON %j',
    (raw) => expect(() => parseValue(raw, 'json')).toThrow(),
  )
})
