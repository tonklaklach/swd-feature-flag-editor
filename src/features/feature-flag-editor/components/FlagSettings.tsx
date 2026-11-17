import type { ValueType } from '../model/flag'
import type { FlagFormApi } from '../hooks/use-flag-form'
import { FieldErrors } from './field-errors'

export function FlagSettings({ form }: { form: FlagFormApi }) {
  return (
    <section className="ff-panel" aria-labelledby="settings-heading">
      <div className="ff-panel-heading">
        <h2 id="settings-heading">
          <span>01</span> Flag settings
        </h2>
        <form.Field name="enabled">
          {(field) => (
            <FieldErrors
              path={field.name}
              errors={field.state.meta.errors}
              visible={field.state.meta.isBlurred}
              value={field.state.value}
            >
              {(accessibility, error) => (
                <label className="ff-toggle">
                  <input
                    {...accessibility}
                    type="checkbox"
                    checked={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.checked)}
                  />{' '}
                  Enabled
                  {error}
                </label>
              )}
            </FieldErrors>
          )}
        </form.Field>
      </div>
      <div className="ff-fields">
        <form.Field name="key">
          {(field) => (
            <FieldErrors
              path={field.name}
              errors={field.state.meta.errors}
              visible={field.state.meta.isBlurred}
              value={field.state.value}
            >
              {(accessibility, error) => (
                <label>
                  Flag key
                  <input
                    {...accessibility}
                    id="key"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    spellCheck={false}
                    required
                  />
                  <span className="ff-help">
                    A unique identifier, e.g. new-checkout
                  </span>
                  {error}
                </label>
              )}
            </FieldErrors>
          )}
        </form.Field>
        <form.Field name="valueType">
          {(field) => (
            <FieldErrors
              path={field.name}
              errors={field.state.meta.errors}
              visible={field.state.meta.isBlurred}
              value={field.state.value}
            >
              {(accessibility, error) => (
                <label>
                  Variation value type
                  <select
                    {...accessibility}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(e.target.value as ValueType)
                    }
                  >
                    <option value="boolean">Boolean</option>
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="json">JSON</option>
                  </select>
                  <span className="ff-help">
                    Changing type keeps values for review.
                  </span>
                  {error}
                </label>
              )}
            </FieldErrors>
          )}
        </form.Field>
      </div>
      <form.Field name="description">
        {(field) => (
          <FieldErrors
            path={field.name}
            errors={field.state.meta.errors}
            visible={field.state.meta.isBlurred}
            value={field.state.value}
          >
            {(accessibility, error) => (
              <label className="mt-4">
                Description
                <textarea
                  {...accessibility}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  rows={2}
                />
                {error}
              </label>
            )}
          </FieldErrors>
        )}
      </form.Field>
      <form.Field name="trackEvents">
        {(field) => (
          <FieldErrors
            path={field.name}
            errors={field.state.meta.errors}
            visible={field.state.meta.isBlurred}
            value={field.state.value}
          >
            {(accessibility, error) => (
              <label className="ff-toggle mt-4">
                <input
                  {...accessibility}
                  type="checkbox"
                  checked={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.checked)}
                />{' '}
                Track evaluation events
                {error}
              </label>
            )}
          </FieldErrors>
        )}
      </form.Field>
    </section>
  )
}
