// @vitest-environment jsdom
import { Blob as NodeBlob } from 'node:buffer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Preview } from './preview'
import { initialValues } from '../model/initial-values'
import { configurationSchema } from '../model/flag-configuration'

vi.mock('@monaco-editor/react', () => ({
  default: ({ value }: { value: string }) => (
    <pre data-testid="json-preview">{value}</pre>
  ),
}))
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('configuration export', () => {
  it('copies the latest validated JSON after editing', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const values = initialValues()
    const { rerender } = render(<Preview values={values} />)
    const changed = { ...values, key: 'checkout-v2', enabled: false }
    rerender(<Preview values={changed} />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy JSON' }))
    await screen.findByText('Configuration copied.')
    expect(writeText).toHaveBeenCalledTimes(1)
    expect(JSON.parse(writeText.mock.calls[0][0])).toEqual(
      configurationSchema.parse(changed),
    )
  })

  it('reports clipboard failure and keeps download available', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) },
    })
    render(<Preview values={initialValues()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy JSON' }))
    await screen.findByText('Clipboard unavailable. Use Download JSON instead.')
    expect(
      screen
        .getByRole('button', {
          name: 'Download JSON',
        })
        .hasAttribute('disabled'),
    ).toBe(false)
  })

  it('downloads current JSON with the correct filename and releases the URL', async () => {
    vi.stubGlobal('Blob', NodeBlob)
    const createObjectURL = vi.fn().mockReturnValue('blob:flag-config')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal(
      'URL',
      Object.assign(class extends URL {}, { createObjectURL, revokeObjectURL }),
    )
    const downloads: { filename: string; href: string }[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloads.push({ filename: this.download, href: this.href })
    })
    const values = initialValues()
    const { rerender } = render(<Preview values={values} />)
    const changed = {
      ...values,
      key: 'release-v2',
      description: 'Updated description',
    }
    rerender(<Preview values={changed} />)
    fireEvent.click(screen.getByRole('button', { name: 'Download JSON' }))
    expect(downloads).toEqual([
      { filename: 'release-v2.json', href: 'blob:flag-config' },
    ])
    const blob: NodeBlob = createObjectURL.mock.calls[0][0]
    expect(blob.type).toBe('application/json')
    expect(JSON.parse(await blob.text())).toEqual(
      configurationSchema.parse(changed),
    )
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:flag-config')
    await screen.findByText('Configuration downloaded.')
  })

  it('prevents both exports when the edited configuration is invalid', () => {
    const writeText = vi.fn()
    const createObjectURL = vi.fn()
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    vi.stubGlobal(
      'URL',
      Object.assign(class extends URL {}, { createObjectURL }),
    )
    const { rerender } = render(<Preview values={initialValues()} />)
    rerender(<Preview values={{ ...initialValues(), key: '' }} />)
    for (const name of ['Copy JSON', 'Download JSON']) {
      const button = screen.getByRole('button', { name })
      expect(button.hasAttribute('disabled')).toBe(true)
      fireEvent.click(button)
    }
    expect(writeText).not.toHaveBeenCalled()
    expect(createObjectURL).not.toHaveBeenCalled()
  })
  it('omits an unnamed variation after adding it or erasing its name', async () => {
    const values = initialValues()
    const { rerender } = render(<Preview values={values} />)
    const original = (await screen.findByTestId('json-preview')).textContent
    const draft = {
      ...values,
      variations: [
        ...values.variations,
        { id: 'new', name: '', value: 'true' },
      ],
    }
    for (const name of ['tttttt', 'ttttt', 'tttt', 'ttt', 'tt', 't']) {
      rerender(
        <Preview
          values={{
            ...draft,
            variations: [
              ...values.variations,
              { id: 'new', name, value: 'true' },
            ],
          }}
        />,
      )
      expect(
        JSON.parse(screen.getByTestId('json-preview').textContent || '{}')
          .flags['new-checkout'].variations[name],
      ).toBe(true)
    }
    rerender(<Preview values={draft} />)
    expect(screen.getByTestId('json-preview').textContent).toBe(original)
    expect(screen.getByText(/Unnamed variations are omitted/)).toBeDefined()
    expect(screen.getByText('Variation · 3 · Name')).toBeDefined()
    expect(
      screen
        .getByRole('button', { name: 'Copy JSON' })
        .hasAttribute('disabled'),
    ).toBe(true)
    rerender(
      <Preview
        values={{
          ...draft,
          variations: [
            ...values.variations,
            { id: 'new', name: 'beta', value: 'true' },
          ],
        }}
      />,
    )
    expect(
      JSON.parse(screen.getByTestId('json-preview').textContent || '{}').flags[
        'new-checkout'
      ].variations.beta,
    ).toBe(true)
    expect(
      screen.queryByText(/Showing the last valid configuration/),
    ).toBeNull()
    expect(
      screen
        .getByRole('button', { name: 'Copy JSON' })
        .hasAttribute('disabled'),
    ).toBe(false)
  })

  it('shows an empty state until the first valid configuration is available', async () => {
    const values = initialValues()
    const { rerender } = render(<Preview values={{ ...values, key: '' }} />)
    expect(screen.queryByTestId('json-preview')).toBeNull()
    expect(
      screen.getByText('Complete the form to generate your configuration.'),
    ).toBeDefined()
    rerender(<Preview values={values} />)
    expect((await screen.findByTestId('json-preview')).textContent).toContain(
      'new-checkout',
    )
  })
})
