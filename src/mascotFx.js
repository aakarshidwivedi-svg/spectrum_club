// Event-driven mascot behaviour shared by the 3D scene and the DOM (no React state per frame)
import { reduced } from './store'
const rnd = (a, b) => a + Math.random() * (b - a), L = (a, b, k) => a + (b - a) * k, pick = a => a[Math.floor(Math.random() * a.length)]
const makeFx = () => ({
  cur: { lx: 0, ly: 0, hop: 0, sq: 0, rz: 0, exc: 0, bright: 0, squint: 0, tilt: 0, wide: 0, blink: 0 },
  kind: '', t0: 0, amp: 1, last: '', hov: 0, pending: '', nextIdle: 0, nextBlink: 0, blinkAt: -9, dbl: 0, lastReact: 0, cool: {}, lis: new Set(),
  say(text, ms = 3200, prio = 1, hint = '') { this.lis.forEach(f => f({ text, ms, prio, hint })) },
  sayCool(key, secs, text, ms, prio, hint) { const n = performance.now() / 1000; if (n < (this.cool[key] || 0)) return; this.cool[key] = n + secs; this.say(text, ms, prio, hint) },
  play(kind, amp = 1) { this.kind = kind; this.t0 = performance.now() / 1000; this.amp = amp },
  release() { if (this.kind === 'thinking' || this.kind === 'listening') this.kind = '' },
  react() { // random click reaction, never the same twice in a row
    const n = performance.now() / 1000; if (n - this.lastReact < .35) return; this.lastReact = n
    const k = pick(['bounce', 'excited', 'tilt', 'wave'].filter(x => x !== this.last)); this.last = k; this.play(k)
  },
  step(dt) {
    const n = performance.now() / 1000, a = n - this.t0, A = this.amp, m = reduced ? 0 : 1, S = Math.sin, E = x => Math.exp(-a * x)
    if (!this.nextBlink) { this.nextBlink = n + 1.5; this.nextIdle = n + 9 }
    const o = { lx: 0, ly: 0, hop: 0, sq: 0, rz: 0, exc: 0, bright: 0, squint: 0, tilt: 0, wide: 0 }
    switch (this.kind) {
      case 'bounce': if (a < 1.1) { const e = E(2); o.hop = Math.abs(S(a * 6.9)) * .4 * e * A * m; o.sq = Math.cos(a * 6.9) * .04 * e * A * m; o.exc = .6 * e * A * m; o.squint = .3 * e * A } else this.kind = ''; break
      case 'excited': if (a < 1.7) { const e = E(1.3); o.hop = Math.abs(S(a * 9.4)) * .3 * e * A * m; o.exc = 2 * e * A * m; o.rz = S(a * 20) * .04 * e * A * m; o.bright = e * A; o.wide = .5 * e * A } else this.kind = ''; break
      case 'tilt': if (a < 1.9) { const e = a < 1.2 ? 1 : Math.exp(-(a - 1.2) * 5); o.tilt = .14 * S(Math.min(a / .35, 1) * 1.571) * e * A * m; o.wide = .5 * e * A } else this.kind = ''; break
      case 'wave': if (a < 1.7) { const e = E(1.5); o.rz = S(a * 11) * .06 * e * A * m; o.tilt = S(a * 5) * .05 * e * A * m; o.exc = 1.2 * e * A * m; o.squint = .3 * e * A } else this.kind = ''; break
      case 'cheer': if (a < 2.6) { const e = E(.8); o.hop = Math.abs(S(a * 10.5)) * .45 * e * m; o.exc = 2.5 * e * m; o.squint = .35 * e; o.rz = S(a * 14) * .04 * e * m; o.bright = .8 * e } else this.kind = ''; break
      case 'thinking': o.tilt = .1 * m; o.lx = .6; o.ly = .5; o.wide = .2; o.rz = S(n * 1.5) * .01 * m; break // holds until released
      case 'listening': o.wide = .7; o.bright = .4; o.tilt = -.04 * m; break
      case 'confused': if (a < 1.8) { const e = E(1.1); o.tilt = S(a * 6) * .12 * e * m; o.rz = S(a * 6 + 1) * .03 * e * m; o.wide = .5 * e; o.ly = .3 * e } else this.kind = ''; break
      case 'happy': if (a < 1.6) { const e = E(1.4); o.hop = Math.abs(S(a * 6)) * .2 * e * m; o.squint = .4 * e; o.exc = e * m; o.bright = .6 * e } else this.kind = ''; break
      case 'greet': if (a < 2.4) { const e = E(.9); o.tilt = S(a * 3) * .08 * e * m; o.rz = S(a * 8) * .05 * e * m; o.hop = Math.abs(S(a * 5)) * .15 * e * m; o.exc = e * m; o.squint = .3 * e } else this.kind = ''; break
    }
    if (!this.kind && !reduced && n > this.nextIdle) { this.nextIdle = n + rnd(7, 14); this.play(Math.random() < .6 ? 'tilt' : 'wave', .5) } // small idle gestures
    o.bright += this.hov; o.wide += this.hov * .5; o.tilt += this.hov * .05 * m // curious on hover
    const k = 1 - Math.exp(-dt * 14), c = this.cur
    for (const key in o) c[key] = L(c[key], o[key], k) // blend between reactions, no snapping
    if (!reduced) { // varied blink intervals, occasional double blink
      if (n > this.nextBlink) { this.blinkAt = n; this.nextBlink = n + rnd(2.2, 5.5); if (Math.random() < .22) this.dbl = n + .26 }
      if (this.dbl && n > this.dbl) { this.blinkAt = n; this.dbl = 0 }
    }
    const ba = n - this.blinkAt; c.blink = !reduced && ba < .16 ? 1 - Math.abs(ba / .08 - 1) : 0
  },
})
export const fx = makeFx()   // hero mascot
export const bot = makeFx()  // floating assistant
