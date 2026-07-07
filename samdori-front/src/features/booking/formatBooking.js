const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function toLocalDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function getTimeSlotEndDate(date, timeSlot) {
  const endTime = timeSlot?.split('-')[1]?.trim()

  if (!endTime) {
    return new Date(`${date}T23:59:59`)
  }

  return new Date(`${date}T${endTime}:00`)
}

export function isUpcomingSchedule(date, timeSlot, now = new Date()) {
  if (!date) return false

  const today = toLocalDateString(now)

  if (date < today) return false
  if (date > today) return true

  return getTimeSlotEndDate(date, timeSlot).getTime() > now.getTime()
}

export function formatScheduleDateHeader(date, now = new Date()) {
  const parsed = new Date(`${date}T00:00:00`)
  const weekday = WEEKDAYS[parsed.getDay()]
  const month = parsed.getMonth() + 1
  const day = parsed.getDate()
  const label = `${month}월 ${day}일 (${weekday})`

  if (date === toLocalDateString(now)) {
    return `오늘 · ${label}`
  }

  return label
}

export function formatTimeSlotRange(timeSlot) {
  if (!timeSlot) return ''

  const [start, end] = timeSlot.split('-').map((part) => part.trim())
  if (!start || !end) return timeSlot

  return `${start} ~ ${end}`
}

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
