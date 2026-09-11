import { useCallback, useEffect, useRef, useState } from 'react'

const forestNotes = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23]
const battleMelody = [
  329.63, 392, 440, 493.88, 440, 392, 329.63, null,
  369.99, 440, 523.25, 493.88, 440, 369.99, 329.63, 293.66,
  329.63, 392, 493.88, 587.33, 523.25, 493.88, 440, null,
  392, 440, 369.99, 329.63, 293.66, 329.63, 246.94, 293.66,
]
const battleBass = [164.81, 164.81, 146.83, 146.83, 196, 196, 174.61, 146.83]
const victoryMelody = [392, 493.88, 587.33, 783.99, 659.25, 587.33, 523.25, 659.25, 783.99, 987.77, 783.99, 659.25]
const victoryBass = [196, 246.94, 261.63, 329.63, 293.66, 261.63]

export function useGameAudio(mode, raining = false) {
  const contextRef = useRef(null)
  const timerRef = useRef(null)
  const rainRef = useRef(null)
  const stepRef = useRef(0)
  const [started, setStarted] = useState(false)
  const [muted, setMuted] = useState(false)

  const startAudio = useCallback(() => {
    if (!contextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      contextRef.current = new AudioContext()
    }
    contextRef.current.resume().catch(() => {})
    setStarted(true)
  }, [])

  useEffect(() => {
    window.clearInterval(timerRef.current)
    if (!started || muted || !contextRef.current) return
    stepRef.current = 0
    const battling = mode === 'battle'
    const celebrating = mode === 'victory'
    const notes = celebrating ? victoryMelody : battling ? battleMelody : forestNotes
    const tempo = celebrating ? 245 : battling ? 138 : 330

    function playTone(frequency, type, volume, duration, delay = 0) {
      if (!frequency) return
      const context = contextRef.current
      const start = context.currentTime + delay
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency, start)
      gain.gain.setValueAtTime(volume, start)
      gain.gain.exponentialRampToValueAtTime(.001, start + duration)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start(start)
      oscillator.stop(start + duration)
    }

    function playStep() {
      const context = contextRef.current
      if (!context || context.state !== 'running') return
      const step = stepRef.current++
      if (celebrating) {
        playTone(notes[step % notes.length], 'square', .017, .2)
        if (step % 2 === 0) playTone(victoryBass[Math.floor(step / 2) % victoryBass.length], 'triangle', .019, .38)
        if (step % 6 === 3) playTone(notes[step % notes.length] * 1.5, 'sine', .008, .28)
        return
      }
      if (!battling) {
        playTone(notes[step % notes.length], 'triangle', .017, tempo / 1100)
        return
      }

      const phrase = Math.floor(step / battleMelody.length)
      const variation = [1, 1, 1.0595, .9439][phrase % 4]
      playTone(battleMelody[step % battleMelody.length] * variation, 'square', .018, .12)
      if (step % 2 === 0) playTone(battleBass[Math.floor(step / 4) % battleBass.length] * variation, 'triangle', .022, .24)
      if (step % 8 === 6) playTone(98, 'sawtooth', .008, .07)
    }

    playStep()
    timerRef.current = window.setInterval(playStep, tempo)
    return () => window.clearInterval(timerRef.current)
  }, [mode, muted, started])

  useEffect(() => {
    const context = contextRef.current
    if (!started || muted || !raining || mode !== 'forest' || !context) return

    const sampleCount = context.sampleRate * 2
    const buffer = context.createBuffer(1, sampleCount, context.sampleRate)
    const samples = buffer.getChannelData(0)
    let previous = 0
    for (let index = 0; index < sampleCount; index += 1) {
      const whiteNoise = Math.random() * 2 - 1
      previous = previous * .82 + whiteNoise * .18
      samples[index] = previous
    }

    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const gain = context.createGain()
    source.buffer = buffer
    source.loop = true
    filter.type = 'lowpass'
    filter.frequency.value = 2200
    gain.gain.setValueAtTime(.001, context.currentTime)
    gain.gain.linearRampToValueAtTime(.018, context.currentTime + 1.2)
    source.connect(filter).connect(gain).connect(context.destination)
    source.start()
    rainRef.current = { source, gain }

    return () => {
      gain.gain.cancelScheduledValues(context.currentTime)
      gain.gain.setValueAtTime(gain.gain.value || .001, context.currentTime)
      gain.gain.linearRampToValueAtTime(.001, context.currentTime + .7)
      window.setTimeout(() => { try { source.stop() } catch {} }, 750)
      rainRef.current = null
    }
  }, [mode, muted, raining, started])

  useEffect(() => () => {
    window.clearInterval(timerRef.current)
    try { rainRef.current?.source.stop() } catch {}
    contextRef.current?.close()
  }, [])

  const toggleMute = useCallback(() => {
    if (!started) {
      startAudio()
      setMuted(false)
      return
    }
    setMuted((value) => !value)
  }, [startAudio, started])

  return { startAudio, toggleMute, muted, started }
}
