import { useEffect, useRef, useState, useCallback } from 'react'
import './App.css'
import { BlogRichBody, excerptFromContent } from './blogRich'

function CardImage({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false)
  const showImg = Boolean(src) && !failed
  return (
    <div className="blog-card-img-wrap">
      <div className="blog-card-img-ph" aria-hidden />
      {showImg ? (
        <img src={src} alt="" className="blog-card-img" loading="lazy" onError={() => setFailed(true)} />
      ) : null}
    </div>
  )
}

function HeroImage({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false)
  const showImg = Boolean(src) && !failed
  return (
    <div className="blog-post-hero-img">
      <div className="blog-post-hero-fallback" aria-hidden />
      {showImg ? (
        <img src={src} alt="" className="blog-post-hero-img-el" onError={() => setFailed(true)} />
      ) : null}
    </div>
  )
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1'

type BlogRow = {
  id: string
  title: string
  slug: string
  content?: string
  category?: string
  image_url?: string
  created_at?: string
  author_name?: string
  views_count?: number
}

const FLUSH_MS = 60_000

export default function App() {
  const [posts, setPosts] = useState<BlogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [detail, setDetail] = useState<BlogRow | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const pendingViews = useRef<Map<string, number>>(new Map())

  const flushViews = useCallback(() => {
    const m = pendingViews.current
    if (m.size === 0) return
    const deltas: Record<string, number> = {}
    for (const [slug, n] of m.entries()) {
      if (n > 0) deltas[slug] = n
    }
    m.clear()
    if (Object.keys(deltas).length === 0) return
    fetch(`${API}/blogs/views`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deltas }),
    }).catch(() => {
      for (const [slug, n] of Object.entries(deltas)) {
        pendingViews.current.set(slug, (pendingViews.current.get(slug) ?? 0) + n)
      }
    })
  }, [])

  const queueView = useCallback((slug: string) => {
    pendingViews.current.set(slug, (pendingViews.current.get(slug) ?? 0) + 1)
  }, [])

  useEffect(() => {
    const id = window.setInterval(flushViews, FLUSH_MS)
    const onUnload = () => flushViews()
    window.addEventListener('beforeunload', onUnload)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('beforeunload', onUnload)
      flushViews()
    }
  }, [flushViews])

  useEffect(() => {
    const syncFromHash = () => {
      const raw = window.location.hash.replace(/^#/, '')
      if (!raw) {
        setSelectedSlug(null)
        setErr('')
        return
      }
      try {
        setSelectedSlug(decodeURIComponent(raw))
      } catch {
        setSelectedSlug(raw)
      }
    }
    syncFromHash()
    window.addEventListener('hashchange', syncFromHash)
    return () => window.removeEventListener('hashchange', syncFromHash)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch(`${API}/blogs`)
        const j = await r.json()
        const list = j?.data ?? j
        if (!cancelled) {
          setPosts(Array.isArray(list) ? list : [])
          setErr('')
        }
      } catch {
        if (!cancelled) setErr("Ma'lumotni yuklab bo'lmadi. Backend va VITE_API_URL ni tekshiring.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedSlug) {
      setDetail(null)
      return
    }
    let cancelled = false
    queueView(selectedSlug)
    ;(async () => {
      setDetailLoading(true)
      setErr('')
      try {
        const r = await fetch(`${API}/blogs/post/${encodeURIComponent(selectedSlug)}`)
        if (!r.ok) throw new Error('not found')
        const row = await r.json()
        const p = row?.data ?? row
        if (!cancelled) setDetail(p as BlogRow)
      } catch {
        if (!cancelled) {
          setDetail(null)
          setErr('Post topilmadi yoki yuklanmadi.')
        }
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedSlug, queueView])

  const navigateToPost = (slug: string) => {
    window.location.hash = encodeURIComponent(slug)
  }

  const backToList = () => {
    window.location.hash = ''
  }

  const showList = !selectedSlug

  return (
    <div className="blog-root">
      <div className="blog-bg-blobs" aria-hidden />
      <header className={`blog-hero ${showList ? '' : 'blog-hero--compact'}`}>
        <p className="blog-kicker blog-anim blog-anim-1">IT School</p>
        <h1 className="blog-anim blog-anim-2">Blog</h1>
        <p className="blog-lead blog-anim blog-anim-3">
          Yangiliklar, maslahatlar va o‘quv markazi e’lonlari — barchasi backend `/api/v1/blogs` orqali.
        </p>
      </header>

      {loading && (
        <div className="blog-skeleton-grid" aria-busy>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="blog-skeleton-card" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      )}
      {err && <p className="blog-error blog-shake">{err}</p>}

      {!showList && (
        <article className="blog-post-full" key={selectedSlug ?? 'post'}>
          <button type="button" className="blog-back" onClick={backToList}>
            ← Ro‘yxatga qaytish
          </button>
          {detailLoading ? (
            <div className="blog-post-skeleton" aria-busy>
              <div className="blog-post-skeleton-hero" />
              <div className="blog-post-skeleton-line blog-post-skeleton-line--lg" />
              <div className="blog-post-skeleton-line" />
              <div className="blog-post-skeleton-line" />
              <div className="blog-post-skeleton-line blog-post-skeleton-line--short" />
            </div>
          ) : detail ? (
            <div className="blog-post-inner">
              <HeroImage src={detail.image_url} />
              {detail.category && <span className="blog-cat">{detail.category}</span>}
              <h2 className="blog-post-title">{detail.title}</h2>
              <p className="blog-meta">
                {detail.author_name && <span>{detail.author_name}</span>}
                {detail.created_at && (
                  <time dateTime={detail.created_at}>
                    {new Date(detail.created_at).toLocaleDateString('uz-UZ')}
                  </time>
                )}
                {detail.views_count != null && <span>{detail.views_count} ko‘rish</span>}
              </p>
              <div className="blog-post-body">
                <BlogRichBody content={detail.content ?? ''} />
              </div>
            </div>
          ) : (
            !detailLoading && <p className="blog-muted">Post mavjud emas.</p>
          )}
        </article>
      )}

      {showList && !loading && (
        <div className="blog-grid">
          {posts.map((p, idx) => (
            <article
              key={p.id}
              className="blog-card"
              style={{ animationDelay: `${Math.min(idx, 12) * 65}ms` }}
            >
              <button type="button" className="blog-card-hit" onClick={() => navigateToPost(p.slug)} aria-label={p.title}>
                <CardImage src={p.image_url} />
                <div className="blog-card-body">
                  {p.category && <span className="blog-cat">{p.category}</span>}
                  <h2>{p.title}</h2>
                  <p className="blog-meta">
                    {p.author_name && <span>{p.author_name}</span>}
                    {p.created_at && (
                      <time dateTime={p.created_at}>
                        {new Date(p.created_at).toLocaleDateString('uz-UZ')}
                      </time>
                    )}
                  </p>
                  {p.content && <p className="blog-excerpt">{excerptFromContent(p.content, 220)}</p>}
                  <span className="blog-read-more">To‘liq o‘qish →</span>
                </div>
              </button>
            </article>
          ))}
        </div>
      )}

      {!loading && posts.length === 0 && !err && showList && (
        <p className="blog-muted">Hozircha postlar yo‘q. CRM dan blog qo‘shing.</p>
      )}
    </div>
  )
}
