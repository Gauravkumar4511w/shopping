import { useState } from 'react'
import { Icon } from './Icons'
import { api } from '../lib/api'

export default function ClubForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | done
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    setError('')
    try {
      setResult(await api.subscribe(email))
      setStatus('done')
    } catch (err) {
      setError(err.fields?.email || err.message)
      setStatus('idle')
    }
  }

  if (status === 'done') {
    return (
      <div>
        <p className="club__done">
          {result.alreadySubscribed ? "You're already in ✦" : "You're in ✦"} Use code <code>{result.code}</code> at
          checkout.
        </p>
        <small>New drops every Friday. No spam, unsubscribe anytime.</small>
      </div>
    )
  }

  return (
    <div>
      <form onSubmit={submit} noValidate>
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError('')
          }}
          aria-label="Email address"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'club-error' : undefined}
        />
        <button className="btn btn--primary" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Joining…' : 'Join'} <Icon.Arrow size={18} />
        </button>
      </form>
      {error ? (
        <p className="club__error" id="club-error" role="alert">
          {error}
        </p>
      ) : (
        <small>New drops every Friday. No spam, unsubscribe anytime.</small>
      )}
    </div>
  )
}
