// src/components/BroadcastPanel.jsx
import React, { useMemo, useRef, useState, useEffect } from 'react'
import { useAdmin } from '../context/AdminContext'
import {
  Send,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'

const MESSAGE_LIMIT = 4096
const CAPTION_LIMIT = 1024

const TOKENS = [
  { token: '{user_name}', label: 'Name' },
  { token: '{username}', label: 'Username' },
  { token: '{user_id}', label: 'User ID' },
]

const SAMPLE_USER = { name: 'Hayredin', username: 'hayredin', user_id: '5522724001' }

function personalize(text, user) {
  return (text || '')
    .replace(/{user_name}/g, user.name || 'User')
    .replace(/{username}/g, user.username ? `@${user.username}` : '@unknown')
    .replace(/{user_id}/g, user.user_id)
}

export function BroadcastPanel() {
  const { api } = useAdmin()

  const [text, setText] = useState('')
  const [photoFileId, setPhotoFileId] = useState('')
  const [parseMode, setParseMode] = useState('HTML')
  const [speed, setSpeed] = useState(8)

  const [recipientCount, setRecipientCount] = useState(null)
  const [loadingCount, setLoadingCount] = useState(true)

  const [confirmArmed, setConfirmArmed] = useState(false)
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressDetail, setProgressDetail] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const textareaRef = useRef(null)

  useEffect(() => {
    let mounted = true
    setLoadingCount(true)
    api.getAllUsers()
      .then((users) => { if (mounted) setRecipientCount(users.length) })
      .catch(() => { if (mounted) setRecipientCount(null) })
      .finally(() => { if (mounted) setLoadingCount(false) })
    return () => { mounted = false }
  }, [api])

  const limit = photoFileId.trim() ? CAPTION_LIMIT : MESSAGE_LIMIT
  const overLimit = text.length > limit

  const insertToken = (token) => {
    const el = textareaRef.current
    if (!el) {
      setText((prev) => prev + token)
      return
    }
    const start = el.selectionStart ?? text.length
    const end = el.selectionEnd ?? text.length
    const next = text.slice(0, start) + token + text.slice(end)
    setText(next)
    // Restore focus and caret position after the inserted token
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + token.length
      el.setSelectionRange(pos, pos)
    })
  }

  const previewText = useMemo(() => personalize(text, SAMPLE_USER), [text])

  const resetResult = () => {
    setResult(null)
    setError(null)
  }

  const handleTextChange = (e) => {
    setText(e.target.value)
    resetResult()
    setConfirmArmed(false)
  }

  const canSend = text.trim().length > 0 || photoFileId.trim().length > 0

  const handleSendClick = () => {
    resetResult()

    if (!canSend) {
      setError('Write a message or provide a photo file ID before broadcasting.')
      return
    }
    if (overLimit) {
      setError(
        photoFileId.trim()
          ? `Caption is too long (${text.length}/${CAPTION_LIMIT} characters).`
          : `Message is too long (${text.length}/${MESSAGE_LIMIT} characters).`
      )
      return
    }

    if (!confirmArmed) {
      setConfirmArmed(true)
      return
    }

    doSend()
  }

  const doSend = async () => {
    setSending(true)
    setConfirmArmed(false)
    setProgress(0)
    setProgressDetail(null)
    setResult(null)
    setError(null)

    try {
      const outcome = await api.sendBroadcastMessage(
        text,
        photoFileId.trim() || null,
        null,
        (pct, detail) => {
          setProgress(pct)
          setProgressDetail(detail)
        },
        { parseMode, speed }
      )

      if (outcome.error && outcome.sent === 0) {
        setError(outcome.error)
      } else {
        setResult(outcome)
      }
    } catch (err) {
      setError(err?.message || 'Broadcast failed unexpectedly.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="broadcast-panel">
      <div className="card card--pad">
        <div className="section-heading">
          <div>
            <p className="section-heading__eyebrow">
              {loadingCount ? 'Loading recipients…' : `${recipientCount ?? '—'} recipients`}
            </p>
            <h2 className="section-heading__title">Broadcast</h2>
          </div>
        </div>

        <div className="broadcast-container">
          <div className="broadcast-form">
            {recipientCount !== null && (
              <div className="broadcast-alert broadcast-alert--warning">
                <AlertCircle size={18} />
                <p>
                  This will message <strong>{recipientCount}</strong> user{recipientCount === 1 ? '' : 's'} on Telegram.
                  There's no undo once it starts sending.
                </p>
              </div>
            )}

            <div className="form-field">
              <label className="form-field__label">Message</label>
              <textarea
                ref={textareaRef}
                className={`broadcast-textarea ${overLimit ? 'broadcast-textarea--error' : ''}`}
                value={text}
                onChange={handleTextChange}
                placeholder="Write your broadcast message… use the tokens below to personalize it."
                disabled={sending}
              />
              <div className="token-row">
                <span className="token-row__label">Insert:</span>
                {TOKENS.map((t) => (
                  <button
                    key={t.token}
                    type="button"
                    className="token-btn"
                    onClick={() => insertToken(t.token)}
                    disabled={sending}
                  >
                    {t.token}
                  </button>
                ))}
              </div>
              {overLimit && (
                <p className="field-error">
                  {text.length}/{limit} characters — trim the message to continue.
                </p>
              )}
            </div>

            <div className="form-field">
              <label className="form-field__label">
                <ImageIcon size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                Photo File ID (optional)
              </label>
              <input
                className="monospace-input"
                value={photoFileId}
                onChange={(e) => { setPhotoFileId(e.target.value); resetResult(); setConfirmArmed(false) }}
                placeholder="AgACAgIAAxkBAAI... (Telegram file_id)"
                disabled={sending}
              />
            </div>

            <div className="form-field">
              <label className="form-field__label">Parse Mode</label>
              <select
                className="filter-select filter-select--block"
                value={parseMode}
                onChange={(e) => setParseMode(e.target.value)}
                disabled={sending}
              >
                <option value="HTML">HTML</option>
                <option value="Markdown">Markdown</option>
                <option value="">Plain text</option>
              </select>
            </div>

            <div className="form-field speed-field">
              <label className="form-field__label">
                Send Speed — {speed} msg/sec ({Math.max(125, Math.round(1000 / speed))}ms between sends)
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="speed-slider"
                disabled={sending}
              />
            </div>

            <div className="broadcast-preview">
              <label className="form-field__label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                Preview (as seen by a sample user)
              </label>
              <div className="preview-box" data-placeholder="Your message preview will appear here…">
                {previewText}
              </div>
            </div>

            {error && (
              <div className="broadcast-alert broadcast-alert--error">
                <AlertCircle size={18} />
                <p>{error}</p>
              </div>
            )}

            {confirmArmed && !sending && (
              <div className="broadcast-alert broadcast-alert--warning">
                <AlertCircle size={18} />
                <p>Click "Confirm Send" again to broadcast to {recipientCount ?? 'all'} users.</p>
              </div>
            )}

            {sending && (
              <div className="broadcast-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="stat-label" style={{ margin: 0 }}>
                  {progress}% — sent {progressDetail?.sent ?? 0}, failed {progressDetail?.failed ?? 0} of {progressDetail?.total ?? recipientCount ?? '…'}
                </p>
              </div>
            )}

            {result && (
              <div className={`broadcast-result broadcast-result--${result.failed > 0 && result.sent === 0 ? 'error' : 'success'}`}>
                <CheckCircle2 size={20} />
                <div>
                  <p>Broadcast finished</p>
                  <p>Sent: {result.sent} · Failed: {result.failed} · Total: {result.total}</p>
                </div>
              </div>
            )}

            <div className="broadcast-actions">
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={handleSendClick}
                disabled={sending || !canSend || overLimit}
              >
                {sending ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    Sending…
                  </>
                ) : confirmArmed ? (
                  <>
                    <Send size={16} />
                    Confirm Send
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Broadcast
                  </>
                )}
              </button>
              {confirmArmed && !sending && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setConfirmArmed(false)}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}