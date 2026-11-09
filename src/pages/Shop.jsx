import { useState } from 'react'
import { CATEGORIES, PRODUCTS } from '../data/products'
import ProductCard from '../components/ProductCard'
import { Icon } from '../components/Icons'
import { navigate, useLocation } from '../lib/router'
import { discountOf } from '../lib/product'

const COUNTS = PRODUCTS.reduce((c, p) => ({ ...c, [p.category]: (c[p.category] || 0) + 1 }), { All: PRODUCTS.length })

export default function Shop({ bag, saved, ratings, onAdd, onSave }) {
  const { query: params } = useLocation()
  const [sort, setSort] = useState(() => params.get('sort') || 'featured')
  const [query, setQuery] = useState('')

  // The category lives in the URL (?c=Home) so it can be linked to and survives a reload.
  const category = params.get('c') || 'All'
  const setCategory = (c) => navigate(c === 'All' ? '/shop' : `/shop?c=${encodeURIComponent(c)}`, { replace: true })

  const chips = saved.size > 0 ? [...CATEGORIES, 'Saved'] : CATEGORIES
  const activeCategory = chips.includes(category) ? category : 'All'

  const visible = (() => {
    const q = query.trim().toLowerCase()
    const list = PRODUCTS.filter((p) => {
      if (activeCategory === 'Saved' && !saved.has(p.id)) return false
      if (activeCategory !== 'All' && activeCategory !== 'Saved' && p.category !== activeCategory) return false
      return !q || `${p.name} ${p.brand || ''} ${p.category} ${p.tags.join(' ')}`.toLowerCase().includes(q)
    })
    if (sort === 'low') return [...list].sort((a, b) => a.price - b.price)
    if (sort === 'high') return [...list].sort((a, b) => b.price - a.price)
    if (sort === 'rating')
      return [...list].sort(
        (a, b) => (ratings[b.id]?.avg || 0) - (ratings[a.id]?.avg || 0) || (ratings[b.id]?.count || 0) - (ratings[a.id]?.count || 0),
      )
    if (sort === 'discount') return [...list].sort((a, b) => discountOf(b) - discountOf(a))
    return list
  })()

  return (
    <section className="shop" id="shop">
      <div className="section-head">
        <div>
          <p className="kicker">The edit</p>
          <h1 className="page-title">
            {activeCategory === 'All' ? (
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
          {visible.length} {visible.length === 1 ? 'piece' : 'pieces'}, refreshed every Friday. Tap the heart to save a
          favourite for later.
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
              <span>{c === 'Saved' ? saved.size : COUNTS[c]}</span>
            </button>
          ))}
        </div>
        <div className="toolbar__right">
          <label className="search">
            <Icon.Search size={18} />
            <input
              type="search"
              placeholder="Search phones, shoes, brands…"
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
            <option value="discount">Biggest discount</option>
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
          <p>{query ? `Nothing matches “${query}” here.` : 'Nothing here yet.'}</p>
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
  )
}
