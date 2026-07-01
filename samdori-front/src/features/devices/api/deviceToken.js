import { API_BASE_URL } from '../../../config/api'

export async function registerDeviceToken({ userId, fcmToken, platform }) {
  const response = await fetch(`${API_BASE_URL}/api/devices/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, fcmToken, platform }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message ?? '기기 토큰 등록에 실패했습니다.')
  }
}
