'use client'

import { useEffect, useRef } from 'react'

type Planet = { name: string; color: string; radius: number; angle: number; speed: number; size: number; phase: number; ring?: boolean }
type Dot = { x: number; y: number; size: number; alpha: number; color: string; phase: number; arm: number }

const planets: Planet[] = [
  { name: 'Python', color: '#FFCD50', radius: 78, angle: 0.2, speed: 0.34, size: 8, phase: 0.2 },
  { name: 'Oracle DB', color: '#FF695A', radius: 102, angle: 2.7, speed: 0.29, size: 9, phase: 0.9 },
  { name: 'MongoDB', color: '#3FD682', radius: 126, angle: 4.4, speed: 0.25, size: 9, phase: 1.5 },
  { name: 'Machine Learning', color: '#8A8FFF', radius: 150, angle: 1.3, speed: 0.21, size: 10, phase: 2.1 },
  { name: 'Deep Learning', color: '#BE82FF', radius: 174, angle: 5.3, speed: 0.18, size: 11, phase: 2.8, ring: true },
  { name: 'Mathematics', color: '#5EC8FF', radius: 222, angle: 3.2, speed: 0.14, size: 10, phase: 3.4 },
  { name: 'Cloud Computing', color: '#AFD4FF', radius: 246, angle: 0.8, speed: 0.115, size: 10, phase: 4.1 },
  { name: 'Prompt Engineering', color: '#FF8CC8', radius: 270, angle: 4.1, speed: 0.095, size: 9, phase: 4.8 },
  { name: 'Networking', color: '#3CDCD2', radius: 294, angle: 2.0, speed: 0.08, size: 10, phase: 5.4 },
]

const hash = (seed: number) => { const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return value - Math.floor(value) }
const hexRgb = (hex: string) => { const n = Number.parseInt(hex.slice(1), 16); return `${n >> 16}, ${n >> 8 & 255}, ${n & 255}` }

export default function GalaxySystem() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const touch = window.matchMedia('(pointer: coarse)').matches
    let width = 0; let height = 0; let dpr = 1; let frame = 0; let time = 0; let pointer: { x: number; y: number } | null = null
    let stars: Dot[] = []; let galaxy: Dot[] = []; let asteroids: Dot[] = []

    const resize = () => {
      const bounds = canvas.getBoundingClientRect(); width = bounds.width; height = bounds.height; dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); context.setTransform(dpr, 0, 0, dpr, 0, 0)
      const mobile = width < 640; const factor = mobile ? 0.55 : 1
      stars = Array.from({ length: Math.round(140 * factor) }, (_, i) => ({ x: hash(i * 2.3), y: hash(i * 4.7), size: 0.35 + hash(i * 3.1) * 1.25, alpha: 0.15 + hash(i * 5.2) * 0.5, color: '#FFFFFF', phase: hash(i * 7), arm: 0 }))
      galaxy = Array.from({ length: Math.round(3400 * factor) }, (_, i) => {
        const arm = i % 3
        const radius = Math.pow(hash(i * 1.7), 0.62) * 0.98
        const angle = arm * Math.PI * 2 / 3 + radius * 3.7 + (hash(i * 5.4) - 0.5) * (0.35 + radius * 0.7)
        return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * 0.52, size: 0.35 + hash(i * 2.8) * 1.15 * (1 - radius * 0.25), alpha: (0.1 + hash(i * 6.2) * 0.35) * (1 - radius * 0.3), color: arm === 0 ? '#FFFFFF' : arm === 1 ? '#F4F7FF' : '#EAF0FF', phase: hash(i * 8.1), arm: arm }
      })
      asteroids = Array.from({ length: Math.round(500 * factor) }, (_, i) => { const angle = hash(i * 3.9) * Math.PI * 2; const radius = 193 + (hash(i * 6.7) - 0.5) * 13; return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * 0.5, size: 0.3 + hash(i * 9.1) * 0.75, alpha: 0.18 + hash(i * 2.1) * 0.35, color: '#FFFFFF', phase: hash(i * 4.2), arm: 0 } })
    }
    let resizeTimer: ReturnType<typeof setTimeout> | undefined
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 100) }
    const onPointerMove = (event: PointerEvent) => { const rect = canvas.getBoundingClientRect(); pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top } }
    const onPointerLeave = () => { pointer = null }
    resize(); window.addEventListener('resize', onResize); if (!touch) { canvas.addEventListener('pointermove', onPointerMove); canvas.addEventListener('pointerleave', onPointerLeave) }

    const drawDots = (dots: Dot[], cx: number, cy: number, scale: number, rotation: number, boostCursor = false) => {
      for (const dot of dots) { const x = cx + (dot.x * Math.cos(rotation) - dot.y * Math.sin(rotation)) * scale; const y = cy + (dot.x * Math.sin(rotation) + dot.y * Math.cos(rotation)) * scale; let alpha = dot.alpha; if (!reducedMotion) alpha *= 0.72 + Math.sin(time * 0.0018 + dot.phase * 8) * 0.28; if (boostCursor && pointer && Math.hypot(pointer.x - x, pointer.y - y) < 90) alpha *= 1.55; context.fillStyle = dot.color; context.globalAlpha = Math.min(alpha, 0.8); context.beginPath(); context.arc(x, y, dot.size, 0, Math.PI * 2); context.fill() }
    }
    const drawStars = () => {
      for (const star of stars) {
        let alpha = star.alpha
        if (!reducedMotion) alpha *= 0.72 + Math.sin(time * 0.0018 + star.phase * 8) * 0.28
        context.fillStyle = star.color; context.globalAlpha = alpha; context.beginPath(); context.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2); context.fill()
      }
    }
    const draw = () => {
      time = reducedMotion ? 0 : performance.now(); context.clearRect(0, 0, width, height); context.globalCompositeOperation = 'lighter'; const cx = width / 2; const cy = height / 2; const scale = Math.min(width / 640, height / 720) * 0.97; const galaxyRotation = reducedMotion ? 0 : time * 0.000018; drawStars(); drawDots(galaxy, cx, cy, scale * 300, galaxyRotation, true); drawDots(asteroids, cx, cy, scale, reducedMotion ? 0 : time * 0.00005)
      const orbitRotation = -0.22; const orbit = (radius: number, active = false) => { context.strokeStyle = active ? 'rgba(255, 255, 255, .58)' : 'rgba(255, 255, 255, .22)'; context.lineWidth = active ? 1.2 : 0.65; context.setLineDash([1.5, 5]); context.beginPath(); context.ellipse(cx, cy, radius * scale, radius * scale * 0.5, orbitRotation, 0, Math.PI * 2); context.stroke(); context.setLineDash([]) }
      planets.forEach((planet, index) => { const angle = planet.angle + (reducedMotion ? 0 : time * 0.001 * planet.speed); const x = cx + Math.cos(angle) * planet.radius * scale; const y = cy + Math.sin(angle) * planet.radius * scale * 0.5; const hovered = !touch && pointer && Math.hypot(pointer.x - x, pointer.y - y) < 40; orbit(planet.radius, !!hovered); if (Math.sin(angle) < 0) drawPlanet(planet, x, y, scale, !!hovered, index) })
      drawSun(cx, cy, scale)
      planets.forEach((planet, index) => { const angle = planet.angle + (reducedMotion ? 0 : time * 0.001 * planet.speed); const x = cx + Math.cos(angle) * planet.radius * scale; const y = cy + Math.sin(angle) * planet.radius * scale * 0.5; if (Math.sin(angle) >= 0) drawPlanet(planet, x, y, scale, !touch && !!pointer && Math.hypot(pointer.x - x, pointer.y - y) < 40, index) })
      context.globalCompositeOperation = 'source-over'; if (!reducedMotion) frame = requestAnimationFrame(draw)
    }
    const drawSun = (cx: number, cy: number, scale: number) => { const glow = context.createRadialGradient(cx, cy, 4 * scale, cx, cy, 70 * scale); glow.addColorStop(0, 'rgba(255, 190, 100, .3)'); glow.addColorStop(1, 'rgba(255, 160, 70, 0)'); context.fillStyle = glow; context.globalAlpha = 1; context.beginPath(); context.arc(cx, cy, 70 * scale, 0, Math.PI * 2); context.fill(); for (let i = 0; i < 1700; i++) { const u = hash(i * 1.31); const v = hash(i * 3.17); const z = 1 - 2 * u; const ring = Math.sqrt(Math.max(0, 1 - z * z)); const a = v * Math.PI * 2 + (reducedMotion ? 0 : time * 0.00014); const px = cx + Math.cos(a) * ring * 27 * scale; const py = cy + z * 27 * scale; context.fillStyle = i % 3 ? '#FFD084' : '#FFF0C2'; context.globalAlpha = 0.22 + hash(i * 7.2) * 0.7; context.beginPath(); context.arc(px, py, (0.35 + hash(i * 2.4) * 0.85) * scale, 0, Math.PI * 2); context.fill() } }
    const drawPlanet = (planet: Planet, x: number, y: number, scale: number, hovered: boolean, index: number) => { const size = planet.size * scale * (hovered ? 1.25 : 1); const glow = context.createRadialGradient(x, y, 0, x, y, size * 4); glow.addColorStop(0, `rgba(${hexRgb(planet.color)}, .3)`); glow.addColorStop(1, `rgba(${hexRgb(planet.color)}, 0)`); context.fillStyle = glow; context.globalAlpha = 1; context.beginPath(); context.arc(x, y, size * 4, 0, Math.PI * 2); context.fill(); context.fillStyle = planet.color; for (let i = 0; i < 38; i++) { const a = hash(i * 2.1 + index) * Math.PI * 2; const r = Math.sqrt(hash(i * 4.8 + index)) * size; context.globalAlpha = 0.35 + hash(i * 3.2) * 0.6; context.beginPath(); context.arc(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.86, Math.max(0.45, size * 0.16), 0, Math.PI * 2); context.fill() } if (planet.ring) { context.strokeStyle = planet.color; context.globalAlpha = 0.7; context.lineWidth = 0.7 * scale; context.beginPath(); context.ellipse(x, y, size * 1.9, size * 0.55, -0.15, 0, Math.PI * 2); context.stroke() } context.globalAlpha = hovered ? 1 : 0.72; context.font = `600 ${Math.max(10.5, 12.5 * scale)}px Inter, sans-serif`; context.textAlign = 'center'; context.fillStyle = hovered ? '#FFFFFF' : '#C8D4E6'; context.fillText(planet.name, x, y + size + 17 * scale) }
    draw(); return () => { cancelAnimationFrame(frame); clearTimeout(resizeTimer); window.removeEventListener('resize', onResize); canvas.removeEventListener('pointermove', onPointerMove); canvas.removeEventListener('pointerleave', onPointerLeave) }
  }, [])

  return <div role="img" aria-label="A solar system where each planet is a subject, orbiting a glowing sun inside a spiral galaxy" className="relative mx-auto h-[440px] w-full max-w-[640px] touch-pan-y overflow-hidden lg:h-[min(90svh,760px)]"><canvas ref={canvasRef} className="absolute inset-0 size-full" /></div>
}
