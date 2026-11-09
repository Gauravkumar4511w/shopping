import { useEffect, useState } from 'react'
import ProductArt from '../components/ProductArt'
import { Icon } from '../components/Icons'
import { api } from '../lib/api'
import { formatINR } from '../lib/format'
import Link from '../components/Link'

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

const STATUS = { placed: 'Placed · cash on delivery', cancelled: 'Cancelled' }

export default function Orders({ user, onLogin, notify }) {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    if (!user) return
    let live = true
    api
      .orders()
      .then(({ orders }) => live && setOrders(orders))
      .catch((err) => live && setError(err.message))
    return () => {
      live = false
    }
  }, [user])

  const cancel = async (order) => {
    if (!window.confirm(`Cancel order ${order.code}?`)) return
    setBusy(order.id)
    try {
      const { order: updated } = await api.cancelOrder(order.id)
      setOrders((list) => list.map((o) => (o.id === updated.id ? updated : o)))
      notify(`Order ${order.code} is cancelled.`)
    } catch (err) {
      notify(err.message)
    } finally {
      setBusy(null)
    }
  }

  let body
  if (user === undefined) body = <p className="orders__note">Loading…</p>
  else if (!user)
    body = (
      <div className="empty">
        <p>Log in to see your orders.</p>
        <button className="btn btn--primary" onClick={onLogin}>
          Log in
        </button>
      </div>
    )
  else if (error) body = <p className="form-error">{error}</p>
  else if (!orders) body = <p className="orders__note">Loading your orders…</p>
  else if (!orders.length)
    body = (
      <div className="empty">
        <p>No orders yet. Your first one is a few taps away.</p>
        <Link href="/shop" className="btn btn--primary">
          Start shopping <Icon.Arrow size={18} />
        </Link>
      </div>
    )
  else
    body = (
      <ul className="orders">
        {orders.map((o) => (
          <li key={o.id} className={`order${o.status === 'cancelled' ? ' is-cancelled' : ''}`}>
            <header className="order__head">
              <div>
                <b>{o.code}</b>
                <span>{dateFmt.format(new Date(o.createdAt))}</span>
              </div>
              <span className={`order__status order__status--${o.status}`}>{STATUS[o.status] || o.status}</span>
            </header>
            <ul className="order__items">
              {o.items.map((i) => (
                <li key={i.id}>
                  <span className="order__art" style={i.image ? undefined : { background: i.bg }}>
                    {i.image ? <img src={i.image} alt="" loading="lazy" /> : <ProductArt kind={i.kind} />}
                  </span>
                  <span className="order__name">
                    {i.image ? <Link href={`/product/${i.id}`}>{i.name}</Link> : i.name} <small>× {i.qty}</small>
                  </span>
                  <span>{formatINR(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <footer className="order__foot">
              <p>
                {o.name}, {o.address}, {o.city} {o.pincode}
              </p>
              <div>
                {o.discount > 0 && <small className="order__saved">Saved {formatINR(o.discount)}</small>}
                <strong>{formatINR(o.total)}</strong>
                {o.status === 'placed' && (
                  <button className="link-btn" onClick={() => cancel(o)} disabled={busy === o.id}>
                    {busy === o.id ? 'Cancelling…' : 'Cancel order'}
                  </button>
                )}
              </div>
            </footer>
          </li>
        ))}
      </ul>
    )

  return (
    <section className="shop">
      <div className="section-head">
        <div>
          <p className="kicker">Your account</p>
          <h1 className="page-title">
            My <em>orders</em>
          </h1>
        </div>
      </div>
      {body}
    </section>
  )
}
