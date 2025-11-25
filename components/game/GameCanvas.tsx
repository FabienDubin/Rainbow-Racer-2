'use client'

import { useRef, useEffect, useState } from 'react'

/**
 * GameCanvas component - Main canvas wrapper for the game engine
 * This component renders a full-screen HTML5 canvas for the game.
 * The canvas is rendered client-side only (no SSR).
 */
export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 })

  // Handle canvas resize to fill the viewport
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        })
      }
    }

    // Initial size
    updateDimensions()

    // Listen for resize events
    window.addEventListener('resize', updateDimensions)

    return () => {
      window.removeEventListener('resize', updateDimensions)
    }
  }, [])

  // Initialize canvas context and basic rendering
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('Failed to get 2D context from canvas')
      return
    }

    // Set canvas background color (Crystal Cloudscape biome - deep purple)
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw a placeholder text to confirm canvas is working
    ctx.fillStyle = '#ffffff'
    ctx.font = '24px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Rainbow Racer V2 - Canvas Ready', canvas.width / 2, canvas.height / 2)
    ctx.font = '16px Arial'
    ctx.fillStyle = '#888888'
    ctx.fillText('Game Engine will be initialized here', canvas.width / 2, canvas.height / 2 + 30)

    // Cleanup function - will be used later to destroy GameEngine
    return () => {
      // GameEngine cleanup will go here in future stories
    }
  }, [dimensions])

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-[#1a1a2e]">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0"
        style={{ touchAction: 'none' }}
      />
    </div>
  )
}
