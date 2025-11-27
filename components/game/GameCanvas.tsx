'use client'

import { useRef, useEffect, useState } from 'react'
import { GameEngine } from '@/game/core/GameEngine'
import { AudioManager } from '@/game/core/AudioManager'

/**
 * GameCanvas component - Main canvas wrapper for the game engine
 * This component renders a full-screen HTML5 canvas for the game.
 * The canvas is rendered client-side only (no SSR).
 */
export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const gameEngineRef = useRef<GameEngine | null>(null)
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 })

  // Handle canvas resize to fill the viewport
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const newWidth = window.innerWidth
        const newHeight = window.innerHeight
        setDimensions({ width: newWidth, height: newHeight })

        // Notify GameEngine of resize
        if (gameEngineRef.current) {
          gameEngineRef.current.resize(newWidth, newHeight)
        }
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

  // Initialize GameEngine
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Preload audio assets
    AudioManager.preloadSounds([
      '/audio/sfx/jump.mp3',
      '/audio/sfx/flap.mp3',
      '/audio/sfx/glide-loop.mp3'
    ])

    // Create and start GameEngine
    const engine = new GameEngine(canvas)
    gameEngineRef.current = engine

    // Sync with actual window dimensions immediately
    engine.resize(window.innerWidth, window.innerHeight)

    engine.start()

    // Cleanup on unmount
    return () => {
      engine.destroy()
      AudioManager.clearAll()
      gameEngineRef.current = null
    }
  }, []) // Only run once on mount

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
