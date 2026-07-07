const FAVORITE_COUNSELOR_KEY_PREFIX = 'samdori_favorite_counselor_'

function storageKey(clientId) {
  return `${FAVORITE_COUNSELOR_KEY_PREFIX}${clientId}`
}

export function getFavoriteCounselorId(clientId) {
  if (clientId == null || clientId === '') return null

  return localStorage.getItem(storageKey(clientId))
}

export function setFavoriteCounselorId(clientId, counselorId) {
  if (clientId == null || clientId === '') return

  if (counselorId == null || counselorId === '') {
    localStorage.removeItem(storageKey(clientId))
    return
  }

  localStorage.setItem(storageKey(clientId), String(counselorId))
}
