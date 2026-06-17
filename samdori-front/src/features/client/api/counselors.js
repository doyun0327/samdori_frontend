import { API_BASE_URL } from '../../../config/api'

export async function fetchCounselors() {
  const response = await fetch(`${API_BASE_URL}/api/user/counselors`)
  const data = await response.json()

  if (!response.ok || data.success === false) {
    throw new Error(data.message ?? '상담사 목록을 불러오지 못했습니다.')
  }

  if (!Array.isArray(data)) {
    return []
  }

  return data.map((counselor) => ({
    id: counselor.id,
    name: counselor.name,
  }))
}
