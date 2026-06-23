const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export function formatBookingSchedule(date, timeSlot) {
  const parsed = new Date(`${date}T00:00:00`)
  const weekday = WEEKDAYS[parsed.getDay()]
  const month = parsed.getMonth() + 1
  const day = parsed.getDate()

  return `${month}월 ${day}일 (${weekday}) ${timeSlot}`
}

export function formatRequestedAt(isoString) {
  const requestedAt = new Date(isoString)
  const diffMs = Date.now() - requestedAt.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) return '방금 전'
  if (diffMinutes < 60) return `${diffMinutes}분 전`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}시간 전`

  const month = requestedAt.getMonth() + 1
  const day = requestedAt.getDate()
  const hours = String(requestedAt.getHours()).padStart(2, '0')
  const minutes = String(requestedAt.getMinutes()).padStart(2, '0')

  return `${month}/${day} ${hours}:${minutes}`
}
