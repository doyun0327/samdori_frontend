import { saveAuthSession } from './authSession'

const KEEP_LOGIN_KEY = 'keepLogin' //저장여부
const SAVED_LOGIN_ID_KEY = 'savedLoginId'
const PERSISTED_AUTH_KEY = 'persistedAuth'

export function isKeepLoginEnabled() {
  return localStorage.getItem(KEEP_LOGIN_KEY) === 'true'
}

export function getSavedLoginId() {
  return localStorage.getItem(SAVED_LOGIN_ID_KEY) ?? ''
}

export function saveLoginPersistence({ keepLogin, loginId, session }) {
  if (!keepLogin) {
    clearLoginPersistence()
    return
  }

  localStorage.setItem(KEEP_LOGIN_KEY, 'true')
  localStorage.setItem(SAVED_LOGIN_ID_KEY, loginId)
  // { name, role, id }
  localStorage.setItem(PERSISTED_AUTH_KEY, JSON.stringify(session))
}

export function clearPersistedSession() {
  localStorage.removeItem(PERSISTED_AUTH_KEY)
}

export function clearLoginPersistence() {
  localStorage.removeItem(KEEP_LOGIN_KEY)
  localStorage.removeItem(SAVED_LOGIN_ID_KEY)
  clearPersistedSession()
}

export function restorePersistedAuthSession() {
  if (!isKeepLoginEnabled()) return false

  const raw = localStorage.getItem(PERSISTED_AUTH_KEY)
  if (!raw) return false

  try {
    const session = JSON.parse(raw)
    if (!session?.name) return false

    saveAuthSession(session)
    return true
  } catch {
    clearLoginPersistence()
    return false
  }
}
