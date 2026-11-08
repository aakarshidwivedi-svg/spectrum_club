import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import logo from '../assets/mascot-badge.png'
const links = [['About','#about'],['Perspectives','#perspectives'],['Events','#events'],['Team','#team'],['Gallery','#gallery']]
export default function Navbar() {
  const [open, setOpen] = useState(false)
  return <header className="nav">
    <a href="#home" className="brand" aria-label="Spectrum Club home"><img src={logo} alt="" width="44" height="44" decoding="async"/><b>SPECTRUM</b></a>
    <nav className={open ? 'open' : ''} aria-label="Primary">
      {links.map(([t,h]) => <a key={t} href={h} onClick={() => setOpen(false)}>{t}</a>)}
      <a className="btn primary sm" href="#join" onClick={() => setOpen(false)}>Join</a>
    </nav>
    <button className="burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
  </header>
}
