import { useEffect, useState } from 'react'
import { Icon } from './Icons'
import { api } from '../lib/api'

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
const LABELS = ['', 'Poor', 'Not great', 'Okay', 'Good', 'Excellent']

// Real reviews from signed-in shoppers. Buyers of the product get a "Verified buyer" badge.
export default function Reviews({ product, user, onLogin, onRated }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    let live = true
    api
      .reviews(product.id)
      .then((d) => live && setData(d))
      .catch((err) => live && setError(err.message))
    return () => {
      live = false
    }
    // Reload when the shopper logs in or out, so "your review" is right.
  }, [product.id, user])

  const saved = (review) => {
    setData((d) => {
      const reviews = [review, ...d.reviews.filter((r) => !r.mine)]
      return { ...d, reviews, mine: review, summary: summarise(reviews) }
    })
    setEditing(false)
    onRated()
  }

  const remove = async () => {
    if (!window.confirm('Delete your review?')) return
    try {
      await api.deleteReview(product.id)
      setData((d) => {
        const reviews = d.reviews.filter((r) => !r.mine)
        return { ...d, reviews, mine: null, summary: summarise(reviews) }
      })
      onRated()
    } catch (err) {
      setError(err.message)
    }
  }

  const summary = data?.summary
  const mine = data?.mine

  return (
    <section className="section reviews-block" id="reviews">
      <div className="section-head">
        <div>
          <p className="kicker">Ratings &amp; reviews</p>
          <h2>
            What shoppers <em>say</em>
          </h2>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
      {!data && !error && <p className="orders__note">Loading reviews…</p>}

      {data && (
        <div className="reviews-block__grid">
          <aside className="rsum">
            {summary.count > 0 ? (
              <>
                <p className="rsum__avg">
                  {summary.avg.toFixed(1)} <Icon.Star size={28} />
                </p>
                <p className="rsum__count">
                  {summary.count} {summary.count === 1 ? 'review' : 'reviews'}
                </p>
                <ul className="rsum__bars">
                  {summary.histogram.map((n, i) => (
                    <li key={i}>
                      <span>{5 - i} ★</span>
                      <span className="rsum__bar">
                        <span style={{ width: `${summary.count ? (n / summary.count) * 100 : 0}%` }} />
                      </span>
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="rsum__empty">No reviews yet. Bought this? Be the first to review it.</p>
            )}

            {!user ? (
              <button className="btn btn--primary btn--block" onClick={onLogin}>
                Log in to write a review
              </button>
            ) : mine && !editing ? (
              <div className="rsum__mine">
                <button className="btn btn--ghost btn--block" onClick={() => setEditing(true)}>
                  Edit your review
                </button>
                <button className="link-btn" onClick={remove}>
                  Delete it
                </button>
              </div>
            ) : (
              !editing && (
                <button className="btn btn--primary btn--block" onClick={() => setEditing(true)}>
                  Write a review
                </button>
              )
            )}
          </aside>

          <div>
            {editing && user && (
              <ReviewForm productId={product.id} initial={mine} onSaved={saved} onCancel={() => setEditing(false)} />
            )}
            {data.reviews.length > 0 ? (
              <ul className="rlist">
                {data.reviews.map((r) => (
                  <li key={r.id} className="ritem">
                    <div className="ritem__top">
                      <span className={`rating-pill rating-pill--small${r.rating < 3 ? ' is-low' : ''}`}>
                        {r.rating} <Icon.Star size={11} />
                      </span>
                      <b>{r.title || LABELS[r.rating]}</b>
                    </div>
                    <p>{r.body}</p>
                    <p className="ritem__by">
                      {r.name}
                      {r.verified && (
                        <span className="ritem__verified">
                          <Icon.Shield size={14} /> Verified buyer
                        </span>
                      )}
                      <span>{dateFmt.format(new Date(r.createdAt))}</span>
                      {r.mine && <span className="ritem__mine">Your review</span>}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              !editing && <p className="orders__note">Reviews from shoppers will show up here.</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function summarise(reviews) {
  const histogram = [0, 0, 0, 0, 0]
  for (const r of reviews) histogram[5 - r.rating]++
  const count = reviews.length
  const avg = count ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0
  return { avg, count, histogram }
}

function ReviewForm({ productId, initial, onSaved, onCancel }) {
  const [rating, setRating] = useState(initial?.rating || 0)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState(initial?.title || '')
  const [body, setBody] = useState(initial?.body || '')
  const [fields, setFields] = useState({})
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const { review } = await api.saveReview(productId, { rating, title, body })
      onSaved(review)
    } catch (err) {
      setFields(err.fields || {})
      if (!err.fields) setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const shown = hover || rating

  return (
    <form className="rform" onSubmit={submit} noValidate>
      <fieldset className={`rform__stars${fields.rating ? ' has-error' : ''}`}>
        <legend className="field__label">Your rating</legend>
        <div onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={n <= shown ? 'is-on' : undefined}
              onClick={() => {
                setRating(n)
                setFields((f) => ({ ...f, rating: undefined }))
              }}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              aria-pressed={rating === n}
            >
              <Icon.Star size={30} />
            </button>
          ))}
          <span className="rform__label">{LABELS[shown]}</span>
        </div>
        {fields.rating && <span className="field__error">{fields.rating}</span>}
      </fieldset>
      <label className={`field${fields.title ? ' has-error' : ''}`}>
        <span className="field__label">Title (optional)</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Sum it up in a few words" />
        {fields.title && <span className="field__error">{fields.title}</span>}
      </label>
      <label className={`field${fields.body ? ' has-error' : ''}`}>
        <span className="field__label">Your review</span>
        <textarea
          rows={4}
          value={body}
          onChange={(e) => {
            setBody(e.target.value)
            setFields((f) => ({ ...f, body: undefined }))
          }}
          maxLength={1500}
          placeholder="What did you like or dislike? How did you use it?"
        />
        {fields.body && <span className="field__error">{fields.body}</span>}
      </label>
      {error && <p className="form-error">{error}</p>}
      <div className="rform__actions">
        <button className="btn btn--primary" type="submit" disabled={sending}>
          {sending ? 'Posting…' : initial ? 'Update review' : 'Post review'}
        </button>
        <button className="link-btn" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
