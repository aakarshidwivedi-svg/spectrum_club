import { useEffect, useRef } from 'react'
import { reduced } from '../store'

// Canvas dot field: organic drift, pointer repulsion, click shockwaves. Fills its positioned parent.
const COLORS = ['#ffcf1a', '#9aa0b4', '#2aa0b5', '#f0629a']
export default function DotField() {
  const ref = useRef()
  useEffect(() => {
    const cv = ref.current, ctx = cv.getContext('2d'), host = cv.parentElement
    const gap = innerWidth < 768 ? 44 : 34
    let w, h, dots = [], raf, live = true
    const m = { x: -9999, y: -9999 }, ripples = []
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5), r = host.getBoundingClientRect()
      w = r.width; h = r.height; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      dots = []
      for (let y = gap / 2; y < h; y += gap) for (let x = gap / 2; x < w; x += gap) {
        const q = Math.random()
        dots.push({ x, y, c: q < .55 ? 0 : q < .85 ? 1 : q < .95 ? 2 : 3, ph: Math.random() * 6.28 })
      }
    }
    const draw = now => {
      ctx.clearRect(0, 0, w, h)
      for (let i = ripples.length - 1; i >= 0; i--) if (now - ripples[i].t > 1600) ripples.splice(i, 1)
      for (const d of dots) {
        let ox = 0, oy = 0, bump = 0
        if (!reduced) { ox = Math.sin(now * .0006 + d.y * .012 + d.ph) * 3; oy = Math.cos(now * .0005 + d.x * .012 + d.ph) * 3 }
        let dx = d.x - m.x, dy = d.y - m.y, dist = Math.hypot(dx, dy) || 1
        if (dist < 130) { const f = (1 - dist / 130) ** 2; ox += dx / dist * f * 26; oy += dy / dist * f * 26; bump += f * 1.6 }
        for (const r of ripples) {
          const age = (now - r.t) / 1000, rad = age * 520, rx = d.x - r.x, ry = d.y - r.y, rd = Math.hypot(rx, ry) || 1, dl = Math.abs(rd - rad)
          if (dl < 80) { const f = Math.cos(dl / 80 * Math.PI / 2) * (1 - age / 1.6); ox += rx / rd * f * 24; oy += ry / rd * f * 24; bump += f * 2 }
        }
        ctx.globalAlpha = Math.min(.8, .42 + bump * .25); ctx.fillStyle = COLORS[d.c]
        ctx.beginPath(); ctx.arc(d.x + ox, d.y + oy, 1.5 + bump, 0, 6.283); ctx.fill()
      }
    }
    const loop = now => { if (live && !document.hidden) draw(now); raf = requestAnimationFrame(loop) }
    const inside = e => { const r = host.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, ok: e.clientY >= r.top && e.clientY <= r.bottom } }
    const move = e => { const p = inside(e); if (p.ok) { m.x = p.x; m.y = p.y } else m.x = m.y = -9999 }
    const down = e => { const p = inside(e); if (p.ok) { ripples.push({ x: p.x, y: p.y, t: performance.now() }); if (ripples.length > 4) ripples.shift() } }
    const gone = () => { m.x = m.y = -9999 }
    const ro = new ResizeObserver(() => { size(); if (reduced) draw(0) }); ro.observe(host)
    const io = new IntersectionObserver(([en]) => (live = en.isIntersecting)); io.observe(host)
    size()
    if (reduced) draw(0)
    else { raf = requestAnimationFrame(loop); addEventListener('pointermove', move, { passive: true }); addEventListener('pointerdown', down); document.addEventListener('pointerleave', gone) }
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); removeEventListener('pointermove', move); removeEventListener('pointerdown', down); document.removeEventListener('pointerleave', gone) }
  }, [])
  return <canvas ref={ref} className="dotfield" aria-hidden="true" />
}
