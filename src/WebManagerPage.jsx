import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header.jsx'
import { apiFetch } from './apiFetch.js'
import './signup.css'

const BASE = '/pulse/websites'
const EMPTY = { name: [], url: [] }

// group a 422 errors array (from express-validator) by field path
function group422(errorsArr) {
  const g = { name: [], url: [] }
  if (Array.isArray(errorsArr)) {
    for (const er of errorsArr) if (g[er.path]) g[er.path].push(er.msg)
  }
  return g
}

export default function WebManagerPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [load, setLoad] = useState('loading') // loading | ready | error

  // add form
  const [form, setForm] = useState({ name: '', url: '' })
  const [errors, setErrors] = useState(EMPTY)
  const [adding, setAdding] = useState(false)

  // page-level message
  const [banner, setBanner] = useState(null)

  // per-row state
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', url: '' })
  const [editErrors, setEditErrors] = useState(EMPTY)
  const [confirmId, setConfirmId] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [openingId, setOpeningId] = useState(null) // website whose policy is being opened

  const toLoginOn = (res) => res.status === 401 || res.status === 403

  // "Cookie policy" button: route to the read-only preview if the policy has
  // already been generated (server-stamped content.generatedAt), otherwise to
  // the wizard's first step. Falls back to the wizard on any error so the
  // button is never dead.
  async function openCookiePolicy(id) {
    if (openingId) return
    setOpeningId(id)
    try {
      const res = await apiFetch(`${BASE}/${id}/cookie-policy`, { method: 'GET' })
      if (toLoginOn(res)) {
        navigate('/login')
        return
      }
      const data = await res.json().catch(() => ({}))
      const generated = res.ok && data?.data?.content?.generatedAt
      navigate(
        generated ? `/cookie-policy/${id}/preview` : `/cookie-policy/${id}`,
      )
    } catch {
      navigate(`/cookie-policy/${id}`)
    } finally {
      setOpeningId(null)
    }
  }

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const res = await apiFetch(BASE, { method: 'GET' })
        if (res.status === 401 || res.status === 403) {
          if (active) navigate('/login')
          return
        }
        const data = await res.json().catch(() => ({}))
        if (!active) return
        if (res.ok) {
          setItems(Array.isArray(data.data) ? data.data : [])
          setLoad('ready')
        } else {
          setBanner(data.message || 'Could not load websites.')
          setLoad('error')
        }
      } catch {
        if (active) {
          setBanner('Could not reach the server. Is the backend running on :8000?')
          setLoad('error')
        }
      }
    }
    load()
    return () => {
      active = false
    }
  }, [navigate])

  const updateAdd = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (errors[key]?.length) setErrors((p) => ({ ...p, [key]: [] }))
    if (banner) setBanner(null)
  }

  async function handleAdd(e) {
    e.preventDefault()
    setErrors(EMPTY)
    setBanner(null)
    setAdding(true)
    try {
      const res = await apiFetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (toLoginOn(res)) return navigate('/login')
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        if (data.data) setItems((list) => [data.data, ...list])
        setForm({ name: '', url: '' })
      } else if (res.status === 422) {
        setErrors(group422(data.errors))
      } else {
        setBanner(data.message || 'Could not add the website.')
      }
    } catch {
      setBanner('Could not reach the server. Is the backend running on :8000?')
    } finally {
      setAdding(false)
    }
  }

  function startEdit(w) {
    setConfirmId(null)
    setEditId(w.id)
    setEditForm({ name: w.name, url: w.url })
    setEditErrors(EMPTY)
    setBanner(null)
  }

  const updateEdit = (key) => (e) => {
    setEditForm((f) => ({ ...f, [key]: e.target.value }))
    if (editErrors[key]?.length) setEditErrors((p) => ({ ...p, [key]: [] }))
  }

  async function saveEdit(id) {
    setEditErrors(EMPTY)
    setBanner(null)
    setBusyId(id)
    try {
      const res = await apiFetch(`${BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (toLoginOn(res)) return navigate('/login')
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setItems((list) =>
          list.map((w) => (w.id === id ? { ...w, ...data.data } : w)),
        )
        setEditId(null)
      } else if (res.status === 422) {
        setEditErrors(group422(data.errors))
      } else {
        setBanner(data.message || 'Could not update the website.')
      }
    } catch {
      setBanner('Could not reach the server. Is the backend running on :8000?')
    } finally {
      setBusyId(null)
    }
  }

  async function doDelete(id) {
    setBanner(null)
    setBusyId(id)
    try {
      const res = await apiFetch(`${BASE}/${id}`, { method: 'DELETE' })
      if (toLoginOn(res)) return navigate('/login')
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setItems((list) => list.filter((w) => w.id !== id))
        setConfirmId(null)
      } else {
        setBanner(data.message || 'Could not delete the website.')
      }
    } catch {
      setBanner('Could not reach the server. Is the backend running on :8000?')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page">
      <Header account />
      <main className="main">
        <div className="wm">
          <h1 className="title">Web Manager</h1>
          <p className="subtitle">
            Register the websites you manage. You'll attach a cookie policy to each
            one later.
          </p>

          {banner && (
            <div className="banner" role="alert">
              {banner}
            </div>
          )}

          {/* Add website */}
          <form className="wm-add" onSubmit={handleAdd} noValidate>
            <div className="wm-add-row">
              <div className={`field ${errors.name.length ? 'invalid' : ''}`}>
                <label className="label" htmlFor="name">
                  <span>Website name</span>
                </label>
                <div className="input-row">
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={updateAdd('name')}
                    placeholder="My site"
                  />
                </div>
                {errors.name.length > 0 && (
                  <ul className="errlist">
                    {errors.name.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={`field ${errors.url.length ? 'invalid' : ''}`}>
                <label className="label" htmlFor="url">
                  <span>URL</span>
                </label>
                <div className="input-row">
                  <input
                    id="url"
                    type="text"
                    value={form.url}
                    onChange={updateAdd('url')}
                    placeholder="https://example.com"
                  />
                </div>
                {errors.url.length > 0 && (
                  <ul className="errlist">
                    {errors.url.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <button
              type="submit"
              className={`submit wm-add-btn ${adding ? 'loading' : ''}`}
              disabled={adding}
            >
              Add website
            </button>
          </form>

          {/* List */}
          {load === 'loading' ? (
            <p className="wm-empty">Loading…</p>
          ) : items.length === 0 ? (
            <p className="wm-empty">No websites yet. Add one above.</p>
          ) : (
            <ul className="wm-list">
              {items.map((w) => (
                <li className="wm-row" key={w.id}>
                  {editId === w.id ? (
                    <div className="wm-edit">
                      <div
                        className={`field ${editErrors.name.length ? 'invalid' : ''}`}
                      >
                        <div className="input-row">
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={updateEdit('name')}
                            placeholder="Name"
                          />
                        </div>
                        {editErrors.name.length > 0 && (
                          <ul className="errlist">
                            {editErrors.name.map((m, i) => (
                              <li key={i}>{m}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div
                        className={`field ${editErrors.url.length ? 'invalid' : ''}`}
                      >
                        <div className="input-row">
                          <input
                            type="text"
                            value={editForm.url}
                            onChange={updateEdit('url')}
                            placeholder="URL"
                          />
                        </div>
                        {editErrors.url.length > 0 && (
                          <ul className="errlist">
                            {editErrors.url.map((m, i) => (
                              <li key={i}>{m}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="wm-actions">
                        <button
                          type="button"
                          className="submit wm-inline-btn"
                          onClick={() => saveEdit(w.id)}
                          disabled={busyId === w.id}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setEditId(null)}
                          disabled={busyId === w.id}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : confirmId === w.id ? (
                    <div className="wm-confirm">
                      <span className="wm-confirm-text">
                        Delete <strong>{w.name}</strong>? This will also remove its
                        cookie policy.
                      </span>
                      <div className="wm-actions">
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => doDelete(w.id)}
                          disabled={busyId === w.id}
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setConfirmId(null)}
                          disabled={busyId === w.id}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="wm-row-main">
                        <div className="wm-row-name">{w.name}</div>
                        <div className="wm-row-url">{w.url}</div>
                      </div>
                      <div className="wm-actions">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => openCookiePolicy(w.id)}
                          disabled={openingId === w.id}
                        >
                          {openingId === w.id ? 'Opening…' : 'Cookie policy'}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => startEdit(w)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => {
                            setEditId(null)
                            setConfirmId(w.id)
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
