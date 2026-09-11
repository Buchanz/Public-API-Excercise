import { useCallback, useEffect, useRef, useState } from 'react'
import EncounterCard from './components/EncounterCard.jsx'
import GameMap, { isGrassTile, isTreeTile } from './components/GameMap.jsx'
import PokedexMenu from './components/PokedexMenu.jsx'
import { usePokemonEncounter } from './hooks/usePokemonEncounter.js'
import { useGameAudio } from './hooks/useGameAudio.js'

function App() {
  const [player, setPlayer] = useState({ x: 11, y: 10 })
  const [direction, setDirection] = useState('down')
  const [walking, setWalking] = useState(false)
  const walkTimer = useRef(null)
  const [steps, setSteps] = useState(0)
  const [phase, setPhase] = useState('explore')
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuClosing, setMenuClosing] = useState(false)
  const menuTimer = useRef(null)
  const [caught, setCaught] = useState(() => JSON.parse(localStorage.getItem('wildwood-caught') || '[]'))
  const [raining, setRaining] = useState(false)
  const { pokemon, loading, error, encounter, clearEncounter, retry } = usePokemonEncounter()
  const { startAudio, toggleMute, muted, started } = useGameAudio(phase === 'explore' ? 'forest' : 'battle', raining)

  useEffect(() => {
    if (phase !== 'explore') { setRaining(false); return }
    let timer
    let cancelled = false
    const scheduleShower = () => {
      timer = window.setTimeout(() => {
        if (cancelled) return
        setRaining(true)
        timer = window.setTimeout(() => {
          if (cancelled) return
          setRaining(false)
          scheduleShower()
        }, 7000 + Math.random() * 7000)
      }, 5000 + Math.random() * 14000)
    }
    scheduleShower()
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [phase])

  const beginEncounter = useCallback(() => {
    setPhase('transition')
    encounter()
  }, [encounter])

  useEffect(() => {
    if (phase !== 'transition') return
    const timer = window.setTimeout(() => setPhase('reveal'), 1700)
    return () => window.clearTimeout(timer)
  }, [phase])

  const move = useCallback((dx, dy) => {
    if (phase !== 'explore' || menuOpen) return
    startAudio()
    setDirection(dx < 0 ? 'left' : dx > 0 ? 'right' : dy < 0 ? 'up' : 'down')
    setWalking(true)
    window.clearTimeout(walkTimer.current)
    walkTimer.current = window.setTimeout(() => setWalking(false), 190)
    setPlayer((current) => {
      const next = { x: Math.max(1, Math.min(13, current.x + dx)), y: Math.max(1, Math.min(13, current.y + dy)) }
      if (next.x === current.x && next.y === current.y) return current
      if (isTreeTile(next.x, next.y)) return current
      setSteps((count) => count + 1)
      if (isGrassTile(next.x, next.y) && Math.random() < 0.24) beginEncounter()
      return next
    })
  }, [beginEncounter, menuOpen, phase, startAudio])

  const closeMenu = useCallback(() => {
    if (!menuOpen || menuClosing) return
    setMenuClosing(true)
    window.clearTimeout(menuTimer.current)
    menuTimer.current = window.setTimeout(() => {
      setMenuOpen(false)
      setMenuClosing(false)
    }, 620)
  }, [menuClosing, menuOpen])

  const toggleMenu = useCallback(() => {
    if (menuOpen) closeMenu()
    else {
      window.clearTimeout(menuTimer.current)
      setMenuClosing(false)
      setMenuOpen(true)
    }
  }, [closeMenu, menuOpen])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key.toLowerCase() === 'e' && phase === 'explore') {
        event.preventDefault()
        toggleMenu()
        return
      }
      if (event.key === 'Escape' && menuOpen) { closeMenu(); return }
      const moves = { w: [0, -1], arrowup: [0, -1], s: [0, 1], arrowdown: [0, 1], a: [-1, 0], arrowleft: [-1, 0], d: [1, 0], arrowright: [1, 0] }
      const direction = moves[event.key.toLowerCase()]
      if (!direction) return
      event.preventDefault()
      move(...direction)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeMenu, menuOpen, move, phase, toggleMenu])

  useEffect(() => () => {
    window.clearTimeout(walkTimer.current)
    window.clearTimeout(menuTimer.current)
  }, [])

  function continueExploring() {
    clearEncounter()
    setPhase('explore')
  }

  function catchPokemon(pokemon) {
    setCaught((current) => {
      if (current.some((item) => item.id === pokemon.id)) return current
      const next = [...current, pokemon]
      localStorage.setItem('wildwood-caught', JSON.stringify(next))
      return next
    })
  }

  return <main className="game-page">
    <section className={`game-console ${phase === 'transition' ? 'is-transitioning' : ''}`}>
      <aside className="controls-panel wasd-controls"><div className="control-group"><p>Move · WASD</p><div className="d-pad"><span/><button onClick={() => move(0, -1)}>W</button><span/><button onClick={() => move(-1, 0)}>A</button><button onClick={() => move(0, 1)}>S</button><button onClick={() => move(1, 0)}>D</button></div><small>Keyboard controls</small></div></aside>
      <aside className="controls-panel arrow-controls"><div className="control-group"><p>Move · Arrows</p><div className="d-pad"><span/><button aria-label="Move up" onClick={() => move(0, -1)}><i className="arrow-icon up"/></button><span/><button aria-label="Move left" onClick={() => move(-1, 0)}><i className="arrow-icon left"/></button><button aria-label="Move down" onClick={() => move(0, 1)}><i className="arrow-icon down"/></button><button aria-label="Move right" onClick={() => move(1, 0)}><i className="arrow-icon right"/></button></div><small>Arrow keys</small><button className="menu-key" onClick={() => setMenuOpen(true)}>E <span>Menu</span></button><button className="sound-key" onClick={toggleMute}>{started && !muted ? '♪ On' : '♪ Off'}</button></div></aside>
      <div className="game-area"><div className="map-title"><span>PokéAPI</span><strong>Wildwood Trail</strong></div><p className="route-label">Route 01 · Walk through tall grass</p>
        <div className="map-frame">
          <GameMap player={player} direction={direction} walking={walking}/>
          {raining && <div className="rain-layer" aria-label="Rain shower">
            {Array.from({ length: 58 }, (_, index) => <i key={index} style={{
              '--rain-x': `${(index * 37) % 103}%`,
              '--rain-delay': `${-((index * 83) % 1700)}ms`,
              '--rain-speed': `${620 + (index * 47) % 620}ms`,
              '--rain-length': `${8 + (index * 13) % 17}px`,
              '--rain-depth': `${.28 + ((index * 17) % 65) / 100}`,
            }}/>) }
          </div>}
          {phase === 'transition' && <div className="encounter-transition"><div className="encounter-flashes"/><div className="snake-wipe" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <span key={index}/>)}</div></div>}
        </div><p className="hint">Wild encounters use live PokéAPI data</p>
      </div>
      {phase === 'reveal' && <EncounterCard pokemon={pokemon} loading={loading} error={error} onContinue={continueExploring} onRetry={retry} onCatch={catchPokemon}/>} 
      {menuOpen && <PokedexMenu caught={caught} closing={menuClosing} onClose={closeMenu}/>} 
    </section>
  </main>
}
export default App
