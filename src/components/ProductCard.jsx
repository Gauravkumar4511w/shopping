import Link from './Link'
import { RatingPill } from './Stars'
import { Icon } from './Icons'
import { formatINR } from '../lib/format'
import { discountOf, isNew } from '../lib/product'

export default function ProductCard({ product, index = 0, rating, inBag, saved, onAdd, onSave }) {
  const off = discountOf(product)
  const href = `/product/${product.id}`
  const tag = product.stock < 10 ? `Only ${product.stock} left` : isNew(product) ? `New · ${product.year}` : product.featured ? 'Bestseller' : null
  const [first, second] = product.images

  return (
    <article className="card" style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}>
      <div className="card__art">
        <Link href={href} className="card__photo" aria-label={product.name} tabIndex={-1}>
          <img src={product.thumbnail || first} alt="" loading="lazy" decoding="async" />
          {second && <img className="card__photo-alt" src={second} alt="" loading="lazy" decoding="async" />}
        </Link>
        {tag && <span className="card__tag">{tag}</span>}
        <button
          className={`card__wish${saved ? ' is-on' : ''}`}
          onClick={() => onSave(product)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
        >
          <Icon.Heart filled={saved} size={19} />
        </button>
        <button className="card__add" onClick={() => onAdd(product)}>
          {inBag ? `In bag · ${inBag}` : 'Add to bag'} <Icon.Plus size={18} />
        </button>
      </div>

      <div className="card__info">
        {product.brand && <p className="card__brand">{product.brand}</p>}
        <h3>
          <Link href={href}>{product.name}</Link>
        </h3>
        <RatingPill rating={rating} small />
        <p className="card__price">
          <strong>{formatINR(product.price)}</strong>
          {product.mrp && <s>{formatINR(product.mrp)}</s>}
          {off > 0 && <span className="off">{off}% off</span>}
        </p>
      </div>
    </article>
  )
}
