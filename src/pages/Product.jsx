import { useEffect } from 'react'
import { FREE_SHIPPING_AT, PRODUCTS } from '../data/products'
import Gallery from '../components/Gallery'
import ProductCard from '../components/ProductCard'
import Reviews from '../components/Reviews'
import { RatingPill } from '../components/Stars'
import Link from '../components/Link'
import { Icon } from '../components/Icons'
import { formatINR } from '../lib/format'
import { discountOf } from '../lib/product'

export default function Product({ id, bag, saved, ratings, user, onAdd, onSave, onBuyNow, onLogin, onRated }) {
  const product = PRODUCTS.find((p) => p.id === id)

  useEffect(() => {
    if (product) document.title = `${product.name} | haat.`
  }, [product])

  if (!product) {
    return (
      <section className="shop">
        <div className="empty">
          <p>This product is no longer in the bazaar.</p>
          <Link href="/shop" className="btn btn--primary">
            See everything <Icon.Arrow size={18} />
          </Link>
        </div>
      </section>
    )
  }

  const off = discountOf(product)
  const inBag = bag[product.id] || 0
  const isSaved = saved.has(product.id)
  const similar = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)

  return (
    <>
      <section className="pdp">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/shop?c=${encodeURIComponent(product.category)}`}>{product.category}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="pdp__grid">
          <Gallery key={product.id} images={product.images} name={product.name} credits={product.credits} />

          <div className="pdp__info">
            <p className="pdp__brand">
              {product.brand}
              {product.year && <span className="pdp__year">Launched {product.year}</span>}
            </p>
            <h1 className="pdp__name">{product.name}</h1>
            <a href="#reviews" className="pdp__rating">
              <RatingPill rating={ratings[product.id]} />
            </a>

            <div className="pdp__price">
              <strong>{formatINR(product.price)}</strong>
              {product.mrp && <s>{formatINR(product.mrp)}</s>}
              {off > 0 && <span className="off">{off}% off</span>}
            </div>
            <p className="pdp__tax">Inclusive of all taxes</p>

            <p className={`pdp__stock${product.stock < 10 ? ' is-low' : ''}`}>
              {product.stock < 10 ? `Hurry, only ${product.stock} left in stock` : 'In stock'}
            </p>

            <div className="pdp__actions">
              <button className="btn btn--ghost" onClick={() => onAdd(product)}>
                <Icon.Bag size={18} /> {inBag ? `In bag · ${inBag}` : 'Add to bag'}
              </button>
              <button className="btn btn--primary" onClick={() => onBuyNow(product)}>
                Buy now <Icon.Arrow size={18} />
              </button>
              <button
                className={`icon-btn pdp__save${isSaved ? ' is-on' : ''}`}
                onClick={() => onSave(product)}
                aria-pressed={isSaved}
                aria-label={isSaved ? 'Remove from saved' : 'Save for later'}
              >
                <Icon.Heart filled={isSaved} />
              </button>
            </div>

            <ul className="pdp__perks">
              <li>
                <Icon.Truck size={20} />
                {product.price >= FREE_SHIPPING_AT ? 'Free delivery' : `Free delivery on orders above ${formatINR(FREE_SHIPPING_AT)}`}
                <small>Dispatched within 48 hours</small>
              </li>
              <li>
                <Icon.Shield size={20} /> Cash on delivery <small>Pay in cash or UPI at your door</small>
              </li>
              <li>
                <Icon.Return size={20} /> 7-day returns <small>Free doorstep pickup</small>
              </li>
            </ul>

            <div className="pdp__block">
              <h2>About this item</h2>
              <p>{product.description}</p>
            </div>

            <div className="pdp__block">
              <h2>Specifications</h2>
              <dl className="specs">
                <div>
                  <dt>Category</dt>
                  <dd>{product.category}</dd>
                </div>
                {product.specs.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <Reviews key={product.id} product={product} user={user} onLogin={onLogin} onRated={onRated} />

      {similar.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <p className="kicker">You may also like</p>
              <h2>
                More in <em>{product.category.toLowerCase()}</em>
              </h2>
            </div>
            <Link href={`/shop?c=${encodeURIComponent(product.category)}`} className="btn btn--ghost">
              See all <Icon.Arrow size={18} />
            </Link>
          </div>
          <div className="grid grid--featured">
            {similar.map((p, i) => (
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
      )}
    </>
  )
}
