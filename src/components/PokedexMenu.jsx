import { useEffect, useMemo, useRef, useState } from 'react'

function PokedexMenu({ caught, closing, onClose }) {
  const [pokemon, setPokemon] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pokedex')
  const [selectedId, setSelectedId] = useState(caught[0]?.id || 25)
  const [previewId, setPreviewId] = useState(caught[0]?.id || 25)
  const [previewLeaving, setPreviewLeaving] = useState(false)
  const scrollFrame = useRef(null)
  const listRef = useRef(null)
  const previewTimer = useRef(null)

  useEffect(() => {
    fetch('https://pokeapi.co/api/v2/pokemon?limit=151')
      .then((response) => {
        if (!response.ok) throw new Error('Pokédex unavailable')
        return response.json()
      })
      .then((data) => setPokemon(data.results.map((item, index) => ({ id: index + 1, name: item.name, image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${index + 1}.png` }))))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (loading || !listRef.current) return
    const selectedEntry = listRef.current.querySelector(`[data-pokemon-id="${selectedId}"]`)
    selectedEntry?.scrollIntoView({ block: 'center' })
  }, [loading, tab])

  const caughtIds = useMemo(() => new Set(caught.map((item) => item.id)), [caught])
  const visible = tab === 'caught' ? pokemon.filter((item) => caughtIds.has(item.id)) : pokemon
  const selected = pokemon.find((item) => item.id === previewId)
  const selectedIndex = visible.findIndex((item) => item.id === selectedId)

  useEffect(() => {
    if (selectedId === previewId) return
    setPreviewLeaving(true)
    window.clearTimeout(previewTimer.current)
    previewTimer.current = window.setTimeout(() => {
      setPreviewId(selectedId)
      setPreviewLeaving(false)
    }, 220)
    return () => window.clearTimeout(previewTimer.current)
  }, [previewId, selectedId])

  function handleScroll(event) {
    window.cancelAnimationFrame(scrollFrame.current)
    const list = event.currentTarget
    scrollFrame.current = window.requestAnimationFrame(() => {
      const listBox = list.getBoundingClientRect()
      const center = listBox.top + listBox.height / 2
      let closestId = selectedId
      let closestDistance = Infinity
      list.querySelectorAll('[data-pokemon-id]').forEach((entry) => {
        const box = entry.getBoundingClientRect()
        const distance = Math.abs(box.top + box.height / 2 - center)
        if (distance < closestDistance) {
          closestDistance = distance
          closestId = Number(entry.dataset.pokemonId)
        }
      })
      setSelectedId(closestId)
    })
  }

  return <div className={`pokedex-overlay ${closing ? 'is-closing' : ''}`} role="dialog" aria-modal="true">
    <div className="pokedex-header"><div><span>◉</span> National Pokédex</div><button onClick={onClose}>E · Close</button></div>
    <div className="pokedex-tabs"><button className={tab === 'pokedex' ? 'active' : ''} onClick={() => setTab('pokedex')}>Pokédex</button><button className={tab === 'caught' ? 'active' : ''} onClick={() => setTab('caught')}>Caught · {caught.length}</button></div>
    {loading ? <div className="dex-loading">Loading Pokédex…</div> : <div className="dex-body">
      <div className={`dex-preview ${caughtIds.has(previewId) ? '' : 'unknown'} ${previewLeaving ? 'preview-leaving' : ''}`}><img key={previewId} src={selected?.image} alt=""/><strong>{caughtIds.has(previewId) ? selected?.name : '?????'}</strong><small>No. {String(previewId).padStart(3, '0')}</small></div>
      <div className="dex-list" ref={listRef} onScroll={handleScroll}>{visible.length ? visible.map((item, index) => { const depth = selectedIndex < 0 ? 4 : Math.min(Math.abs(index - selectedIndex), 4); return <button data-pokemon-id={item.id} key={item.id} className={`${caughtIds.has(item.id) ? 'caught' : 'unseen'} ${selectedId === item.id ? 'selected' : ''} depth-${depth}`} onClick={(event) => { setSelectedId(item.id); event.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}><img src={item.image} alt=""/><span>{String(item.id).padStart(3, '0')}</span><strong>{caughtIds.has(item.id) ? item.name : '?????'}</strong></button> }) : <p>No Pokémon caught yet.</p>}</div>
    </div>}
    <div className="dex-footer"><span>Seen through encounters</span><strong>Obtained {caught.length} / 151</strong></div>
  </div>
}
export default PokedexMenu
