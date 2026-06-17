import { API_BASE_URL } from '../../../config/api'

async function requestAvailability(method, payload) {
  const response = await fetch(`${API_BASE_URL}/api/counselor/availability`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok || data.success === false) {
    throw new Error(data.message ?? '상담 가능 시간 처리에 실패했습니다.')
  }

  return data
}

export function createAvailability(payload) {
  return requestAvailability('POST', payload)
}

export function deleteAvailability(payload) {
  return requestAvailability('DELETE', payload)
}
