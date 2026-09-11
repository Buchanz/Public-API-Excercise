import PokemonCard from './PokemonCard.jsx'

function PokemonGrid({ pokemon, loading, error, onRetry }) {
  if (loading) {
    return <div className="status" role="status"><div className="spinner" />Loading Pokémon…</div>
  }

  if (error) {
    return (
      <div className="status error" role="alert">
        <p>{error}</p>
        <button type="button" onClick={onRetry}>Try again</button>
      </div>
    )
  }

  if (pokemon.length === 0) {
    return <div className="status"><p>No Pokémon match those filters.</p></div>
  }

  return (
    <div className="grid">
      {pokemon.map((item) => <PokemonCard key={item.id} pokemon={item} />)}
    </div>
  )
}

export default PokemonGrid
