// Small helpers shared by product cards, the product page, search and the shop.
export const discountOf = (p) => (p.mrp ? Math.round((1 - p.price / p.mrp) * 100) : 0)

// Launched this year or last: shown with a "New" tag.
export const NEW_FROM = 2025
export const isNew = (p) => (p.year || 0) >= NEW_FROM

// Every word of the search has to appear somewhere in the product's name, brand, category or tags.
export function matchesSearch(p, q) {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const text = `${p.name} ${p.brand || ''} ${p.category} ${p.tags.join(' ')}`.toLowerCase()
  return words.every((w) => text.includes(w))
}
