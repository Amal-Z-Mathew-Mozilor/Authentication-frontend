import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from './Header.jsx'
import RichTextDescription from './RichTextDescription.jsx'
import { apiFetch } from './apiFetch.js'
import './signup.css'

const EMPTY = { heading: [], description: [] }

// Sidebar sections. `sectionKey` is the key in the cookie_policy.content jsonb / the
// PUT `:section` path param. "Cookie preferences" is not built yet (disabled).
const SECTIONS = [
  {
    key: 'about',
    sectionKey: 'aboutCookies',
    label: 'About cookies',
    active: true,
    title: 'About cookies',
    headingPlaceholder: 'What are cookies?',
    descPlaceholder: 'Describe what cookies are and how this site uses them…',
  },
  {
    key: 'use',
    sectionKey: 'useOfCookies',
    label: 'Use of cookies',
    active: true,
    title: 'Use of cookies',
    headingPlaceholder: 'How do we use cookies?',
    descPlaceholder:
      'Describe how this website uses first- and third-party cookies…',
  },
  { key: 'preferences', label: 'Cookie preferences' },
]

function group422(errorsArr) {
  const g = { heading: [], description: [] }
  if (Array.isArray(errorsArr)) {
    for (const er of errorsArr) if (g[er.path]) g[er.path].push(er.msg)
  }
  return g
}

const blankData = () => ({
  aboutCookies: { heading: '', description: '' },
  useOfCookies: { heading: '', description: '' },
})

export default function CookiePolicyPage() {
  const { websiteId } = useParams()
  const navigate = useNavigate()

  const [url, setUrl] = useState('')
  const [load, setLoad] = useState('loading') // loading | ready | error
  const [active, setActive] = useState('about') // sidebar key
  const [data, setData] = useState(blankData) // per-section { heading, description }
  const [errors, setErrors] = useState(EMPTY)
  const [banner, setBanner] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const current = SECTIONS.find((s) => s.key === active)
  const sectionKey = current.sectionKey
  const heading = data[sectionKey].heading
  const description = data[sectionKey].description

  const setHeading = (v) =>
    setData((p) => ({ ...p, [sectionKey]: { ...p[sectionKey], heading: v } }))
  const setDescription = (v) =>
    setData((p) => ({
      ...p,
      [sectionKey]: { ...p[sectionKey], description: v },
    }))

  useEffect(() => {
    let active = true
    async function loadAll() {
      try {
        // website URL (for the sidebar) + existing policy content (all sections)
        const [listRes, polRes] = await Promise.all([
          apiFetch('/pulse/websites', { method: 'GET' }),
          apiFetch(`/pulse/websites/${websiteId}/cookie-policy`, {
            method: 'GET',
          }),
        ])
        if (
          listRes.status === 401 ||
          listRes.status === 403 ||
          polRes.status === 401 ||
          polRes.status === 403
        ) {
          if (active) navigate('/login')
          return
        }
        if (!active) return
        if (polRes.status === 404) {
          setBanner('Website not found.')
          setLoad('error')
          return
        }
        const listData = await listRes.json().catch(() => ({}))
        const polData = await polRes.json().catch(() => ({}))
        const site = (listData.data || []).find((w) => w.id === websiteId)
        setUrl(site?.url || '')
        const content = polData?.data?.content || {}
        const next = blankData()
        for (const s of SECTIONS) {
          if (!s.sectionKey) continue
          const c = content[s.sectionKey] || {}
          next[s.sectionKey] = {
            heading: c.heading || '',
            description: c.description || '',
          }
        }
        setData(next)
        setLoad('ready')
      } catch {
        if (active) {
          setBanner(
            'Could not reach the server. Is the backend running on :8000?',
          )
          setLoad('error')
        }
      }
    }
    loadAll()
    return () => {
      active = false
    }
  }, [websiteId, navigate])

  function switchSection(key) {
    if (key === active) return
    setActive(key)
    setErrors(EMPTY)
    setBanner(null)
    setSaved(false)
  }

  async function handleSave() {
    // Both fields are required — cannot save empty (matches CookieYes).
    const next = { heading: [], description: [] }
    if (!heading.trim()) next.heading.push('This field cannot be empty.')
    const descText = (description || '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .trim()
    if (!descText) next.description.push('This field cannot be empty.')
    if (next.heading.length || next.description.length) {
      setErrors(next)
      setBanner(null)
      setSaved(false)
      return
    }

    setErrors(EMPTY)
    setBanner(null)
    setSaved(false)
    setSaving(true)
    try {
      const res = await apiFetch(
        `/pulse/websites/${websiteId}/cookie-policy/${sectionKey}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ heading, description }),
        },
      )
      if (res.status === 401 || res.status === 403) return navigate('/login')
      const resData = await res.json().catch(() => ({}))
      if (res.ok) {
        setSaved(true)
      } else if (res.status === 422) {
        setErrors(group422(resData.errors))
      } else {
        setBanner(resData.message || 'Could not save.')
      }
    } catch {
      setBanner('Could not reach the server. Is the backend running on :8000?')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <Header account />
      <div className="cp-shell">
        <aside className="cp-side">
          <h2 className="cp-side-title">Cookie Policy</h2>
          <p className="cp-side-sub">
            Generating cookie policy for
            <br />
            <span>{url || '…'}</span>
          </p>
          <nav className="cp-nav">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                className={`cp-side-item ${
                  s.key === active ? 'active' : s.active ? '' : 'disabled'
                }`}
                disabled={!s.active}
                onClick={() => switchSection(s.key)}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="cp-main">
          <h1 className="cp-title">{current.title}</h1>

          {banner && (
            <div className="banner" role="alert">
              {banner}
            </div>
          )}

          {load === 'loading' ? (
            <p className="wm-empty">Loading…</p>
          ) : (
            <>
              <div className={`field ${errors.heading.length ? 'invalid' : ''}`}>
                <label className="label" htmlFor="cp-heading">
                  <span>Heading</span>
                </label>
                <div className="input-row">
                  <input
                    id="cp-heading"
                    type="text"
                    value={heading}
                    onChange={(e) => {
                      setHeading(e.target.value)
                      if (errors.heading.length)
                        setErrors((p) => ({ ...p, heading: [] }))
                      setSaved(false)
                    }}
                    placeholder={current.headingPlaceholder}
                  />
                </div>
                {errors.heading.length > 0 && (
                  <ul className="errlist">
                    {errors.heading.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div
                className={`field ${errors.description.length ? 'invalid' : ''}`}
              >
                <label className="label">
                  <span>Description</span>
                </label>
                <RichTextDescription
                  key={sectionKey}
                  value={description}
                  onChange={(html) => {
                    setDescription(html)
                    if (errors.description.length)
                      setErrors((p) => ({ ...p, description: [] }))
                    setSaved(false)
                  }}
                  onImageUpload={async (file) => {
                    const fd = new FormData()
                    fd.append('file', file)
                    const res = await apiFetch(
                      `/pulse/websites/${websiteId}/images`,
                      { method: 'POST', body: fd },
                    )
                    if (res.status === 401 || res.status === 403) {
                      navigate('/login')
                      return null
                    }
                    const upData = await res.json().catch(() => ({}))
                    if (res.ok && upData?.data?.url) return upData.data.url
                    setBanner(upData.message || 'Could not upload the image.')
                    return null
                  }}
                  placeholder={current.descPlaceholder}
                />
                {errors.description.length > 0 && (
                  <ul className="errlist">
                    {errors.description.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="cp-actions">
                <button
                  type="button"
                  className={`submit cp-save ${saving ? 'loading' : ''}`}
                  onClick={handleSave}
                  disabled={saving}
                >
                  Save draft
                </button>
                {saved && <span className="cp-saved">Saved ✓</span>}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
