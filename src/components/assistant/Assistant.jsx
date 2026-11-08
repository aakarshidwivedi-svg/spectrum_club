import { lazy, Suspense, useCallback, useRef, useState } from 'react'
import { bot } from '../../mascotFx'
import { hasWebGL } from '../../store'
import charImg from '../../assets/spectrum-character.png'
const Mini = lazy(() => import('../Hero3D').then(m => ({ default: m.MiniMascot })))
const Chat = lazy(() => import('./ChatPanel'))

export default function Assistant() {
  const [open, setOpen] = useState(false), [gl] = useState(() => hasWebGL()), btn = useRef(), clicks = useRef([])
  const lowPower = innerWidth < 768 || (navigator.hardwareConcurrency || 8) <= 4
  const close = useCallback(() => { setOpen(false); bot.chatOpen = false; btn.current?.focus() }, [])
  const toggle = () => {
    const n = performance.now(); clicks.current = clicks.current.filter(t => n - t < 1500).concat(n)
    if (clicks.current.length >= 4) { // hidden Easter egg: four quick clicks
      clicks.current = []; setOpen(false); bot.chatOpen = false; bot.play('cheer'); bot.say('You found a secret! Spectrum loves curious minds ✦', 4200, 4); return
    }
    const next = !open; setOpen(next); bot.chatOpen = next; if (next) bot.play('happy')
  }
  return <div className={'buddy' + (open ? ' open' : '')}>
    <button ref={btn} type="button" className="buddy-3d" aria-label={open ? 'Close Ask Spectrum chat' : 'Open Ask Spectrum chat'} aria-expanded={open} aria-controls="ask-spectrum"
      onClick={toggle} onPointerEnter={() => { bot.hov = 1; if (!open) bot.sayCool('hover', 30, 'Want to explore with me?', 3000, 1, 'Click to ask me anything') }} onPointerLeave={() => (bot.hov = 0)}>
      {gl ? <Suspense fallback={null}><Mini lowPower={lowPower} /></Suspense> : <img src={charImg} alt="" />}
    </button>
    {open && <Suspense fallback={<div className="chat chat-loading" role="status">Loading…</div>}><Chat onClose={close} /></Suspense>}
  </div>
}
