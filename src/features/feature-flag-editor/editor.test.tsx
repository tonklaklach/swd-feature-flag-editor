// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import Editor from './FeatureFlagEditor'

vi.mock('@monaco-editor/react', () => ({
  default: ({ value }: { value: string }) => (
    <pre data-testid="json-preview">{value}</pre>
  ),
}))
afterEach(cleanup)

async function preview() {
  return JSON.parse(
    (await screen.findByTestId('json-preview')).textContent || '{}',
  )
}

describe('editor interactions', () => {
  it('updates JSON and references as a variation is renamed', async () => {
    render(<Editor />)
    expect((await preview()).flags['new-checkout'].variations.on).toBe(true)
    const variations = screen.getByRole('region', { name: /Variations/ })
    fireEvent.change(within(variations).getAllByLabelText(/^Name/)[0], {
      target: { value: 'beta' },
    })
    await waitFor(async () =>
      expect(
        (await preview()).flags['new-checkout'].targeting[0].variation,
      ).toBe('beta'),
    )
    expect(
      screen
        .getByRole('button', {
          name: 'Remove variation beta',
        })
        .hasAttribute('disabled'),
    ).toBe(true)
  })
  it('blocks export of invalid values and recovers when corrected', async () => {
    render(<Editor />)
    await preview()
    fireEvent.change(screen.getByLabelText(/Flag key/), {
      target: { value: '' },
    })
    await screen.findByText(/Showing the last valid configuration/)
    expect(
      screen
        .getByRole('button', {
          name: 'Download JSON',
        })
        .hasAttribute('disabled'),
    ).toBe(true)
    fireEvent.change(screen.getByLabelText(/Flag key/), {
      target: { value: 'checkout-v2' },
    })
    await waitFor(async () =>
      expect((await preview()).flags['checkout-v2']).toBeDefined(),
    )
  })
  it('adds and removes a variation without corrupting existing values', async () => {
    render(<Editor />)
    fireEvent.click(screen.getByRole('button', { name: 'Add variation' }))
    const variations = screen.getByRole('region', { name: /Variations/ })
    await waitFor(() =>
      expect(within(variations).getAllByLabelText(/^Name/)).toHaveLength(3),
    )
    const names = within(variations).getAllByLabelText(/^Name/)
    expect(names).toHaveLength(3)
    fireEvent.change(names[2], { target: { value: 'extra' } })
    const values = within(variations).getAllByLabelText(/^Value/)
    fireEvent.change(values[2], { target: { value: 'false' } })
    await waitFor(async () =>
      expect((await preview()).flags['new-checkout'].variations.extra).toBe(
        false,
      ),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove variation extra' }),
    )
    await waitFor(async () =>
      expect((await preview()).flags['new-checkout'].variations).toEqual({
        on: true,
        off: false,
      }),
    )
  })
  it('supports nested groups and falls back when all rules are removed', async () => {
    render(<Editor />)
    fireEvent.click(screen.getAllByRole('button', { name: '+ Group' })[0])
    expect(
      screen.getAllByRole('group', { name: 'Condition group' }),
    ).toHaveLength(3)
    expect(
      screen
        .getByRole('button', { name: 'Copy JSON' })
        .hasAttribute('disabled'),
    ).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Remove rule' }))
    await waitFor(async () =>
      expect((await preview()).flags['new-checkout'].targeting).toEqual([]),
    )
    expect(
      screen
        .getByRole('button', {
          name: 'Remove variation on',
        })
        .hasAttribute('disabled'),
    ).toBe(false)
  })
  it('changes nested AND/OR operators while preserving sibling conditions', async () => {
    render(<Editor />)
    fireEvent.change(screen.getAllByLabelText('Group operator')[1], {
      target: { value: 'and' },
    })
    await waitFor(async () =>
      expect((await preview()).flags['new-checkout'].targeting[0].query).toBe(
        '(country eq "TH" and (role eq "admin" and group eq "beta"))',
      ),
    )
    fireEvent.change(screen.getAllByLabelText('Group operator')[0], {
      target: { value: 'or' },
    })
    await waitFor(async () =>
      expect((await preview()).flags['new-checkout'].targeting[0].query).toBe(
        '(country eq "TH" or (role eq "admin" and group eq "beta"))',
      ),
    )
  })

  it('reorders rule fields and exported configurations together', async () => {
    render(<Editor />)
    fireEvent.click(screen.getByRole('button', { name: 'Add rule' }))
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2))
    const rule = within(screen.getAllByRole('article')[1])
    fireEvent.change(rule.getByLabelText(/^Rule name/), {
      target: { value: 'Support' },
    })
    fireEvent.change(rule.getByRole('textbox', { name: 'Value' }), {
      target: { value: 'support' },
    })
    fireEvent.change(rule.getByLabelText(/^Percentage/), {
      target: { value: '25' },
    })
    fireEvent.change(rule.getByLabelText(/^Serve variation/), {
      target: { value: 'off' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Move rule 2 up' }))
    await waitFor(async () =>
      expect((await preview()).flags['new-checkout'].targeting).toEqual([
        {
          name: 'Support',
          query: '(role eq "support")',
          percentage: 25,
          variation: 'off',
        },
        {
          name: 'Beta community',
          query: '(country eq "TH" and (role eq "admin" or group eq "beta"))',
          percentage: 100,
          variation: 'on',
        },
      ]),
    )
    expect(
      within(screen.getAllByRole('article')[0])
        .getByLabelText(/^Rule name/)
        .getAttribute('value'),
    ).toBe('Support')
    fireEvent.click(screen.getByRole('button', { name: 'Move rule 1 down' }))
    await waitFor(async () =>
      expect(
        (await preview()).flags['new-checkout'].targeting.map(
          (r: { name: string }) => r.name,
        ),
      ).toEqual(['Beta community', 'Support']),
    )
  })

  it('keeps values and error paths aligned after deleting a middle variation', async () => {
    render(<Editor />)
    const variations = within(
      screen.getByRole('region', { name: /Variations/ }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Add variation' }))
    await waitFor(() =>
      expect(variations.getAllByLabelText(/^Name/)).toHaveLength(3),
    )
    fireEvent.change(variations.getAllByLabelText(/^Name/)[2], {
      target: { value: 'temporary' },
    })
    fireEvent.change(variations.getAllByLabelText(/^Value/)[2], {
      target: { value: 'true' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add variation' }))
    await waitFor(() =>
      expect(variations.getAllByLabelText(/^Name/)).toHaveLength(4),
    )
    fireEvent.change(variations.getAllByLabelText(/^Value/)[3], {
      target: { value: 'false' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove variation temporary' }),
    )
    await waitFor(() =>
      expect(variations.getAllByLabelText(/^Name/)).toHaveLength(3),
    )
    const output = within(
      screen.getByRole('complementary', { name: 'Configuration preview' }),
    )
    fireEvent.blur(variations.getAllByLabelText(/^Name/)[2])
    await waitFor(() =>
      expect(output.getByText('Variation · 3 · Name')).toBeDefined(),
    )
    expect(output.queryByText('Variation · 4 · Name')).toBeNull()
    expect(
      (variations.getAllByLabelText(/^Value/)[2] as HTMLSelectElement).value,
    ).toBe('false')
    fireEvent.change(variations.getAllByLabelText(/^Name/)[2], {
      target: { value: 'survivor' },
    })
    await waitFor(async () =>
      expect((await preview()).flags['new-checkout'].variations).toEqual({
        on: true,
        off: false,
        survivor: false,
      }),
    )
  })
  it('waits for blur before showing errors for a newly added variation', async () => {
    render(<Editor />)
    fireEvent.click(screen.getByRole('button', { name: 'Add variation' }))
    const section = within(screen.getByRole('region', { name: /Variations/ }))
    await waitFor(() =>
      expect(section.getAllByLabelText(/^Name/)).toHaveLength(3),
    )
    expect(section.queryAllByRole('alert')).toHaveLength(0)
    expect(screen.queryByText('Variation · 3 · Name')).toBeNull()
    const name = section.getAllByLabelText(/^Name/)[2]
    fireEvent.blur(name)
    await waitFor(() => expect(section.getAllByRole('alert')).toHaveLength(1))
    expect(name.getAttribute('aria-invalid')).toBe('true')
    expect(
      document.getElementById(name.getAttribute('aria-describedby') || ''),
    ).toBe(section.getByRole('alert'))
    fireEvent.change(name, { target: { value: 'beta' } })
    await waitFor(() => expect(section.queryAllByRole('alert')).toHaveLength(0))
  })
  it('shares the typing pause with preview errors', async () => {
    render(<Editor />)
    await preview()
    vi.useFakeTimers()
    try {
      const key = screen.getByLabelText(/^Flag key/)
      fireEvent.change(key, { target: { value: 'bad key' } })
      act(() => vi.advanceTimersByTime(599))
      expect(screen.queryAllByText(/Flag key must use/)).toHaveLength(0)
      act(() => vi.advanceTimersByTime(1))
      expect(screen.getAllByText(/Flag key must use/)).toHaveLength(2)
      fireEvent.change(key, { target: { value: 'good-key' } })
      expect(screen.queryAllByText(/Flag key must use/)).toHaveLength(0)
    } finally {
      vi.useRealTimers()
    }
  })
  it('waits for blur before validating a new nested condition', async () => {
    render(<Editor />)
    fireEvent.click(screen.getByRole('button', { name: 'Add rule' }))
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2))
    const rule = within(screen.getAllByRole('article')[1])
    expect(rule.queryAllByRole('alert')).toHaveLength(0)
    const value = rule.getByRole('textbox', { name: 'Value' })
    fireEvent.blur(value)
    expect(rule.getByText('Enter a match value')).toBeDefined()
    expect(value.getAttribute('aria-invalid')).toBe('true')
    expect(
      document.getElementById(value.getAttribute('aria-describedby') || ''),
    ).toBe(rule.getByText('Enter a match value'))
    fireEvent.change(value, { target: { value: 'support' } })
    expect(rule.queryByText('Enter a match value')).toBeNull()
    expect(value.getAttribute('aria-invalid')).toBeNull()
    expect(value.getAttribute('aria-describedby')).toBeNull()
  })
})
