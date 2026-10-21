import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import './CopyButton.css'

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Older Safari / non-secure contexts
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  }
}

type Props = {
  text: string | (() => string)
  label?: string
  copiedLabel?: string
  variant?: 'primary' | 'secondary' | 'quiet'
  className?: string
}

export default function CopyButton({ text, label = 'Copy', copiedLabel = 'Copied', variant = 'quiet', className = '' }: Props) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const onClick = async () => {
    const ok = await copyText(typeof text === 'function' ? text() : text)
    if (!ok) return
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1800)
  }

  const variantClass = variant === 'quiet' ? 'copy-quiet' : `button button-${variant}`

  return (
    <button type="button" className={`copy ${variantClass} ${className}`} onClick={onClick} data-copied={copied}>
      <span className="copy-icon" aria-hidden="true">
        <span className="copy-layer" data-visible={!copied}><Copy size={15} strokeWidth={2} /></span>
        <span className="copy-layer" data-visible={copied}><Check size={15} strokeWidth={2.5} /></span>
      </span>
      <span className="copy-label">
        <span className="copy-layer" data-visible={!copied}>{label}</span>
        <span className="copy-layer" data-visible={copied} aria-hidden={!copied}>{copiedLabel}</span>
      </span>
      <span className="visually-hidden" aria-live="polite">{copied ? 'Copied to clipboard' : ''}</span>
    </button>
  )
}
