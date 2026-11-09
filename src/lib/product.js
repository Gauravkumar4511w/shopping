// Small helpers shared by product cards, the product page and the shop.
export const discountOf = (p) => (p.mrp ? Math.round((1 - p.price / p.mrp) * 100) : 0)
