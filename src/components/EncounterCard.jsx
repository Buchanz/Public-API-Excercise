import { useEffect, useState } from 'react'
import trainerBattleSprite from '../assets/trainer-battle-back.png'

function EncounterCard({ pokemon, loading, error, onContinue, onRetry, onCatch }) {
  const [catchState, setCatchState] = useState('idle')
  const [leaving, setLeaving] = useState(false)
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    if (!pokemon?.cry) return
    const cry = new Audio(pokemon.cry)
    cry.volume = 0.38
    const timer = window.setTimeout(() => {
      cry.play().catch(() => {})
    }, 700)
    return () => {
      window.clearTimeout(timer)
      cry.pause()
    }
  }, [pokemon])

  useEffect(() => setCatchState('idle'), [pokemon?.id])

  useEffect(() => {
    setEntered(false)
    if (!pokemon) return
    const timer = window.setTimeout(() => setEntered(true), 1850)
    return () => window.clearTimeout(timer)
  }, [pokemon?.id])

  useEffect(() => {
    if (catchState !== 'caught') return
    let finishTimer
    const exitTimer = window.setTimeout(() => {
      setLeaving(true)
      finishTimer = window.setTimeout(onContinue, 900)
    }, 2800)
    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(finishTimer)
    }
  }, [catchState])

  function playPokemonCry(volume = .38) {
    if (!pokemon?.cry) return
    const cry = new Audio(pokemon.cry)
    cry.volume = volume
    cry.play().catch(() => {})
  }

  function playBallSound(kind) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const context = new AudioContext()
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const start = context.currentTime
      oscillator.type = kind === 'throw' ? 'sawtooth' : 'square'
      oscillator.frequency.setValueAtTime(kind === 'throw' ? 620 : 185, start)
      oscillator.frequency.exponentialRampToValueAtTime(kind === 'throw' ? 125 : 115, start + (kind === 'throw' ? .34 : .09))
      gain.gain.setValueAtTime(kind === 'throw' ? .045 : .055, start)
      gain.gain.exponentialRampToValueAtTime(.001, start + (kind === 'throw' ? .36 : .11))
      oscillator.connect(gain).connect(context.destination)
      oscillator.start(start)
      oscillator.stop(start + (kind === 'throw' ? .37 : .12))
      window.setTimeout(() => context.close(), 500)
    } catch { /* Capture remains playable if audio is unavailable. */ }
  }

  function throwBall() {
    if (!pokemon || catchState !== 'bag') return
    const caught = Math.random() < Math.max(0.35, 0.82 - pokemon.level / 100)
    setCatchState('throwing')
    playBallSound('throw')
    window.setTimeout(() => {
      setCatchState('shaking')
    }, 850)
    ;[1330, 2290].forEach((delay) => window.setTimeout(() => playBallSound('wiggle'), delay))
    window.setTimeout(() => {
      if (caught) {
        setCatchState('caught')
        onCatch(pokemon)
        playCatchChime()
      } else {
        setCatchState('escaped')
        window.setTimeout(() => playPokemonCry(.42), 120)
      }
    }, 3000)
  }

  function playCatchChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const context = new AudioContext()
      ;[659, 784, 988].forEach((frequency, index) => {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.type = 'square'
        oscillator.frequency.value = frequency
        gain.gain.setValueAtTime(0.06, context.currentTime + index * .11)
        gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + index * .11 + .1)
        oscillator.connect(gain).connect(context.destination)
        oscillator.start(context.currentTime + index * .11)
        oscillator.stop(context.currentTime + index * .11 + .11)
      })
    } catch { /* Sound is an enhancement; capture still works if blocked. */ }
  }

  function exitBattle() {
    if (leaving) return
    setLeaving(true)
    window.setTimeout(onContinue, 900)
  }

  const encounterSize = pokemon ? Math.min(47, Math.max(27, 24 + Math.sqrt(pokemon.height) * 7)) : 31
  const pokemonPosition = { width: `${encounterSize}%`, height: `${encounterSize}%`, right: `${24 - encounterSize / 2}%` }

  return <div className={`battle-scene ${leaving ? 'leaving' : ''}`} role="dialog" aria-modal="true">
    <div className="battle-exit-wipe" aria-hidden="true"/>
    <img className={`trainer-battle-sprite ${entered ? 'settled' : ''} ${catchState === 'throwing' ? 'trainer-throwing' : ''}`} src={trainerBattleSprite} alt="Trainer facing the wild Pokémon"/>
    {loading && <div className="encounter-status"><div className="pokeball-loader"/><p>Calling PokéAPI…</p></div>}
    {error && <div className="encounter-status error-box"><h2>It got away!</h2><p>{error}</p><button onClick={onRetry}>Try again</button><button className="secondary" onClick={exitBattle}>Run</button></div>}
    {pokemon && <div className="pokemon-reveal">
      <div className="wild-copy"><div className="name-level"><h2>{pokemon.name}</h2><em className={`gender ${pokemon.gender}`}>{pokemon.gender === 'female' ? '♀' : pokemon.gender === 'male' ? '♂' : '◆'}</em><strong>Lv.{pokemon.level}</strong></div><div className="type-row">{pokemon.types.map(type => <span className={`type-${type}`} key={type}>{type}</span>)}</div><div className="hp-row"><b>HP</b><span><i/></span></div></div>
      <img style={pokemonPosition} className={`${entered ? 'settled' : ''} ${['throwing', 'shaking', 'caught'].includes(catchState) ? 'being-caught' : ''} ${catchState === 'escaped' ? 'escaped-from-ball' : ''}`} src={pokemon.image} alt={pokemon.name}/>
      {(catchState === 'throwing' || catchState === 'shaking' || catchState === 'caught') && <div className={`catch-ball ${catchState}`}><span/></div>}
      {catchState === 'caught' && <div className="catch-stars" aria-hidden="true"><i>✦</i><i>★</i><i>✦</i><i>★</i><i>✦</i></div>}
      <div className="battle-dialog"><div className="battle-message"><p>{catchState === 'caught' ? `${pokemon.name.toUpperCase()} was caught!` : catchState === 'escaped' ? `${pokemon.name.toUpperCase()} broke free!` : catchState === 'bag' ? 'Choose an item.' : catchState === 'idle' ? 'What will you do?' : 'The Poké Ball is shaking…'}</p><small>{catchState === 'idle' ? 'Choose an action' : catchState === 'caught' ? 'Added to your Pokédex' : catchState === 'escaped' ? 'Try again or run' : catchState === 'bag' ? 'Select a Poké Ball' : 'Almost there…'}</small></div>{catchState === 'caught' ? <button onClick={exitBattle}>Continue</button> : (catchState === 'idle' || catchState === 'escaped') ? <div className="battle-options"><button className="bag-button" onClick={() => setCatchState('bag')}>Bag</button><button className="run-button" onClick={exitBattle}>Run</button></div> : catchState === 'bag' && <div className="bag-options"><button onClick={throwBall}><span className="mini-ball"/>Poké Ball</button><button onClick={() => setCatchState('idle')}>Back</button></div>}</div>
    </div>}
  </div>
}
export default EncounterCard
