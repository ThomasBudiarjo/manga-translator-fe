import { Select } from './ui/Select'
import { LANGUAGES } from '../lib/languages'

type Props = {
  id: string
  label: string
  value: string
  onChange: (code: string) => void
  disabled?: boolean
}

export function LanguagePicker({ id, label, value, onChange, disabled }: Props) {
  return (
    <Select
      id={id}
      label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label} — {l.native}
        </option>
      ))}
    </Select>
  )
}
