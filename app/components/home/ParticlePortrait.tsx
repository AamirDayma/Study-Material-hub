'use client'

import { useEffect, useRef, type PointerEvent } from 'react'

type Particle = {
  targetX: number
  targetY: number
  startX: number
  startY: number
  size: number
  opacity: number
  phase: number
  frequency: number
  color: string
  offsetX: number
  offsetY: number
  velocityX: number
  velocityY: number
}

const INTRO_DURATION = 2100
const REPULSION_RADIUS = 120
const GLYPHS = [
  { symbol: '∞', x: 0.09, y: 0.28, phase: 0.2 },
  { symbol: 'π', x: 0.9, y: 0.25, phase: 1.5 },
  { symbol: 'Σ', x: 0.08, y: 0.68, phase: 2.8 },
  { symbol: '{', x: 0.89, y: 0.65, phase: 4.1 },
  { symbol: '}', x: 0.83, y: 0.84, phase: 5.4 },
]

export default function ParticlePortrait() {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerRef = useRef({ x: 0, y: 0, active: false })
  const touchDeviceRef = useRef(false)

  useEffect(() => {
    const stage = stageRef.current
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')

    if (!stage || !canvas || !context) return

    let width = 0
    let height = 0
    let pixelRatio = 1
    let portraitLayout = { x: 0, y: 0, width: 0, height: 0 }
    let particles: Particle[] = []
    let animationFrame = 0
    let resizeTimer = 0
    let disposed = false
    let hasStarted = false
    let introActive = false
    let introStartedAt = 0
    let prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    touchDeviceRef.current = window.matchMedia('(pointer: coarse)').matches

    const portrait = new Image()
    portrait.crossOrigin = 'anonymous'
    portrait.decoding = 'async'
    portrait.src = '/portrait.png'

    const drawFrame = (time: number) => {
      if (!width || !height) return

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      context.clearRect(0, 0, width, height)
      context.globalCompositeOperation = 'lighter'

      const introProgress = prefersReducedMotion || !introActive
        ? 1
        : Math.min(1, (time - introStartedAt) / INTRO_DURATION)
      const introEase = 1 - Math.pow(1 - introProgress, 3)
      if (introProgress >= 1) introActive = false

      const centerX = width / 2
      const centerY = height / 2
      const breathing = prefersReducedMotion ? 1 : 1 + Math.sin(time * 0.00018) * 0.006

      if (particles.length > 0) {
        const { x: portraitX, y: portraitY, width: portraitWidth, height: portraitHeight } = portraitLayout
        const bloomX = portraitX + portraitWidth * 0.69
        const bloomY = portraitY + portraitHeight * 0.36
        const bloomRadius = Math.max(portraitWidth, portraitHeight) * 0.62

        const hairGlow = context.createRadialGradient(bloomX, bloomY, 0, bloomX, bloomY, bloomRadius)
        hairGlow.addColorStop(0, 'rgba(231, 181, 245, 0.3)')
        hairGlow.addColorStop(0.34, 'rgba(195, 151, 255, 0.14)')
        hairGlow.addColorStop(1, 'rgba(157, 140, 255, 0)')
        context.fillStyle = hairGlow
        context.fillRect(0, 0, width, height)

        const outerGlow = context.createRadialGradient(centerX, centerY, portraitWidth * 0.12, centerX, centerY, bloomRadius * 1.2)
        outerGlow.addColorStop(0, 'rgba(157, 140, 255, 0.045)')
        outerGlow.addColorStop(0.65, 'rgba(157, 140, 255, 0.025)')
        outerGlow.addColorStop(1, 'rgba(157, 140, 255, 0)')
        context.fillStyle = outerGlow
        context.fillRect(0, 0, width, height)
      }

      for (const glyph of GLYPHS) {
        const drift = prefersReducedMotion ? 0 : Math.sin(time * 0.0004 + glyph.phase) * 4
        context.globalAlpha = 0.08 + (prefersReducedMotion ? 0 : Math.sin(time * 0.0007 + glyph.phase) * 0.025)
        context.fillStyle = '#c7baff'
        context.font = '17px Georgia, serif'
        context.fillText(glyph.symbol, glyph.x * width, glyph.y * height + drift)
      }

      for (const particle of particles) {
        const assembledX = particle.startX + (particle.targetX - particle.startX) * introEase
        const assembledY = particle.startY + (particle.targetY - particle.startY) * introEase
        let pushX = 0
        let pushY = 0

        if (!prefersReducedMotion && !introActive && pointerRef.current.active) {
          const distanceX = assembledX - pointerRef.current.x
          const distanceY = assembledY - pointerRef.current.y
          const distance = Math.hypot(distanceX, distanceY)

          if (distance > 0 && distance < REPULSION_RADIUS) {
            const strength = (1 - distance / REPULSION_RADIUS) * 20
            pushX = (distanceX / distance) * strength
            pushY = (distanceY / distance) * strength
          }
        }

        if (prefersReducedMotion || introActive) {
          particle.offsetX = 0
          particle.offsetY = 0
          particle.velocityX = 0
          particle.velocityY = 0
        } else {
          particle.velocityX = (particle.velocityX + (pushX - particle.offsetX) * 0.09) * 0.82
          particle.velocityY = (particle.velocityY + (pushY - particle.offsetY) * 0.09) * 0.82
          particle.offsetX += particle.velocityX
          particle.offsetY += particle.velocityY
        }

        const jitterX = prefersReducedMotion ? 0 : Math.sin(time * particle.frequency + particle.phase) * 0.18
        const jitterY = prefersReducedMotion ? 0 : Math.cos(time * particle.frequency * 0.83 + particle.phase) * 0.18
        const x = centerX + (assembledX - centerX) * breathing + particle.offsetX + jitterX
        const y = centerY + (assembledY - centerY) * breathing + particle.offsetY + jitterY
        const twinkle = prefersReducedMotion ? 1 : 0.82 + Math.sin(time * particle.frequency + particle.phase) * 0.18

        context.globalAlpha = particle.opacity * twinkle
        context.fillStyle = particle.color
        context.fillRect(x, y, particle.size, particle.size)
      }

      context.globalAlpha = 1
    }

    const startAnimation = () => {
      if (disposed || prefersReducedMotion || animationFrame) return
      const animate = (time: number) => {
        animationFrame = 0
        if (disposed) return
        drawFrame(time)
        if (!prefersReducedMotion) animationFrame = window.requestAnimationFrame(animate)
      }
      animationFrame = window.requestAnimationFrame(animate)
    }

    const buildParticles = () => {
      if (disposed || !portrait.complete || !portrait.naturalWidth) return

      const bounds = stage.getBoundingClientRect()
      if (!bounds.width || !bounds.height) return

      width = bounds.width
      height = bounds.height
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

      const mobile = width < 768
      const sampleHeight = mobile ? 160 : 220
      const sampleWidth = Math.round(sampleHeight * (portrait.naturalWidth / portrait.naturalHeight))
      const sampleCanvas = document.createElement('canvas')
      sampleCanvas.width = sampleWidth
      sampleCanvas.height = sampleHeight
      const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true })
      if (!sampleContext) return

      sampleContext.fillStyle = '#000'
      sampleContext.fillRect(0, 0, sampleWidth, sampleHeight)
      sampleContext.drawImage(portrait, 0, 0, sampleWidth, sampleHeight)
      const pixelData = sampleContext.getImageData(0, 0, sampleWidth, sampleHeight).data
      const candidates: Array<{ x: number; y: number; brightness: number }> = []

      for (let y = 0; y < sampleHeight; y += 1) {
        for (let x = 0; x < sampleWidth; x += 1) {
          const index = (y * sampleWidth + x) * 4
          if (pixelData[index + 3] < 32) continue

          const brightness = Math.round(
            pixelData[index] * 0.2126 + pixelData[index + 1] * 0.7152 + pixelData[index + 2] * 0.0722,
          )
          if (brightness > 34) candidates.push({ x, y, brightness })
        }
      }

      const targetCount = mobile ? 4000 : 11000
      const particleCount = Math.min(targetCount, candidates.length)
      const scale = Math.min(width * 0.86 / sampleWidth, height * 0.94 / sampleHeight)
      const portraitWidth = sampleWidth * scale
      const portraitHeight = sampleHeight * scale
      const portraitX = (width - portraitWidth) / 2
      const portraitY = (height - portraitHeight) / 2 - height * 0.015
      portraitLayout = { x: portraitX, y: portraitY, width: portraitWidth, height: portraitHeight }
      const shouldIntro = !prefersReducedMotion && (!hasStarted || introActive)

      if (!hasStarted) {
        hasStarted = true
        introActive = shouldIntro
        introStartedAt = performance.now()
      } else if (!prefersReducedMotion && introActive && performance.now() - introStartedAt >= INTRO_DURATION) {
        introActive = false
      }

      particles = Array.from({ length: particleCount }, (_, particleIndex) => {
        const candidateIndex = Math.floor(particleIndex * candidates.length / Math.max(particleCount, 1))
        const candidate = candidates[candidateIndex]
        const brightness = candidate.brightness
        const isWhiteSpeck = brightness > 208 && Math.random() < 0.018
        const color = isWhiteSpeck
          ? '#fff'
          : brightness > 190
            ? '#d9ccff'
            : brightness > 105
              ? '#b9aaff'
              : '#9d8cff'
        const targetX = portraitX + (candidate.x + 0.5) * scale
        const targetY = portraitY + (candidate.y + 0.5) * scale

        return {
          targetX,
          targetY,
          startX: shouldIntro ? Math.random() * width : targetX,
          startY: shouldIntro ? Math.random() * height : targetY,
          size: 0.6 + Math.random() * 0.55 + (brightness / 255) * 0.45,
          opacity: 0.22 + (brightness / 255) * 0.76,
          phase: Math.random() * Math.PI * 2,
          frequency: 0.001 + Math.random() * 0.002,
          color,
          offsetX: 0,
          offsetY: 0,
          velocityX: 0,
          velocityY: 0,
        }
      })

      drawFrame(performance.now())
      startAnimation()
    }

    const scheduleResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(buildParticles, 120)
    }

    const handleMotionChange = () => {
      prefersReducedMotion = reducedMotionQuery.matches
      if (prefersReducedMotion) {
        if (animationFrame) window.cancelAnimationFrame(animationFrame)
        animationFrame = 0
        introActive = false
        for (const particle of particles) {
          particle.offsetX = 0
          particle.offsetY = 0
          particle.velocityX = 0
          particle.velocityY = 0
        }
        drawFrame(performance.now())
      } else {
        startAnimation()
      }
    }

    const resizeObserver = new ResizeObserver(scheduleResize)
    resizeObserver.observe(stage)
    window.addEventListener('resize', scheduleResize)
    reducedMotionQuery.addEventListener('change', handleMotionChange)
    portrait.onload = buildParticles
    portrait.onerror = () => {
      if (!disposed) drawFrame(performance.now())
    }

    if (portrait.complete && portrait.naturalWidth) buildParticles()

    return () => {
      disposed = true
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
      window.clearTimeout(resizeTimer)
      resizeObserver.disconnect()
      window.removeEventListener('resize', scheduleResize)
      reducedMotionQuery.removeEventListener('change', handleMotionChange)
      portrait.onload = null
      portrait.onerror = null
    }
  }, [])

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' || touchDeviceRef.current) return
    const bounds = event.currentTarget.getBoundingClientRect()
    pointerRef.current = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      active: true,
    }
  }

  const handlePointerLeave = () => {
    pointerRef.current.active = false
  }

  return (
    <div
      ref={stageRef}
      role="img"
      aria-label="A woman portrait made of glowing particles"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative mx-auto h-[360px] w-full max-w-[590px] touch-pan-y overflow-hidden lg:h-[min(580px,calc(100svh-10rem))]"
      style={{
        backgroundColor: 'transparent',
        maskImage: 'radial-gradient(ellipse at center, #000 55%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, #000 55%, transparent 100%)',
      }}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />
    </div>
  )
}
