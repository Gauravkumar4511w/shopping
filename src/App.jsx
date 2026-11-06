import { useCallback, useEffect, useMemo, useState } from 'react'
import { CATEGORIES, PRODUCTS } from './data/products'
import ProductArt from './components/ProductArt'
import ProductCard from './components/ProductCard'
import CartDrawer from './components/CartDrawer'
import Countdown from './components/Countdown'
import AuthModal from './components/AuthModal'
import AccountMenu from './components/AccountMenu'
import { Icon } from './components/Icons'
import { auth } from './lib/auth'
import './App.css'

// Festive gift-box offer ends at this moment (IST).
const SALE_END = new Date('2026-11-15T23:59:59+05:30').getTime()

const TICKER = [
  'Free shipping above ₹999',
  'Cash on delivery',
  '7-day easy returns',
  'Made by Indian makers',
  'Festive sale: up to 40% off',
]

const PERKS = [
  { icon: Icon.Truck, title: 'Free shipping', text: 'On every order above ₹999' },
  { icon: Icon.Return, title: '7-day returns', text: 'Doorstep pickup, no questions' },
  { icon: Icon.Shield, title: 'Secure checkout', text: 'UPI, cards and cash on delivery' },
  { icon: Icon.Spark, title: 'Maker-first', text: 'Fair pay for every small studio' },
]

const REVIEWS = [
  {
    quote: 'The brass lamp turned my reading corner into my favourite spot in the house.',
    name: 'Ananya',
    place: 'Pune',
    item: 'Dome Brass Lamp',
  },
  {
    quote: 'Packed like a gift, arrived in two days. The tote is even nicer in person.',
    name: 'Rohit',
    place: 'Jaipur',
    item: 'Kantha Tote',
  },
  {
    quote: 'That candle smells exactly like the first rain. I have already ordered three more.',
    name: 'Meher',
    place: 'Kochi',
    item: 'Monsoon Soy Candle',
  },
]

export default function App() {
  const [bag, setBag] = useState({}) // { [productId]: qty }
  const [saved, setSaved] = useState(() => new Set())
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('featured')
  const [query, setQuery] = useState('')
  const [bagOpen, setBagOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [email, setEmail] = useState('')
  const [joined, setJoined] = useState(false)
  const [user, setUser] = useState(undefined) // undefined = still checking, null = logged out
  const [authView, setAuthView] = useState({ open: false, mode: 'login', reason: '' })

  useEffect(() => {
    auth
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const notify = (msg, action) => setToast({ msg, action, id: Date.now() })

  const addToBag = (product) => {
    setBag((b) => ({ ...b, [product.id]: (b[product.id] || 0) + 1 }))
    notify(`${product.name} added to your bag`, 'bag')
  }

  const changeQty = (id, delta) =>
    setBag((b) => {
      const next = { ...b }
      const qty = (b[id] || 0) + delta
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

  const checkout = () => {
    if (!user) {
      setBagOpen(false)
      openAuth('login', 'Log in or sign up to check out')
      return
    }
    notify(`Thanks, ${user.name.split(' ')[0]}! Checkout is a demo, so no payment was taken.`)
  }

  const showSaved = () => {
    setCategory('Saved')
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })
  }

  const bagCount = Object.values(bag).reduce((a, b) => a + b, 0)
  const bagItems = PRODUCTS.filter((p) => bag[p.id]).map((p) => ({ ...p, qty: bag[p.id] }))

  const counts = useMemo(() => {
    const c = { All: PRODUCTS.length }
    PRODUCTS.forEach((p) => (c[p.category] = (c[p.category] || 0) + 1))
    return c
  }, [])

  const chips = saved.size > 0 ? [...CATEGORIES, 'Saved'] : CATEGORIES
  const activeCategory = category === 'Saved' && saved.size === 0 ? 'All' : category

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = PRODUCTS.filter((p) => {
      if (activeCategory === 'Saved' && !saved.has(p.id)) return false
      if (activeCategory !== 'All' && activeCategory !== 'Saved' && p.category !== activeCategory) return false
      return !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    })
    if (sort === 'low') return [...list].sort((a, b) => a.price - b.price)
    if (sort === 'high') return [...list].sort((a, b) => b.price - a.price)
    if (sort === 'rating') return [...list].sort((a, b) => b.rating - a.rating)
    return list
  }, [activeCategory, sort, query, saved])

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
        <a href="#top" className="logo" aria-label="haat home">
          haat<span>.</span>
          <small>est. 2026</small>
        </a>
        <nav className="nav" aria-label="Main">
          <a href="#shop">Shop</a>
          <a href="#drop">Gift box</a>
          <a href="#reviews">Reviews</a>
          <a href="#club">Club</a>
        </nav>
        <div className="header__actions">
          <AccountMenu
            user={user}
            onLogin={() => openAuth('login')}
            onSignup={() => openAuth('signup')}
            onLogout={logout}
            onOpenBag={() => setBagOpen(true)}
            onShowSaved={showSaved}
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

      <main id="top">
        <section className="hero">
          <div className="hero__copy">
            <p className="kicker">
              <span className="dot" /> Festive drop · Vol. 03
            </p>
            <h1>
              Things you'll <em>actually</em> love to <span className="hl">own.</span>
            </h1>
            <p className="hero__lead">
              Hand-picked goods from 120+ independent Indian makers. Small batches, honest prices, at your door in
              48 hours.
            </p>
            <div className="hero__cta">
              <a href="#shop" className="btn btn--primary">
                Shop the drop <Icon.Arrow size={18} />
              </a>
              <a href="#drop" className="btn btn--ghost">
                Build a gift box
              </a>
            </div>
            <dl className="hero__stats">
              <div>
                <dt>12k+</dt>
                <dd>happy homes</dd>
              </div>
              <div>
                <dt>4.9★</dt>
                <dd>average rating</dd>
              </div>
              <div>
                <dt>48h</dt>
                <dd>dispatch</dd>
              </div>
            </dl>
          </div>

          <div className="hero__art" aria-hidden="true">
            <div className="blob" />
            <div className="float-card fc-1" style={{ background: '#24302e' }}>
              <ProductArt kind="lamp" />
              <span className="price-tag">₹3,490</span>
            </div>
            <div className="float-card fc-2" style={{ background: '#f3c6b8' }}>
              <ProductArt kind="tote" />
            </div>
            <div className="float-card fc-3" style={{ background: '#e5dcf5' }}>
              <ProductArt kind="sneaker" />
            </div>
            <svg className="spin-badge" viewBox="0 0 120 120">
              <defs>
                <path id="badge-circle" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
              </defs>
              <circle cx="60" cy="60" r="58" fill="#1c1a17" />
              <text fill="#f4ede1" fontSize="10.5" fontWeight="700" letterSpacing="2">
                <textPath href="#badge-circle" textLength="272">
                  UP TO 40% OFF ✦ FESTIVE SALE ✦
                </textPath>
              </text>
              <text x="60" y="71" textAnchor="middle" fontSize="30" fill="#f2a93b">
                ✦
              </text>
            </svg>
          </div>
        </section>

        <section className="shop" id="shop">
          <div className="section-head">
            <div>
              <p className="kicker">The edit</p>
              <h2>
                Shop by <em>mood</em>
              </h2>
            </div>
            <p className="section-head__note">
              {visible.length} {visible.length === 1 ? 'piece' : 'pieces'}, refreshed every Friday. Tap the heart to
              save a favourite for later.
            </p>
          </div>

          <div className="toolbar">
            <div className="chips">
              {chips.map((c) => (
                <button
                  key={c}
                  className={`chip${activeCategory === c ? ' is-active' : ''}`}
                  onClick={() => setCategory(c)}
                  aria-pressed={activeCategory === c}
                >
                  {c === 'Saved' && <Icon.Heart size={15} filled />}
                  {c}
                  <span>{c === 'Saved' ? saved.size : counts[c]}</span>
                </button>
              ))}
            </div>
            <div className="toolbar__right">
              <label className="search">
                <Icon.Search size={18} />
                <input
                  type="search"
                  placeholder="Search lamps, totes…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search products"
                />
              </label>
              <select className="sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
                <option value="featured">Featured</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
                <option value="rating">Top rated</option>
              </select>
            </div>
          </div>

          {visible.length > 0 ? (
            <div className="grid">
              {visible.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  index={i}
                  inBag={bag[p.id] || 0}
                  saved={saved.has(p.id)}
                  onAdd={addToBag}
                  onSave={toggleSaved}
                />
              ))}
            </div>
          ) : (
            <div className="empty">
              <p>Nothing matches “{query}” here.</p>
              <button
                className="btn btn--ghost"
                onClick={() => {
                  setQuery('')
                  setCategory('All')
                }}
              >
                Show everything
              </button>
            </div>
          )}
        </section>

        <div className="band" id="drop">
          <section className="promo">
            <div className="promo__copy">
              <p className="kicker kicker--light">Limited · Diwali gift box</p>
              <h2>
                Pick any 3, <em>save 25%.</em>
              </h2>
              <p>
                Mix lamps, candles and mugs into a hand-wrapped box with a handwritten note. Ships in recycled kraft,
                ready to gift.
              </p>
              <a href="#shop" className="btn btn--saffron">
                Start your box <Icon.Arrow size={18} />
              </a>
            </div>
            <div className="promo__side">
              <div className="promo__art" aria-hidden="true">
                <div className="mini" style={{ background: '#d9e7e3' }}>
                  <ProductArt kind="candle" />
                </div>
                <div className="mini" style={{ background: '#cfdcbd' }}>
                  <ProductArt kind="mug" />
                </div>
                <div className="mini" style={{ background: '#efe0bf' }}>
                  <ProductArt kind="plant" />
                </div>
              </div>
              <div className="promo__timer">
                <p>Offer ends in</p>
                <Countdown target={SALE_END} />
              </div>
            </div>
          </section>
        </div>

        <section className="perks" aria-label="Why shop with us">
          {PERKS.map(({ icon: PerkIcon, title, text }) => (
            <div key={title} className="perk">
              <div className="perk__icon">
                <PerkIcon size={24} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </section>

        <section className="reviews" id="reviews">
          <p className="kicker">Love letters</p>
          <h2>
            From homes that <em>shopped</em> with us
          </h2>
          <div className="reviews__grid">
            {REVIEWS.map((r) => (
              <figure key={r.name} className="review">
                <div className="review__stars" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Icon.Star key={i} size={18} />
                  ))}
                </div>
                <blockquote>“{r.quote}”</blockquote>
                <figcaption>
                  <span className="avatar">{r.name[0]}</span>
                  <span>
                    <b>
                      {r.name}, {r.place}
                    </b>
                    <small>Bought the {r.item}</small>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <div className="band" id="club">
          <section className="club">
            <div>
              <p className="kicker">The haat club</p>
              <h2>
                ₹200 off your <em>first</em> order.
              </h2>
            </div>
            <div>
              {joined ? (
                <p className="club__done">You're in. Check your inbox for the code ✦</p>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    setJoined(true)
                  }}
                >
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-label="Email address"
                  />
                  <button className="btn btn--primary" type="submit">
                    Join <Icon.Arrow size={18} />
                  </button>
                </form>
              )}
              <small>New drops every Friday. No spam, unsubscribe anytime.</small>
            </div>
          </section>
        </div>
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
                <li><a href="#shop">Home</a></li>
                <li><a href="#shop">Bags</a></li>
                <li><a href="#shop">Accessories</a></li>
                <li><a href="#drop">Gift box</a></li>
              </ul>
            </div>
            <div>
              <h4>Help</h4>
              <ul>
                <li><a href="#top">Shipping</a></li>
                <li><a href="#top">Returns</a></li>
                <li><a href="#top">Track order</a></li>
                <li><a href="#top">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4>Follow</h4>
              <ul>
                <li><a href="#top">Instagram</a></li>
                <li><a href="#top">Pinterest</a></li>
                <li><a href="#top">YouTube</a></li>
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
        onClose={closeBag}
        onQty={changeQty}
        onRemove={removeFromBag}
        onCheckout={checkout}
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
