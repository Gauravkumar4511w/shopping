import { useEffect, useState } from 'react'
import ProductArt from './ProductArt'
import { Icon } from './Icons'
import { api } from '../lib/api'
import { formatINR } from '../lib/format'
import { FREE_SHIPPING_AT, SHIPPING_FEE } from '../data/products'

const ADDRESS_FIELDS = [
  ['name', 'Full name', 'name'],
  ['phone', 'Mobile number', 'tel'],
  ['address', 'House, street and area', 'street-address'],
  ['city', 'City', 'address-level2'],
  ['pincode', 'PIN code', 'postal-code'],
]

// Mirrors the club code in server/app.js. The server decides whether it applies.
const CLUB_CODE = 'HAAT200'
const CLUB_DISCOUNT = 200

export default function CartDrawer({ open, items, user, onClose, onQty, onRemove, onNeedLogin, onPlaced }) {
  const [step, setStep] = useState('bag') // bag | details
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', pincode: '', coupon: '' })
  const [fields, setFields] = useState({})
  const [error, setError] = useState('')
  const [placing, setPlacing] = useState(false)

  // Back to the bag view whenever the drawer closes or empties.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (!open) setStep('bag')
  }
  const view = items.length === 0 ? 'bag' : step

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (fields[key]) setFields((fs) => ({ ...fs, [key]: undefined }))
  }

  const startCheckout = () => {
    if (!user) return onNeedLogin()
    setForm((f) => ({ ...f, name: f.name || user.name }))
    setError('')
    setFields({})
    setStep('details')
  }

  const placeOrder = async (e) => {
    e.preventDefault()
    setPlacing(true)
    setError('')
    try {
      const { order } = await api.placeOrder({ ...form, items: items.map(({ id, qty }) => ({ id, qty })) })
      onPlaced(order)
    } catch (err) {
      if (err.status === 401) return onNeedLogin()
      const fieldErrors = { ...err.fields }
      // Field problems show under each field; only an empty bag or a server error needs the banner.
      setError(fieldErrors.items || !Object.keys(fieldErrors).length ? err.message : '')
      delete fieldErrors.items
      setFields(fieldErrors)
    } finally {
      setPlacing(false)
    }
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const count = items.reduce((n, i) => n + i.qty, 0)
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_AT ? 0 : SHIPPING_FEE
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_AT) * 100)
  const discount = form.coupon.trim().toUpperCase() === CLUB_CODE ? Math.min(CLUB_DISCOUNT, subtotal) : 0

  return (
    <>
      <div className={`overlay${open ? ' is-open' : ''}`} onClick={onClose} />
      <aside
        className={`drawer${open ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        inert={!open}
      >
        <header className="drawer__head">
          {view === 'details' ? (
            <h2>
              <button className="icon-btn" onClick={() => setStep('bag')} aria-label="Back to bag">
                <Icon.Arrow style={{ rotate: '180deg' }} />
              </button>
              Delivery
            </h2>
          ) : (
            <h2>
              Your bag <span>({count})</span>
            </h2>
          )}
          <button className="icon-btn" onClick={onClose} aria-label="Close bag">
            <Icon.Close />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="drawer__empty">
            <ProductArt kind="tote" />
            <p>Your bag is feeling a little light.</p>
            <button className="btn btn--primary" onClick={onClose}>
              Keep shopping
            </button>
          </div>
        ) : view === 'details' ? (
          <form className="checkout" onSubmit={placeOrder} noValidate>
            <div className="checkout__fields">
              {ADDRESS_FIELDS.map(([key, label, autoComplete]) => (
                <label key={key} className={`field field--${key}${fields[key] ? ' has-error' : ''}`}>
                  <span className="field__label">{label}</span>
                  <input
                    value={form[key]}
                    onChange={set(key)}
                    autoComplete={autoComplete}
                    inputMode={key === 'phone' || key === 'pincode' ? 'numeric' : undefined}
                    maxLength={key === 'pincode' ? 6 : key === 'phone' ? 14 : 200}
                    required
                  />
                  {fields[key] && <span className="field__error">{fields[key]}</span>}
                </label>
              ))}
              <label className={`field field--coupon${fields.coupon ? ' has-error' : ''}`}>
                <span className="field__label">Club code (optional)</span>
                <input value={form.coupon} onChange={set('coupon')} placeholder="HAAT200" maxLength={20} />
                {fields.coupon && <span className="field__error">{fields.coupon}</span>}
              </label>
              <div className="checkout__pay">
                <Icon.Shield size={20} />
                <span>
                  <b>Cash on delivery</b>
                  <small>Pay in cash or UPI when your parcel arrives.</small>
                </span>
              </div>
            </div>
            <footer className="drawer__foot">
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <dl>
                <div>
                  <dt>
                    {count} {count === 1 ? 'item' : 'items'}
                  </dt>
                  <dd>{formatINR(subtotal)}</dd>
                </div>
                <div>
                  <dt>Shipping</dt>
                  <dd>{shipping ? formatINR(shipping) : 'Free'}</dd>
                </div>
                {discount > 0 && (
                  <div>
                    <dt>Club code</dt>
                    <dd>−{formatINR(discount)}</dd>
                  </div>
                )}
                <div className="total">
                  <dt>To pay</dt>
                  <dd>{formatINR(subtotal + shipping - discount)}</dd>
                </div>
              </dl>
              <button className="btn btn--primary btn--block" type="submit" disabled={placing}>
                {placing ? 'Placing order…' : 'Place order'} <Icon.Arrow size={18} />
              </button>
            </footer>
          </form>
        ) : (
          <>
            <div className="ship-meter">
              <p>
                {subtotal >= FREE_SHIPPING_AT ? (
                  <>Free shipping unlocked ✦</>
                ) : (
                  <>
                    Add <b>{formatINR(FREE_SHIPPING_AT - subtotal)}</b> more for free shipping
                  </>
                )}
              </p>
              <div className="ship-meter__bar">
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>

            <ul className="drawer__list">
              {items.map((item) => (
                <li key={item.id} className="line">
                  <div className="line__art" style={{ background: item.bg }}>
                    <ProductArt kind={item.kind} />
                  </div>
                  <div className="line__body">
                    <div className="line__top">
                      <h3>{item.name}</h3>
                      <button className="line__remove" onClick={() => onRemove(item.id)}>
                        Remove
                      </button>
                    </div>
                    <p className="line__cat">{item.category}</p>
                    <div className="line__bottom">
                      <div className="qty">
                        <button onClick={() => onQty(item.id, -1)} aria-label={`One less ${item.name}`}>
                          <Icon.Minus size={16} />
                        </button>
                        <span>{item.qty}</span>
                        <button onClick={() => onQty(item.id, 1)} aria-label={`One more ${item.name}`}>
                          <Icon.Plus size={16} />
                        </button>
                      </div>
                      <strong>{formatINR(item.price * item.qty)}</strong>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="drawer__foot">
              <dl>
                <div>
                  <dt>Subtotal</dt>
                  <dd>{formatINR(subtotal)}</dd>
                </div>
                <div>
                  <dt>Shipping</dt>
                  <dd>{shipping ? formatINR(shipping) : 'Free'}</dd>
                </div>
                <div className="total">
                  <dt>Total</dt>
                  <dd>{formatINR(subtotal + shipping)}</dd>
                </div>
              </dl>
              <button className="btn btn--primary btn--block" onClick={startCheckout}>
                {user ? 'Checkout' : 'Log in to check out'} <Icon.Arrow size={18} />
              </button>
              <p className="drawer__note">Cash on delivery · 7-day returns</p>
            </footer>
          </>
        )}
      </aside>
    </>
  )
}
