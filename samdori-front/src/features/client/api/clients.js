import { API_BASE_URL } from '../../../config/api'
import { normalizeClient } from '../clientUtils'

export async function searchClients(keyword) {
  const trimmed = keyword?.trim() ?? ''

  if (!trimmed) {
    return []
  }

  const params = new URLSearchParams({ keyword: trimmed })
  const response = await fetch(
    `${API_BASE_URL}/api/user/clients/search?${params.toString()}`,
  )
  const data = await response.json()

  if (!response.ok || data.success === false) {
    throw new Error(data.message ?? '고객 검색에 실패했습니다.')
  }

  if (!Array.isArray(data)) {
    return []
  }

  return data.map(normalizeClient)
}
