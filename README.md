# Wildwood Trail

Wildwood Trail is a small top-down Pokémon encounter game built with React and
[PokéAPI](https://pokeapi.co/). Explore the map with the keyboard, find wild
Pokémon in tall grass, catch them, and track the collection in a Pokédex.

## Controls

| Key | Action |
| --- | --- |
| `W`, `A`, `S`, `D` | Move the trainer |
| Arrow keys | Move the trainer |
| `E` | Open or close the Pokédex |
| `Escape` | Close the Pokédex |

## Features

- Tile-based map with animated movement and collision boundaries
- Random encounters while walking through tall grass
- Pokémon artwork, types, evolution data, levels, and cries from PokéAPI
- Animated encounter transition and Poké Ball capture sequence
- Random capture outcomes with unlimited Poké Balls
- Generation I Pokédex with caught and unseen states
- Collection saved in browser storage between visits
- Responsive, single-screen layout

## Project layout

```text
src/
├── assets/                 Character, environment, and battle artwork
├── components/
│   ├── EncounterCard.jsx   Encounter, capture, and battle controls
│   ├── GameMap.jsx         Map tiles, terrain, and player rendering
│   └── PokedexMenu.jsx     Pokédex list and caught collection
├── hooks/
│   └── usePokemonEncounter.js
│                            PokéAPI requests and encounter data
├── App.jsx                 Game state, movement, menus, and encounters
├── game-layout.css         Game, battle, and Pokédex presentation
├── main.jsx                React entry point
└── styles.css              Base styling and animations
```

## Run locally

```bash
npm install
npm run dev
```

Then open the local address displayed in the terminal.

## Build

```bash
npm run build
```

The optimized site is written to `dist/`.

## Deployment

The workflow at `.github/workflows/deploy.yml` automatically builds and deploys
the project to GitHub Pages whenever a commit is pushed to the `main` branch.
In the repository settings, set **Pages → Source** to **GitHub Actions**.

## API notes

PokéAPI is used for educational purposes. The app requests Pokémon records,
species information, evolution chains, official artwork, and legacy cries.
