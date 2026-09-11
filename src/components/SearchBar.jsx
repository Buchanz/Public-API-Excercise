function SearchBar({ search, onSearchChange, type, onTypeChange, types }) {
  return (
    <div className="filters">
      <label className="search-field">
        <span className="sr-only">Search Pokémon by name</span>
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by name…"
        />
      </label>

      <label>
        <span className="sr-only">Filter Pokémon by type</span>
        <select value={type} onChange={(event) => onTypeChange(event.target.value)}>
          <option value="all">All types</option>
          {types.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
    </div>
  )
}

export default SearchBar
