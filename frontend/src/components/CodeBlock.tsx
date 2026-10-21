import CopyButton from './CopyButton'
import type { Snippet } from '../lib/types'
import './CodeBlock.css'

export default function CodeBlock({ snippet }: { snippet: Snippet }) {
  return (
    <figure className="code">
      <figcaption className="code-head">
        <span className="t-caption code-label">{snippet.label}</span>
        <CopyButton text={snippet.code} />
      </figcaption>
      <pre className="code-body"><code>{snippet.code}</code></pre>
    </figure>
  )
}
