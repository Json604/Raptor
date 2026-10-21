import './Segmented.css'

type Option<T extends string> = { value: T; label: string; count?: number }

// iOS-style segmented control. The selected "thumb" slides with a transform, so
// it's GPU-composited and can be retargeted mid-flight if you click quickly.
export default function Segmented<T extends string>({ options, value, onChange, label }: {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  label: string
}) {
  const index = Math.max(0, options.findIndex(option => option.value === value))
  return (
    <div className="segmented" role="radiogroup" aria-label={label} style={{ '--count': options.length, '--index': index } as React.CSSProperties}>
      <span className="segmented-thumb" aria-hidden="true" />
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          className="segmented-option t-subhead"
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count !== undefined && <span className="segmented-count">{option.count}</span>}
        </button>
      ))}
    </div>
  )
}
