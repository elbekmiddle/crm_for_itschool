import { useEffect, useState } from 'react'
import './App.css'

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

export default function App() {
  const [posts, setPosts] = useState<BlogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

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
      } catch (e) {
        if (!cancelled) setErr("Ma'lumotni yuklab bo'lmadi. Backend va VITE_API_URL ni tekshiring.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="blog-root">
      <header className="blog-hero">
        <p className="blog-kicker">IT School</p>
        <h1>Blog</h1>
        <p className="blog-lead">
          Yangiliklar, maslahatlar va o‘quv markazi e’lonlari — barchasi backend `/api/v1/blogs` orqali.
        </p>
      </header>

      {loading && <p className="blog-muted">Yuklanmoqda…</p>}
      {err && <p className="blog-error">{err}</p>}

      <div className="blog-grid">
        {posts.map((p) => (
          <article key={p.id} className="blog-card">
            {p.image_url && (
              <div className="blog-card-img-wrap">
                <img src={p.image_url} alt="" className="blog-card-img" />
              </div>
            )}
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
              {p.content && (
                <p className="blog-excerpt">
                  {p.content.replace(/<[^>]+>/g, '').slice(0, 220)}
                  {p.content.length > 220 ? '…' : ''}
                </p>
              )}
              <a className="blog-link" href={`#${p.slug}`}>
                #{p.slug}
              </a>
            </div>
          </article>
        ))}
      </div>

      {!loading && posts.length === 0 && !err && (
        <p className="blog-muted">Hozircha postlar yo‘q. CRM dan blog qo‘shing.</p>
      )}
    </div>
  )
}
