import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { configurationSchema } from '../model/flag-configuration'
import type { FlagDraft } from '../model/flag-draft'

function issueLabel(path: PropertyKey[]): string {
  const labels: Record<string, string> = {
    key: 'Flag key',
    description: 'Description',
    valueType: 'Value type',
    variations: 'Variation',
    rules: 'Rule',
    name: 'Name',
    value: 'Value',
    defaultVariationId: 'Default variation',
    variationId: 'Serve variation',
    percentage: 'Percentage',
    group: 'Conditions',
    children: 'Condition',
    attribute: 'Attribute',
    operator: 'Operator',
    type: 'Type',
  }
  return path
    .map((part) =>
      typeof part === 'number'
        ? String(part + 1)
        : (labels[String(part)] ?? String(part)),
    )
    .join(' · ')
}

const Monaco = lazy(() => import('@monaco-editor/react'))

export function Preview({
  values,
  validationPaths,
}: {
  values: FlagDraft
  validationPaths?: string[]
}) {
  const result = useMemo(() => configurationSchema.safeParse(values), [values])
  const visibleIssues =
    result.error?.issues.filter(
      (issue) =>
        validationPaths === undefined ||
        validationPaths.includes(issue.path.join('.')),
    ) ?? []
  const json = result.success ? JSON.stringify(result.data, null, 2) : null
  const [lastValidJson, setLastValidJson] = useState(json)
  useEffect(() => {
    if (json !== null) setLastValidJson(json)
  }, [json])
  const hasUnnamedVariation = values.variations.some(({ name }) => !name.trim())
  const partialJson = useMemo(() => {
    if (!hasUnnamedVariation) return null
    const partial = configurationSchema.safeParse({
      ...values,
      variations: values.variations.filter(({ name }) => name.trim()),
    })
    return partial.success ? JSON.stringify(partial.data, null, 2) : null
  }, [hasUnnamedVariation, values])
  const displayedJson = hasUnnamedVariation
    ? partialJson
    : (json ?? lastValidJson)
  const [mounted, setMounted] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    setMounted(true)
  }, [])
  async function copy() {
    if (!json) return
    try {
      await navigator.clipboard.writeText(json)
      setMessage('Configuration copied.')
    } catch {
      setMessage('Clipboard unavailable. Use Download JSON instead.')
    }
  }
  function download() {
    if (!json) return
    const url = URL.createObjectURL(
      new Blob([json], { type: 'application/json' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `${values.key}.json`
    link.click()
    URL.revokeObjectURL(url)
    setMessage('Configuration downloaded.')
  }
  return (
    <aside className="ff-preview" aria-label="Configuration preview">
      <div className="ff-panel-heading">
        <div>
          <span className="ff-eyebrow">OUTPUT</span>
          <h2>Live preview</h2>
        </div>
        <span className={json ? 'ff-status' : 'ff-help'} role="status">
          {json ? '● Valid configuration' : '● Draft incomplete'}
        </span>
      </div>
      <div className="ff-file">
        flags.json{' '}
        <span>
          {json
            ? 'Read only · updates as you type'
            : hasUnnamedVariation
              ? 'Draft preview'
              : 'Last valid configuration'}
        </span>
      </div>
      {!json && (
        <div className="ff-preview-notice" role="status">
          {partialJson
            ? 'Unnamed variations are omitted until you enter a name.'
            : displayedJson
              ? 'Showing the last valid configuration. Finish editing to update the preview and enable export.'
              : 'Complete the form to generate your configuration.'}
        </div>
      )}
      {displayedJson && (
        <div className="ff-code">
          {mounted ? (
            <Suspense fallback={<pre>{displayedJson}</pre>}>
              <Monaco
                height="520px"
                language="json"
                value={displayedJson}
                theme="vs-dark"
                loading={<pre>{displayedJson}</pre>}
                options={{
                  readOnly: true,
                  domReadOnly: true,
                  minimap: { enabled: false },
                  fontSize: 12,
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 16 },
                  tabSize: 2,
                }}
              />
            </Suspense>
          ) : (
            <pre>{displayedJson}</pre>
          )}
        </div>
      )}
      {visibleIssues.length > 0 && (
        <div className="ff-validation" role="alert">
          <h3>Fields to complete</h3>
          <ul>
            {visibleIssues.map((issue, i) => (
              <li key={`${issueLabel(issue.path)}-${i}`}>
                <strong>{issueLabel(issue.path)}</strong>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="ff-preview-footer">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="ff-button"
            disabled={!json}
            onClick={copy}
          >
            Copy JSON
          </button>
          <button
            type="button"
            className="ff-button ff-button-primary"
            disabled={!json}
            onClick={download}
          >
            Download JSON
          </button>
        </div>
        <p role="status" className="mt-2 text-xs">
          {json ? message : ''}
        </p>
      </div>
    </aside>
  )
}
