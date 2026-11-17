import { Plus } from 'lucide-react'
import { variationUsage } from '../model/variation-usage'
import type { FlagFormApi } from '../hooks/use-flag-form'
import { FieldErrors } from './field-errors'

export function Variations({ form }: { form: FlagFormApi }) {
  return (
    <section className="ff-panel" aria-labelledby="variations-heading">
      <div className="ff-panel-heading">
        <h2 id="variations-heading">
          <span>02</span> Variations
        </h2>
        <button
          type="button"
          className="ff-link"
          onClick={() =>
            form.pushFieldValue('variations', {
              id: crypto.randomUUID(),
              name: '',
              value: '',
            })
          }
        >
          <Plus size={14} /> Add variation
        </button>
      </div>
      <form.Field name="variations" mode="array">
        {(arrayField) => (
          <div className="space-y-3">
            {arrayField.state.value.map((variation, index) => (
              <div className="ff-variation" key={variation.id}>
                <form.Field name={`variations[${index}].name`}>
                  {(field) => (
                    <FieldErrors
                      path={field.name}
                      errors={field.state.meta.errors}
                      visible={field.state.meta.isBlurred}
                      value={field.state.value}
                    >
                      {(accessibility, error) => (
                        <label>
                          Name
                          <input
                            {...accessibility}
                            id={`variations.${index}.name`}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="Variation name"
                          />
                          {error}
                        </label>
                      )}
                    </FieldErrors>
                  )}
                </form.Field>
                <form.Field name={`variations[${index}].value`}>
                  {(field) => (
                    <FieldErrors
                      path={field.name}
                      errors={field.state.meta.errors}
                      visible={field.state.meta.isBlurred}
                      value={field.state.value}
                    >
                      {(accessibility, error) => (
                        <label>
                          Value
                          <form.Subscribe
                            selector={(state) => state.values.valueType}
                          >
                            {(type) =>
                              type === 'boolean' ? (
                                <select
                                  {...accessibility}
                                  value={field.state.value}
                                  onBlur={field.handleBlur}
                                  onChange={(e) =>
                                    field.handleChange(e.target.value)
                                  }
                                >
                                  <option value="">Choose value</option>
                                  <option value="true">true</option>
                                  <option value="false">false</option>
                                </select>
                              ) : (
                                <input
                                  {...accessibility}
                                  id={`variations.${index}.value`}
                                  value={field.state.value}
                                  onBlur={field.handleBlur}
                                  onChange={(e) =>
                                    field.handleChange(e.target.value)
                                  }
                                  placeholder={
                                    type === 'json'
                                      ? '{"theme":"new"}'
                                      : `Enter ${type}`
                                  }
                                />
                              )
                            }
                          </form.Subscribe>
                          {error}
                        </label>
                      )}
                    </FieldErrors>
                  )}
                </form.Field>
                <form.Subscribe
                  selector={(state) => ({
                    rules: state.values.rules,
                    defaultId: state.values.defaultVariationId,
                    variations: state.values.variations,
                  })}
                >
                  {() => {
                    const usedBy = variationUsage(
                      form.state.values,
                      variation.id,
                    )
                    const reason = usedBy.length
                      ? `Used by: ${usedBy.join(', ')}`
                      : form.state.values.variations.length === 1
                        ? 'At least one variation is required'
                        : ''
                    return (
                      <div className="ff-delete">
                        <button
                          type="button"
                          className="ff-link ff-danger"
                          disabled={Boolean(reason)}
                          aria-label={`Remove variation ${form.state.values.variations.find((v) => v.id === variation.id)?.name || index + 1}`}
                          aria-describedby={`usage-${variation.id}`}
                          onClick={() => arrayField.removeValue(index)}
                        >
                          Remove
                        </button>
                        <span id={`usage-${variation.id}`} className="ff-help">
                          {reason}
                        </span>
                      </div>
                    )
                  }}
                </form.Subscribe>
              </div>
            ))}
          </div>
        )}
      </form.Field>
    </section>
  )
}
