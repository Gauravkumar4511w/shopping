import { useEffect, useId, useRef, useState } from 'react'
import { PRODUCTS } from '../data/products'
import { Icon } from './Icons'
import { formatINR } from '../lib/format'
import { matchesSearch } from '../lib/product'
import { navigate, useLocation } from '../lib/router'

// Header search: suggests matching products as you type; Enter shows every result in the shop.
export default function SearchBar() {
  const { path, query } = useLocation()
  const urlQ = path === '/shop' ? query.get('q') || '' : ''
  const [value, setValue] = useState(urlQ)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const box = useRef(null)
  const listId = useId()

  // Follow the URL when it changes (back button, "Clear filters", a new page).
  const [lastUrlQ, setLastUrlQ] = useState(urlQ)
  if (urlQ !== lastUrlQ) {
    setLastUrlQ(urlQ)
    setValue(urlQ)
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e) => !box.current?.contains(e.target) && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const term = value.trim()
  const suggestions = term.length >= 2 ? PRODUCTS.filter((p) => matchesSearch(p, term)).slice(0, 6) : []
  const showList = open && suggestions.length > 0

  const search = (q) => {
    setOpen(false)
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop')
  }

  const submit = (e) => {
    e.preventDefault()
    if (active >= 0 && suggestions[active]) {
      setOpen(false)
      navigate(`/product/${suggestions[active].id}`)
    } else search(term)
    e.currentTarget.querySelector('input')?.blur()
  }

  const onKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((a) => Math.min(a + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, -1))
    } else if (e.key === 'Escape') setOpen(false)
  }

  return (
    <form className="hsearch" role="search" onSubmit={submit} ref={box}>
      <Icon.Search size={18} />
      <input
        type="search"
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setOpen(true)
          setActive(-1)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        placeholder="Search iPhone, PS5, sneakers…"
        aria-label="Search products"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        enterKeyHint="search"
      />
      {showList && (
        <ul className="hsearch__list" id={listId} role="listbox">
          {suggestions.map((p, i) => (
            <li key={p.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={i === active ? 'is-active' : undefined}
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  setOpen(false)
                  navigate(`/product/${p.id}`)
                }}
              >
                <img src={p.thumbnail} alt="" loading="lazy" />
                <span>
                  {p.name}
                  <small>{p.category}</small>
                </span>
                <b>{formatINR(p.price)}</b>
              </button>
            </li>
          ))}
          <li>
            <button type="button" className="hsearch__all" onClick={() => search(term)}>
              See all results for “{term}” <Icon.Arrow size={16} />
            </button>
          </li>
        </ul>
      )}
    </form>
  )
}
