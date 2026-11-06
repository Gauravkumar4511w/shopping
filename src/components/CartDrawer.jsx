import { useEffect } from 'react'
import ProductArt from './ProductArt'
import { Icon } from './Icons'
import { formatINR } from '../lib/format'
import { FREE_SHIPPING_AT, SHIPPING_FEE } from '../data/products'

export default function CartDrawer({ open, items, onClose, onQty, onRemove, onCheckout }) {
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
          <h2>
            Your bag <span>({count})</span>
          </h2>
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
              <button className="btn btn--primary btn--block" onClick={onCheckout}>
                Checkout <Icon.Arrow size={18} />
              </button>
              <p className="drawer__note">UPI · Cards · Cash on delivery</p>
            </footer>
          </>
        )}
      </aside>
    </>
  )
}
