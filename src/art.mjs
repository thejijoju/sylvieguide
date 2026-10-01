// Inline SVG artwork: an engraving-style view of the château, a portrait
// medallion placeholder, ornaments and line icons. Inline SVG keeps the
// pages fast (no image requests) and crisp on every screen. Colours come
// from CSS classes so the art follows the site palette.

const range = (n) => Array.from({ length: n }, (_, i) => i);

function windows(xs, y, w, h) {
  return xs
    .map(
      (x) => `<g class="win"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1"/>` +
        `<line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}"/>` +
        `<line x1="${x}" y1="${y + h * 0.42}" x2="${x + w}" y2="${y + h * 0.42}"/>` +
        `<path class="win-cap" d="M${x - 3} ${y - 4}h${w + 6}"/></g>`,
    )
    .join("");
}

// Main façade: a five-bay central body with a pedimented avant-corps,
// flanking wings, a hipped slate roof with dormers, the Alps behind and the
// charmilles (clipped hornbeam walks) on either side.
export function chateauSvg({ title, className = "", cover = false }) {
  const groundY = 372;
  const leftWing = [150, 196, 242];
  const rightWing = [530, 576, 622];
  const centre = [316, 362, 408, 454];
  const dormers = [170, 230, 300, 470, 540, 600];
  const trees = (x0, dir) =>
    range(5)
      .map((i) => {
        const x = x0 + dir * i * 22;
        const r = 26 - i * 1.5;
        return `<ellipse cx="${x}" cy="${groundY - 34 - i * 2}" rx="${r}" ry="${r + 10}"/>`;
      })
      .join("");

  return `<svg class="chateau ${className}" viewBox="0 0 800 460"${cover ? ' preserveAspectRatio="xMidYMid slice"' : ""} role="img" aria-labelledby="chateau-title" xmlns="http://www.w3.org/2000/svg">
  <title id="chateau-title">${title}</title>
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" class="sky-top"/><stop offset="1" class="sky-bottom"/>
    </linearGradient>
    <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="6" class="hatch-line"/>
    </pattern>
  </defs>
  <rect width="800" height="460" fill="url(#sky)"/>
  <circle cx="640" cy="92" r="38" class="sun"/>
  <path class="alps" d="M0 290 L70 240 L120 262 L190 196 L250 248 L320 210 L380 238 L450 170 L505 214 L560 188 L640 236 L700 206 L800 252 V372 H0Z"/>
  <path class="alps-snow" d="M190 196 L172 214 L186 210 L198 218 L208 206Z M450 170 L428 194 L444 188 L456 198 L470 186Z M560 188 L546 202 L560 199 L572 204Z"/>
  <g class="trees">${trees(92, -1)}${trees(708, 1)}</g>
  <g class="building">
    <!-- roofs -->
    <path class="roof" d="M136 214 L176 168 H624 L664 214Z"/>
    <path class="roof-hatch" d="M136 214 L176 168 H624 L664 214Z" fill="url(#hatch)"/>
    <rect class="chimney" x="214" y="146" width="14" height="26"/>
    <rect class="chimney" x="572" y="146" width="14" height="26"/>
    ${dormers.map((x) => `<g class="dormer"><path d="M${x} 210 V186 L${x + 12} 176 L${x + 24} 186 V210Z"/><rect x="${x + 6}" y="188" width="12" height="16"/></g>`).join("")}
    <!-- walls -->
    <rect class="wall" x="136" y="214" width="528" height="${groundY - 214}"/>
    <rect class="wall-avant" x="298" y="200" width="204" height="${groundY - 200}"/>
    <path class="pediment" d="M290 202 L400 142 L510 202Z"/>
    <path class="pediment-inner" d="M314 196 L400 154 L486 196Z"/>
    <circle class="oculus" cx="400" cy="180" r="8"/>
    <line class="cornice" x1="132" y1="214" x2="668" y2="214"/>
    <line class="cornice" x1="136" y1="290" x2="664" y2="290"/>
    <line class="plinth" x1="132" y1="${groundY - 8}" x2="668" y2="${groundY - 8}"/>
    ${range(5).map((i) => `<line class="quoin" x1="${298 + (i % 2) * 204}" y1="${222 + i * 28}" x2="${298 + (i % 2) * 204 + (i % 2 ? -10 : 10)}" y2="${222 + i * 28}"/>`).join("")}
    ${windows([...leftWing, ...centre, ...rightWing], 230, 26, 46)}
    ${windows([...leftWing, ...rightWing], 304, 26, 52)}
    ${windows([316, 454], 304, 26, 52)}
    <!-- entrance -->
    <path class="door" d="M374 ${groundY - 8} V318 Q400 296 426 318 V${groundY - 8}Z"/>
    <line class="win" x1="400" y1="304" x2="400" y2="${groundY - 8}"/>
    <path class="steps" d="M352 ${groundY - 8} H448 L456 ${groundY} H344Z"/>
  </g>
  <!-- garden: lawn, path and clipped hedges -->
  <path class="lawn" d="M0 ${groundY} H800 V460 H0Z"/>
  <path class="path" d="M344 ${groundY} L456 ${groundY} L560 460 L240 460Z"/>
  <g class="hedges">
    <rect x="70" y="${groundY + 18}" width="180" height="16" rx="8"/>
    <rect x="550" y="${groundY + 18}" width="180" height="16" rx="8"/>
    <rect x="40" y="${groundY + 52}" width="200" height="18" rx="9"/>
    <rect x="560" y="${groundY + 52}" width="200" height="18" rx="9"/>
  </g>
  <g class="urns">
    <path d="M300 ${groundY + 4} h14 l-3 10 h-8z"/><path d="M486 ${groundY + 4} h14 l-3 10 h-8z"/>
  </g>
</svg>`;
}

// Placeholder portrait (4:5). Replace with a real
// photo of Sylvie (see README).
export function portraitSvg(label) {
  return `<svg class="portrait-art" viewBox="0 0 320 400" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">
  <rect class="portrait-bg" width="320" height="400"/>
  <path class="portrait-figure" d="M160 112 a52 56 0 1 1 0.1 0Z M48 400 C52 300 100 262 160 262 C220 262 268 300 272 400Z"/>
  <text class="portrait-initial" x="160" y="186" text-anchor="middle">S</text>
</svg>`;
}

export const ornament = `<span class="rule" aria-hidden="true"></span>`;

export const quill = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 3c-6 1-11 6-13 13l-2 5"/><path d="M20 3c0 6-4 11-10 12"/><path d="M9.5 11.5 14 9"/></svg>`;

const icons = {
  key: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v2"/>',
  quill: '<path d="M20 3c-6 1-11 6-13 13l-2 5"/><path d="M20 3c0 6-4 11-10 12"/><path d="M9.5 11.5 14 9"/>',
  columns: '<path d="M3 9h18L12 4Z"/><path d="M5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 20h18"/>',
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2Z"/><path d="M9 4v14M15 6v14"/>',
  book: '<path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1Z"/><path d="M12 6v14"/>',
  candle: '<path d="M9 10h6v10H9z"/><path d="M12 3c2 2 2 4 0 5-2-1-2-3 0-5Z"/><path d="M6 20h12"/>',
  leaf: '<path d="M5 19C5 10 11 5 20 4c-1 9-6 15-15 15Z"/><path d="M5 19 14 10"/>',
  handshake: '<path d="M2 12l4-4 4 2 3-2 4 1 5 3"/><path d="M6 8v6l5 5 2-1 2 1 3-3"/><path d="M10 14l2 2M12 12l3 3"/>',
  bench: '<path d="M4 10h16M5 10V7h14v3M4 14h16M6 14v5M18 14v5"/>',
  pupil: '<path d="M2 9l10-5 10 5-10 5Z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/><path d="M22 9v6"/>',
  pin: '<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  car: '<path d="M4 16V12l2-5h12l2 5v4Z"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/><path d="M4 12h16"/>',
  bus: '<rect x="5" y="3" width="14" height="15" rx="2"/><path d="M5 11h14M8 21v-3M16 21v-3"/>',
  plane: '<path d="M2 14l20-8-6 14-3-6Z"/><path d="M13 14 22 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  access: '<circle cx="12" cy="4.5" r="1.5"/><path d="M12 7v6h5l2 6M12 10h5"/><path d="M9 11a5 5 0 1 0 6 8"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  phone: '<path d="M5 3h4l2 5-3 2a11 11 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2Z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 3-6 6-6s6 2 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c3 0 5 2 5 5"/>',
  check: '<path d="m5 12 4 4 10-10"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
};

export function icon(name, cls = "icon") {
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icons[name] || ""}</svg>`;
}

export const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1f2a44"/><circle cx="32" cy="32" r="24" fill="none" stroke="#b8955a" stroke-width="2"/><text x="32" y="44" text-anchor="middle" font-family="Georgia, serif" font-size="34" font-style="italic" fill="#f6efe0">S</text></svg>`;
