import type { FlagForm, Rule } from './flag'

export type FlagDraft = Omit<FlagForm, 'rules'> & {
  rules: (Omit<Rule, 'group'> & { group: unknown })[]
}
