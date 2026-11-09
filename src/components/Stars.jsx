import { Icon } from './Icons'

// Flipkart-style green pill: "4.3 ★".
export function RatingPill({ rating, small = false }) {
  if (!rating?.count) return <span className="rating-none">No reviews yet</span>
  return (
    <span className="rating-line">
      <span className={`rating-pill${small ? ' rating-pill--small' : ''}${rating.avg < 3 ? ' is-low' : ''}`}>
        {rating.avg.toFixed(1)} <Icon.Star size={small ? 11 : 13} />
      </span>
      <span className="rating-count">
        ({rating.count.toLocaleString('en-IN')} {rating.count === 1 ? 'review' : 'reviews'})
      </span>
    </span>
  )
}
