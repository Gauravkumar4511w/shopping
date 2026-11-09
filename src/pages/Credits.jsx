import { PRODUCTS } from '../data/products'
import Link from '../components/Link'

const CREDITED = PRODUCTS.filter((p) => p.credits)

// Attribution for every freely licensed photo used in the shop.
export default function Credits() {
  return (
    <section className="shop credits">
      <div className="section-head">
        <div>
          <p className="kicker">Thank you</p>
          <h1 className="page-title">
            Photo <em>credits</em>
          </h1>
        </div>
        <p className="section-head__note">
          Phone, laptop, gadget and camera photos are from Wikimedia Commons and are used under the licences below. Other
          product photos come from DummyJSON, a free demo catalogue.
        </p>
      </div>
      <ul className="credits__list">
        {CREDITED.map((p) => (
          <li key={p.id}>
            <Link href={`/product/${p.id}`} className="credits__product">
              <img src={p.thumbnail} alt="" loading="lazy" />
              {p.name}
            </Link>
            <ol>
              {p.credits.map((c, i) => (
                <li key={i}>
                  Photo {i + 1}: {c.author} ·{' '}
                  <a href={c.source} target="_blank" rel="noreferrer">
                    {c.license}, Wikimedia Commons
                  </a>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ul>
    </section>
  )
}
