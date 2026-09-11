function PokemonCard({ pokemon }) {
  return (
    <article className="card">
      <div className="card-number">#{String(pokemon.id).padStart(3, '0')}</div>
      <img src={pokemon.image} alt={pokemon.name} />
      <div className="card-content">
        <h3>{pokemon.name}</h3>
        <div className="types">
          {pokemon.types.map((type) => <span key={type}>{type}</span>)}
        </div>
        <p>{pokemon.height} m · {pokemon.weight} kg</p>
      </div>
    </article>
  )
}

export default PokemonCard
