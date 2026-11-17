import { createFileRoute } from '@tanstack/react-router'

import FeatureFlagEditor from '#/features/feature-flag-editor/FeatureFlagEditor'

export const Route = createFileRoute('/code-challenge/feature-flag-form')({
  component: FeatureFlagEditor,
  head: () => ({ meta: [{ title: 'SWD Feature Flag Editor' }] }),
})
