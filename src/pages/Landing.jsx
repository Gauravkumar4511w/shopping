import { CATEGORIES, FREE_SHIPPING_AT, PRODUCTS } from '../data/products'
import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard'
import { RatingPill } from '../components/Stars'
import Countdown from '../components/Countdown'
import ClubForm from '../components/ClubForm'
import ContactForm from '../components/ContactForm'
import { Icon } from '../components/Icons'
import Link from '../components/Link'
import { formatINR } from '../lib/format'
import { discountOf } from '../lib/product'
import { api } from '../lib/api'

// Festive sale ends at this moment (IST).
const SALE_END = new Date('2026-11-15T23:59:59+05:30').getTime()

const PERKS = [
  { icon: Icon.Truck, title: 'Free shipping', text: `On every order above ${formatINR(FREE_SHIPPING_AT)}` },
  { icon: Icon.Return, title: '7-day returns', text: 'Doorstep pickup, no questions' },
  { icon: Icon.Shield, title: 'Cash on delivery', text: 'Pay when your parcel arrives' },
  { icon: Icon.Spark, title: 'Honest reviews', text: 'Every rating comes from a signed-in shopper' },
]

const STEPS = [
  { n: '01', title: 'Pick what you love', text: 'Browse small-batch goods, save favourites and fill your bag.' },
  { n: '02', title: 'We pack it by hand', text: 'Every order is wrapped in recycled kraft, with a handwritten note.' },
  { n: '03', title: 'At your door in 48h', text: 'Pay cash on delivery. Not right? Send it back within 7 days.' },
]

const FAQ = [
  [
    'How long does delivery take?',
    'Orders leave our studio within 48 hours. Metro cities usually get them in 2 to 3 days, everywhere else in 4 to 6.',
  ],
  [
    'How do I pay?',
    'Every order is cash on delivery for now. You can pay the delivery partner in cash or by UPI when your parcel arrives.',
  ],
  [
    'Can I return something?',
    'Yes. Tell us within 7 days of delivery and we will pick it up from your door and refund you in full.',
  ],
  [
    'Can I cancel an order?',
    'Until we pack it, yes. Open My orders from your account menu and tap Cancel on the order.',
  ],
  [
    'Do you sell wholesale?',
    'We do, for stores and corporate gifting. Use the contact form below and pick Wholesale as the topic.',
  ],
]

const BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]))
const FEATURED = PRODUCTS.filter((p) => p.featured)
const HERO = ['iPhone 13 Pro', 'Nike Air Jordan 1 Red And Black', 'Apple Airpods'].map((name) =>
  PRODUCTS.find((p) => p.name === name),
)
const MAX_OFF = Math.max(...PRODUCTS.map(discountOf))
const DEALS = [...PRODUCTS].sort((a, b) => discountOf(b) - discountOf(a)).slice(0, 3)
// Each category tile shows its first product's photo.
const TILES = CATEGORIES.filter((c) => c !== 'All').map((c) => {
  const items = PRODUCTS.filter((p) => p.category === c)
  return { name: c, count: items.length, photo: (items.find((p) => p.featured) || items[0]).thumbnail }
})
const reviewDate = new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' })

export default function Landing({ bag, saved, ratings, onAdd, onSave }) {
  const [latest, setLatest] = useState([])

  useEffect(() => {
    let live = true
    api
      .latestReviews()
      .then(({ reviews }) => live && setLatest(reviews.filter((r) => BY_ID.has(r.productId))))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [])

  return (
    <>
      <section className="hero">
        <div className="hero__copy">
          <p className="kicker">
            <span className="dot" /> Festive sale · live now
          </p>
          <h1>
            Things you'll <em>actually</em> love to <span className="hl">own.</span>
          </h1>
          <p className="hero__lead">
            Phones, fashion, shoes, home and beauty, picked with care and priced honestly. Cash on delivery, at your
            door in 48 hours.
          </p>
          <div className="hero__cta">
            <Link href="/shop" className="btn btn--primary">
              Shop all {PRODUCTS.length} products <Icon.Arrow size={18} />
            </Link>
            <a href="#drop" className="btn btn--ghost">
              See today's deals
            </a>
          </div>
          <dl className="hero__stats">
            <div>
              <dt>{PRODUCTS.length}</dt>
              <dd>products</dd>
            </div>
            <div>
              <dt>{TILES.length}</dt>
              <dd>categories</dd>
            </div>
            <div>
              <dt>48h</dt>
              <dd>dispatch</dd>
            </div>
          </dl>
        </div>

        <div className="hero__art">
          <div className="blob" aria-hidden="true" />
          {HERO.map((p, i) => (
            <Link key={p.id} href={`/product/${p.id}`} className={`float-card fc-${i + 1}`} aria-label={p.name}>
              <img src={p.thumbnail} alt="" />
              {i === 0 && <span className="price-tag">{formatINR(p.price)}</span>}
            </Link>
          ))}
          <svg className="spin-badge" viewBox="0 0 120 120" aria-hidden="true">
            <defs>
              <path id="badge-circle" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
            </defs>
            <circle cx="60" cy="60" r="58" fill="#1c1a17" />
            <text fill="#f4ede1" fontSize="10.5" fontWeight="700" letterSpacing="2">
              <textPath href="#badge-circle" textLength="272">
                {`UP TO ${MAX_OFF}% OFF ✦ FESTIVE SALE ✦`}
              </textPath>
            </text>
            <text x="60" y="71" textAnchor="middle" fontSize="30" fill="#f2a93b">
              ✦
            </text>
          </svg>
        </div>
      </section>

      <section className="section" id="categories">
        <div className="section-head">
          <div>
            <p className="kicker">Browse</p>
            <h2>
              Shop by <em>category</em>
            </h2>
          </div>
          <p className="section-head__note">Tap a category to see everything in it, then sort by price, rating or discount.</p>
        </div>
        <div className="cats">
          {TILES.map((t) => (
            <Link key={t.name} href={`/shop?c=${encodeURIComponent(t.name)}`} className="cat-tile">
              <img src={t.photo} alt="" loading="lazy" />
              <span className="cat-tile__name">
                {t.name} <Icon.Arrow size={18} />
              </span>
              <small>
                {t.count} {t.count === 1 ? 'product' : 'products'}
              </small>
            </Link>
          ))}
        </div>
      </section>

      <section className="section" id="bestsellers">
        <div className="section-head">
          <div>
            <p className="kicker">Most loved</p>
            <h2>
              This week's <em>best sellers</em>
            </h2>
          </div>
          <Link href="/shop" className="btn btn--ghost">
            See all {PRODUCTS.length} products <Icon.Arrow size={18} />
          </Link>
        </div>
        <div className="grid grid--featured">
          {FEATURED.map((p, i) => (
            <ProductCard
              key={p.id}
              product={p}
              index={i}
              rating={ratings[p.id]}
              inBag={bag[p.id] || 0}
              saved={saved.has(p.id)}
              onAdd={onAdd}
              onSave={onSave}
            />
          ))}
        </div>
      </section>

      <div className="band" id="drop">
        <section className="promo">
          <div className="promo__copy">
            <p className="kicker kicker--light">Limited · Festive sale</p>
            <h2>
              Up to <em>{MAX_OFF}% off</em> today.
            </h2>
            <p>
              Prices are already marked down in the shop, no code needed. Club members get another ₹200 off their
              first order.
            </p>
            <Link href="/shop?sort=discount" className="btn btn--saffron">
              Shop the deals <Icon.Arrow size={18} />
            </Link>
          </div>
          <div className="promo__side">
            <div className="promo__art">
              {DEALS.map((p) => (
                <Link key={p.id} href={`/product/${p.id}`} className="mini" aria-label={`${p.name}, ${discountOf(p)}% off`}>
                  <img src={p.thumbnail} alt="" loading="lazy" />
                  <span className="mini__off">−{discountOf(p)}%</span>
                </Link>
              ))}
            </div>
            <div className="promo__timer">
              <p>Sale ends in</p>
              <Countdown target={SALE_END} />
            </div>
          </div>
        </section>
      </div>

      <section className="section" id="how">
        <p className="kicker">How it works</p>
        <h2>
          From a maker's bench to <em>your door</em>
        </h2>
        <ol className="steps">
          {STEPS.map((s) => (
            <li key={s.n} className="step">
              <span className="step__n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

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

      {latest.length > 0 && (
        <section className="reviews" id="reviews">
          <p className="kicker">Latest reviews</p>
          <h2>
            What shoppers <em>say</em>
          </h2>
          <div className="reviews__grid">
            {latest.slice(0, 3).map((r) => {
              const p = BY_ID.get(r.productId)
              return (
                <figure key={r.id} className="review">
                  <RatingPill rating={{ avg: r.rating, count: 1 }} small />
                  <blockquote>“{r.title ? `${r.title}. ` : ''}{r.body}”</blockquote>
                  <figcaption>
                    <img className="avatar avatar--photo" src={p.thumbnail} alt="" loading="lazy" />
                    <span>
                      <b>
                        {r.name}
                        {r.verified && ' · Verified buyer'}
                      </b>
                      <small>
                        <Link href={`/product/${p.id}`}>{p.name}</Link> · {reviewDate.format(new Date(r.createdAt))}
                      </small>
                    </span>
                  </figcaption>
                </figure>
              )
            })}
          </div>
        </section>
      )}

      <div className="band" id="club">
        <section className="club">
          <div>
            <p className="kicker">The haat club</p>
            <h2>
              ₹200 off your <em>first</em> order.
            </h2>
          </div>
          <ClubForm />
        </section>
      </div>

      <section className="section faq-contact">
        <div id="faq">
          <p className="kicker">Questions</p>
          <h2>
            Good to <em>know</em>
          </h2>
          <div className="faq">
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q} <Icon.Plus size={20} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
        <div id="contact">
          <p className="kicker">Say hello</p>
          <h2>
            Write to <em>us</em>
          </h2>
          <ContactForm />
        </div>
      </section>
    </>
  )
}
