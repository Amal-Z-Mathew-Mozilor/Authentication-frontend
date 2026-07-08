import { useEffect, useState, useReducer } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'

// Non-inclusive Link: typing right after a link does NOT extend the link.
const NonInclusiveLink = Link.extend({ inclusive: false })

// Inline SVG icons (project uses no icon package). currentColor so CSS controls color.
const SVG = (children) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
)
const icons = {
  bold: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 4h6a4 4 0 0 1 0 8H7zm0 8h7a4 4 0 0 1 0 8H7z" />
    </svg>
  ),
  italic: SVG(
    <>
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </>,
  ),
  underline: SVG(
    <>
      <path d="M6 4v6a6 6 0 0 0 12 0V4" />
      <line x1="4" y1="21" x2="20" y2="21" />
    </>,
  ),
  strike: SVG(
    <>
      <line x1="4" y1="12" x2="20" y2="12" />
      <path d="M16 7a4 4 0 0 0-4-2H9.5a3.5 3.5 0 0 0-1 6.8" />
      <path d="M8 17a4 4 0 0 0 4 2h1.5a3.5 3.5 0 0 0 1-6.8" />
    </>,
  ),
  ordered: SVG(
    <>
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <path d="M4 6h1v4" />
      <path d="M4 10h2" />
    </>,
  ),
  bullet: SVG(
    <>
      <line x1="9" y1="6" x2="21" y2="6" />
      <line x1="9" y1="12" x2="21" y2="12" />
      <line x1="9" y1="18" x2="21" y2="18" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
    </>,
  ),
  link: SVG(
    <>
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </>,
  ),
  image: SVG(
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 16l-5-5L5 20" />
    </>,
  ),
}

export default function RichTextDescription({
  value = '',
  onChange,
  placeholder = '',
  disabled = false,
  maxLength,
  onImageUpload,
}) {
  // Link-preview bubble: { top, left, href } when a link is clicked, else null.
  // Self-positioned (not Tiptap BubbleMenu) so show/hide is instant, single-click.
  const [linkView, setLinkView] = useState(null)

  const editor = useEditor({
    editable: !disabled,
    extensions: [
      // v3 StarterKit bundles link — disable it and use our non-inclusive Link instead.
      StarterKit.configure({ link: false }),
      NonInclusiveLink.configure({ openOnClick: false, autolink: false }),
      Image,
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange?.(editor.isEmpty ? '' : editor.getHTML())
    },
    editorProps: {
      // Toggle the link bubble on click: on when a link was clicked, off otherwise.
      handleClick(view, pos, event) {
        const a = event.target?.closest?.('a')
        if (a) {
          const r = a.getBoundingClientRect()
          setLinkView({
            top: r.bottom + 6,
            left: r.left,
            href: a.getAttribute('href') || '',
          })
        } else {
          setLinkView(null)
        }
        return false
      },
    },
  })

  // Inline link editor (CookieYes-style) — small floating popover, no native prompt.
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkPos, setLinkPos] = useState(null) // { top, left } near the selection/link

  // Re-render the toolbar on every editor transaction so active states — including a
  // pending mark toggled with NO selection — turn blue immediately, not only after typing.
  const [, forceRender] = useReducer((x) => x + 1, 0)
  useEffect(() => {
    if (!editor) return
    const onTx = () => forceRender()
    editor.on('transaction', onTx)
    return () => editor.off('transaction', onTx)
  }, [editor])

  // Dismiss the link popover / preview bubble on a single outside click.
  useEffect(() => {
    if (!linkView && !linkOpen) return
    function onDocMouseDown(e) {
      const t = e.target
      if (
        t?.closest &&
        (t.closest('.rte') ||
          t.closest('.rte-linkview') ||
          t.closest('.rte-linkbar'))
      )
        return
      setLinkView(null)
      setLinkOpen(false)
      setLinkUrl('')
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [linkView, linkOpen])

  // Round-trip external value changes (e.g. after async load) without clobbering typing.
  useEffect(() => {
    if (!editor) return
    const current = editor.isEmpty ? '' : editor.getHTML()
    if (value !== current && !editor.isFocused) {
      editor.commands.setContent(value || '')
    }
  }, [value, editor])

  if (!editor) return null

  const btn = (key, label, isActive, onClick) => (
    <button
      type="button"
      className={`rte-btn ${isActive ? 'active' : ''}`}
      aria-label={label}
      aria-pressed={!!isActive}
      title={label}
      disabled={disabled}
      // Keep the editor focused + cursor/selection intact so toggling a format with
      // NO selection sets a pending mark → the next typed text comes out formatted.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {icons[key]}
    </button>
  )

  const chain = () => editor.chain().focus()

  // Open the inline link bar — ONLY when text is selected, or the cursor sits on an
  // existing link (to edit it). A bare cursor with no selection does nothing.
  function openLink() {
    const { from, to, empty } = editor.state.selection
    const onLink = editor.isActive('link')
    if (empty && !onLink) return
    const existingHref = editor.getAttributes('link').href
    // Editing an existing link → show its URL. New link on a selection → pre-fill
    // with the selected text (highlighted), CookieYes-style, so typing replaces it.
    setLinkUrl(existingHref || editor.state.doc.textBetween(from, to, ' '))
    const coords = editor.view.coordsAtPos(from)
    setLinkPos({ top: coords.bottom + 6, left: coords.left })
    setLinkOpen(true)
  }

  function saveLink() {
    const url = linkUrl.trim()
    if (!url) {
      chain().extendMarkRange('link').unsetLink().run()
    } else {
      chain().extendMarkRange('link').setLink({ href: url }).run()
      // Collapse the cursor to the end of the link so the Link button deactivates
      // and text typed afterwards is NOT part of the link.
      editor.chain().focus().setTextSelection(editor.state.selection.to).run()
    }
    setLinkOpen(false)
    setLinkUrl('')
  }

  function removeLink() {
    chain().extendMarkRange('link').unsetLink().run()
    setLinkOpen(false)
    setLinkUrl('')
    setLinkView(null)
  }

  // From the link-preview bubble → open the edit bar pre-filled with the current URL.
  function editFromView() {
    setLinkUrl(linkView?.href || editor.getAttributes('link').href || '')
    if (linkView) setLinkPos({ top: linkView.top, left: linkView.left })
    setLinkOpen(true)
    setLinkView(null)
  }

  function handleImage() {
    if (onImageUpload) {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) return
        try {
          const url = await onImageUpload(file)
          if (url) chain().setImage({ src: url }).run()
        } catch {
          /* ignore upload failure */
        }
      }
      input.click()
      return
    }
    // No upload mechanism → insert by URL (per rich-text-description skill).
    const url = window.prompt('Image URL')
    if (url) chain().setImage({ src: url }).run()
  }

  const count = editor.getText().length
  const over = maxLength != null && count > maxLength

  return (
    <div className={`rte ${disabled ? 'rte-disabled' : ''}`}>
      <div className="rte-toolbar" role="toolbar" aria-label="Formatting">
        {btn('bold', 'Bold', editor.isActive('bold'), () =>
          chain().toggleBold().run(),
        )}
        {btn('italic', 'Italic', editor.isActive('italic'), () =>
          chain().toggleItalic().run(),
        )}
        {btn('underline', 'Underline', editor.isActive('underline'), () =>
          chain().toggleUnderline().run(),
        )}
        {btn('strike', 'Strikethrough', editor.isActive('strike'), () =>
          chain().toggleStrike().run(),
        )}
        {btn('ordered', 'Numbered list', editor.isActive('orderedList'), () =>
          chain().toggleOrderedList().run(),
        )}
        {btn('bullet', 'Bulleted list', editor.isActive('bulletList'), () =>
          chain().toggleBulletList().run(),
        )}
        {btn('link', 'Insert link', editor.isActive('link') || linkOpen, openLink)}
        {btn('image', 'Insert image', false, handleImage)}
      </div>
      {linkOpen && (
        <div
          className="rte-linkbar"
          style={{
            position: 'fixed',
            top: linkPos?.top,
            left: linkPos?.left,
            zIndex: 60,
          }}
        >
          <span className="rte-linkbar-label">Enter link:</span>
          <input
            className="rte-linkbar-input"
            autoFocus
            value={linkUrl}
            placeholder="https://example.com"
            onFocus={(e) => e.target.select()}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                saveLink()
              }
              if (e.key === 'Escape') {
                setLinkOpen(false)
                setLinkUrl('')
              }
            }}
          />
          <button type="button" className="rte-linkbar-btn" onClick={saveLink}>
            Save
          </button>
        </div>
      )}
      <EditorContent editor={editor} className="rte-content" />
      {linkView && !linkOpen && (
        <div
          className="rte-linkview"
          style={{
            position: 'fixed',
            top: linkView.top,
            left: linkView.left,
            zIndex: 50,
          }}
        >
          <span className="rte-linkview-label">Visit URL:</span>
          <a
            className="rte-linkview-url"
            href={linkView.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {linkView.href}
          </a>
          <button
            type="button"
            className="rte-linkbar-btn"
            onClick={editFromView}
          >
            Edit
          </button>
          <span className="rte-linkview-sep">|</span>
          <button
            type="button"
            className="rte-linkbar-btn remove"
            onClick={removeLink}
          >
            Remove
          </button>
        </div>
      )}
      {maxLength != null && (
        <div className={`rte-counter ${over ? 'over' : ''}`}>
          {count}/{maxLength}
        </div>
      )}
    </div>
  )
}
