import { useForm } from '@tanstack/react-form'
import { flagSchema } from '../model/validation'
import { initialValues } from '../model/initial-values'
import type { FlagDraft } from '../model/flag-draft'

export function useFlagForm() {
  const defaultValues: FlagDraft = initialValues()
  return useForm({
    defaultValues,
    listeners: {
      onBlur: ({ formApi }) => {
        void formApi.validate('change')
      },
    },
    validators: {
      onChange: flagSchema,
      onSubmit: flagSchema,
    },
  })
}
export type FlagFormApi = ReturnType<typeof useFlagForm>
