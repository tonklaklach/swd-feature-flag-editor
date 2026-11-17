import type { FlagFormApi } from '../hooks/use-flag-form'
import { FieldErrors } from './field-errors'

export function DefaultBehavior({ form }: { form: FlagFormApi }) {
  return (
    <section className="ff-panel" aria-labelledby="default-heading">
      <div className="ff-panel-heading">
        <h2 id="default-heading">
          <span>04</span> Default behavior
        </h2>
      </div>
      <div className="ff-default">
        <div>
          <h3>Everyone else</h3>
          <p className="ff-help">When no targeting rule matches</p>
        </div>
        <form.Field name="defaultVariationId">
          {(field) => (
            <FieldErrors
              path={field.name}
              errors={field.state.meta.errors}
              visible={field.state.meta.isBlurred}
              value={field.state.value}
            >
              {(accessibility, error) => (
                <label>
                  Serve variation
                  <form.Subscribe selector={(state) => state.values.variations}>
                    {(variations) => (
                      <select
                        {...accessibility}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      >
                        <option value="">Choose variation</option>
                        {variations.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name || '(unnamed)'}
                          </option>
                        ))}
                      </select>
                    )}
                  </form.Subscribe>
                  {error}
                </label>
              )}
            </FieldErrors>
          )}
        </form.Field>
      </div>
    </section>
  )
}
