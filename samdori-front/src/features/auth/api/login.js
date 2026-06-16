import { API_BASE_URL } from '../../../config/api'

export async function login(payload) {
  const response = await fetch(`${API_BASE_URL}/api/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok || data.success === false) {
    return { success: false, message: data.message ?? '로그인에 실패했습니다.' }
  }

  return { success: true, data }
}
