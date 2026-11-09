import { useCallback, useEffect, useState } from 'react'
import { PRODUCTS } from './data/products'
import CartDrawer from './components/CartDrawer'
import AuthModal from './components/AuthModal'
import AccountMenu from './components/AccountMenu'
import { Icon } from './components/Icons'
import Landing from './pages/Landing'
import Shop from './pages/Shop'
import Orders from './pages/Orders'
import { auth } from './lib/auth'
import { formatINR } from './lib/format'
import { navigate, useLocation } from './lib/router'
import Link from './components/Link'
import './App.css'

const TICKER = [
  'Free shipping above ₹999',
  'Cash on delivery',
  '7-day easy returns',
  'Made by Indian makers',
  'Festive sale: up to 40% off',
]

const TITLES = { '/': 'haat. | the modern bazaar', '/shop': 'Shop | haat.', '/orders': 'My orders | haat.' }

// The bag and saved list survive a reload. Storage can be blocked (private mode), so never rely on it.
function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key))
    return value ?? fallback
  } catch {
    return fallback
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

const KNOWN_IDS = new Set(PRODUCTS.map((p) => p.id))

export default function App() {
  const { path, hash } = useLocation()
  const [bag, setBag] = useState(() => {
    const stored = load('haat:bag', {})
    return Object.fromEntries(Object.entries(stored).filter(([id, qty]) => KNOWN_IDS.has(Number(id)) && qty > 0))
  })
  const [saved, setSaved] = useState(() => new Set(load('haat:saved', []).filter((id) => KNOWN_IDS.has(id))))
  const [bagOpen, setBagOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [user, setUser] = useState(undefined) // undefined = still checking, null = logged out
  const [authView, setAuthView] = useState({ open: false, mode: 'login', reason: '' })

  useEffect(() => save('haat:bag', bag), [bag])
  useEffect(() => save('haat:saved', [...saved]), [saved])

  useEffect(() => {
    auth
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
  }, [])

  // On every page change: set the title and jump to the #section or the top.
  // Changing only the shop filter (?c=) keeps the scroll position.
  useEffect(() => {
    document.title = TITLES[path] || TITLES['/']
    if (hash) document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
    else window.scrollTo({ top: 0, behavior: 'instant' })
  }, [path, hash])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast])

  const notify = useCallback((msg, action) => setToast({ msg, action, id: Date.now() }), [])

  const addToBag = (product) => {
    setBag((b) => ({ ...b, [product.id]: Math.min(10, (b[product.id] || 0) + 1) }))
    notify(`${product.name} added to your bag`, 'bag')
  }

  const changeQty = (id, delta) =>
    setBag((b) => {
      const next = { ...b }
      const qty = Math.min(10, (b[id] || 0) + delta)
      if (qty <= 0) delete next[id]
      else next[id] = qty
      return next
    })

  const removeFromBag = (id) =>
    setBag((b) => {
      const next = { ...b }
      delete next[id]
      return next
    })

  const toggleSaved = (product) => {
    setSaved((s) => {
      const next = new Set(s)
      if (next.has(product.id)) next.delete(product.id)
      else next.add(product.id)
      return next
    })
  }

  const closeBag = useCallback(() => setBagOpen(false), [])
  const closeAuth = useCallback(() => setAuthView((v) => ({ ...v, open: false })), [])
  const openAuth = (mode, reason = '') => setAuthView({ open: true, mode, reason })

  const handleAuthed = (u, mode) => {
    setUser(u)
    const first = u.name.split(' ')[0]
    const resumeCheckout = authView.reason !== ''
    closeAuth()
    notify(mode === 'signup' ? `Welcome to haat., ${first}!` : `Welcome back, ${first}!`)
    if (resumeCheckout) setBagOpen(true)
  }

  const logout = async () => {
    try {
      await auth.logout()
      setUser(null)
      notify('You are logged out. See you soon!')
    } catch (err) {
      notify(err.message)
    }
  }

  const needLogin = () => {
    setUser(null)
    setBagOpen(false)
    openAuth('login', 'Log in or sign up to check out')
  }

  const orderPlaced = (order) => {
    setBag({})
    setBagOpen(false)
    navigate('/orders')
    notify(`Order ${order.code} placed! Pay ${formatINR(order.total)} on delivery.`)
  }

  const showSaved = () => navigate('/shop?c=Saved')

  const bagCount = Object.values(bag).reduce((a, b) => a + b, 0)
  const bagItems = PRODUCTS.filter((p) => bag[p.id]).map((p) => ({ ...p, qty: bag[p.id] }))
  const pageProps = { bag, saved, onAdd: addToBag, onSave: toggleSaved }

  let page
  if (path === '/') page = <Landing {...pageProps} />
  else if (path === '/shop') page = <Shop {...pageProps} />
  else if (path === '/orders') page = <Orders user={user} onLogin={() => openAuth('login')} notify={notify} />
  else
    page = (
      <section className="shop">
        <div className="empty">
          <p>We couldn't find that page.</p>
          <Link href="/" className="btn btn--primary">
            Back home <Icon.Arrow size={18} />
          </Link>
        </div>
      </section>
    )

  const navClass = (href) => (path === href ? 'is-current' : undefined)

  return (
    <>
      <div className="ticker" aria-label="Store offers">
        <div className="ticker__track">
          {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((t, i) => (
            <span key={i} aria-hidden={i >= TICKER.length}>
              {t}
              <i>✦</i>
            </span>
          ))}
        </div>
      </div>

      <header className="header">
        <Link href="/" className="logo" aria-label="haat home">
          haat<span>.</span>
          <small>est. 2026</small>
        </Link>
        <nav className="nav" aria-label="Main">
          <Link href="/shop" className={navClass('/shop')}>
            Shop
          </Link>
          <Link href="/#drop">Gift box</Link>
          <Link href="/#faq">Help</Link>
          <Link href="/#contact">Contact</Link>
        </nav>
        <div className="header__actions">
          <AccountMenu
            user={user}
            onLogin={() => openAuth('login')}
            onSignup={() => openAuth('signup')}
            onLogout={logout}
            onOpenBag={() => setBagOpen(true)}
            onShowSaved={showSaved}
            onShowOrders={() => navigate('/orders')}
          />
          <button className="icon-btn" onClick={showSaved} aria-label={`Saved items: ${saved.size}`}>
            <Icon.Heart />
            {saved.size > 0 && <span className="badge">{saved.size}</span>}
          </button>
          <button className="cart-btn" onClick={() => setBagOpen(true)} aria-label={`Open bag, ${bagCount} items`}>
            <Icon.Bag />
            <span className="cart-btn__label">Bag</span>
            <span className="cart-btn__count" key={bagCount}>
              {bagCount}
            </span>
          </button>
        </div>
      </header>

      <main id="top" key={path}>
        {page}
      </main>

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__cols">
            <div>
              <p className="footer__lead">A modern bazaar for things made with care, by people who care.</p>
            </div>
            <div>
              <h4>Shop</h4>
              <ul>
                <li><Link href="/shop?c=Home">Home</Link></li>
                <li><Link href="/shop?c=Bags">Bags</Link></li>
                <li><Link href="/shop?c=Accessories">Accessories</Link></li>
                <li><Link href="/#drop">Gift box</Link></li>
              </ul>
            </div>
            <div>
              <h4>Help</h4>
              <ul>
                <li><Link href="/#faq">Shipping &amp; returns</Link></li>
                <li><Link href="/orders">Track order</Link></li>
                <li><Link href="/#contact">Contact</Link></li>
                <li><Link href="/#club">Join the club</Link></li>
              </ul>
            </div>
            <div>
              <h4>Follow</h4>
              <ul>
                <li><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a></li>
                <li><a href="https://pinterest.com" target="_blank" rel="noreferrer">Pinterest</a></li>
                <li><a href="https://youtube.com" target="_blank" rel="noreferrer">YouTube</a></li>
              </ul>
            </div>
          </div>
          <p className="footer__word" aria-hidden="true">
            haat<span>.</span>
          </p>
          <div className="footer__bottom">
            <span>© 2026 haat. Demo store.</span>
            <span>Built with React + Vite</span>
          </div>
        </div>
      </footer>

      <CartDrawer
        open={bagOpen}
        items={bagItems}
        user={user}
        onClose={closeBag}
        onQty={changeQty}
        onRemove={removeFromBag}
        onNeedLogin={needLogin}
        onPlaced={orderPlaced}
      />

      <AuthModal
        open={authView.open}
        mode={authView.mode}
        reason={authView.reason}
        onModeChange={(mode) => setAuthView((v) => ({ ...v, mode }))}
        onClose={closeAuth}
        onAuthed={handleAuthed}
      />

      {toast && (
        <div className="toast" key={toast.id} role="status">
          <span>{toast.msg}</span>
          {toast.action === 'bag' && (
            <button
              onClick={() => {
                setToast(null)
                setBagOpen(true)
              }}
            >
              View bag
            </button>
          )}
        </div>
      )}
    </>
  )
}
