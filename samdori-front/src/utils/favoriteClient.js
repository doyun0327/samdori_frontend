const FAVORITE_CLIENTS_KEY_PREFIX = 'samdori_favorite_clients_'

function storageKey(counselorId) {
  return `${FAVORITE_CLIENTS_KEY_PREFIX}${counselorId}`
}

function normalizeStoredClient(raw) {
  return {
    id: String(raw?.id ?? ''),
    name: raw?.name ?? '',
    phoneNumber: raw?.phoneNumber ?? raw?.phone_number ?? '',
  }
}

export function getFavoriteClients(counselorId) {
  if (counselorId == null || counselorId === '') return []

  try {
    const raw = localStorage.getItem(storageKey(counselorId))
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.map(normalizeStoredClient).filter((client) => client.id)
  } catch {
    return []
  }
}

function saveFavoriteClients(counselorId, clients) {
  if (counselorId == null || counselorId === '') return

  localStorage.setItem(storageKey(counselorId), JSON.stringify(clients))
}

export function addFavoriteClient(counselorId, client) {
  if (!client?.id) return getFavoriteClients(counselorId)

  const normalized = normalizeStoredClient(client)
  const current = getFavoriteClients(counselorId)

  if (current.some((item) => item.id === normalized.id)) {
    return current
  }

  const next = [...current, normalized]
  saveFavoriteClients(counselorId, next)
  return next
}

export function removeFavoriteClient(counselorId, clientId) {
  if (clientId == null || clientId === '') return getFavoriteClients(counselorId)

  const next = getFavoriteClients(counselorId).filter(
    (client) => client.id !== String(clientId),
  )
  saveFavoriteClients(counselorId, next)
  return next
}

export function isFavoriteClient(counselorId, clientId) {
  return getFavoriteClients(counselorId).some(
    (client) => client.id === String(clientId),
  )
}
