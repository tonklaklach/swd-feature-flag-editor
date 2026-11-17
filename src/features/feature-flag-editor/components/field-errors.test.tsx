// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FieldErrors } from './field-errors'

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function advance(ms: number) {
  act(() => vi.advanceTimersByTime(ms))
}

const errors = ['Invalid name']

describe('validation feedback timing', () => {
  it('does not show errors for a newly added untouched field', () => {
    render(<FieldErrors errors={errors} visible={false} value="" />)
    advance(2000)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('waits 600ms after the last keystroke before showing errors', () => {
    const { rerender } = render(
      <FieldErrors errors={errors} visible={false} value="" />,
    )
    rerender(<FieldErrors errors={errors} visible={false} value="a " />)
    advance(599)
    expect(screen.queryByRole('alert')).toBeNull()
    rerender(<FieldErrors errors={errors} visible={false} value="a b" />)
    advance(599)
    expect(screen.queryByRole('alert')).toBeNull()
    advance(1)
    expect(screen.getByRole('alert').textContent).toBe('Invalid name')
  })

  it('shows errors immediately on blur and removes them when valid', () => {
    const { rerender } = render(
      <FieldErrors errors={errors} visible={false} value="" />,
    )
    rerender(<FieldErrors errors={errors} visible={false} value="a " />)
    rerender(<FieldErrors errors={errors} visible value="a " />)
    expect(screen.getByRole('alert')).toBeDefined()
    rerender(<FieldErrors errors={[]} visible value="valid" />)
    expect(screen.queryByRole('alert')).toBeNull()
    advance(600)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('cancels pending feedback when the field is removed', () => {
    const { rerender, unmount } = render(
      <FieldErrors errors={errors} visible={false} value="" />,
    )
    rerender(<FieldErrors errors={errors} visible={false} value="a " />)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('connects the displayed error to the input after debounce and clears ARIA when corrected', () => {
    function Field({ value, invalid }: { value: string; invalid: boolean }) {
      return (
        <FieldErrors
          value={value}
          errors={invalid ? errors : []}
          visible={false}
        >
          {(accessibility, feedback) => (
            <label>
              Name
              <input {...accessibility} value={value} readOnly />
              {feedback}
            </label>
          )}
        </FieldErrors>
      )
    }
    const { rerender } = render(<Field value="" invalid />)
    const input = screen.getByRole('textbox')
    expect(input.getAttribute('aria-invalid')).toBeNull()
    expect(input.getAttribute('aria-describedby')).toBeNull()
    rerender(<Field value="invalid " invalid />)
    advance(600)
    const alert = screen.getByRole('alert')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(
      document.getElementById(input.getAttribute('aria-describedby') || ''),
    ).toBe(alert)
    rerender(<Field value="valid" invalid={false} />)
    expect(input.getAttribute('aria-invalid')).toBeNull()
    expect(input.getAttribute('aria-describedby')).toBeNull()
  })
})
