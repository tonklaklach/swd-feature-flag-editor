import { flagSchema } from './validation'
import { compileQuery } from './query'
import { parseValue } from './flag-value'

export const configurationSchema = flagSchema.transform((form) => {
  const variationName = (id: string) =>
    form.variations.find((v) => v.id === id)!.name
  return {
    flags: {
      [form.key]: {
        variations: Object.fromEntries(
          form.variations.map((v) => [
            v.name,
            parseValue(v.value, form.valueType),
          ]),
        ),
        targeting: form.rules.map((rule) => ({
          name: rule.name,
          query: compileQuery(rule.group),
          percentage: Number(rule.percentage),
          variation: variationName(rule.variationId),
        })),
        defaultRule: { variation: variationName(form.defaultVariationId) },
        disable: !form.enabled,
        trackEvents: form.trackEvents,
        metadata: { description: form.description },
      },
    },
  }
})
