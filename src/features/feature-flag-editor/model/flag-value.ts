import type { ValueType } from './flag'

export function parseValue(raw: string, type: ValueType): unknown {
  if (type === 'string') return raw
  if (type === 'boolean') {
    if (raw !== 'true' && raw !== 'false')
      throw new Error('Choose true or false')
    return raw === 'true'
  }
  if (type === 'number') {
    if (!raw.trim() || !Number.isFinite(Number(raw)))
      throw new Error('Enter a finite number')
    return Number(raw)
  }
  const value: unknown = JSON.parse(raw)
  const check = (item: unknown): void => {
    if (typeof item === 'number' && !Number.isFinite(item))
      throw new Error('JSON numbers must be finite')
    if (item && typeof item === 'object') Object.values(item).forEach(check)
  }
  check(value)
  return value
}
