import type { FlagForm } from './flag'

export function variationUsage(
  form: {
    defaultVariationId: string
    rules: Pick<FlagForm['rules'][number], 'name' | 'variationId'>[]
  },
  id: string,
): string[] {
  return [
    ...(form.defaultVariationId === id ? ['Default behavior'] : []),
    ...form.rules
      .filter((r) => r.variationId === id)
      .map((r) => r.name || 'Unnamed rule'),
  ]
}
