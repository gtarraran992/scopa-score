export const PUNTI = [
  { key: 'carte', label: 'Carte' },
  { key: 'denaro', label: 'Denari' },
  { key: 'settebello', label: 'Sette bello' },
  { key: 'rebello', label: 'Re bello' },
  { key: 'primiera', label: 'Primiera' },
]

export function calcTotals(players, mani) {
  return players.map((_, pi) => {
    const totByKey = {}
    PUNTI.forEach(pt => {
      totByKey[pt.key] = mani.reduce((s, m) => s + (m[pi]?.[pt.key] || 0), 0)
    })
    totByKey.scope = mani.reduce((s, m) => s + (m[pi]?.scope || 0), 0)
    totByKey.napoli = mani.reduce((s, m) => s + (m[pi]?.napoli || 0), 0)
    totByKey.total = mani.reduce((s, m) => s + (m[pi]?.total || 0), 0)
    return totByKey
  })
}