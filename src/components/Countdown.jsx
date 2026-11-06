import { useEffect, useState } from 'react'

export default function Countdown({ target }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const diff = Math.max(0, target - now)
  const parts = [
    ['Days', Math.floor(diff / 86_400_000)],
    ['Hrs', Math.floor(diff / 3_600_000) % 24],
    ['Min', Math.floor(diff / 60_000) % 60],
    ['Sec', Math.floor(diff / 1000) % 60],
  ]

  return (
    <div className="countdown" role="timer">
      {parts.map(([label, value]) => (
        <div key={label} className="countdown__cell">
          <span>{String(value).padStart(2, '0')}</span>
          <small>{label}</small>
        </div>
      ))}
    </div>
  )
}
