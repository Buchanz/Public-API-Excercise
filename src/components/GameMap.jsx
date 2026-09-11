const WIDTH = 15
const HEIGHT = 15
const FLOWERS = new Set([
  '6-2', '8-2', '6-3', '7-4', '8-5', '4-9', '5-10', '7-9',
  '9-8', '10-8', '11-9', '6-10', '7-11', '1-10', '13-9', '7-13',
])

export function isGrassTile(x, y) {
  return (x >= 1 && x <= 5 && y >= 2 && y <= 5) ||
    (x >= 9 && x <= 13 && y >= 3 && y <= 7) ||
    (x >= 8 && x <= 13 && y >= 10 && y <= 13) ||
    (x >= 2 && x <= 6 && y >= 11 && y <= 13)
}

export function isTreeTile(x, y) {
  if (x === 0 || y === 0 || x === WIDTH - 1 || y === HEIGHT - 1) return true
  return (x <= 3 && y >= 6 && y <= 8) || (x >= 6 && x <= 8 && y >= 6 && y <= 8)
}

function GameMap({ player, direction, walking }) {
  const tiles = Array.from({ length: WIDTH * HEIGHT }, (_, index) => {
    const x = index % WIDTH, y = Math.floor(index / WIDTH)
    const tree = isTreeTile(x, y), grass = !tree && isGrassTile(x, y)
    const type = tree ? 'tree' : grass ? 'grass' : 'ground'
    const hasPlayer = player.x === x && player.y === y
    const flower = !tree && !grass && FLOWERS.has(`${x}-${y}`)
    return <div className={`tile ${type} ${hasPlayer ? 'occupied' : ''} ${hasPlayer && walking ? 'rustling' : ''}`} key={`${x}-${y}`} style={{ '--tile-row': y }}>
      {tree && <span className="tree-top"/>}
      {grass && <span className="grass-blades">〽</span>}
      {flower && <span className="flower-mark">✿</span>}
      {hasPlayer && grass && <span className="grass-foreground"/>}
    </div>
  })
  const playerStyle = {
    '--player-x': player.x,
    '--player-y': player.y,
    '--player-row': player.y,
  }

  return <div className="map" role="img" aria-label="A forest route with patches of tall grass">
    {tiles}
    <div className={`player ${direction} ${walking ? 'walking' : ''}`} style={playerStyle} aria-label={`Player facing ${direction}`}/>
  </div>
}
export default GameMap
