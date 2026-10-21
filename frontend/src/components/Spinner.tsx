import './Spinner.css'

// Apple's activity indicator (UIActivityIndicatorView): eight rounded spokes
// fading around the circle, rotating in discrete 45° steps rather than smoothly.
const SPOKES = Array.from({ length: 8 }, (_, index) => ({
  angle: index * -45,
  opacity: [1, 0.85, 0.7, 0.58, 0.47, 0.38, 0.3, 0.24][index],
}))

export default function Spinner({ size = 18, label }: { size?: number; label?: string }) {
  return (
    <span className="spinner" style={{ width: size, height: size }} role={label ? 'status' : undefined} aria-label={label}>
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        {SPOKES.map(({ angle, opacity }) => (
          <rect
            key={angle}
            x="10.75"
            y="1.5"
            width="2.5"
            height="6.5"
            rx="1.25"
            fill="currentColor"
            opacity={opacity}
            transform={`rotate(${angle} 12 12)`}
          />
        ))}
      </svg>
    </span>
  )
}
