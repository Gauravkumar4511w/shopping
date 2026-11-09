import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icons'

export default function AccountMenu({ user, onLogin, onSignup, onLogout, onOpenBag, onShowSaved, onShowOrders }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Still checking the session: keep the space so the header doesn't jump.
  if (user === undefined) return <span className="account-skeleton" aria-hidden="true" />

  if (!user) {
    return (
      <div className="auth-links">
        <button className="link-btn" onClick={onLogin}>
          Log in
        </button>
        <button className="login-btn" onClick={onSignup}>
          <Icon.User size={18} />
          <span>Sign up</span>
        </button>
      </div>
    )
  }

  const first = user.name.split(' ')[0]
  const pick = (fn) => () => {
    setOpen(false)
    fn()
  }

  return (
    <div className="account" ref={ref}>
      <button className="account__btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu">
        <span className="account__avatar">{first[0].toUpperCase()}</span>
        <span className="account__name">{first}</span>
      </button>
      {open && (
        <div className="account__menu" role="menu">
          <div className="account__who">
            <b>{user.name}</b>
            <span>{user.email}</span>
          </div>
          <button role="menuitem" onClick={pick(onShowOrders)}>
            <Icon.Box size={18} /> My orders
          </button>
          <button role="menuitem" onClick={pick(onOpenBag)}>
            <Icon.Bag size={18} /> My bag
          </button>
          <button role="menuitem" onClick={pick(onShowSaved)}>
            <Icon.Heart size={18} /> Saved pieces
          </button>
          <button role="menuitem" className="danger" onClick={pick(onLogout)}>
            <Icon.Logout size={18} /> Log out
          </button>
        </div>
      )}
    </div>
  )
}
