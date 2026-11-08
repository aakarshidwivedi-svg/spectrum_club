import { useState } from 'react'
import { Cpu, Palette, Lightbulb, Users, Instagram, Linkedin, Mail, ArrowUpRight } from 'lucide-react'
const COLORS = ['#2aa0b5', '#2f6fc4', '#7b5cb8', '#f0629a', '#ea7b2c', '#6b8f3a']
const P = [[Cpu,'Technology','#2aa0b5'],[Palette,'Creativity','#f0629a'],[Lightbulb,'Innovation','#ea7b2c'],[Users,'Collaboration','#7b5cb8']]
const TAG = 'Different Perspectives. Limitless Impact. '

function Perspectives() {
  const [on, setOn] = useState(0)
  return <div className="panels">{P.map(([I, t, c], i) =>
    <button key={t} className={'panel' + (on === i ? ' on' : '')} style={{ '--c': c }} aria-expanded={on === i}
      onPointerEnter={e => e.pointerType === 'mouse' && setOn(i)} onFocus={() => setOn(i)} onClick={() => setOn(i)}>
      <span className="idx">0{i + 1}</span><I size={30} className="pi"/>
      <h3>{t}</h3><p>[Placeholder] How Spectrum approaches {t.toLowerCase()}.</p>
    </button>)}</div>
}
const Row = ({ k, t }) => <li className="row magnetic-none"><span>{k}</span><b>{t}</b><ArrowUpRight size={20}/></li>

export default function Sections() {
  return <>
    <section id="about" className="sec about">
      <div className="reveal"><p className="eyebrow">About Spectrum</p>
        <h2 className="display sm">One club. Every <span className="grad">perspective</span>.</h2></div>
      <div className="reveal"><p className="lead">[Placeholder] Add Spectrum's official mission, founding story and vision here.</p>
        <div className="band" aria-hidden="true">{COLORS.map(c => <i key={c} style={{ background: c }}/>)}</div></div>
    </section>

    <section id="perspectives" className="sec tint"><div className="reveal"><p className="eyebrow">Our Perspectives</p>
      <h2 className="display sm">Four ways of <span className="grad">seeing</span>.</h2></div><Perspectives/></section>

    <section id="events" className="sec"><div className="reveal"><p className="eyebrow">Events</p><h2 className="display sm">What we gather for.</h2></div>
      <div className="two"><div><h3 className="sub">Upcoming</h3><ul className="rows"><Row k="[Date TBA]" t="[Event name]"/><Row k="[Date TBA]" t="[Event name]"/></ul></div>
        <div><h3 className="sub">Previous</h3><ul className="rows"><Row k="[Date]" t="[Event name]"/><Row k="[Date]" t="[Event name]"/></ul></div></div></section>

    <section id="team" className="sec peach"><div className="reveal"><p className="eyebrow">Our Team</p><h2 className="display sm">The people behind the colour.</h2></div>
      <div className="team">{COLORS.slice(0, 5).map((c, i) => <figure key={c} data-speed={i % 2 ? .25 : .08} style={{ '--c': c }}>
        <div className={'blob b' + i} aria-hidden="true"/><figcaption><b>[Name]</b><span>[Role]</span></figcaption></figure>)}</div></section>

    <section id="gallery" className="sec"><div className="reveal"><p className="eyebrow">Gallery</p><h2 className="display sm">Moments in motion.</h2></div>
      <div className="gal">{[0, 1, 2, 3, 4].map(i => <div key={i} className={'g g' + i} data-speed={[.1, .3, .15, .35, .2][i]} style={{ '--c': COLORS[(i * 2) % 6], '--d': COLORS[(i * 2 + 3) % 6] }}><span>[Photo]</span></div>)}</div></section>

    <section id="join" className="join">
      <div className="marquee" aria-hidden="true"><div>{Array(8).fill(TAG).join('')}</div></div>
      <div className="sec reveal"><h2 className="display">Join <span className="grad">Spectrum</span></h2>
        <p className="lead">[Placeholder] Membership details and form link.</p>
        <a className="btn primary light magnetic" href="#join">Become a member <ArrowUpRight size={18}/></a></div>
    </section>
    <footer className="foot"><span>© Spectrum Club</span><div>
      <a href="#" aria-label="Instagram"><Instagram size={20}/></a><a href="#" aria-label="LinkedIn"><Linkedin size={20}/></a><a href="#" aria-label="Email"><Mail size={20}/></a></div></footer>
  </>
}
