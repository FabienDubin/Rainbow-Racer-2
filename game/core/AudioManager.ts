/**
 * AudioManager - Web Audio API wrapper for SFX and music
 *
 * Static class (singleton) for audio playback throughout the game.
 * Uses Web Audio API for precise control over volume and pitch.
 * Gracefully fails if audio is unavailable (game continues without sound).
 */
export class AudioManager {
  // Web Audio API context
  private static audioContext: AudioContext | null = null

  // Cached audio buffers
  private static buffers: Map<string, AudioBuffer> = new Map()

  // Master volume (0.0 to 1.0)
  private static masterVolume: number = 1.0

  // Whether audio is available
  private static isAvailable: boolean = true

  // Initialization state
  private static isInitialized: boolean = false

  /**
   * Initialize the AudioContext
   * Must be called after user interaction due to browser autoplay policies
   */
  private static init(): void {
    if (this.isInitialized) return

    try {
      // Create AudioContext (with vendor prefix for Safari)
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext

      if (!AudioContextClass) {
        console.warn('Web Audio API not supported')
        this.isAvailable = false
        return
      }

      this.audioContext = new AudioContextClass()
      this.isInitialized = true
    } catch (error) {
      console.warn('Failed to initialize AudioContext:', error)
      this.isAvailable = false
    }
  }

  /**
   * Resume AudioContext if suspended
   * Required due to browser autoplay policies
   */
  private static async resumeIfNeeded(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      try {
        await this.audioContext.resume()
      } catch (error) {
        console.warn('Failed to resume AudioContext:', error)
      }
    }
  }

  /**
   * Preload sounds from URLs
   * @param urls Array of audio file URLs to preload
   */
  static async preloadSounds(urls: string[]): Promise<void> {
    this.init()

    if (!this.isAvailable || !this.audioContext) {
      return
    }

    const loadPromises = urls.map(async (url) => {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          console.warn(`Failed to fetch audio: ${url}`)
          return
        }

        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)

        // Extract sound name from URL (e.g., "/audio/sfx/jump.mp3" -> "jump")
        const soundName = this.extractSoundName(url)
        this.buffers.set(soundName, audioBuffer)
      } catch (error) {
        console.warn(`Failed to load audio: ${url}`, error)
      }
    })

    await Promise.all(loadPromises)
  }

  /**
   * Extract sound name from URL
   * @param url Audio file URL
   * @returns Sound name without extension
   */
  private static extractSoundName(url: string): string {
    const parts = url.split('/')
    const filename = parts[parts.length - 1]
    return filename.replace(/\.[^.]+$/, '')
  }

  /**
   * Play a preloaded sound
   * @param soundName Name of the sound (without extension)
   * @param volume Volume multiplier (0.0 to 1.0), defaults to 1.0
   */
  static play(soundName: string, volume: number = 1.0): void {
    if (!this.isAvailable || !this.audioContext) {
      return
    }

    const buffer = this.buffers.get(soundName)
    if (!buffer) {
      console.warn(`Sound not found: ${soundName}`)
      return
    }

    // Resume context if suspended (autoplay policy)
    this.resumeIfNeeded()

    try {
      // Create source node
      const source = this.audioContext.createBufferSource()
      source.buffer = buffer

      // Create gain node for volume control
      const gainNode = this.audioContext.createGain()
      gainNode.gain.value = volume * this.masterVolume

      // Connect nodes: source -> gain -> destination
      source.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // Play immediately
      source.start(0)
    } catch (error) {
      console.warn(`Failed to play sound: ${soundName}`, error)
    }
  }

  /**
   * Play a sound with random pitch variation
   * Useful for making repeated sounds less monotonous
   * @param soundName Name of the sound
   * @param range Pitch variation range (e.g., 0.1 = ±10% pitch change)
   * @param volume Volume multiplier
   */
  static playWithPitchVariation(
    soundName: string,
    range: number = 0.1,
    volume: number = 1.0
  ): void {
    if (!this.isAvailable || !this.audioContext) {
      return
    }

    const buffer = this.buffers.get(soundName)
    if (!buffer) {
      console.warn(`Sound not found: ${soundName}`)
      return
    }

    this.resumeIfNeeded()

    try {
      const source = this.audioContext.createBufferSource()
      source.buffer = buffer

      // Random pitch variation: 1.0 ± range
      const pitchVariation = 1.0 + (Math.random() * 2 - 1) * range
      source.playbackRate.value = pitchVariation

      const gainNode = this.audioContext.createGain()
      gainNode.gain.value = volume * this.masterVolume

      source.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      source.start(0)
    } catch (error) {
      console.warn(`Failed to play sound with pitch variation: ${soundName}`, error)
    }
  }

  /**
   * Set master volume
   * @param volume Volume level (0.0 to 1.0)
   */
  static setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume))
  }

  /**
   * Get master volume
   */
  static getMasterVolume(): number {
    return this.masterVolume
  }

  /**
   * Check if audio is available
   */
  static isAudioAvailable(): boolean {
    return this.isAvailable
  }

  /**
   * Check if a sound is loaded
   * @param soundName Name of the sound
   */
  static isSoundLoaded(soundName: string): boolean {
    return this.buffers.has(soundName)
  }

  /**
   * Clear all cached audio buffers
   * Call this when cleaning up the game
   */
  static clearAll(): void {
    this.buffers.clear()
  }
}
