import { useEffect, useRef } from 'react'
import { CATEGORIES, PRODUCTS } from '../data/products'
import ProductCard from '../components/ProductCard'
import { Icon } from '../components/Icons'
import { navigate, useLocation } from '../lib/router'
import { discountOf, matchesSearch } from '../lib/product'

const COUNTS = PRODUCTS.reduce((c, p) => ({ ...c, [p.category]: (c[p.category] || 0) + 1 }), { All: PRODUCTS.length })

const PRICES = [
  ['', 'Any price'],
  ['0-999', 'Under ₹1,000'],
  ['1000-9999', '₹1,000 – ₹10,000'],
  ['10000-29999', '₹10,000 – ₹30,000'],
  ['30000-59999', '₹30,000 – ₹60,000'],
  ['60000-', '₹60,000 and above'],
]

const SORTS = [
  ['featured', 'Featured'],
  ['newest', 'Newest first'],
  ['low', 'Price: low to high'],
  ['high', 'Price: high to low'],
  ['rating', 'Top rated'],
  ['discount', 'Biggest discount'],
]

// Every filter lives in the URL (?c=Mobiles&q=iphone&brand=Apple&price=30000-59999&sort=low),
// so a filtered page can be shared and survives a reload.
export default function Shop({ bag, saved, ratings, onAdd, onSave }) {
  const { query: params } = useLocation()
  const category = params.get('c') || 'All'
  const q = params.get('q') || ''
  const brand = params.get('brand') || ''
  const price = params.get('price') || ''
  const sort = params.get('sort') || 'featured'

  const setParams = (changes) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(changes)) {
      if (!v || (k === 'c' && v === 'All') || (k === 'sort' && v === 'featured')) next.delete(k)
      else next.set(k, v)
    }
    const s = next.toString()
    navigate(s ? `/shop?${s}` : '/shop', { replace: true })
  }

  const chips = saved.size > 0 ? [...CATEGORIES, 'Saved'] : CATEGORIES
  const activeCategory = chips.includes(category) ? category : 'All'

  // On narrow screens the chip row scrolls sideways: keep the selected category in view.
  const chipRow = useRef(null)
  useEffect(() => {
    const row = chipRow.current
    const chip = row?.querySelector('.chip.is-active')
    if (row && chip) row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' })
  }, [activeCategory])

  const inCategory = PRODUCTS.filter((p) => {
    if (activeCategory === 'Saved') return saved.has(p.id)
    return activeCategory === 'All' || p.category === activeCategory
  })
  const brands = [...new Set(inCategory.map((p) => p.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  const [min, max] = price ? price.split('-').map((n) => (n ? Number(n) : Infinity)) : [0, Infinity]

  const visible = (() => {
    const list = inCategory.filter(
      (p) => matchesSearch(p, q) && (!brand || p.brand === brand) && p.price >= min && p.price <= max,
    )
    if (sort === 'low') return [...list].sort((a, b) => a.price - b.price)
    if (sort === 'high') return [...list].sort((a, b) => b.price - a.price)
    if (sort === 'newest') return [...list].sort((a, b) => (b.year || 0) - (a.year || 0))
    if (sort === 'rating')
      return [...list].sort(
        (a, b) => (ratings[b.id]?.avg || 0) - (ratings[a.id]?.avg || 0) || (ratings[b.id]?.count || 0) - (ratings[a.id]?.count || 0),
      )
    if (sort === 'discount') return [...list].sort((a, b) => discountOf(b) - discountOf(a))
    return list
  })()

  const filtersOn = Boolean(q || brand || price)

  return (
    <section className="shop" id="shop">
      <div className="section-head">
        <div>
          <p className="kicker">{q ? 'Search results' : 'The edit'}</p>
          <h1 className="page-title">
            {q ? (
              <>
                “<em>{q}</em>”
              </>
            ) : activeCategory === 'All' ? (
              <>
                Everything in the <em>bazaar</em>
              </>
            ) : activeCategory === 'Saved' ? (
              <>
                Your <em>saved</em> pieces
              </>
            ) : (
              <>
                Shop <em>{activeCategory.toLowerCase()}</em>
              </>
            )}
          </h1>
        </div>
        <p className="section-head__note">
          {visible.length} {visible.length === 1 ? 'product' : 'products'}
          {activeCategory !== 'All' && activeCategory !== 'Saved' ? ` in ${activeCategory}` : ''}. Tap the heart to save a
          favourite for later.
        </p>
      </div>

      <div className="toolbar">
        <div className="chips" ref={chipRow}>
          {chips.map((c) => (
            <button
              key={c}
              className={`chip${activeCategory === c ? ' is-active' : ''}`}
              onClick={() => setParams({ c, brand: '' })}
              aria-pressed={activeCategory === c}
            >
              {c === 'Saved' && <Icon.Heart size={15} filled />}
              {c}
              <span>{c === 'Saved' ? saved.size : COUNTS[c]}</span>
            </button>
          ))}
        </div>
        <div className="filters">
          <select className="sort" value={brand} onChange={(e) => setParams({ brand: e.target.value })} aria-label="Brand">
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select className="sort" value={price} onChange={(e) => setParams({ price: e.target.value })} aria-label="Price">
            {PRICES.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
          <select className="sort" value={sort} onChange={(e) => setParams({ sort: e.target.value })} aria-label="Sort">
            {SORTS.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
          {filtersOn && (
            <button className="link-btn" onClick={() => setParams({ q: '', brand: '', price: '' })}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {visible.length > 0 ? (
        <div className="grid">
          {visible.map((p, i) => (
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
      ) : (
        <div className="empty">
          <p>{q ? `Nothing matches “${q}” here.` : 'Nothing matches these filters.'}</p>
          <button className="btn btn--ghost" onClick={() => navigate('/shop', { replace: true })}>
            Show everything
          </button>
        </div>
      )}
    </section>
  )
}
