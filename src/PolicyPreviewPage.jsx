import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from './Header.jsx'
import PolicyDocument from './PolicyDocument.jsx'
import { apiFetch } from './apiFetch.js'
import './signup.css'

// Ordered section keys, matching the wizard's SECTIONS in CookiePolicyPage.
const SECTION_KEYS = ['aboutCookies', 'useOfCookies', 'cookiePreferences']

// Policy Preview page (/cookie-policy/:websiteId/preview) — the final "Generate
// cookie policy" step. Renders the SAVED policy as a real page with a disclaimer
// sidebar, a (disabled) "Add policy to site" action, and 100% progress. Reached
// after the wizard's Generate button saves the last section.
export default function PolicyPreviewPage() {
  const { websiteId } = useParams()
  const navigate = useNavigate()

  const [url, setUrl] = useState('')
  const [load, setLoad] = useState('loading') // loading | ready | error
  const [banner, setBanner] = useState(null)
  const [sections, setSections] = useState([])
  const [effectiveDate, setEffectiveDate] = useState('')
  // Success toast on arrival (matches CookieYes) — shown from first render,
  // auto-dismissed after ~4s by the effect below.
  const [toast, setToast] = useState({
    message:
      'Your edits to the cookie policy have been saved. Now, add it to your website.',
  })

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    let active = true
    async function loadAll() {
      try {
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
        setSections(
          SECTION_KEYS.map((key) => ({
            sectionKey: key,
            heading: content[key]?.heading || '',
            description: content[key]?.description || '',
          })),
        )
        setEffectiveDate(content.effectiveDate || '')
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

  return (
    <div className="page cp-page">
      <Header account />
      <div className="cp-topbar">
        <button
          type="button"
          className="cp-btn cp-back"
          onClick={() => navigate('/home')}
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

          <div className="cp-disclaimer">
            <h3>
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
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Disclaimer
            </h3>
            <p>
              We do not take any responsibility, and we are not liable, for any
              cookie policies created using our service. Any information,
              materials, or services provided herein do not ensure any form of
              regulatory compliance and are not intended to be a substitute for
              professional legal advice. If any legal assistance is required,
              users should seek the services of an attorney.
            </p>
          </div>

          <button
            type="button"
            className="cp-edit-btn"
            onClick={() => navigate(`/cookie-policy/${websiteId}`)}
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
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" />
            </svg>
            Edit cookie policy
          </button>

          <div className="cp-progress">
            <p className="cp-progress-label">100% complete</p>
            <div
              className="cp-progress-track"
              role="progressbar"
              aria-valuenow={100}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Cookie policy completion"
            >
              <div className="cp-progress-fill" style={{ width: '100%' }} />
            </div>
          </div>
        </aside>

        <main className="cp-main">
          <div className="cp-main-head">
            <h1 className="cp-title">Policy preview</h1>
            <div className="cp-main-head-actions">
              <button
                type="button"
                className="cp-add-policy"
                disabled
                title="Coming soon"
                aria-disabled="true"
              >
                Add policy to site
              </button>
              <button
                type="button"
                className="cp-kebab"
                disabled
                title="Coming soon"
                aria-label="More options"
                aria-disabled="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="5" r="1.6" />
                  <circle cx="12" cy="12" r="1.6" />
                  <circle cx="12" cy="19" r="1.6" />
                </svg>
              </button>
            </div>
          </div>

          <div className="cp-main-scroll">
          {banner && (
            <div className="banner" role="alert">
              {banner}
            </div>
          )}

          {load === 'loading' ? (
            <p className="wm-empty">Loading…</p>
          ) : load === 'ready' ? (
            <div className="cp-preview-card">
              <PolicyDocument
                url={url}
                sections={sections}
                effectiveDate={effectiveDate}
              />
            </div>
          ) : null}
          </div>
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
    </div>
  )
}
