import { useEffect } from 'react'
import { CATEGORIES, PRODUCTS } from '../data/products'
import Link from './Link'
import { Icon } from './Icons'

const COUNTS = PRODUCTS.reduce((c, p) => ({ ...c, [p.category]: (c[p.category] || 0) + 1 }), {})

// Slide-in menu for phones and tablets, where the header has no room for the nav links.
export default function MobileMenu({ open, onClose, user, onLogin }) {
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

  return (
    <>
      <div className={`overlay${open ? ' is-open' : ''}`} onClick={onClose} />
      <nav className={`mmenu${open ? ' is-open' : ''}`} aria-label="Menu" inert={!open}>
        <div className="mmenu__head">
          <span className="logo">
            haat<span>.</span>
          </span>
          <button className="icon-btn" onClick={onClose} aria-label="Close menu">
            <Icon.Close />
          </button>
        </div>

        {user ? (
          <p className="mmenu__hello">Hi, {user.name.split(' ')[0]} 👋</p>
        ) : (
          user === null && (
            <button
              className="btn btn--primary btn--block mmenu__login"
              onClick={() => {
                onClose()
                onLogin()
              }}
            >
              Log in or sign up
            </button>
          )
        )}

        <ul className="mmenu__links" onClick={onClose}>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/shop">Shop everything</Link>
          </li>
          <li>
            <Link href="/shop?sort=newest">New launches</Link>
          </li>
          <li>
            <Link href="/shop?sort=discount">Today's deals</Link>
          </li>
          <li>
            <Link href="/orders">My orders</Link>
          </li>
        </ul>

        <p className="mmenu__label">Categories</p>
        <ul className="mmenu__cats" onClick={onClose}>
          {CATEGORIES.filter((c) => c !== 'All').map((c) => (
            <li key={c}>
              <Link href={`/shop?c=${encodeURIComponent(c)}`}>
                {c} <span>{COUNTS[c]}</span>
              </Link>
            </li>
          ))}
        </ul>

        <ul className="mmenu__links mmenu__links--small" onClick={onClose}>
          <li>
            <Link href="/#faq">Help &amp; FAQ</Link>
          </li>
          <li>
            <Link href="/#contact">Contact us</Link>
          </li>
          <li>
            <Link href="/credits">Photo credits</Link>
          </li>
        </ul>
      </nav>
    </>
  )
}
