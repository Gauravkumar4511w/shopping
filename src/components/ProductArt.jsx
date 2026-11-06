// Flat "sticker" illustrations drawn in SVG, so the shop needs no photos.
const INK = '#1c1a17'
const CREAM = '#f4ede1'
const line = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' }

function Tote() {
  return (
    <g>
      <path d="M72 78 C72 34 128 34 128 78" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" />
      <path d="M48 76 H152 L162 168 H38 Z" fill="#d8572a" {...line} />
      <path d="M53 98 H147" stroke={CREAM} strokeWidth="3" strokeDasharray="6 6" />
      <path d="M46 150 H154" stroke={CREAM} strokeWidth="3" strokeDasharray="6 6" />
      <circle cx="100" cy="124" r="16" fill="#f2a93b" {...line} />
      <circle cx="100" cy="124" r="6" fill={INK} />
    </g>
  )
}

function Mug() {
  return (
    <g>
      <path d="M84 60 c-8 -10 8 -16 0 -26" fill="none" {...line} />
      <path d="M106 60 c-8 -10 8 -16 0 -26" fill="none" {...line} />
      <path d="M136 92 c30 0 30 46 0 46" fill="none" stroke={INK} strokeWidth="13" />
      <path d="M136 92 c30 0 30 46 0 46" fill="none" stroke={CREAM} strokeWidth="6" />
      <rect x="58" y="72" width="80" height="94" rx="12" fill={CREAM} {...line} />
      <rect x="58" y="98" width="80" height="18" fill="#2f6f6a" {...line} />
      <circle cx="98" cy="141" r="6" fill="#d8572a" />
    </g>
  )
}

function Lamp() {
  return (
    <g>
      <path d="M62 110 L36 168 H164 L138 110 Z" fill="#fff3c4" opacity="0.22" />
      <rect x="96" y="112" width="8" height="48" fill={CREAM} stroke={INK} strokeWidth="2" />
      <path d="M46 106 A54 54 0 0 1 154 106 Z" fill="#e0901f" {...line} />
      <path d="M68 92 A36 36 0 0 1 96 64" stroke="#f9d38a" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="100" cy="110" r="11" fill="#fff3c4" {...line} />
      <ellipse cx="100" cy="164" rx="38" ry="9" fill="#b5651d" {...line} />
    </g>
  )
}

function Sneaker() {
  return (
    <g>
      <path d="M28 142 H172 Q180 142 178 152 Q176 160 168 160 H34 Q24 160 24 151 Q24 142 28 142 Z" fill={CREAM} {...line} />
      <path
        d="M32 142 C30 118 46 104 70 104 L104 84 C116 78 128 82 134 94 L160 118 C170 124 174 134 172 142 Z"
        fill="#7b5cc4"
        {...line}
      />
      <path d="M58 134 C90 124 120 116 152 124" fill="none" stroke="#f2a93b" strokeWidth="7" strokeLinecap="round" />
      <path d="M100 98 L114 106 M108 92 L122 100 M116 87 L129 95" {...line} stroke={CREAM} />
    </g>
  )
}

function Headphones() {
  return (
    <g>
      <path d="M50 122 C50 52 150 52 150 122" fill="none" stroke={INK} strokeWidth="13" strokeLinecap="round" />
      <path d="M50 122 C50 52 150 52 150 122" fill="none" stroke="#d8572a" strokeWidth="6" strokeLinecap="round" />
      <rect x="62" y="114" width="12" height="42" rx="6" fill={INK} />
      <rect x="126" y="114" width="12" height="42" rx="6" fill={INK} />
      <rect x="32" y="106" width="36" height="58" rx="15" fill="#2f6f6a" {...line} />
      <rect x="132" y="106" width="36" height="58" rx="15" fill="#2f6f6a" {...line} />
      <circle cx="50" cy="135" r="6" fill="#f2a93b" />
      <circle cx="150" cy="135" r="6" fill="#f2a93b" />
    </g>
  )
}

function Plant() {
  return (
    <g>
      <ellipse cx="68" cy="102" rx="8" ry="22" transform="rotate(-62 68 102)" fill="#78b07a" {...line} />
      <ellipse cx="132" cy="102" rx="8" ry="22" transform="rotate(62 132 102)" fill="#78b07a" {...line} />
      <ellipse cx="80" cy="82" rx="11" ry="30" transform="rotate(-32 80 82)" fill="#5a9a63" {...line} />
      <ellipse cx="120" cy="82" rx="11" ry="30" transform="rotate(32 120 82)" fill="#5a9a63" {...line} />
      <ellipse cx="100" cy="68" rx="13" ry="36" fill="#3f7d4e" {...line} />
      <path d="M64 124 H136 L128 170 H72 Z" fill="#d8572a" {...line} />
      <rect x="58" y="114" width="84" height="16" rx="4" fill="#c2481f" {...line} />
      <path d="M78 150 l7 -8 l7 8 l7 -8 l7 8 l7 -8 l7 8" fill="none" stroke={CREAM} strokeWidth="3" strokeLinejoin="round" />
    </g>
  )
}

function Watch() {
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6
    const r1 = i % 3 === 0 ? 24 : 27
    return (
      <line
        key={i}
        x1={100 + Math.sin(a) * r1}
        y1={100 - Math.cos(a) * r1}
        x2={100 + Math.sin(a) * 32}
        y2={100 - Math.cos(a) * 32}
        stroke={INK}
        strokeWidth={i % 3 === 0 ? 3 : 1.5}
        strokeLinecap="round"
      />
    )
  })
  return (
    <g>
      <rect x="82" y="24" width="36" height="152" rx="10" fill="#8a5a3b" {...line} />
      <circle cx="100" cy="152" r="2.5" fill={INK} />
      <circle cx="100" cy="162" r="2.5" fill={INK} />
      <rect x="138" y="93" width="9" height="14" rx="2" fill={INK} />
      <circle cx="100" cy="100" r="40" fill={CREAM} {...line} />
      {ticks}
      <line x1="100" y1="100" x2="100" y2="76" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <line x1="100" y1="100" x2="117" y2="108" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <line x1="100" y1="100" x2="88" y2="122" stroke="#d8572a" strokeWidth="2" strokeLinecap="round" />
      <circle cx="100" cy="100" r="4" fill={INK} />
    </g>
  )
}

function Shades() {
  return (
    <g>
      <path d="M36 96 L20 90 M164 96 L180 90" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <path d="M90 102 Q100 90 110 102" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <rect x="34" y="84" width="58" height="46" rx="21" fill="#2a2633" stroke={INK} strokeWidth="5" />
      <rect x="108" y="84" width="58" height="46" rx="21" fill="#2a2633" stroke={INK} strokeWidth="5" />
      <path d="M38 118 Q63 98 88 112 L88 118 Q80 128 63 128 Q44 128 38 118 Z" fill="#d8572a" opacity="0.75" />
      <path d="M112 118 Q137 98 162 112 L162 118 Q154 128 137 128 Q118 128 112 118 Z" fill="#d8572a" opacity="0.75" />
      <path d="M48 98 L60 92 M122 98 L134 92" stroke="#f3c6b8" strokeWidth="4" strokeLinecap="round" />
    </g>
  )
}

function Candle() {
  return (
    <g>
      <path d="M100 40 C111 55 113 66 100 73 C87 66 89 55 100 40 Z" fill="#f2a93b" {...line} />
      <path d="M100 54 C105 61 105 66 100 69 C95 66 95 61 100 54 Z" fill="#fff3c4" />
      <line x1="100" y1="73" x2="100" y2="84" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <rect x="62" y="80" width="76" height="88" rx="14" fill="#c9b8e8" {...line} />
      <path d="M64 96 Q100 104 136 96" fill="none" stroke={INK} strokeWidth="2" />
      <rect x="74" y="114" width="52" height="34" rx="5" fill={CREAM} {...line} />
      <text
        x="100"
        y="135"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        letterSpacing="1.5"
        fill={INK}
        fontFamily="Space Grotesk, sans-serif"
      >
        RAIN
      </text>
    </g>
  )
}

function Diya() {
  return (
    <g>
      <path d="M100 56 C113 73 115 86 100 95 C85 86 87 73 100 56 Z" fill="#f2a93b" {...line} />
      <path d="M100 71 C106 79 106 86 100 90 C94 86 94 79 100 71 Z" fill="#fff3c4" />
      <line x1="100" y1="95" x2="100" y2="106" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <rect x="82" y="156" width="36" height="12" rx="3" fill="#a86c1f" {...line} />
      <path d="M40 112 H160 C156 146 130 162 100 162 C70 162 44 146 40 112 Z" fill="#c8862a" {...line} />
      <ellipse cx="100" cy="112" rx="60" ry="10" fill="#e8b45a" {...line} />
      <circle cx="72" cy="134" r="4.5" fill="#d8572a" />
      <circle cx="100" cy="140" r="4.5" fill="#d8572a" />
      <circle cx="128" cy="134" r="4.5" fill="#d8572a" />
    </g>
  )
}

const ART = {
  diya: Diya,
  tote: Tote,
  mug: Mug,
  lamp: Lamp,
  sneaker: Sneaker,
  headphones: Headphones,
  plant: Plant,
  watch: Watch,
  shades: Shades,
  candle: Candle,
}

export default function ProductArt({ kind, className }) {
  const Art = ART[kind] ?? Tote
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true">
      <ellipse cx="100" cy="178" rx="62" ry="6" fill={INK} opacity="0.14" />
      <Art />
    </svg>
  )
}
