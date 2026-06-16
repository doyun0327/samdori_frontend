import { API_BASE_URL } from '../../../config/api'

export async function createUser(payload) {
  const response = await fetch(`${API_BASE_URL}/api/user/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let message = '회원가입에 실패했습니다.'

    try {
      const data = await response.json()
      message = data.message || data.error || message
    } catch {
      const text = await response.text()
      if (text) message = text
    }

    throw new Error(message)
  }

  return response.json().catch(() => ({}))
}
