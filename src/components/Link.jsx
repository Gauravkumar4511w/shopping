import { navigate } from '../lib/router'

// <Link href="/shop?c=Home">: same-site links switch pages without a reload.
export default function Link({ href, onClick, ...props }) {
  const handle = (e) => {
    onClick?.(e)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    navigate(href)
  }
  return <a href={href} onClick={handle} {...props} />
}
