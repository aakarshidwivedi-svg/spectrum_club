import { useRef, useEffect, useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sparkles, Environment, PerformanceMonitor, useTexture, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { scene, botScene, reduced } from '../store'
import { fx, bot } from '../mascotFx'
import charUrl from '../assets/spectrum-character.png'

const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = THREE.MathUtils.lerp

// Image character: the user's own render on a subdivided mesh. Tail, crest/horns/ears, wing and head are
// displaced by per-region weights (image-pixel coordinates) so they move independently of the body.
const VS = `
uniform float uT,uSw,uExc,uTilt; uniform vec2 uP; varying vec2 vUv;
float inv(float a,float b,float x){return 1.-smoothstep(a,b,x);}
void main(){
 vUv=uv; vec3 p=position; vec2 px=vec2(uv.x*1024.,(1.-uv.y)*1024.);
 float dt_=clamp(length(px-vec2(300.,650.))/340.,0.,1.);
 float tailW=pow(dt_,1.6)*inv(290.,350.,px.x)*smoothstep(300.,380.,px.y);
 float hairW=pow(inv(70.,300.,px.y),2.)*smoothstep(270.,330.,px.x)*inv(720.,780.,px.x);
 float wingW=smoothstep(600.,650.,px.x)*smoothstep(350.,390.,px.y)*inv(470.,510.,px.y);
 float ph=uT*1.9-dt_*3.;
 p.x+=(sin(ph)*.35+cos(uT*.9-dt_*2.)*.1-uSw*.5-uP.x*.15)*tailW*.55*(1.+uExc);
 p.y+=(sin(ph*.8+1.)*.12+uP.y*.05)*tailW*.4*(1.+uExc);
 float hp=uT*1.5-(1.-inv(70.,300.,px.y))*2.5;
 p.x+=(sin(hp)*.06-uSw*.15-uP.x*.04)*hairW*(1.+uExc*.7); p.y+=cos(hp*1.3)*.03*hairW;
 p.y+=sin(uT*3.+px.x*.01)*.05*wingW; p.x+=sin(uT*2.4)*.03*wingW;
 p.y+=sin(uT*1.8)*.015*inv(300.,900.,px.y);
 float headW=inv(380.,450.,px.y)*smoothstep(260.,330.,px.x)*inv(730.,790.,px.x);
 vec2 pv=vec2((440./1024.-.5)*6.6,(.5-420./1024.)*6.6);
 float a=(uP.x*.05+sin(uT*.8)*.015+uTilt)*headW; vec2 d=p.xy-pv;
 p.xy=pv+vec2(cos(a)*d.x-sin(a)*d.y,sin(a)*d.x+cos(a)*d.y);
 vec2 c=(uv-vec2(.5,.45))*2.; p.z=max(0.,1.-dot(c,c))*.5-tailW*.5+headW*.35-wingW*.2;
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}`
const FS = `
uniform sampler2D map; uniform vec2 uLook; uniform float uBlink,uBright; varying vec2 vUv;
void main(){
 vec2 uv=vUv; vec2 e=(uv-vec2(545./1024.,1.-352./1024.))*1024.;
 uv-=uLook*(1.-smoothstep(8.,34.,length(e)))*.0065;           // pupils drift toward the pointer
 vec4 c=texture2D(map,uv);
 vec2 q=(vUv-vec2(535./1024.,1.-346./1024.))*1024.;
 float inEye=1.-smoothstep(.85,1.,length(q/vec2(52.,30.)));
 float lid=smoothstep(0.,3.,q.y-(30.-60.*uBlink))*inEye*step(.01,uBlink); // eyelid sweeps down to blink
 c.rgb=mix(c.rgb,vec3(.17,.52,.62),lid);
 c.rgb*=1.+uBright*.35*inEye; // brighter eyes when curious
 gl_FragColor=c;
 #include <colorspace_fragment>
}`

function ImageChar({ S = scene, F = fx }) {
  const tex = useTexture(charUrl), m = useRef(), pt = useRef({ x: 0, y: 0, gw: 0, ps: 0 }).current
  useMemo(() => { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8 }, [tex])
  const mask = useMemo(() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.drawImage(tex.image, 0, 0, 256, 256); return x.getImageData(0, 0, 256, 256).data }, [tex])
  const hit = e => !!e.uv && mask[(Math.floor((1 - e.uv.y) * 255) * 256 + Math.floor(e.uv.x * 255)) * 4 + 3] > 170 // only the character, not empty corners
  const uni = useMemo(() => ({ map: { value: tex }, uT: { value: 0 }, uSw: { value: 0 }, uP: { value: new THREE.Vector2() }, uLook: { value: new THREE.Vector2() }, uBlink: { value: 0 }, uExc: { value: 0 }, uTilt: { value: 0 }, uBright: { value: 0 } }), [tex])
  useEffect(() => { if (F === fx) document.querySelector('.stage')?.classList.add('gl-ready') }, [F])
  useFrame((s, d) => {
    const dt = Math.min(d, .05), k = 1 - Math.exp(-dt * 6), t = reduced ? 0 : s.clock.elapsedTime, has = Math.abs(S.px) < 5
    pt.gw = lerp(pt.gw, S.gt, k)
    const sv = clamp(((S.scroll - pt.ps) / Math.max(dt, .001)) * .4, -.5, .5); pt.ps = S.scroll // glance down while scrolling away
    pt.x = lerp(pt.x, lerp(has ? clamp(S.px, -1, 1) : 0, S.gx, pt.gw * .7), k)
    pt.y = lerp(pt.y, lerp(has ? clamp(S.py, -1, 1) : 0, S.gy, pt.gw * .7) - sv, k)
    const c = F.cur, u = m.current.uniforms
    u.uT.value = t; u.uSw.value = S.sw; u.uP.value.set(pt.x, pt.y); u.uLook.value.set(pt.x + c.lx, pt.y + c.ly)
    u.uBlink.value = Math.max(c.blink, c.squint); u.uExc.value = c.exc; u.uTilt.value = c.tilt; u.uBright.value = c.bright + c.wide * .5
  })
  return <mesh
    onPointerMove={e => { F.hov = hit(e) ? 1 : 0 }}
    onPointerOut={() => (F.hov = 0)}
    onClick={e => { if (e.delta > 6 || !hit(e)) return; F.react() }}> {/* e.delta > 6: it was a drag, not a click */}
    <planeGeometry args={[6.6, 6.6, 64, 64]} />
    <shaderMaterial ref={m} uniforms={uni} vertexShader={VS} fragmentShader={FS} transparent toneMapped={false} depthWrite={false} side={THREE.DoubleSide} /></mesh>
}

// Real model path: used automatically when /models/spectrum.glb exists. Plays its clips and adds spring bones.
function GLBChar() {
  const { scene: model, animations } = useGLTF('/models/spectrum.glb')
  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model])
  const fit = useMemo(() => { const b = new THREE.Box3().setFromObject(model), z = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3()); return { s: 5.6 / z.y, c } }, [model])
  const bones = useMemo(() => { const a = []; model.traverse(o => { if (o.isBone && /tail|hair|crest|horn|ear/i.test(o.name)) a.push({ o, bz: o.rotation.z, bx: o.rotation.x, x: 0, z: 0, vx: 0, vz: 0, i: a.length }) }); return a }, [model])
  useEffect(() => { animations.forEach(a => mixer.clipAction(a).play()); return () => mixer.stopAllAction() }, [animations, mixer])
  useFrame((s, d) => {
    const dt = Math.min(d, .05), t = reduced ? 0 : s.clock.elapsedTime; mixer.update(dt)
    const py = Math.abs(scene.py) < 5 ? scene.py : 0, anim = animations.length > 0
    bones.forEach(b => { // damped springs chasing a sway target; body turning (scene.sw) drags them behind
      b.vz += (30 * (Math.sin(t * 1.6 - b.i * .5) * .12 * (1 + fx.cur.exc) - scene.sw * .05 - b.z) - 5 * b.vz) * dt; b.z += b.vz * dt
      b.vx += (30 * (py * .04 + Math.cos(t * 1.2 - b.i * .5) * .05 - b.x) - 5 * b.vx) * dt; b.x += b.vx * dt
      b.o.rotation.z = (anim ? b.o.rotation.z : b.bz) + b.z; b.o.rotation.x = (anim ? b.o.rotation.x : b.bx) + b.x
    })
  })
  return <group scale={fit.s}><primitive object={model} position={fit.c.clone().multiplyScalar(-1)} /></group>
}

// Drag rotation with inertia, idle motion, ctrl/pinch zoom, double-click reset. The image mesh is limited
// to a front-facing arc; a real GLB gets full 360 degrees.
function Rig({ full, mini, S = scene, F = fx, children }) {
  const gl = useThree(x => x.gl), g = useRef()
  const s = useRef({ yaw: 0, pit: 0, vy: 0, vp: 0, drag: false, lx: 0, lt: 0, idle: performance.now() + 2000, zoom: 1, zt: 1, ret: false, pinch: 0, prev: 0, ptrs: new Map() }).current
  const YL = full ? 1e9 : .7, PL = full ? .6 : .25
  useEffect(() => {
    const el = gl.domElement, K = .006
    el.style.touchAction = 'pan-y' // vertical swipes keep scrolling the page on touch
    const dist = () => { const p = [...s.ptrs.values()]; return Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]) }
    const down = e => { el.setPointerCapture(e.pointerId); s.ptrs.set(e.pointerId, [e.clientX, e.clientY]); s.drag = true; s.ret = false; s.lx = e.clientX; s.ly = e.clientY; s.lt = performance.now(); if (s.ptrs.size === 2) s.pinch = dist() }
    const move = e => {
      if (!s.ptrs.has(e.pointerId)) return
      s.ptrs.set(e.pointerId, [e.clientX, e.clientY])
      if (s.ptrs.size === 2) { const d = dist(); if (s.pinch) s.zt = clamp(s.zt * d / s.pinch, .8, 1.3); s.pinch = d; return }
      const now = performance.now(), dt = Math.max(.008, (now - s.lt) / 1000), dx = e.clientX - s.lx, dy = e.clientY - s.ly
      s.lx = e.clientX; s.ly = e.clientY; s.lt = now; s.idle = now + 1800
      s.yaw = clamp(s.yaw + dx * K, -YL, YL); s.pit = clamp(s.pit + dy * K, -PL, PL)
      s.vy = lerp(s.vy, clamp(dx * K / dt, -10, 10), .4); s.vp = lerp(s.vp, clamp(dy * K / dt, -6, 6), .4)
    }
    const up = e => { if (performance.now() - s.lt > 90) s.vy = s.vp = 0; s.ptrs.delete(e.pointerId); s.pinch = 0; if (!s.ptrs.size) { s.drag = false; s.idle = performance.now() + 1800 } }
    const wheel = e => { if (!e.ctrlKey) return; e.preventDefault(); s.zt = clamp(s.zt * Math.exp(-e.deltaY * .0025), .8, 1.3) }
    const dbl = () => { s.ret = true; s.zt = 1; s.vy = s.vp = 0 }
    const track = e => { const r = el.getBoundingClientRect(); S.px = ((e.clientX - r.left) / r.width) * 2 - 1; S.py = -(((e.clientY - r.top) / r.height) * 2 - 1) }
    const on = (n, f, o) => !mini && el.addEventListener(n, f, o) // the floating assistant is not drag-rotatable
    on('pointerdown', down); on('pointermove', move); on('pointerup', up); on('pointercancel', up); on('wheel', wheel, { passive: false }); on('dblclick', dbl)
    on('pointerenter', () => (S.ch = 1)); on('pointerleave', () => (S.ch = 0)); addEventListener('pointermove', track, { passive: true })
    return () => { el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); el.removeEventListener('wheel', wheel); el.removeEventListener('dblclick', dbl); removeEventListener('pointermove', track) }
  }, [gl, s, YL, PL])
  useFrame((st, d) => {
    const dt = Math.min(d, .05), now = performance.now(), t = reduced ? 0 : st.clock.elapsedTime
    if (S.reset) { s.ret = true; s.zt = 1; s.vy = s.vp = 0; S.reset = false }
    if (s.ret) { if (full) s.yaw -= Math.round(s.yaw / (2 * Math.PI)) * 2 * Math.PI; s.yaw *= Math.exp(-dt * 5); s.pit *= Math.exp(-dt * 5); if (Math.abs(s.yaw) + Math.abs(s.pit) < .003) { s.yaw = s.pit = 0; s.ret = false } }
    else if (!s.drag) {
      const dc = Math.exp(-dt * 3); s.vy *= dc; s.vp *= dc
      s.yaw = clamp(s.yaw + s.vy * dt, -YL, YL); s.pit = clamp(s.pit + s.vp * dt, -PL, PL)
      if (!reduced && now > s.idle) { // idle motion pauses while interacting
        if (full) s.yaw += .15 * dt; else s.yaw += (Math.sin(t * .4) * .25 - s.yaw) * (1 - Math.exp(-dt * .8))
        s.pit *= Math.exp(-dt * .5)
      }
    }
    const asp = st.size.width / st.size.height, k = 1 - Math.exp(-dt * 6)
    s.zoom += (s.zt - s.zoom) * k
    F.step(dt); g.current.rotation.set(s.pit, s.yaw, F.cur.rz)
    g.current.position.y = Math.sin(t * 1.3) * .12 + S.scroll * 2 + F.cur.hop
    g.current.scale.setScalar(Math.min(1, asp * .98) * s.zoom * (1 - S.scroll * .25)); g.current.scale.y *= 1 + F.cur.sq
    S.sw = lerp(S.sw, clamp((s.yaw - s.prev) / Math.max(dt, .001), -6, 6), .25); s.prev = s.yaw // body-turn velocity drives secondary motion
  })
  return <group ref={g}>{children}</group>
}

export default function Hero3D({ lowPower }) {
  const [dpr, setDpr] = useState(lowPower ? 1.25 : 1.75), [vis, setVis] = useState(true), [glb, setGlb] = useState(false)
  useEffect(() => { const el = document.querySelector('.stage'); if (!el) return; const io = new IntersectionObserver(([e]) => { setVis(e.isIntersecting); if (e.isIntersecting && fx.pending) { const k = fx.pending; fx.pending = ''; setTimeout(() => fx.play(k), 400) } }); io.observe(el); return () => io.disconnect() }, [])
  useEffect(() => { // dev servers answer missing files with index.html, so check the content type too
    fetch('/models/spectrum.glb', { method: 'HEAD' }).then(r => setGlb(r.ok && !(r.headers.get('content-type') || '').includes('text/html'))).catch(() => {})
  }, [])
  return <Canvas frameloop={vis ? 'always' : 'never'} dpr={dpr} camera={{ position: [0, 0, 9], fov: 40 }} gl={{ antialias: !lowPower, alpha: true, powerPreference: 'high-performance' }}>
    <PerformanceMonitor onDecline={() => setDpr(1)} />
    {glb && <><ambientLight intensity={.8} /><directionalLight position={[4, 5, 4]} intensity={2} /><Environment preset="city" /></>}
    <Rig full={glb}>{glb ? <GLBChar /> : <ImageChar />}</Rig>
    <Sparkles count={lowPower ? 15 : 40} scale={9} size={3} speed={reduced ? 0 : .4} color="#2f6fc4" />
  </Canvas>
}

// Small floating view of the same character for the assistant (own expression state, no drag, no scroll lift)
export function MiniMascot({ lowPower }) {
  return <Canvas dpr={[1, lowPower ? 1.25 : 1.5]} camera={{ position: [0, 0, 9], fov: 40 }} gl={{ antialias: !lowPower, alpha: true }} style={{ pointerEvents: 'none' }}>
    <Rig mini S={botScene} F={bot}><ImageChar S={botScene} F={bot} /></Rig>
  </Canvas>
}
