'use client'

import dynamic from 'next/dynamic'

/**
 * Dynamic import of GameCanvas with SSR disabled
 * The canvas element cannot be rendered on the server,
 * so we must load the component client-side only.
 */
const GameCanvas = dynamic(
  () => import('@/components/game/GameCanvas'),
  {
    ssr: false,  // Critical: disable server-side rendering for canvas
    loading: () => (
      <div className="flex items-center justify-center w-full h-screen bg-[#1a1a2e]">
        <div className="text-center">
          <div className="text-white text-2xl mb-4">Rainbow Racer V2</div>
          <div className="text-gray-400">Loading game...</div>
          {/* Simple loading spinner */}
          <div className="mt-4 w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    ),
  }
)

/**
 * Play page - Main game route
 * This page renders the full-screen game canvas.
 */
export default function PlayPage() {
  return (
    <main className="w-full h-screen overflow-hidden">
      <GameCanvas />
    </main>
  )
}
