const KEY = 'scopa-partite-guest'

export function getPartiteLocali() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function savePartitaLocale(partita) {
  const partite = getPartiteLocali()
  const idx = partite.findIndex(p => p.id === partita.id)
  if (idx >= 0) {
    partite[idx] = partita
  } else {
    partite.unshift(partita)
  }
  localStorage.setItem(KEY, JSON.stringify(partite))
  return partita
}

export function getPartitaLocale(id) {
  return getPartiteLocali().find(p => p.id === id) || null
}

export function deletePartitaLocale(id) {
  const partite = getPartiteLocali().filter(p => p.id !== id)
  localStorage.setItem(KEY, JSON.stringify(partite))
}

export function clearPartiteLocali() {
  localStorage.removeItem(KEY)
}

export function generateId() {
  return 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2)
}