import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowLeft, ArrowRight, Pause, Play, X } from 'lucide-react'
import { TEAM } from '../data/team'
import { ICON } from './SocialIcons'
import { reduced } from '../store'
gsap.registerPlugin(ScrollTrigger)

const COLORS = ['#2aa0b5', '#2f6fc4', '#7b5cb8', '#f0629a', '#ea7b2c', '#6b8f3a']
const SPEED = 28 // px/second: deliberately slow
const lerp = (a, b, k) => a + (b - a) * k
const showGroups = new Set(TEAM.map(m => m.group).filter(Boolean)).size > 1 // only group when the data itself has groups
const ITEMS = []; { let last; TEAM.forEach(m => { if (showGroups && m.group !== last) { ITEMS.push({ label: m.group || 'Team', id: 'l' + ITEMS.length }); last = m.group } ITEMS.push(m) }) }
const idx = m => TEAM.indexOf(m)

function Card({ m, hidden, onOpen }) {
  const i = idx(m), intro = m.bio ? (m.bio.length > 96 ? m.bio.slice(0, 93) + '…' : m.bio) : 'View profile'
  return <button type="button" className="tm-card" style={{ '--c': COLORS[i % 6] }} tabIndex={hidden ? -1 : 0} aria-hidden={hidden || undefined}
    aria-label={`${m.name}, ${m.role}. Open profile`} onClick={e => onOpen(m, e.currentTarget)}>
    <span className="tm-photo">
      {m.photo ? <img src={m.photo} alt="" width="250" height="312" loading="lazy" draggable="false" /> : <span className={'tm-ph b' + (i % 5)} aria-hidden="true" />}
      <span className="tm-intro">{intro}</span>
    </span>
    <span className="tm-name">{m.name}</span><span className="tm-role">{m.role}</span>
  </button>
}
const Set_ = ({ hidden, onOpen }) => ITEMS.map(it => it.label ? <span key={it.id} className="tm-label" aria-hidden="true">{it.label}</span> : <Card key={it.id} m={it} hidden={hidden} onOpen={onOpen} />)

export default function Team() {
  const root = useRef(), wrap = useRef(), track = useRef(), set0 = useRef(), closeBtn = useRef(), lastFocus = useRef(), timer = useRef()
  const [paused, setPaused] = useState(reduced), [sel, setSel] = useState(null), [closing, setClosing] = useState(false)
  const st = useRef({ x: 0, v: 0, drag: false, moved: false, hover: false, focus: false, setW: 1, glide: null, id: -1, sx: 0, ax: 0, lx: 0, lt: 0, resumeAt: 0, paused: reduced }).current
  st.paused = paused

  useEffect(() => { // continuous, seamless marquee with drag, inertia and glides; stops when offscreen
    const tr = track.current, box = wrap.current; let raf = 0, last = 0
    const measure = () => { st.setW = set0.current.offsetWidth || 1 }
    const frame = now => {
      const dt = Math.min(.05, (now - last) / 1000); last = now
      if (st.glide) { const g = st.glide, k = Math.min(1, (now - g.t0) / 600); st.x = g.from + (g.to - g.from) * (1 - Math.pow(1 - k, 3)); if (k >= 1) st.glide = null }
      else if (!st.drag) {
        if (st.v) { st.x -= st.v * dt; st.v *= Math.exp(-dt * 3); if (Math.abs(st.v) < 5) st.v = 0 }
        else if (!reduced && !st.paused && !st.hover && !st.focus && now > st.resumeAt) st.x += SPEED * dt
      }
      st.x = ((st.x % st.setW) + st.setW) % st.setW // wraps by exactly one set: no visible jump
      tr.style.transform = `translate3d(${-st.x}px,0,0)`
      raf = requestAnimationFrame(frame)
    }
    const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame) } }, stop = () => { cancelAnimationFrame(raf); raf = 0 }
    measure(); const ro = new ResizeObserver(measure); ro.observe(set0.current)
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())); io.observe(box)
    const down = e => { if (e.button > 0) return; Object.assign(st, { id: e.pointerId, sx: e.clientX, ax: st.x, lx: e.clientX, lt: performance.now(), v: 0, glide: null, moved: false }) }
    const move = e => {
      if (e.pointerId !== st.id) return
      const dx = e.clientX - st.sx
      if (!st.drag) { if (Math.abs(dx) < 6) return; st.drag = true; st.moved = true; box.setPointerCapture(e.pointerId); box.classList.add('grabbing') }
      const n = performance.now(), d = Math.max(.008, (n - st.lt) / 1000)
      st.v = Math.max(-3000, Math.min(3000, lerp(st.v, (e.clientX - st.lx) / d, .4))); st.lx = e.clientX; st.lt = n; st.x = st.ax - dx
    }
    const up = e => {
      if (e.pointerId !== st.id) return; st.id = -1
      if (st.drag) { st.drag = false; box.classList.remove('grabbing'); if (performance.now() - st.lt > 90) st.v = 0; st.resumeAt = performance.now() + 1800; setTimeout(() => (st.moved = false), 0) } // moved flag blocks the click that follows a drag
    }
    const enter = e => e.pointerType === 'mouse' && (st.hover = true), leave = e => e.pointerType === 'mouse' && (st.hover = false)
    const fin = e => { // keyboard focus pauses the motion and brings the focused card to the middle
      st.focus = true; const c = e.target.closest('.tm-card'); if (!c) return
      const r = c.getBoundingClientRect(), w = box.getBoundingClientRect()
      if (r.left < w.left + 20 || r.right > w.right - 20) st.glide = { from: st.x, to: st.x + (r.left - w.left) - (w.width - r.width) / 2, t0: performance.now() }
    }
    const fout = e => { if (!box.contains(e.relatedTarget)) st.focus = false }
    const L = [['pointerdown', down], ['pointermove', move], ['pointerup', up], ['pointercancel', up], ['pointerenter', enter], ['pointerleave', leave], ['focusin', fin], ['focusout', fout]]
    L.forEach(([n, f]) => box.addEventListener(n, f))
    return () => { stop(); ro.disconnect(); io.disconnect(); L.forEach(([n, f]) => box.removeEventListener(n, f)) }
  }, [st])

  useEffect(() => { // staggered entrance
    if (reduced) return
    const ctx = gsap.context(() => gsap.from('.tm-card', { y: 40, scale: .96, opacity: 0, duration: .9, ease: 'power3.out', stagger: { amount: .9 }, scrollTrigger: { trigger: root.current, start: 'top 75%', once: true } }), root)
    return () => ctx.revert()
  }, [])

  const nudge = dir => { const w = set0.current.children[0]?.offsetWidth || 250; st.glide = { from: st.x, to: st.x + dir * (w + 20) * 2, t0: performance.now() }; st.v = 0; st.resumeAt = performance.now() + 2500 }
  const open = useCallback((m, el) => { if (st.moved) return; lastFocus.current = el; setSel(m) }, [st])
  const close = useCallback(() => { setClosing(true); clearTimeout(timer.current); timer.current = setTimeout(() => { setSel(null); setClosing(false); lastFocus.current?.focus() }, 260) }, [])
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => { // modal: focus, Escape, focus trap, scroll lock
    if (!sel) return
    closeBtn.current?.focus(); document.documentElement.style.overflow = 'hidden'
    const key = e => {
      if (e.key === 'Escape') return close()
      if (e.key !== 'Tab') return
      const f = [...document.querySelectorAll('.tm-sheet button, .tm-sheet a')]; if (!f.length) return
      const a = f[0], z = f[f.length - 1]
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() }
    }
    addEventListener('keydown', key); return () => { removeEventListener('keydown', key); document.documentElement.style.overflow = '' }
  }, [sel, close])

  return <section id="team" className="sec peach tm-sec" ref={root}>
    <div className="reveal"><p className="eyebrow">Our Team</p><h2 className="display sm">The people behind the colour.</h2></div>
    <div className="tm" ref={wrap} role="region" aria-label="Team members carousel">
      <div className="tm-track" ref={track}>
        <div className="tm-set" ref={set0}><Set_ onOpen={open} /></div>
        <div className="tm-set" aria-hidden="true"><Set_ hidden onOpen={open} /></div>
        <div className="tm-set" aria-hidden="true"><Set_ hidden onOpen={open} /></div>
      </div>
    </div>
    <div className="tm-ctl">
      <span>Drag, swipe or use the arrows</span>
      <div>
        <button type="button" className="tm-arrow" aria-label="Previous team members" onClick={() => nudge(-1)}><ArrowLeft size={18} /></button>
        <button type="button" className="tm-arrow" aria-label="Next team members" onClick={() => nudge(1)}><ArrowRight size={18} /></button>
        <button type="button" className="tm-arrow" aria-pressed={paused} aria-label={paused ? 'Resume auto-scroll' : 'Pause auto-scroll'} disabled={reduced} onClick={() => setPaused(p => !p)}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>
      </div>
    </div>
    {sel && <div className={'tm-modal' + (closing ? ' out' : '')} role="dialog" aria-modal="true" aria-label={`${sel.name}, profile`} onClick={close}>
      <div className="tm-sheet" onClick={e => e.stopPropagation()} data-lenis-prevent>
        <button ref={closeBtn} type="button" className="tm-x" aria-label="Close profile" onClick={close}><X size={18} /></button>
        <div className="tm-big" style={{ '--c': COLORS[idx(sel) % 6] }}>{sel.photo ? <img src={sel.photo} alt={sel.name} /> : <span className={'tm-ph b' + (idx(sel) % 5)} aria-hidden="true" />}</div>
        <div className="tm-body">
          {sel.group && <p className="eyebrow">{sel.group}</p>}
          <h3>{sel.name}</h3><p className="tm-r">{sel.role}</p>
          <p className="tm-bio">{sel.bio || 'Introduction coming soon.'}</p>
          {sel.socials?.length > 0 && <div className="tm-soc">{sel.socials.map(s => { const I = ICON[s.id]; return I && <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`${sel.name} on ${s.id}`}><I size={18} /></a> })}</div>}
        </div>
      </div>
    </div>}
  </section>
}
