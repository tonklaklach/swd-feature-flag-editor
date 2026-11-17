import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import type { AriaAttributes, ReactNode } from 'react'

export const ValidationVisibility = createContext<
  (path: string, visible: boolean) => void
>(() => {})

export function useReportVisibleError(
  path: string | undefined,
  visible: boolean,
) {
  const report = useContext(ValidationVisibility)
  useEffect(() => {
    if (!path || !visible) return
    const normalized = path.replace(/\[(\d+)\]/g, '.$1')
    report(normalized, true)
    return () => report(normalized, false)
  }, [path, visible, report])
}

export function FieldErrors({
  path,
  errors,
  visible = true,
  value,
  children,
}: {
  path?: string
  errors: unknown[]
  visible?: boolean
  value?: unknown
  children?: (accessibility: AriaAttributes, error: ReactNode) => ReactNode
}) {
  const errorId = useId()
  const previousValue = useRef(value)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (Object.is(previousValue.current, value)) return
    previousValue.current = value
    setPaused(false)
    const timeout = setTimeout(() => setPaused(true), 600)
    return () => clearTimeout(timeout)
  }, [value])
  const showError = (visible || paused) && errors.length > 0
  useReportVisibleError(path, showError)
  const error = showError ? (
    <span id={errorId} className="ff-error" role="alert">
      {errors
        .map((issue) =>
          typeof issue === 'string'
            ? issue
            : issue && typeof issue === 'object' && 'message' in issue
              ? String(issue.message)
              : 'Invalid value',
        )
        .join('. ')}
    </span>
  ) : null
  return children
    ? children(
        {
          'aria-invalid': showError || undefined,
          'aria-describedby': showError ? errorId : undefined,
        },
        error,
      )
    : error
}
