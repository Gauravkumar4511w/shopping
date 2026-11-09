import { useState } from 'react'
import { Icon } from './Icons'
import { api } from '../lib/api'

const TOPICS = [
  ['order', 'An order'],
  ['returns', 'Returns'],
  ['wholesale', 'Wholesale'],
  ['other', 'Something else'],
]

const EMPTY = { name: '', email: '', topic: 'order', message: '' }

export default function ContactForm() {
  const [form, setForm] = useState(EMPTY)
  const [fields, setFields] = useState({})
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [ticket, setTicket] = useState(null)

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (fields[key]) setFields((fs) => ({ ...fs, [key]: undefined }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const { ticket } = await api.contact(form)
      setTicket(ticket)
      setForm(EMPTY)
    } catch (err) {
      setError(err.message)
      setFields(err.fields || {})
    } finally {
      setSending(false)
    }
  }

  if (ticket) {
    return (
      <div className="contact contact--done" role="status">
        <p className="contact__check">✦</p>
        <h3>Thanks, we got your message.</h3>
        <p>
          Your reference is <b>{ticket}</b>. We reply within one working day.
        </p>
        <button className="btn btn--ghost" onClick={() => setTicket(null)}>
          Send another
        </button>
      </div>
    )
  }

  return (
    <form className="contact" onSubmit={submit} noValidate>
      <div className="contact__row">
        <label className={`field${fields.name ? ' has-error' : ''}`}>
          <span className="field__label">Name</span>
          <input value={form.name} onChange={set('name')} autoComplete="name" required />
          {fields.name && <span className="field__error">{fields.name}</span>}
        </label>
        <label className={`field${fields.email ? ' has-error' : ''}`}>
          <span className="field__label">Email</span>
          <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
          {fields.email && <span className="field__error">{fields.email}</span>}
        </label>
      </div>
      <fieldset className="contact__topics">
        <legend className="field__label">About</legend>
        {TOPICS.map(([value, label]) => (
          <label key={value} className={`chip${form.topic === value ? ' is-active' : ''}`}>
            <input type="radio" name="topic" value={value} checked={form.topic === value} onChange={set('topic')} />
            {label}
          </label>
        ))}
      </fieldset>
      <label className={`field${fields.message ? ' has-error' : ''}`}>
        <span className="field__label">Message</span>
        <textarea rows={5} value={form.message} onChange={set('message')} required maxLength={2000} />
        {fields.message && <span className="field__error">{fields.message}</span>}
      </label>
      {error && !Object.values(fields).some(Boolean) && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn--primary" type="submit" disabled={sending}>
        {sending ? 'Sending…' : 'Send message'} <Icon.Arrow size={18} />
      </button>
    </form>
  )
}
