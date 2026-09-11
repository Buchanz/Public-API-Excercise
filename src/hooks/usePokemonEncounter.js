import { useCallback, useRef, useState } from 'react'

export function usePokemonEncounter() {
  const [pokemon, setPokemon] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const lastId = useRef(null)
  function findEvolutionStage(node, name, stage = 1) {
    if (node.species.name === name) return stage
    for (const evolution of node.evolves_to) {
      const result = findEvolutionStage(evolution, name, stage + 1)
      if (result) return result
    }
    return 1
  }

  function levelForStage(stage) {
    const ranges = { 1: [5, 16], 2: [18, 35], 3: [36, 55] }
    const [minimum, maximum] = ranges[Math.min(stage, 3)]
    return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum
  }

  const fetchPokemon = useCallback(async (id) => {
    setLoading(true); setError(''); setPokemon(null); lastId.current = id
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
      if (!response.ok) throw new Error('The wild Pokémon got away.')
      const data = await response.json()
      const speciesResponse = await fetch(data.species.url)
      if (!speciesResponse.ok) throw new Error('The Pokémon details could not be loaded.')
      const species = await speciesResponse.json()
      const evolutionResponse = await fetch(species.evolution_chain.url)
      if (!evolutionResponse.ok) throw new Error('The evolution data could not be loaded.')
      const evolution = await evolutionResponse.json()
      const stage = findEvolutionStage(evolution.chain, data.name)
      const level = levelForStage(stage)
      const maxHp = Math.max(12, Math.floor(((2 * data.stats[0].base_stat + 31) * level) / 100) + level + 10)
      const gender = species.gender_rate === -1 ? 'genderless' : Math.random() < species.gender_rate / 8 ? 'female' : 'male'
      setPokemon({ id: data.id, name: data.name, image: data.sprites.other['official-artwork'].front_default, cry: data.cries?.legacy || data.cries?.latest || null, types: data.types.map((entry) => entry.type.name), height: data.height / 10, weight: data.weight / 10, level, maxHp, gender })
    } catch (requestError) { setError(requestError.message || 'The encounter could not be loaded.') }
    finally { setLoading(false) }
  }, [])
  const encounter = useCallback(() => fetchPokemon(Math.floor(Math.random() * 151) + 1), [fetchPokemon])
  const retry = useCallback(() => fetchPokemon(lastId.current), [fetchPokemon])
  const clearEncounter = useCallback(() => { setPokemon(null); setError('') }, [])
  return { pokemon, loading, error, encounter, retry, clearEncounter }
}
