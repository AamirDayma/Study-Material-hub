'use client'

import { useEffect, useRef } from 'react'

type Particle = {
  x: number
  y: number
  homeX: number
  homeY: number
  vx: number
  vy: number
  size: number
  alpha: number
  phase: number
  color: string
}

type SymbolDot = {
  x: number
  y: number
  size: number
  alpha: number
  phase: number
}

type FloatingSymbol = {
  dots: SymbolDot[]
  x: number
  y: number
  phase: number
}

const CAP_WIDTH = 640
const CAP_HEIGHT = 460
const CAP_BOUNDS = { left: 72, top: 64, right: 592, bottom: 372 }
const SYMBOLS = [
  { glyph: '∞', x: 0.16, y: 0.23 },
  { glyph: 'π', x: 0.81, y: 0.2 },
  { glyph: 'Σ', x: 0.12, y: 0.62 },
  { glyph: 'A+', x: 0.88, y: 0.61 },
  { glyph: '{ }', x: 0.29, y: 0.84 },
  { glyph: '√', x: 0.74, y: 0.84 },
]

function createRandom(seed: number) {
  let state = seed >>> 0

  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function createCapSamples() {
  const mask = document.createElement('canvas')
  mask.width = CAP_WIDTH
  mask.height = CAP_HEIGHT
  const context = mask.getContext('2d')
  if (!context) return []

  context.fillStyle = '#fff'
  context.beginPath()
  context.moveTo(226, 203)
  context.quadraticCurveTo(320, 237, 414, 203)
  context.lineTo(402, 310)
  context.quadraticCurveTo(320, 356, 238, 310)
  context.closePath()
  context.fill()

  context.beginPath()
  context.moveTo(320, 72)
  context.lineTo(566, 176)
  context.lineTo(320, 282)
  context.lineTo(74, 176)
  context.closePath()
  context.fill()

  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.strokeStyle = '#fff'
  context.lineWidth = 9
  context.beginPath()
  context.moveTo(557, 179)
  context.bezierCurveTo(569, 223, 547, 254, 565, 300)
  context.stroke()

  context.lineWidth = 7
  context.beginPath()
  context.moveTo(552, 299)
  context.lineTo(579, 299)
  context.moveTo(556, 301)
  context.lineTo(554, 328)
  context.moveTo(563, 301)
  context.lineTo(563, 334)
  context.moveTo(570, 301)
  context.lineTo(573, 328)
  context.stroke()

  const { data } = context.getImageData(0, 0, CAP_WIDTH, CAP_HEIGHT)
  const samples: Array<{ x: number; y: number }> = []

  for (let y = CAP_BOUNDS.top; y < CAP_BOUNDS.bottom; y += 1) {
    for (let x = CAP_BOUNDS.left; x < CAP_BOUNDS.right; x += 1) {
      if (data[(y * CAP_WIDTH + x) * 4 + 3] > 150) samples.push({ x, y })
    }
  }

  return samples
}

function createSymbolDots(glyph: string, seed: number) {
  const mask = document.createElement('canvas')
  mask.width = 220
  mask.height = 120
  const context = mask.getContext('2d')
  if (!context) return []

  context.clearRect(0, 0, mask.width, mask.height)
  context.fillStyle = '#fff'
  context.font = '500 68px Inter, ui-sans-serif, system-ui, sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(glyph, mask.width / 2, mask.height / 2)

  const { data } = context.getImageData(0, 0, mask.width, mask.height)
  const random = createRandom(seed)
  const dots: SymbolDot[] = []

  for (let y = 8; y < mask.height - 8; y += 3) {
    for (let x = 8; x < mask.width - 8; x += 3) {
      const alpha = data[(y * mask.width + x) * 4 + 3]
      if (alpha > 130) {
        dots.push({
          x: x - mask.width / 2,
          y: y - mask.height / 2,
          size: 0.68 + random() * 0.72,
          alpha: 0.56 + random() * 0.36,
          phase: random() * Math.PI * 2,
        })
      }
    }
  }

  return dots
}

export default function ParticleShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
    const canInteract = !isTouchDevice
    const capSamples = createCapSamples()
    const floatingSymbols: FloatingSymbol[] = SYMBOLS.map((symbol, index) => ({
      ...symbol,
      phase: index * 0.91,
      dots: createSymbolDots(symbol.glyph, 1200 + index * 83),
    }))
    const pointer = { x: 0, y: 0, active: false }
    let width = 0
    let height = 0
    let particles: Particle[] = []
    let pixelRatio = 1
    let reducedMotion = motionPreference.matches
    let animationFrame = 0
    let resizeTimer = 0
    let lastFrame = 0

    const drawFrame = (timestamp: number) => {
      if (!width || !height) return
      const time = timestamp / 1000
      const step = lastFrame ? Math.min((timestamp - lastFrame) / 16.67, 2.5) : 1
      lastFrame = timestamp

      context.clearRect(0, 0, width, height)
      context.globalCompositeOperation = 'screen'
      const glow = context.createRadialGradient(width * 0.5, height * 0.53, 0, width * 0.5, height * 0.53, Math.max(width, height) * 0.55)
      glow.addColorStop(0, 'rgba(167, 194, 255, 0.2)')
      glow.addColorStop(0.46, 'rgba(102, 153, 255, 0.09)')
      glow.addColorStop(1, 'rgba(72, 120, 230, 0)')
      context.fillStyle = glow
      context.fillRect(0, 0, width, height)
      context.globalCompositeOperation = 'lighter'

      const symbolScale = Math.min(width / 500, height / 470, 0.92)
      for (const symbol of floatingSymbols) {
        const driftX = reducedMotion ? 0 : Math.sin(time * 0.22 + symbol.phase) * width * 0.008
        const driftY = reducedMotion ? 0 : Math.cos(time * 0.18 + symbol.phase) * height * 0.009
        const anchorX = symbol.x * width + driftX
        const anchorY = symbol.y * height + driftY

        for (let index = 0; index < symbol.dots.length; index += 1) {
          const dot = symbol.dots[index]
          const twinkle = reducedMotion ? 0.8 : 0.57 + 0.43 * (0.5 + 0.5 * Math.sin(time * 0.75 + dot.phase))
          const dotX = anchorX + dot.x * symbolScale
          const dotY = anchorY + dot.y * symbolScale
          const dotSize = dot.size * symbolScale

          if (index % 5 === 0) {
            context.globalAlpha = dot.alpha * twinkle * 0.12
            context.fillStyle = '#c5d4ff'
            context.fillRect(dotX - dotSize, dotY - dotSize, dotSize * 3, dotSize * 3)
          }
          context.globalAlpha = dot.alpha * twinkle * 0.56
          context.fillStyle = '#c5d4ff'
          context.fillRect(dotX, dotY, dotSize, dotSize)
        }
      }

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index]

        if (canInteract && pointer.active) {
          const dx = particle.x - pointer.x
          const dy = particle.y - pointer.y
          const distance = Math.hypot(dx, dy)
          if (distance > 0 && distance < 110) {
            const influence = 1 - distance / 110
            particle.vx += (dx / distance) * influence * 0.9 * step
            particle.vy += (dy / distance) * influence * 0.9 * step
          }
        }

        particle.vx += (particle.homeX - particle.x) * 0.009 * step
        particle.vy += (particle.homeY - particle.y) * 0.009 * step
        const damping = Math.pow(0.89, step)
        particle.vx *= damping
        particle.vy *= damping
        particle.x += particle.vx * step
        particle.y += particle.vy * step

        const twinkle = reducedMotion ? 0.78 : 0.42 + 0.58 * (0.5 + 0.5 * Math.sin(time * 1.35 + particle.phase))
        const dotSize = particle.size * (0.92 + twinkle * 0.12)
        if (index % 11 === 0) {
          context.globalAlpha = particle.alpha * twinkle * 0.16
          context.fillStyle = particle.color
          context.fillRect(particle.x - dotSize, particle.y - dotSize, dotSize * 3, dotSize * 3)
        }
        context.globalAlpha = particle.alpha * twinkle
        context.fillStyle = particle.color
        context.fillRect(particle.x - dotSize / 2, particle.y - dotSize / 2, dotSize, dotSize)
      }

      context.globalAlpha = 1
      context.globalCompositeOperation = 'source-over'
    }

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect()
      if (bounds.width <= 0 || bounds.height <= 0) return

      width = bounds.width
      height = bounds.height
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

      const compact = window.innerWidth < 880
      const particleCount = compact ? 2000 : 4800
      const random = createRandom(7841 + Math.round(width) * 31 + Math.round(height) * 17)
      const scale = Math.min(
        (width * 0.9) / (CAP_BOUNDS.right - CAP_BOUNDS.left),
        (height * 0.66) / (CAP_BOUNDS.bottom - CAP_BOUNDS.top),
      )
      const originX = (width - CAP_WIDTH * scale) / 2
      const originY = height * 0.54 - (CAP_HEIGHT * scale) / 2

      particles = Array.from({ length: particleCount }, () => {
        const sample = capSamples[Math.floor(random() * capSamples.length)]
        const hue = random()
        const red = Math.round(170 + hue * 31)
        const green = Math.round(205 - hue * 21)
        return {
          homeX: originX + (sample.x + random()) * scale,
          homeY: originY + (sample.y + random()) * scale,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          size: 0.5 + random() * 1.1,
          alpha: 0.48 + random() * 0.48,
          phase: random() * Math.PI * 2,
          color: `rgb(${red} ${green} 255)`,
        }
      })

      for (const particle of particles) {
        particle.x = particle.homeX
        particle.y = particle.homeY
      }

      lastFrame = 0
      drawFrame(performance.now())
    }

    const queueResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(resizeCanvas, 140)
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!canInteract || event.pointerType !== 'mouse') return
      const bounds = canvas.getBoundingClientRect()
      pointer.x = event.clientX - bounds.left
      pointer.y = event.clientY - bounds.top
      pointer.active = true
    }

    const handlePointerLeave = () => {
      pointer.active = false
    }

    const animate = (timestamp: number) => {
      drawFrame(timestamp)
      animationFrame = window.requestAnimationFrame(animate)
    }

    const handleMotionPreference = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches
      if (reducedMotion) {
        window.cancelAnimationFrame(animationFrame)
        animationFrame = 0
        drawFrame(performance.now())
      } else if (!animationFrame) {
        lastFrame = 0
        animationFrame = window.requestAnimationFrame(animate)
      }
    }

    canvas.style.pointerEvents = canInteract ? 'auto' : 'none'
    if (canInteract) {
      canvas.addEventListener('pointermove', handlePointerMove, { passive: true })
      canvas.addEventListener('pointerleave', handlePointerLeave)
      canvas.addEventListener('pointercancel', handlePointerLeave)
    }

    resizeCanvas()
    const observer = new ResizeObserver(queueResize)
    if (canvas.parentElement) observer.observe(canvas.parentElement)
    window.addEventListener('resize', queueResize)
    motionPreference.addEventListener('change', handleMotionPreference)

    if (!reducedMotion) animationFrame = window.requestAnimationFrame(animate)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.clearTimeout(resizeTimer)
      observer.disconnect()
      window.removeEventListener('resize', queueResize)
      motionPreference.removeEventListener('change', handleMotionPreference)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerleave', handlePointerLeave)
      canvas.removeEventListener('pointercancel', handlePointerLeave)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 z-0 block size-full" />
}
