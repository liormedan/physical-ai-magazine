// Generated line graphics in the "ink & circuit" language: inline SVG that
// inherits the page colours (currentColor = ink, var(--acc) = copper,
// var(--cc) = the article's category colour). No raster images.

// deterministic PRNG so the same issue date always draws the same cover
function rng(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353), h = (h << 13) | (h >>> 19);
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}
const f = (n) => Math.round(n * 10) / 10;

// Cover: a technical drawing of an abstract articulated arm — joints, reach
// arcs, dimension ticks — laid over a faint grid. 800x200 viewBox.
export function coverSvg(issue) {
  const r = rng(issue.date + (issue.items[0]?.category ?? ''));
  const W = 800, H = 200;
  const n = 4 + Math.floor(r() * 2); // 4-5 joints
  const pts = [];
  let x = 80 + r() * 60, y = 160 + r() * 10;
  pts.push([x, y]);
  // first link points steeply up, each next link bends 20-70 degrees from the
  // previous direction so the arm reads as articulated rather than flat
  let dir = (-100 + r() * 40) * Math.PI / 180;
  for (let i = 1; i < n; i++) {
    const len = i === 1 ? 70 + r() * 40 : 80 + r() * 90;
    if (i > 1) dir += (20 + r() * 50) * Math.PI / 180 * (r() < 0.75 ? 1 : -1);
    // try the chosen bend, then mirrored ones, until the link stays inside the
    // frame instead of being squashed against an edge onto the previous joint
    let nx, ny;
    for (const d of [dir, -dir, dir + Math.PI / 2, 0]) {
      nx = Math.max(40, Math.min(W - 60, x + Math.cos(d) * len));
      ny = Math.max(28, Math.min(H - 30, y + Math.sin(d) * len));
      if (Math.hypot(nx - x, ny - y) > len * 0.7) { dir = d; break; }
    }
    x = nx; y = ny;
    pts.push([x, y]);
  }
  const [bx, by] = pts[0];
  const reach = Math.hypot(pts[n - 1][0] - bx, pts[n - 1][1] - by);
  const grid = [];
  for (let gx = 0; gx <= W; gx += 40) grid.push(`M${gx} 0V${H}`);
  for (let gy = 0; gy <= H; gy += 40) grid.push(`M0 ${gy}H${W}`);
  const joints = pts.map(([px, py], i) =>
    i === 0
      ? `<path d="M${f(px - 14)} ${f(py + 10)}h28M${f(px - 8)} ${f(py + 10)}l-5 8M${f(px)} ${f(py + 10)}l-5 8M${f(px + 8)} ${f(py + 10)}l-5 8" stroke="currentColor"/><circle cx="${f(px)}" cy="${f(py)}" r="7" fill="var(--paper)" stroke="currentColor"/><circle cx="${f(px)}" cy="${f(py)}" r="2" fill="var(--acc)" stroke="none"/>`
      : i === n - 1
        ? `<circle cx="${f(px)}" cy="${f(py)}" r="4" fill="var(--acc)" stroke="none"/><path d="M${f(px - 9)} ${f(py - 9)}l18 18M${f(px + 9)} ${f(py - 9)}l-18 18" stroke="var(--acc)" opacity=".7"/>`
        : `<circle cx="${f(px)}" cy="${f(py)}" r="5" fill="var(--paper)" stroke="currentColor"/><circle cx="${f(px)}" cy="${f(py)}" r="1.5" fill="currentColor" stroke="none"/>`
  ).join('');
  const arcs = [0.55, 1].map((k) => {
    const rr = reach * k;
    return `<path d="M${f(bx - rr)} ${f(by)}A${f(rr)} ${f(rr)} 0 0 1 ${f(bx + rr)} ${f(by)}" stroke="var(--acc)" stroke-dasharray="${k === 1 ? '2 5' : '1 4'}" opacity=".55"/>`;
  }).join('');
  // dimension line under the base to the end effector
  const ex = pts[n - 1][0];
  const dim = `<path d="M${f(bx)} ${H - 6}H${f(ex)}M${f(bx)} ${H - 10}v8M${f(ex)} ${H - 10}v8" stroke="currentColor" opacity=".5"/>`;
  const marks = Array.from({ length: 3 }, () => { const mx = 40 + r() * (W - 80), my = 20 + r() * 60; return `<path d="M${f(mx - 5)} ${f(my)}h10M${f(mx)} ${f(my - 5)}v10" stroke="currentColor" opacity=".35"/>`; }).join('');
  return `<svg class="cover" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" fill="none" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
<path d="${grid.join('')}" stroke="currentColor" opacity=".07"/>
${arcs}${dim}${marks}
<polyline points="${pts.map(([px, py]) => `${f(px)},${f(py)}`).join(' ')}" stroke="currentColor" stroke-width="1.6"/>
${joints}</svg>`;
}

// Category icons: 28x28, one stroke weight, drawn in the category colour.
const ICONS = {
  robotics: '<path d="M5 24h10M10 24V15l7-6 6 3"/><circle cx="10" cy="15" r="2.2"/><circle cx="17" cy="9" r="2.2"/><path d="M23 12l3-2M23 12l1 3.5"/>',
  humanoids: '<circle cx="14" cy="6.5" r="3"/><path d="M7 14h14M14 14v8M9.5 25l4.5-3 4.5 3M11 14v5M17 14v5"/>',
  models: '<circle cx="6" cy="14" r="2.4"/><circle cx="16" cy="6" r="2.4"/><circle cx="16" cy="22" r="2.4"/><circle cx="24" cy="14" r="2.4"/><path d="M8 13l6-6M8 15l6 6M18 7l4.5 5M18 21l4.5-5"/>',
  autonomy: '<circle cx="14" cy="14" r="3"/><circle cx="5" cy="5" r="2.2"/><circle cx="23" cy="5" r="2.2"/><circle cx="5" cy="23" r="2.2"/><circle cx="23" cy="23" r="2.2"/><path d="M7 7l5 5M21 7l-5 5M7 21l5-5M21 21l-5-5"/>',
  hardware: '<rect x="8" y="8" width="12" height="12" rx="1.5"/><rect x="11.5" y="11.5" width="5" height="5"/><path d="M11 8V4M14 8V4M17 8V4M11 24v-4M14 24v-4M17 24v-4M8 11H4M8 14H4M8 17H4M24 11h-4M24 14h-4M24 17h-4"/>',
  industry: '<path d="M4 24V12l6 4v-4l6 4v-4l8 5v7zM4 24h20"/><path d="M8 24v-4M14 24v-4M20 24v-4"/><path d="M18 11V5h3v6"/>',
  research: '<path d="M11 4h6M12 4v7l-6 10a2 2 0 0 0 1.7 3h12.6a2 2 0 0 0 1.7-3l-6-10V4"/><path d="M9 18h10"/>',
};
export function catIcon(category) {
  return `<svg class="ci" viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="var(--cc)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${ICONS[category] ?? ''}</svg>`;
}
