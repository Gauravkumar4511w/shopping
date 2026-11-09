import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icons'

// Product photos: swipe or tap the thumbnails to change, hover to zoom, tap to open full screen.
export default function Gallery({ images, name, credits }) {
  const [index, setIndex] = useState(0)
  const [full, setFull] = useState(false)
  const [zoom, setZoom] = useState(null) // { x, y } in % while hovering with a mouse
  const track = useRef(null)
  const count = images.length

  const go = useCallback(
    (i) => {
      const next = (i + count) % count
      setIndex(next)
      const el = track.current
      if (el) el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
    },
    [count],
  )

  // Keep the dots and thumbnails in step when the shopper swipes the photo strip.
  const onScroll = () => {
    const el = track.current
    if (!el) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i !== index) setIndex(i)
  }

  const onKey = (e) => {
    if (e.key === 'ArrowRight') go(index + 1)
    if (e.key === 'ArrowLeft') go(index - 1)
  }

  return (
    <div className="gallery">
      {count > 1 && (
        <div className="gallery__thumbs" role="tablist" aria-label="Product photos">
          {images.map((src, i) => (
            <button
              key={src}
              role="tab"
              aria-selected={i === index}
              aria-label={`Photo ${i + 1} of ${count}`}
              className={`gallery__thumb${i === index ? ' is-active' : ''}`}
              onClick={() => go(i)}
              onMouseEnter={() => go(i)}
            >
              <img src={src} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}

      <div className="gallery__stage" tabIndex={0} onKeyDown={onKey} aria-roledescription="carousel" aria-label={`${name} photos`}>
        <div className="gallery__track" ref={track} onScroll={onScroll}>
          {images.map((src, i) => (
            <button
              key={src}
              className="gallery__slide"
              onClick={() => {
                setZoom(null)
                setFull(true)
              }}
              onMouseMove={(e) => {
                if (e.nativeEvent.pointerType === 'touch') return
                const r = e.currentTarget.getBoundingClientRect()
                setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
              }}
              onMouseLeave={() => setZoom(null)}
              aria-label={`Open photo ${i + 1} full screen`}
              tabIndex={-1}
            >
              <img
                src={src}
                alt={`${name}, photo ${i + 1}`}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                style={zoom && i === index ? { transform: 'scale(2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
              />
            </button>
          ))}
        </div>
        {count > 1 && (
          <>
            <button className="gallery__nav gallery__nav--prev" onClick={() => go(index - 1)} aria-label="Previous photo">
              <Icon.Arrow size={18} style={{ rotate: '180deg' }} />
            </button>
            <button className="gallery__nav gallery__nav--next" onClick={() => go(index + 1)} aria-label="Next photo">
              <Icon.Arrow size={18} />
            </button>
            <div className="gallery__dots" aria-hidden="true">
              {images.map((src, i) => (
                <span key={src} className={i === index ? 'is-active' : undefined} />
              ))}
            </div>
          </>
        )}
        <span className="gallery__hint" aria-hidden="true">
          Tap to zoom
        </span>
      </div>

      {credits?.[index] && (
        <p className="gallery__credit">
          Photo: {credits[index].author} ·{' '}
          <a href={credits[index].source} target="_blank" rel="noreferrer">
            {credits[index].license}
          </a>
        </p>
      )}

      {full && <Lightbox images={images} name={name} start={index} onClose={(i) => (setFull(false), go(i))} />}
    </div>
  )
}

function Lightbox({ images, name, start, onClose }) {
  const [i, setI] = useState(start)
  const count = images.length
  const touch = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose(i)
      if (e.key === 'ArrowRight') setI((v) => (v + 1) % count)
      if (e.key === 'ArrowLeft') setI((v) => (v - 1 + count) % count)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [count, i, onClose])

  // Rendered on <body> so the sticky gallery's stacking context can't trap it under the header.
  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${name} photos`}>
      <button className="lightbox__close icon-btn" onClick={() => onClose(i)} aria-label="Close photos">
        <Icon.Close />
      </button>
      <div
        className="lightbox__stage"
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - (touch.current ?? 0)
          if (Math.abs(dx) > 40) setI((v) => (v + (dx < 0 ? 1 : -1) + count) % count)
        }}
      >
        <img key={images[i]} src={images[i]} alt={`${name}, photo ${i + 1}`} />
        {count > 1 && (
          <>
            <button className="gallery__nav gallery__nav--prev" onClick={() => setI((i - 1 + count) % count)} aria-label="Previous photo">
              <Icon.Arrow size={20} style={{ rotate: '180deg' }} />
            </button>
            <button className="gallery__nav gallery__nav--next" onClick={() => setI((i + 1) % count)} aria-label="Next photo">
              <Icon.Arrow size={20} />
            </button>
          </>
        )}
      </div>
      <div className="lightbox__thumbs">
        {images.map((src, n) => (
          <button key={src} className={`gallery__thumb${n === i ? ' is-active' : ''}`} onClick={() => setI(n)} aria-label={`Photo ${n + 1}`}>
            <img src={src} alt="" />
          </button>
        ))}
      </div>
      <p className="lightbox__count">
        {i + 1} / {count}
      </p>
    </div>,
    document.body,
  )
}
