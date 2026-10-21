import { useEffect, useState } from 'react'
import { gradeTone } from '../lib/format'
import './ScoreRing.css'

const SIZE = 132
const STROKE = 10
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const DURATION = 1100

const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5)

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const reduced = prefersReducedMotion()
  const [shown, setShown] = useState(reduced ? score : 0)

  // Count up once. The ring is drawn from the same value, so number and arc never drift apart.
  useEffect(() => {
    if (reduced) return
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION)
      setShown(Math.round(easeOutQuint(progress) * score))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [score, reduced])

  const offset = CIRCUMFERENCE * (1 - shown / 100)

  return (
    <div className="ring" data-tone={gradeTone(grade)} role="img" aria-label={`Security score ${score} out of 100, grade ${grade}`}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        <circle className="ring-track" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} strokeWidth={STROKE} />
        <circle
          className="ring-value"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ring-label" aria-hidden="true">
        <span className="ring-score">{shown}</span>
        <span className="ring-max">/100</span>
      </div>
    </div>
  )
}
