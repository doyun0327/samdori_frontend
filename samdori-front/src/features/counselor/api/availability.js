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

export async function fetchAvailability(counselorId) {
  const response = await fetch(
    `${API_BASE_URL}/api/counselor/availability?id=${counselorId}`,
  )

  const data = await response.json()

  if (!response.ok || data.success === false) {
    throw new Error(data.message ?? '상담 가능 시간 조회에 실패했습니다.')
  }

  if (!Array.isArray(data)) {
    return []
  }

  if (data.length === 0) {
    return []
  }

  // 백엔드 flat 형식: [{ date, timeSlot }]
  /*{
  "id": 3,
  "date": "2026-06-24",
  "timeSlots": [
    "08:00-09:00",
    "09:00-10:00",
    "13:00-14:00"
  ]
}*/
  if (data[0].timeSlot != null) {
    return data.map((item) => ({
      date: item.date,
      timeSlot: item.timeSlot,
    }))
  }

  // 날짜별 그룹 형식: [{ date, timeSlots: [] }]
  return data.flatMap((item) =>
    (item.timeSlots ?? []).map((timeSlot) => ({
      date: item.date,
      timeSlot,
    })),
  )
}
