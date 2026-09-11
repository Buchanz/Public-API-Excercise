import { useCallback, useEffect, useState } from 'react'

const API_URL = 'https://pokeapi.co/api/v2/pokemon?limit=24'

export function usePokemon() {
  const [pokemon, setPokemon] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestNumber, setRequestNumber] = useState(0)

  const retry = useCallback(() => setRequestNumber((number) => number + 1), [])

  useEffect(() => {
    const controller = new AbortController()

    async function fetchPokemon() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(API_URL, { signal: controller.signal })
        if (!response.ok) throw new Error('The Pokédex could not be loaded.')

        const list = await response.json()
        const details = await Promise.all(
          list.results.map(async (item) => {
            const detailResponse = await fetch(item.url, { signal: controller.signal })
            if (!detailResponse.ok) throw new Error('A Pokémon could not be loaded.')
            const data = await detailResponse.json()

            return {
              id: data.id,
              name: data.name,
              image: data.sprites.other['official-artwork'].front_default,
              types: data.types.map((entry) => entry.type.name),
              height: data.height / 10,
              weight: data.weight / 10,
            }
          }),
        )

        setPokemon(details)
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Something went wrong. Please try again.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    fetchPokemon()
    return () => controller.abort()
  }, [requestNumber])

  return { pokemon, loading, error, retry }
}
