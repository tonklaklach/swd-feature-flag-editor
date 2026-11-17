import { useCallback, useState } from 'react'
import { ValidationVisibility } from './components/field-errors'
import { Flag } from 'lucide-react'
import { useFlagForm } from './hooks/use-flag-form'
import { Preview } from './components/preview'
import './editor.css'
import { FlagSettings } from './components/FlagSettings'
import { Variations } from './components/Variations'
import { TargetingRules } from './components/TargetingRules'
import { DefaultBehavior } from './components/DefaultBehavior'

function FeatureFlagEditor() {
  const form = useFlagForm()
  const [visiblePaths, setVisiblePaths] = useState<string[]>([])
  const reportVisibility = useCallback((path: string, visible: boolean) => {
    setVisiblePaths((paths) =>
      visible ? [...paths, path] : paths.filter((item) => item !== path),
    )
  }, [])
  return (
    <div className="ff-editor">
      <div className="ff-topline">
        <span className="flex items-center gap-2 font-semibold">
          <Flag size={17} /> SWD{' '}
          <span className="font-normal text-muted-foreground">
            / Feature Flag Editor
          </span>
        </span>
        <span className="ff-tag">Frontend challenge</span>
      </div>
      <header className="ff-header">
        <div>
          <span className="ff-eyebrow">RELEASE WITH CONFIDENCE</span>
          <h1>Control what ships.</h1>
          <p>
            Build your variations. Define your audience. Preview every change.
          </p>
        </div>
        <a
          className="ff-link"
          href="https://gofeatureflag.org/editor"
          target="_blank"
          rel="noreferrer"
        >
          Reference editor ↗
        </a>
      </header>
      <datalist id="ff-attributes">
        <option value="group" />
        <option value="role" />
        <option value="country" />
        <option value="targetingKey" />
        <option value="user.email" />
      </datalist>
      <div className="ff-workspace">
        <ValidationVisibility.Provider value={reportVisibility}>
          <form
            className="ff-form"
            onSubmit={(e) => {
              e.preventDefault()
              void form.handleSubmit()
            }}
            noValidate
          >
            <FlagSettings form={form} />
            <Variations form={form} />
            <TargetingRules form={form} />
            <DefaultBehavior form={form} />
          </form>
        </ValidationVisibility.Provider>
        <form.Subscribe selector={(state) => state.values}>
          {(values) => (
            <Preview values={values} validationPaths={visiblePaths} />
          )}
        </form.Subscribe>
      </div>
      <footer className="ff-footer">
        Configuration editor · Changes stay in this session until you download
        them.
      </footer>
    </div>
  )
}
export default FeatureFlagEditor
