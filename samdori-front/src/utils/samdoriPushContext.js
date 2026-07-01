import { registerDeviceToken } from '../features/devices/api/deviceToken'

/** Flutter가 나중에 토큰을 갱신할 때 사용 (앱 시작 시 주입이 늦는 경우 대비) */
export function initSamdoriPushBridge() {
  window.__receiveSamdoriFcmToken = (token) => {
    if (token) {
      window.samdoriFcmToken = token
    }
  }

  window.__receiveSamdoriPlatform = (platform) => {
    if (platform) {
      window.samdoriPlatform = platform
    }
  }
}

export function getSamdoriFcmToken() {
  return window.samdoriFcmToken || null
}

export function getSamdoriPlatform() {
  if (window.samdoriPlatform) {
    return window.samdoriPlatform
  }

  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(ua)) return 'IOS'
  if (/Android/i.test(ua)) return 'ANDROID'

  return null
}

/**
 * ① 로그인 후 호출
 * Flutter 앱 시작 시 주입된 window.samdoriFcmToken 사용 → POST /api/devices/token
 */
export async function registerSamdoriDeviceToken(userId) {
  if (userId == null || userId === '') {
    console.log('[FCM] 기기 토큰 등록 생략 — userId 없음')
    return
  }

  const fcmToken = getSamdoriFcmToken()
  const platform = getSamdoriPlatform()

  if (!fcmToken || !platform) {
    console.log(
      '[FCM] 기기 토큰 등록 생략 — Flutter 주입값 없음',
      JSON.stringify({
        fcmToken,
        platform,
        hasSamdoriFcmToken: Boolean(window.samdoriFcmToken),
        hasSamdoriPlatform: Boolean(window.samdoriPlatform),
      }),
    )
    return
  }

  try {
    await registerDeviceToken({ userId, fcmToken, platform })
    console.log(
      '[FCM] 기기 토큰 등록 완료',
      JSON.stringify({ userId, platform }),
    )
  } catch (error) {
    console.error('[FCM] 기기 토큰 등록 실패', error)
  }
}
