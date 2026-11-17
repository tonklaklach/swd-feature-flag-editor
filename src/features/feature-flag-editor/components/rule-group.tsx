import { useId, useState } from 'react'
import type { Group, Node } from '../model/flag'
import { FieldErrors, useReportVisibleError } from './field-errors'
import { conditionSchema } from '../model/validation'
import { newCondition, newGroup } from '../model/initial-values'

export function RuleGroup({
  group,
  onChange,
  path,
}: {
  group: Group
  onChange: (value: Group) => void
  path: string
}) {
  useReportVisibleError(`${path}.children`, group.children.length === 0)
  const groupErrorId = useId()
  const [blurredFields, setBlurredFields] = useState<Set<string>>(
    () => new Set(),
  )
  const replace = (index: number, node: Node) =>
    onChange({
      ...group,
      children: group.children.map((child, i) => (i === index ? node : child)),
    })
  return (
    <fieldset
      className="ff-group"
      aria-invalid={group.children.length === 0 || undefined}
      aria-describedby={group.children.length === 0 ? groupErrorId : undefined}
    >
      <legend className="sr-only">Condition group</legend>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Match</span>
        <select
          aria-label="Group operator"
          value={group.operator}
          onChange={(e) =>
            onChange({
              ...group,
              operator: e.target.value as Group['operator'],
            })
          }
        >
          <option value="and">ALL (AND)</option>
          <option value="or">ANY (OR)</option>
        </select>
        <span>of the following</span>
      </div>
      {group.children.map((node, index) => {
        const issues =
          node.kind === 'condition'
            ? (conditionSchema.safeParse(node).error?.issues ?? [])
            : []
        return (
          <div
            key={node.id}
            className="mt-3"
            onBlurCapture={(event) => {
              const target = event.target
              if (
                target instanceof HTMLInputElement ||
                target instanceof HTMLSelectElement
              ) {
                const field = target.name
                if (node.kind === 'condition')
                  setBlurredFields((previous) =>
                    new Set(previous).add(node.id + '.' + field),
                  )
              }
            }}
          >
            {node.kind === 'group' ? (
              <RuleGroup
                group={node}
                onChange={(value) => replace(index, value)}
                path={`${path}.children.${index}`}
              />
            ) : (
              <div className="ff-condition">
                <FieldErrors
                  errors={issues.filter(
                    (issue) => issue.path[0] === 'attribute',
                  )}
                  path={`${path}.children.${index}.attribute`}
                  visible={blurredFields.has(node.id + '.attribute')}
                  value={node.attribute}
                >
                  {(accessibility, error) => (
                    <label>
                      Attribute
                      <input
                        {...accessibility}
                        id={`${path}.children.${index}.attribute`}
                        name="attribute"
                        list="ff-attributes"
                        value={node.attribute}
                        onChange={(e) =>
                          replace(index, { ...node, attribute: e.target.value })
                        }
                      />
                      {error}
                    </label>
                  )}
                </FieldErrors>
                <FieldErrors
                  errors={issues.filter(
                    (issue) => issue.path[0] === 'operator',
                  )}
                  path={`${path}.children.${index}.operator`}
                  visible={blurredFields.has(node.id + '.operator')}
                  value={node.operator}
                >
                  {(accessibility, error) => (
                    <label>
                      Operator
                      <select
                        {...accessibility}
                        name="operator"
                        value={node.operator}
                        onChange={(e) =>
                          replace(index, {
                            ...node,
                            operator: e.target.value as typeof node.operator,
                          })
                        }
                      >
                        <option value="eq">equals</option>
                        <option value="ne">not equal</option>
                        <option value="gt">greater than</option>
                        <option value="lt">less than</option>
                      </select>
                      {error}
                    </label>
                  )}
                </FieldErrors>
                <FieldErrors
                  errors={issues.filter((issue) => issue.path[0] === 'type')}
                  path={`${path}.children.${index}.type`}
                  visible={blurredFields.has(node.id + '.type')}
                  value={node.type}
                >
                  {(accessibility, error) => (
                    <label>
                      Type
                      <select
                        {...accessibility}
                        name="type"
                        value={node.type}
                        onChange={(e) =>
                          replace(index, {
                            ...node,
                            type: e.target.value as typeof node.type,
                          })
                        }
                      >
                        <option>string</option>
                        <option>number</option>
                        <option>boolean</option>
                      </select>
                      {error}
                    </label>
                  )}
                </FieldErrors>
                <FieldErrors
                  errors={issues.filter((issue) => issue.path[0] === 'value')}
                  path={`${path}.children.${index}.value`}
                  visible={blurredFields.has(node.id + '.value')}
                  value={node.value}
                >
                  {(accessibility, error) => (
                    <label>
                      Value
                      <input
                        {...accessibility}
                        id={`${path}.children.${index}.value`}
                        name="value"
                        value={node.value}
                        onChange={(e) =>
                          replace(index, { ...node, value: e.target.value })
                        }
                        placeholder="Match value"
                      />
                      {error}
                    </label>
                  )}
                </FieldErrors>
              </div>
            )}
            <button
              type="button"
              className="ff-link ff-danger mt-1"
              onClick={() =>
                onChange({
                  ...group,
                  children: group.children.filter(
                    (child) => child.id !== node.id,
                  ),
                })
              }
            >
              Remove {node.kind}
            </button>
          </div>
        )
      })}
      {group.children.length === 0 && (
        <p id={groupErrorId} className="ff-error mt-2">
          Add at least one condition.
        </p>
      )}
      <div className="mt-3 flex gap-4">
        <button
          type="button"
          className="ff-link"
          onClick={() =>
            onChange({
              ...group,
              children: [...group.children, newCondition()],
            })
          }
        >
          + Condition
        </button>
        <button
          type="button"
          className="ff-link"
          onClick={() =>
            onChange({ ...group, children: [...group.children, newGroup()] })
          }
        >
          + Group
        </button>
      </div>
    </fieldset>
  )
}
