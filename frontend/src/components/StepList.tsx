import { Check, Minus, X } from 'lucide-react'
import Spinner from './Spinner'
import type { Job } from '../lib/types'
import './StepList.css'

const GROUPS = [
  { prefix: 'web.', label: 'Website' },
  { prefix: 'repo.', label: 'Repository' },
]

export default function StepList({ steps }: { steps: Job['steps'] }) {
  const groups = GROUPS
    .map(group => ({ ...group, steps: steps.filter(step => step.key.startsWith(group.prefix)) }))
    .filter(group => group.steps.length)

  return (
    <div className="steps">
      {groups.map(group => (
        <div key={group.prefix} className="steps-group">
          {groups.length > 1 && <h3 className="steps-title t-footnote">{group.label}</h3>}
          <ol className="steps-list">
            {group.steps.map(step => (
              <li key={step.key} className="step" data-state={step.state}>
                <span className="step-icon" aria-hidden="true">
                  {step.state === 'active' && <Spinner size={18} />}
                  {step.state === 'done' && <span className="step-mark step-done"><Check size={12} strokeWidth={3.25} /></span>}
                  {step.state === 'failed' && <span className="step-mark step-failed"><X size={12} strokeWidth={3.25} /></span>}
                  {step.state === 'skipped' && <span className="step-mark step-skipped"><Minus size={12} strokeWidth={3} /></span>}
                  {step.state === 'pending' && <span className="step-pending" />}
                </span>
                <span className="step-label t-callout">{step.label}</span>
                <span className="visually-hidden">{step.state === 'active' ? '(in progress)' : step.state === 'done' ? '(done)' : ''}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  )
}
