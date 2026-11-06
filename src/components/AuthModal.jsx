import { useEffect, useRef, useState } from 'react'
import ProductArt from './ProductArt'
import { Icon } from './Icons'
import { auth } from '../lib/auth'

function passwordStrength(pw) {
  if (!pw) return null
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (pw.length < 8) return { level: 1, label: 'Too short' }
  if (score <= 2) return { level: 1, label: 'Weak' }
  if (score === 3) return { level: 2, label: 'Okay' }
  return { level: 3, label: 'Strong' }
}

const COPY = {
  login: {
    title: 'Welcome back',
    sub: 'Log in to check out faster and see your saved pieces.',
    cta: 'Log in',
    swap: "New to haat.?",
    swapCta: 'Create an account',
  },
  signup: {
    title: 'Join the bazaar',
    sub: 'Create an account in under a minute. ₹200 off your first order.',
    cta: 'Create account',
    swap: 'Already have an account?',
    swapCta: 'Log in',
  },
}

export default function AuthModal({ open, mode, reason, onModeChange, onClose, onAuthed }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState({})
  const firstInput = useRef(null)

  // Clear messages and the password when switching tabs or closing; keep the email so it isn't retyped.
  const resetMessages = () => {
    setError('')
    setFields({})
    setShowPw(false)
    setForm((f) => ({ ...f, password: '' }))
  }

  const switchMode = (m) => {
    resetMessages()
    onModeChange(m)
  }

  const close = () => {
    if (busy) return
    resetMessages()
    onClose()
  }

  // Escape should always call the latest close() without re-subscribing on every keystroke.
  const closeRef = useRef(close)
  useEffect(() => {
    closeRef.current = close
  })

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && closeRef.current()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => firstInput.current?.focus(), 60)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      clearTimeout(t)
    }
  }, [open, mode])

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (fields[key]) setFields((fs) => ({ ...fs, [key]: undefined }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setFields({})
    try {
      const { user } = mode === 'signup' ? await auth.signup(form) : await auth.login(form)
      setForm({ name: '', email: '', password: '' })
      onAuthed(user, mode)
    } catch (err) {
      setError(err.message)
      setFields(err.fields || {})
    } finally {
      setBusy(false)
    }
  }

  const copy = COPY[mode]
  const strength = mode === 'signup' ? passwordStrength(form.password) : null

  return (
    <div className={`auth${open ? ' is-open' : ''}`} inert={!open}>
      <div className="auth__backdrop" onClick={close} />
      <div className="auth__card" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <aside className="auth__side" aria-hidden="true">
          <p className="auth__brand">
            haat<span>.</span>
          </p>
          <div className="auth__art">
            <div className="auth__tile" style={{ background: '#f3c6b8' }}>
              <ProductArt kind="tote" />
            </div>
            <div className="auth__tile" style={{ background: '#f6dcc8' }}>
              <ProductArt kind="diya" />
            </div>
          </div>
          <ul className="auth__perks">
            <li>✦ Faster checkout</li>
            <li>✦ Saved pieces on every device</li>
            <li>✦ Members-only drops</li>
          </ul>
        </aside>

        <div className="auth__main">
          <button className="icon-btn auth__close" onClick={close} aria-label="Close" disabled={busy}>
            <Icon.Close />
          </button>

          <div className="auth__tabs" role="tablist" aria-label="Account">
            {['login', 'signup'].map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                className={mode === m ? 'is-active' : ''}
                onClick={() => switchMode(m)}
                disabled={busy}
              >
                {m === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>

          {reason && <p className="auth__reason">{reason}</p>}
          <h2 id="auth-title">{copy.title}</h2>
          <p className="auth__sub">{copy.sub}</p>

          <form onSubmit={submit} noValidate>
            {mode === 'signup' && (
              <Field label="Full name" error={fields.name}>
                <input
                  ref={firstInput}
                  type="text"
                  autoComplete="name"
                  placeholder="Priya Sharma"
                  value={form.name}
                  onChange={update('name')}
                  maxLength={60}
                  required
                />
              </Field>
            )}

            <Field label="Email" error={fields.email}>
              <input
                ref={mode === 'login' ? firstInput : undefined}
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={update('email')}
                required
              />
            </Field>

            <Field label="Password" error={fields.password}>
              <div className="pw">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                  value={form.password}
                  onChange={update('password')}
                  maxLength={128}
                  required
                />
                <button
                  type="button"
                  className="pw__toggle"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <Icon.EyeOff size={18} /> : <Icon.Eye size={18} />}
                </button>
              </div>
              {strength && (
                <div className={`strength strength--${strength.level}`} aria-live="polite">
                  <span />
                  <span />
                  <span />
                  <em>{strength.label}</em>
                </div>
              )}
            </Field>

            {error && (
              <p className="auth__error" role="alert">
                {error}
              </p>
            )}

            <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : copy.cta} {!busy && <Icon.Arrow size={18} />}
            </button>
          </form>

          <p className="auth__swap">
            {copy.swap}{' '}
            <button type="button" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')} disabled={busy}>
              {copy.swapCta}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <label className={`field${error ? ' has-error' : ''}`}>
      <span className="field__label">{label}</span>
      {children}
      {error && <span className="field__error">{error}</span>}
    </label>
  )
}
