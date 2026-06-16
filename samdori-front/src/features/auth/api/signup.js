import { API_BASE_URL } from '../../../config/api'

export async function createUser(payload) {
  const response = await fetch(`${API_BASE_URL}/api/user/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message)
  }

  return data
}
