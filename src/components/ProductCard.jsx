import ProductArt from './ProductArt'
import { Icon } from './Icons'
import { formatINR } from '../lib/format'

export default function ProductCard({ product, index, inBag, saved, onAdd, onSave }) {
  const off = product.mrp ? Math.round((1 - product.price / product.mrp) * 100) : 0
  const classes = ['card', product.tall && 'card--tall', product.dark && 'card--dark'].filter(Boolean).join(' ')

  return (
    <article className={classes} style={{ animationDelay: `${index * 45}ms` }}>
      <div className="card__art" style={{ '--card-bg': product.bg }}>
        {product.tag && <span className="card__tag">{product.tag}</span>}
        <button
          className={`card__wish${saved ? ' is-on' : ''}`}
          onClick={() => onSave(product)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
        >
          <Icon.Heart filled={saved} size={19} />
        </button>
        <ProductArt kind={product.kind} className="card__svg" />
        <button className="card__add" onClick={() => onAdd(product)}>
          {inBag ? `In bag · ${inBag}` : 'Add to bag'} <Icon.Plus size={18} />
        </button>
      </div>

      <div className="card__info">
        <div className="card__row">
          <h3>{product.name}</h3>
          <p className="card__price">
            <strong>{formatINR(product.price)}</strong>
            {product.mrp && <s>{formatINR(product.mrp)}</s>}
          </p>
        </div>
        <div className="card__row card__meta">
          <span className="cat">{product.category}</span>
          <span className="rating">
            <Icon.Star size={15} /> {product.rating} <em>({product.reviews})</em>
          </span>
          {off > 0 && <span className="off">{off}% off</span>}
        </div>
      </div>
    </article>
  )
}
