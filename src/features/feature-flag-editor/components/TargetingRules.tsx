import { ArrowDown, ArrowUp, Plus } from 'lucide-react'
import type { Group } from '../model/flag'
import { newGroup } from '../model/initial-values'
import { RuleGroup } from './rule-group'
import type { FlagFormApi } from '../hooks/use-flag-form'
import { FieldErrors } from './field-errors'

export function TargetingRules({ form }: { form: FlagFormApi }) {
  return (
    <section className="ff-panel" aria-labelledby="rules-heading">
      <div className="ff-panel-heading">
        <h2 id="rules-heading">
          <span>03</span> Targeting rules
        </h2>
        <button
          type="button"
          className="ff-link"
          onClick={() =>
            form.pushFieldValue('rules', {
              id: crypto.randomUUID(),
              name: '',
              variationId: form.state.values.variations[0]?.id ?? '',
              percentage: '100',
              group: newGroup(),
            })
          }
        >
          <Plus size={14} /> Add rule
        </button>
      </div>
      <p className="ff-help mb-4">
        Evaluated top to bottom. The first matching rule wins. Use group and
        role as audience attributes.
      </p>
      <form.Field name="rules" mode="array">
        {(arrayField) => (
          <div className="space-y-4">
            {arrayField.state.value.length === 0 && (
              <p className="ff-empty">
                No targeting rules. Everyone receives the default variation.
              </p>
            )}
            {arrayField.state.value.map((rule, index) => (
              <article className="ff-rule" key={rule.id}>
                <div className="ff-rule-heading">
                  <span className="ff-tag">Rule {index + 1}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="ff-icon-button"
                      aria-label={`Move rule ${index + 1} up`}
                      disabled={index === 0}
                      onClick={() => arrayField.swapValues(index, index - 1)}
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      type="button"
                      className="ff-icon-button"
                      aria-label={`Move rule ${index + 1} down`}
                      disabled={index === arrayField.state.value.length - 1}
                      onClick={() => arrayField.swapValues(index, index + 1)}
                    >
                      <ArrowDown size={15} />
                    </button>
                    <button
                      type="button"
                      className="ff-link ff-danger"
                      onClick={() => arrayField.removeValue(index)}
                    >
                      Remove rule
                    </button>
                  </div>
                </div>
                <form.Field name={`rules[${index}].name`}>
                  {(field) => (
                    <FieldErrors
                      path={field.name}
                      errors={field.state.meta.errors}
                      visible={field.state.meta.isBlurred}
                      value={field.state.value}
                    >
                      {(accessibility, error) => (
                        <label>
                          Rule name
                          <input
                            {...accessibility}
                            id={`rules.${index}.name`}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="e.g. Beta community"
                          />
                          {error}
                        </label>
                      )}
                    </FieldErrors>
                  )}
                </form.Field>
                <form.Field name={`rules[${index}].group`}>
                  {(field) => (
                    <RuleGroup
                      group={field.state.value as Group}
                      onChange={field.handleChange}
                      path={`rules.${index}.group`}
                    />
                  )}
                </form.Field>
                <div className="ff-fields">
                  <form.Field name={`rules[${index}].variationId`}>
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
                            <form.Subscribe
                              selector={(state) => state.values.variations}
                            >
                              {(variations) => (
                                <select
                                  {...accessibility}
                                  value={field.state.value}
                                  onBlur={field.handleBlur}
                                  onChange={(e) =>
                                    field.handleChange(e.target.value)
                                  }
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
                  <form.Field name={`rules[${index}].percentage`}>
                    {(field) => (
                      <FieldErrors
                        path={field.name}
                        errors={field.state.meta.errors}
                        visible={field.state.meta.isBlurred}
                        value={field.state.value}
                      >
                        {(accessibility, error) => (
                          <label>
                            Percentage (0–100)
                            <input
                              {...accessibility}
                              id={`rules.${index}.percentage`}
                              type="number"
                              min="0"
                              max="100"
                              step="any"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                            />
                            {error}
                          </label>
                        )}
                      </FieldErrors>
                    )}
                  </form.Field>
                </div>
              </article>
            ))}
          </div>
        )}
      </form.Field>
    </section>
  )
}
