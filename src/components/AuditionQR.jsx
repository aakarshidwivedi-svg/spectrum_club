import { useEffect, useState } from 'react'
// QR is generated in the browser from the exact form URL (library loads on demand, so it never delays first paint).
export default function AuditionQR({ url }) {
  const [src, setSrc] = useState(''), [failed, setFailed] = useState(false)
  useEffect(() => {
    let live = true
    import('qrcode').then(Q => Q.toDataURL(url, { margin: 1, width: 360, errorCorrectionLevel: 'M', color: { dark: '#141a3a', light: '#fffaf1' } }))
      .then(d => live && setSrc(d)).catch(() => live && setFailed(true))
    return () => { live = false }
  }, [url])
  if (failed) return null // the button above remains the primary path
  return <figure className="qr">
    {src ? <img src={src} alt="QR code linking to the SPECTRUM audition registration form" width="180" height="180" /> : <div className="qr-ph" aria-hidden="true" />}
    <figcaption>Scan to Register</figcaption></figure>
}
