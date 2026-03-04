// Encode an SVG string to a data URL
const svg = (markup) =>
  `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(markup)))}`

export const BACKGROUNDS = [
  {
    id: 'navy-dots',
    label: 'Navy',
    preview: '#1a2744',
    patternUrl: svg(`
      <svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
        <rect width="50" height="50" fill="#1a2744"/>
        <circle cx="25" cy="25" r="4.5" fill="rgba(255,255,255,0.45)"/>
      </svg>
    `),
  },
  {
    id: 'cream',
    label: 'Cream',
    solid: '#f5efe2',
    preview: '#f5efe2',
  },
  {
    id: 'red-grid',
    label: 'Plaid',
    patternUrl: svg(`
      <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" fill="#c94b3c"/>
        <rect x="0" y="0" width="16" height="16" fill="rgba(255,255,255,0.08)"/>
        <rect x="16" y="16" width="16" height="16" fill="rgba(255,255,255,0.08)"/>
        <line x1="0" y1="16" x2="32" y2="16" stroke="rgba(255,255,255,0.18)" stroke-width="0.8"/>
        <line x1="16" y1="0" x2="16" y2="32" stroke="rgba(255,255,255,0.18)" stroke-width="0.8"/>
      </svg>
    `),
    preview: '#c94b3c',
  },
  {
    id: 'manila',
    label: 'Manila',
    patternUrl: svg(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#d6ae72"/>
        <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feBlend in="SourceGraphic" mode="multiply" result="blend"/></filter>
        <rect width="100" height="100" filter="url(#n)" opacity="0.12"/>
      </svg>
    `),
    preview: '#d6ae72',
  },
  {
    id: 'dark-slate',
    label: 'Slate',
    patternUrl: svg(`
      <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" fill="#1c1c24"/>
        <line x1="0" y1="40" x2="40" y2="0" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
        <line x1="-20" y1="40" x2="20" y2="0" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
        <line x1="20" y1="40" x2="60" y2="0" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
      </svg>
    `),
    preview: '#1c1c24',
  },
  {
    id: 'blush',
    label: 'Blush',
    patternUrl: svg(`
      <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
        <rect width="60" height="60" fill="#f2d9d0"/>
        <circle cx="0"  cy="0"  r="2" fill="rgba(180,100,90,0.15)"/>
        <circle cx="30" cy="30" r="2" fill="rgba(180,100,90,0.15)"/>
        <circle cx="60" cy="0"  r="2" fill="rgba(180,100,90,0.15)"/>
        <circle cx="0"  cy="60" r="2" fill="rgba(180,100,90,0.15)"/>
        <circle cx="60" cy="60" r="2" fill="rgba(180,100,90,0.15)"/>
      </svg>
    `),
    preview: '#f2d9d0',
  },
]
