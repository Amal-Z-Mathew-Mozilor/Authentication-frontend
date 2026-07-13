import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Header from '../components/Header.jsx'
import PolicyDocument from '../components/PolicyDocument.jsx'
import { apiFetch } from '../lib/apiFetch.js'
import '../styles/signup.css'

// Ordered section keys, matching the wizard's SECTIONS in CookiePolicyPage.
const SECTION_KEYS = ['aboutCookies', 'useOfCookies', 'cookiePreferences']

// Policy Preview page (/cookie-policy/:websiteId/preview) — the final "Generate
// cookie policy" step. Renders the SAVED policy as a real page with a disclaimer
// sidebar, a (disabled) "Add policy to site" action, and 100% progress. Reached
// after the wizard's Generate button saves the last section.
/**
 * /cookie-policy/:websiteId/preview route — read-only Policy Preview (the final "Generate" step).
 * Loads the saved policy and renders it via PolicyDocument, offers an "Add policy to site" modal
 * (HTML-snippet copy / send to a teammate) and a kebab menu to edit or delete (reset) the policy;
 * shows a one-time success toast when arriving straight from the wizard's Generate button.
 * @returns {JSX.Element}
 */
export default function PolicyPreviewPage() {
  const { websiteId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [url, setUrl] = useState('')
  const [load, setLoad] = useState('loading') // loading | ready | error
  const [banner, setBanner] = useState(null)
  const [sections, setSections] = useState([])
  const [effectiveDate, setEffectiveDate] = useState('')
  const [lastUpdated, setLastUpdated] = useState('') // cookie_policy.updatedAt (ISO)
  const [menuOpen, setMenuOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false) // "Add policy to site" method-picker modal
  const [addStep, setAddStep] = useState('method') // 'method' | 'html' | 'send' | 'sent'
  const [htmlCode, setHtmlCode] = useState(null) // fetched self-contained HTML snippet
  const [htmlLoad, setHtmlLoad] = useState('idle') // idle | loading | ready | error
  const [copied, setCopied] = useState(false)
  const [teamEmail, setTeamEmail] = useState('') // "Send code to a teammate" recipient
  const [sentTo, setSentTo] = useState('') // email shown on the success step
  const [sendState, setSendState] = useState('idle') // idle | sending | error
  const [sendError, setSendError] = useState(null) // inline field/banner error
  const [dialog, setDialog] = useState(null) // null | 'confirm' | 'deleted'
  const [deleting, setDeleting] = useState(false)
  const menuRef = useRef(null)
  // Success toast — shown ONLY when arriving from the wizard's "Generate cookie
  // policy" button on the FIRST generation (signalled via navigation state). A
  // returning user routed here from Web Manager, or a re-generation, sends no
  // flag, so no toast. Auto-dismissed after ~4s by the effect below.
  const [toast, setToast] = useState(
    location.state?.justGenerated
      ? {
          message:
            'Your edits to the cookie policy have been saved. Now, add it to your website.',
        }
      : null,
  )

  // Clear the navigation state so refreshing/going back doesn't replay the toast.
  useEffect(() => {
    if (location.state?.justGenerated) {
      navigate(location.pathname, { replace: true, state: {} })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  // Close the 3-dots actions menu on outside-click or Esc.
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  // Close the modal and reset it to the method step, dropping any fetched code so the
  // next open starts clean (and re-fetches fresh HTML). Used by ✕/backdrop/Esc.
  /**
   * Close the "Add policy to site" modal and reset it to the method step, clearing fetched code/state.
   * @returns {void}
   */
  const closeAdd = useCallback(() => {
    setAddOpen(false)
    setAddStep('method')
    setHtmlCode(null)
    setHtmlLoad('idle')
    setCopied(false)
    setTeamEmail('')
    setSentTo('')
    setSendState('idle')
    setSendError(null)
  }, [])

  // "Add policy to site" modal: close on Esc and lock body scroll while open.
  useEffect(() => {
    if (!addOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') closeAdd()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [addOpen, closeAdd])

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  // Fetch the self-contained HTML snippet for the "HTML format" option.
  /**
   * Fetch the self-contained HTML snippet for the "HTML format" export and store it for display.
   * @returns {Promise<void>}
   */
  async function loadHtml() {
    setHtmlLoad('loading')
    try {
      const res = await apiFetch(
        `/pulse/websites/${websiteId}/cookie-policy/html`,
        { method: 'GET' },
      )
      if (res.status === 401 || res.status === 403) {
        navigate('/login')
        return
      }
      if (!res.ok) {
        setHtmlLoad('error')
        return
      }
      const d = await res.json().catch(() => ({}))
      setHtmlCode(d?.data?.html || '')
      setHtmlLoad('ready')
    } catch {
      setHtmlLoad('error')
    }
  }

  function openHtmlStep() {
    setAddStep('html')
    loadHtml()
  }

  /**
   * Copy the fetched HTML snippet to the clipboard and briefly show the "Copied!" state.
   * @returns {Promise<void>}
   */
  async function handleCopy() {
    if (htmlLoad !== 'ready' || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(htmlCode || '')
      setCopied(true)
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  // Send the install snippet to a teammate. Client guard: email must be non-empty
  // (backend is the source of truth for format → 422 shown inline).
  /**
   * Email the install snippet to a teammate after a non-empty-email guard, then show the sent step.
   * @param {import('react').FormEvent} e - The form submit event (default prevented).
   * @returns {Promise<void>}
   */
  async function handleSendCode(e) {
    e.preventDefault()
    if (!teamEmail.trim()) {
      setSendError('Email address is required.')
      return
    }
    setSendError(null)
    setSendState('sending')
    try {
      const res = await apiFetch(
        `/pulse/websites/${websiteId}/cookie-policy/send-code`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: teamEmail.trim() }),
        },
      )
      if (res.status === 401 || res.status === 403) {
        navigate('/login')
        return
      }
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSendState('error')
        if (res.status === 422)
          setSendError(d?.errors?.[0]?.msg || 'Invalid email address.')
        else setSendError(d.message || 'Could not send the email.')
        return
      }
      setSentTo(teamEmail.trim())
      setSendState('idle')
      setAddStep('sent')
    } catch {
      setSendState('error')
      setSendError(
        'Could not reach the server. Is the backend running on :8000?',
      )
    }
  }

  // Delete = reset the policy to defaults server-side, then show the "deleted" dialog.
  /**
   * Delete the cookie policy (server resets it to defaults), then show the "deleted" dialog.
   * @returns {Promise<void>}
   */
  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await apiFetch(`/pulse/websites/${websiteId}/cookie-policy`, {
        method: 'DELETE',
      })
      if (res.status === 401 || res.status === 403) {
        navigate('/login')
        return
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setBanner(d.message || 'Could not delete the cookie policy.')
        setDialog(null)
        return
      }
      setDialog('deleted')
    } catch {
      setBanner('Could not reach the server. Is the backend running on :8000?')
      setDialog(null)
    } finally {
      setDeleting(false)
    }
  }

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
        setLastUpdated(polData?.data?.updatedAt || '')
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
                aria-haspopup="dialog"
                onClick={() => setAddOpen(true)}
              >
                Add policy to site
              </button>
              <div className="cp-kebab-wrap" ref={menuRef}>
                <button
                  type="button"
                  className="cp-kebab"
                  aria-label="More options"
                  aria-haspopup="true"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((o) => !o)}
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
                {menuOpen && (
                  <div className="cp-menu" role="menu">
                    <button
                      type="button"
                      className="cp-menu-item"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false)
                        navigate(`/cookie-policy/${websiteId}`)
                      }}
                    >
                      Edit policy
                    </button>
                    <button
                      type="button"
                      className="cp-menu-item danger"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false)
                        setDialog('confirm')
                      }}
                    >
                      Delete policy
                    </button>
                  </div>
                )}
              </div>
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
                  lastUpdated={lastUpdated}
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
      {dialog === 'confirm' && (
        <div
          className="cp-modal-overlay"
          onClick={() => !deleting && setDialog(null)}
        >
          <div
            className="cp-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Delete cookie policy"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Are you sure you want to delete this policy?</h2>
            <p>
              This will permanently remove your cookie policy from{' '}
              <strong>{url || 'this website'}</strong>. This action cannot be
              undone.
            </p>
            <p>
              If you&apos;re planning to create a new policy later, make sure to
              replace the embed code on your site.
            </p>
            <div className="cp-dialog-actions">
              <button
                type="button"
                className="cp-btn"
                onClick={() => setDialog(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cp-btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                Delete cookie policy
              </button>
            </div>
          </div>
        </div>
      )}
      {dialog === 'deleted' && (
        <div className="cp-modal-overlay">
          <div
            className="cp-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Cookie policy deleted"
          >
            <h2>Your cookie policy is deleted</h2>
            <p>
              The cookie policy for <strong>{url || 'this website'}</strong> has
              been deleted. You can start over and create a new policy at any
              time.
            </p>
            <div className="cp-dialog-actions">
              <button
                type="button"
                className="cp-btn"
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
              <button
                type="button"
                className="submit"
                onClick={() => navigate(`/cookie-policy/${websiteId}`)}
              >
                Create new cookie policy
              </button>
            </div>
          </div>
        </div>
      )}
      {addOpen && (
        <div className="cp-modal-overlay" onClick={closeAdd}>
          <div
            className="cp-add-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Add cookie policy to your site"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="cp-modal-close cp-add-close"
              aria-label="Close"
              onClick={closeAdd}
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {(addStep === 'method' || addStep === 'html') && (
              <div className="cp-add-head">
                <h2>Add cookie policy to your site</h2>
                <p className="cp-add-url">{url || 'this website'}</p>
              </div>
            )}
            {addStep === 'method' && (
              <div className="cp-add-body">
                <p className="cp-add-label">
                  Select your preferred method to add the policy
                </p>
                <button
                  type="button"
                  className="cp-method-card"
                  onClick={openHtmlStep}
                >
                  <div className="cp-method-title">
                    <h3>HTML format</h3>
                  </div>
                  <p>
                    Manually update the code on your site each time you modify
                    the generated policy.
                  </p>
                </button>
              </div>
            )}
            {addStep === 'html' && (
              <div className="cp-add-body">
                <button
                  type="button"
                  className="cp-code-back"
                  onClick={() => setAddStep('method')}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="15"
                    height="15"
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
                  Back
                </button>
                <p className="cp-step-label">
                  <strong>Step 1:</strong> Copy this HTML code.
                </p>
                <textarea
                  className="cp-code-box"
                  readOnly
                  value={
                    htmlLoad === 'loading'
                      ? 'Generating…'
                      : htmlLoad === 'error'
                        ? 'Could not generate the code.'
                        : htmlCode || ''
                  }
                  onFocus={(e) => e.target.select()}
                  aria-label="Cookie policy HTML code"
                />
                <div className="cp-code-actions">
                  {htmlLoad === 'error' ? (
                    <button type="button" className="cp-btn" onClick={loadHtml}>
                      Retry
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="cp-btn"
                      onClick={handleCopy}
                      disabled={htmlLoad !== 'ready'}
                    >
                      {copied ? 'Copied!' : 'Copy code'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="cp-btn"
                    onClick={() => setAddStep('send')}
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
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" />
                      <line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                    Send code to a teammate
                  </button>
                </div>
                <p className="cp-step-label">
                  <strong>Step 2:</strong> Paste the copied code into the
                  required page on your website.
                </p>
              </div>
            )}
            {addStep === 'send' && (
              <div className="cp-add-body">
                <button
                  type="button"
                  className="cp-code-back"
                  onClick={() => setAddStep('html')}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="15"
                    height="15"
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
                  Back
                </button>
                <div className="cp-add-head cp-send-head">
                  <h2>Send installation code to your teammate</h2>
                  <p className="cp-add-url">
                    Your teammate will receive an email with the policy
                    installation code and instructions to set it up.
                  </p>
                </div>
                <form onSubmit={handleSendCode} className="cp-send-form">
                  <div className={`field ${sendError ? 'invalid' : ''}`}>
                    <label className="label" htmlFor="cp-team-email">
                      <span>
                        Email address <span className="cp-req">*</span>
                      </span>
                    </label>
                    <div className="input-row">
                      <input
                        id="cp-team-email"
                        type="email"
                        placeholder="email@domain.com"
                        value={teamEmail}
                        onChange={(e) => {
                          setTeamEmail(e.target.value)
                          if (sendError) setSendError(null)
                        }}
                        autoFocus
                      />
                    </div>
                    {sendError && (
                      <ul className="errlist" role="alert">
                        <li>{sendError}</li>
                      </ul>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="submit cp-send-submit"
                    disabled={sendState === 'sending'}
                  >
                    {sendState === 'sending' ? 'Sending…' : 'Send email'}
                  </button>
                </form>
              </div>
            )}
            {addStep === 'sent' && (
              <div className="cp-add-body cp-sent">
                <svg
                  className="cp-sent-check"
                  viewBox="0 0 24 24"
                  width="72"
                  height="72"
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
                <h2>Installation code sent successfully!</h2>
                <p>
                  Your teammate ({sentTo}) will receive the installation code
                  and instructions shortly to complete the installation process.
                </p>
                <button type="button" className="submit" onClick={closeAdd}>
                  Okay
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
