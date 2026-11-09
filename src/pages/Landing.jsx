import { CATEGORIES, FREE_SHIPPING_AT, PRODUCTS } from '../data/products'
import ProductArt from '../components/ProductArt'
import ProductCard from '../components/ProductCard'
import Countdown from '../components/Countdown'
import ClubForm from '../components/ClubForm'
import ContactForm from '../components/ContactForm'
import { Icon } from '../components/Icons'
import Link from '../components/Link'
import { formatINR } from '../lib/format'

// Festive gift-box offer ends at this moment (IST).
const SALE_END = new Date('2026-11-15T23:59:59+05:30').getTime()

const PERKS = [
  { icon: Icon.Truck, title: 'Free shipping', text: `On every order above ${formatINR(FREE_SHIPPING_AT)}` },
  { icon: Icon.Return, title: '7-day returns', text: 'Doorstep pickup, no questions' },
  { icon: Icon.Shield, title: 'Cash on delivery', text: 'Pay when your parcel arrives' },
  { icon: Icon.Spark, title: 'Maker-first', text: 'Fair pay for every small studio' },
]

const STEPS = [
  { n: '01', title: 'Pick what you love', text: 'Browse small-batch goods, save favourites and fill your bag.' },
  { n: '02', title: 'We pack it by hand', text: 'Every order is wrapped in recycled kraft, with a handwritten note.' },
  { n: '03', title: 'At your door in 48h', text: 'Pay cash on delivery. Not right? Send it back within 7 days.' },
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

const CATEGORY_KIND = { Home: 'lamp', Bags: 'tote', Footwear: 'sneaker', Tech: 'headphones', Accessories: 'watch' }
const CATEGORY_BG = { Home: '#cfdcbd', Bags: '#f3c6b8', Footwear: '#e5dcf5', Tech: '#bcd6e0', Accessories: '#f2a93b' }

// Best sellers: highest rating, then most reviews.
const FEATURED = [...PRODUCTS]
  .sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
  .slice(0, 4)
  .map((p) => ({ ...p, tall: false }))

export default function Landing({ bag, saved, onAdd, onSave }) {
  const counts = PRODUCTS.reduce((c, p) => ({ ...c, [p.category]: (c[p.category] || 0) + 1 }), {})

  return (
    <>
      <section className="hero">
        <div className="hero__copy">
          <p className="kicker">
            <span className="dot" /> Festive drop · Vol. 03
          </p>
          <h1>
            Things you'll <em>actually</em> love to <span className="hl">own.</span>
          </h1>
          <p className="hero__lead">
            Hand-picked goods from 120+ independent Indian makers. Small batches, honest prices, at your door in 48
            hours.
          </p>
          <div className="hero__cta">
            <Link href="/shop" className="btn btn--primary">
              Shop the drop <Icon.Arrow size={18} />
            </Link>
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

      <section className="section" id="categories">
        <div className="section-head">
          <div>
            <p className="kicker">Browse</p>
            <h2>
              Shop by <em>mood</em>
            </h2>
          </div>
          <p className="section-head__note">Five corners of the bazaar, each one stocked by small studios across India.</p>
        </div>
        <div className="cats">
          {CATEGORIES.filter((c) => c !== 'All').map((c) => (
            <Link key={c} href={`/shop?c=${encodeURIComponent(c)}`} className="cat-tile" style={{ '--tile-bg': CATEGORY_BG[c] }}>
              <ProductArt kind={CATEGORY_KIND[c]} />
              <span className="cat-tile__name">
                {c} <Icon.Arrow size={18} />
              </span>
              <small>
                {counts[c]} {counts[c] === 1 ? 'piece' : 'pieces'}
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
            See all {PRODUCTS.length} pieces <Icon.Arrow size={18} />
          </Link>
        </div>
        <div className="grid grid--featured">
          {FEATURED.map((p, i) => (
            <ProductCard
              key={p.id}
              product={p}
              index={i}
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
            <p className="kicker kicker--light">Limited · Diwali gift box</p>
            <h2>
              Pick any 3, <em>save 25%.</em>
            </h2>
            <p>
              Mix lamps, candles and mugs into a hand-wrapped box with a handwritten note. Ships in recycled kraft,
              ready to gift.
            </p>
            <Link href="/shop?c=Home" className="btn btn--saffron">
              Start your box <Icon.Arrow size={18} />
            </Link>
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
