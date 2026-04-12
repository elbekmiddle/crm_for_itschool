import type { CSSProperties, ReactNode } from 'react'
import DOMPurify from 'dompurify'

type Run = {
  text?: string
  color?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
}

type Block = {
  id?: string
  type?: string
  runs?: Run[]
  align?: string
}

function parseBlocks(raw: string | undefined): Block[] | null {
  if (!raw) return null
  const s = raw.trim()
  if (!s.startsWith('[')) return null
  try {
    const j = JSON.parse(s)
    return Array.isArray(j) ? j : null
  } catch {
    return null
  }
}

/** Kartochka uchun qisqa matn (JSON rich yoki HTML) */
export function excerptFromContent(raw: string | undefined, max = 200): string {
  if (!raw) return ''
  const blocks = parseBlocks(raw)
  if (blocks) {
    const text = blocks
      .map((b) => (Array.isArray(b.runs) ? b.runs.map((r) => r.text ?? '').join('') : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (!text) return ''
    return text.length > max ? text.slice(0, max) + '…' : text
  }
  const plain = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!plain) return ''
  return plain.length > max ? plain.slice(0, max) + '…' : plain
}

function RunSpan({ run }: { run: Run }) {
  const style: CSSProperties = {}
  if (run.color) style.color = run.color
  return (
    <span
      style={style}
      className={[run.bold ? 'blog-rich-bold' : '', run.italic ? 'blog-rich-italic' : '', run.underline ? 'blog-rich-ul' : '']
        .filter(Boolean)
        .join(' ')}
    >
      {run.text ?? ''}
    </span>
  )
}

export function BlogRichBody({ content }: { content: string }) {
  const blocks = parseBlocks(content)
  if (!blocks) {
    const looksHtml = /<[a-z][\s\S]*>/i.test(content)
    if (looksHtml) {
      const safe = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['p', 'b', 'i', 'u', 'em', 'strong', 'h2', 'h3', 'h4', 'br', 'ul', 'ol', 'li', 'a', 'blockquote', 'span', 'div'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
      })
      return <div className="blog-rich-html" dangerouslySetInnerHTML={{ __html: safe }} />
    }
    return <div className="blog-rich-plain">{content}</div>
  }

  const nodes: ReactNode[] = []
  for (const b of blocks) {
    const align = b.align === 'center' ? 'center' : b.align === 'right' ? 'right' : 'left'
    const runs = Array.isArray(b.runs) ? b.runs : []
    const inner = runs.map((r, i) => <RunSpan key={`${b.id ?? ''}-${i}`} run={r} />)
    if (b.type === 'heading') {
      nodes.push(
        <h3 key={b.id ?? nodes.length} className="blog-rich-heading" style={{ textAlign: align as 'left' | 'center' | 'right' }}>
          {inner}
        </h3>,
      )
    } else {
      nodes.push(
        <p key={b.id ?? nodes.length} className="blog-rich-p" style={{ textAlign: align as 'left' | 'center' | 'right' }}>
          {inner.length ? inner : '\u00a0'}
        </p>,
      )
    }
  }
  return <div className="blog-rich-root">{nodes}</div>
}
