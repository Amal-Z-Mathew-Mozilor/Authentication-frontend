import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from './Header.jsx'
import RichTextDescription from './RichTextDescription.jsx'
import DatePicker from './DatePicker.jsx'
import PolicyPreview from './PolicyPreview.jsx'
import { todayISO } from './dateUtils.js'
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
  {
    key: 'preferences',
    sectionKey: 'cookiePreferences',
    label: 'Cookie preferences',
    active: true,
    title: 'Cookie preferences',
    headingPlaceholder: 'Manage cookie preferences',
    descPlaceholder:
      'Explain how visitors can revisit their consent and manage cookies in their browser…',
  },
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
  cookiePreferences: { heading: '', description: '' },
})

export default function CookiePolicyPage() {
  const { websiteId } = useParams()
  const navigate = useNavigate()

  const [url, setUrl] = useState('')
  const [load, setLoad] = useState('loading') // loading | ready | error
  const [active, setActive] = useState('about') // sidebar key
  const [data, setData] = useState(blankData) // per-section { heading, description }
  const [effectiveDate, setEffectiveDate] = useState('') // ISO YYYY-MM-DD (policy-level)
  const [errors, setErrors] = useState(EMPTY)
  const [banner, setBanner] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  // Auto-dismiss the success toast after ~4s (matches the app's other toasts).
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const current = SECTIONS.find((s) => s.key === active)
  const idx = SECTIONS.findIndex((s) => s.key === active)
  // Wizard progress follows the CURRENT step (so Previous moves it back):
  // About 0% → Use 40% → Preferences 80%. 100% is reserved for the future
  // "Generate cookie policy" step.
  const pct = idx === 0 ? 0 : idx === 1 ? 40 : 80
  const prevKey = SECTIONS[idx - 1]?.key
  const nextKey = SECTIONS[idx + 1]?.key
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
        // Effective date is policy-level; default to today if none saved yet.
        setEffectiveDate(content.effectiveDate || todayISO())
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
  }

  // Image ids currently used across ALL section editors (live HTML in `data`), so the
  // backend keeps them even for sections not saved yet — see the cleanup plan doc.
  function collectUsedImageIds() {
    const urls =
      Object.values(data)
        .map((s) => s.description || '')
        .join(' ')
        .match(/\/pulse\/images\/[0-9a-f-]{36}/gi) || []
    return [...new Set(urls.map((u) => u.split('/').pop()))]
  }

  // Save the current section (+ effective date on the preferences tab). Returns true on a
  // clean save, false on validation/request failure. Shared by Save draft and Prev/Next.
  // `silent` suppresses the success toast (used by Back to Dashboard, which navigates away).
  async function saveCurrent({ silent = false } = {}) {
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
      return false
    }

    setErrors(EMPTY)
    setBanner(null)
    setSaving(true)
    try {
      const res = await apiFetch(
        `/pulse/websites/${websiteId}/cookie-policy/${sectionKey}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            heading,
            description,
            usedImageIds: collectUsedImageIds(),
          }),
        },
      )
      if (res.status === 401 || res.status === 403) {
        navigate('/login')
        return false
      }
      const resData = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 422) setErrors(group422(resData.errors))
        else setBanner(resData.message || 'Could not save.')
        return false
      }

      // On the Cookie preferences tab, also persist the policy-level effective date.
      if (active === 'preferences') {
        const dateRes = await apiFetch(
          `/pulse/websites/${websiteId}/cookie-policy`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              effectiveDate: effectiveDate || todayISO(),
              usedImageIds: collectUsedImageIds(),
            }),
          },
        )
        if (dateRes.status === 401 || dateRes.status === 403) {
          navigate('/login')
          return false
        }
        if (!dateRes.ok) {
          const dd = await dateRes.json().catch(() => ({}))
          setBanner(dd.message || 'Could not save the effective date.')
          return false
        }
      }
      if (!silent) setToast({ message: 'Draft saved successfully!' })
      return true
    } catch {
      setBanner('Could not reach the server. Is the backend running on :8000?')
      return false
    } finally {
      setSaving(false)
    }
  }

  // Save draft — save in place, no navigation.
  async function handleSave() {
    await saveCurrent()
  }

  // Back to Dashboard — silently save the current section (reusing Save-draft logic), then
  // leave for /home only if it saved cleanly. Invalid section blocks navigation (shows errors).
  async function handleBackToDashboard() {
    const ok = await saveCurrent({ silent: true })
    if (ok) navigate('/home')
  }

  // Previous/Next — auto-save the current section, then move only if it saved cleanly.
  async function goTo(key) {
    if (!key) return
    const ok = await saveCurrent()
    if (ok) switchSection(key)
  }

  return (
    <div className="page">
      <Header account />
      <div className="cp-topbar">
        <button
          type="button"
          className="cp-btn cp-back"
          onClick={handleBackToDashboard}
          disabled={saving}
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Dashboard
        </button>
      </div>
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
          <button
            type="button"
            className="cp-preview-btn"
            onClick={() => setShowPreview(true)}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="4" y="3" width="16" height="18" rx="2" />
              <line x1="14" y1="3" x2="14" y2="21" />
              <line x1="7" y1="8" x2="11" y2="8" />
              <line x1="7" y1="12" x2="11" y2="12" />
            </svg>
            Preview cookie policy
          </button>
          <div className="cp-progress">
            <p className="cp-progress-label">{pct}% complete</p>
            <div
              className="cp-progress-track"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Cookie policy completion"
            >
              <div className="cp-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
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

              {active === 'preferences' && (
                <div className="field cp-date-field">
                  <label className="label">
                    <span>What is the effective date for this Cookie Policy?</span>
                  </label>
                  <DatePicker
                    value={effectiveDate}
                    onChange={(iso) => {
                      setEffectiveDate(iso)
                    }}
                    placeholder="Select the effective date"
                  />
                  <p className="cp-generate-note">
                    By clicking &quot;Generate cookie policy&quot;, you agree to our{' '}
                    <a href="#terms">Terms and Conditions</a> &amp;{' '}
                    <a href="#privacy">Privacy Policy</a>.
                  </p>
                </div>
              )}

              <div className="cp-actions">
                <button
                  type="button"
                  className="cp-btn cp-prev"
                  onClick={() => goTo(prevKey)}
                  disabled={saving || !prevKey}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Previous
                </button>
                <div className="cp-actions-right">
                  <button
                    type="button"
                    className={`cp-btn cp-save ${saving ? 'loading' : ''}`}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    Save draft
                  </button>
                  <button
                    type="button"
                    className={`submit cp-next ${saving ? 'loading' : ''}`}
                    onClick={() => goTo(nextKey)}
                    disabled={saving || !nextKey}
                  >
                    Next
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
      {toast && (
        <div
          className="toast toast-success"
          role="alert"
          onClick={() => setToast(null)}
        >
          <svg
            className="toast-check"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="8 12 11 15 16 9" />
          </svg>
          <span>{toast.message}</span>
        </div>
      )}
      {showPreview && (
        <PolicyPreview
          url={url}
          sections={SECTIONS.map((s) => ({
            sectionKey: s.sectionKey,
            ...data[s.sectionKey],
          }))}
          effectiveDate={effectiveDate}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}
