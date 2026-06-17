const USER_NAME_KEY = 'userName'
const USER_ROLE_KEY = 'userRole'
const USER_ID_KEY = 'id'

export function saveAuthSession({ name, role, id }) {
  if (name) {
    sessionStorage.setItem(USER_NAME_KEY, name)
  }

  if (role) {
    sessionStorage.setItem(USER_ROLE_KEY, role)
  }

  if (id != null && id !== '') {
    sessionStorage.setItem(USER_ID_KEY, String(id))
  }
}

export function getAuthSession() {
  return {
    name: sessionStorage.getItem(USER_NAME_KEY),
    role: sessionStorage.getItem(USER_ROLE_KEY),
    id: sessionStorage.getItem(USER_ID_KEY),
  }
}

export function clearAuthSession() {
  sessionStorage.removeItem(USER_NAME_KEY)
  sessionStorage.removeItem(USER_ROLE_KEY)
  sessionStorage.removeItem(USER_ID_KEY)
}

export function isCounselor(role) {
  return role === 'COUNSELOR'
}
