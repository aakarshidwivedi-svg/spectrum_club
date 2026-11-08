import { useEffect } from 'react'
import { bot } from '../mascotFx'
import { scene } from '../store'
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const SEC = { events: ['Ready for something exciting?', ''], gallery: ["Look what we've been creating!", ''], join: ['Come be part of our story!', 'cheer'] }
const TIPS = ['Want to know what Spectrum is about?', 'Curious about our upcoming events?', "Come explore what we've been building!", 'Ready to become part of Spectrum?']
export default function useMascotEvents() {
  useEffect(() => {
    const timers = []; let seen = false
    try { seen = localStorage.getItem('spectrum-buddy-seen') === '1' } catch {}
    if (!seen) { // first visit only; returning visitors are not interrupted
      timers.push(setTimeout(() => { bot.play('greet'); bot.say('Hey there! Welcome to Spectrum!', 4200, 3) }, 1600))
      timers.push(setTimeout(() => bot.say("I'm your Spectrum buddy. Need help exploring?", 6000, 3, 'Click me to ask anything'), 6400))
      try { localStorage.setItem('spectrum-buddy-seen', '1') } catch {}
    }
    let i = 0; const iv = setInterval(() => { if (!document.hidden && !bot.chatOpen) bot.say(TIPS[i++ % TIPS.length], 4200, 1) }, 50000)
    const done = new Set()
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting || done.has(e.target.id)) return; done.add(e.target.id)
      const [msg, anim] = SEC[e.target.id]; bot.say(msg, 3200, 2); if (anim) bot.play(anim)
    }), { threshold: .35 })
    Object.keys(SEC).forEach(id => { const el = document.getElementById(id); el && io.observe(el) })
    const over = e => { // hero mascot glances at hovered primary buttons
      const b = e.target.closest && e.target.closest('.hero .btn, .nav .btn, .join .btn'), s = document.querySelector('.stage')
      if (b && s) { const r = s.getBoundingClientRect(), q = b.getBoundingClientRect(); scene.gx = clamp(((q.left + q.width / 2 - r.left) / r.width) * 2 - 1, -1, 1); scene.gy = clamp(-(((q.top + q.height / 2 - r.top) / r.height) * 2 - 1), -1, 1); scene.gt = 1 } else scene.gt = 0
    }
    const leave = () => { scene.px = scene.py = 9; scene.gt = 0 }
    document.addEventListener('pointerover', over, { passive: true }); document.documentElement.addEventListener('mouseleave', leave)
    return () => { timers.forEach(clearTimeout); clearInterval(iv); io.disconnect(); document.removeEventListener('pointerover', over); document.documentElement.removeEventListener('mouseleave', leave) }
  }, [])
}
