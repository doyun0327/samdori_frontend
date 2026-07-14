const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const WEEKDAYS_MON_FIRST = ['월', '화', '수', '목', '금', '토', '일']

export const TIMETABLE_HOUR_START = 9
export const TIMETABLE_HOUR_END = 22
export const TIMETABLE_WEEK_COUNT = 4

function toLocalDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function parseLocalDate(dateString) {
  return new Date(`${dateString}T00:00:00`)
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** 해당 날짜가 속한 주의 월요일 (로컬 기준) */
export function getMondayOfWeek(date = new Date()) {
  const base = date instanceof Date ? new Date(date) : parseLocalDate(date)
  const day = base.getDay()
  const offset = day === 0 ? -6 : 1 - day
  base.setHours(0, 0, 0, 0)
  return addDays(base, offset)
}

export function getMinWeekStart(now = new Date()) {
  return getMondayOfWeek(now)
}

export function getMaxWeekStart(now = new Date()) {
  return addDays(getMinWeekStart(now), (TIMETABLE_WEEK_COUNT - 1) * 7)
}

export function shiftWeekStart(weekStart, weekDelta) {
  return addDays(
    weekStart instanceof Date ? weekStart : parseLocalDate(weekStart),
    weekDelta * 7,
  )
}

export function clampWeekStart(weekStart, now = new Date()) {
  const min = getMinWeekStart(now)
  const max = getMaxWeekStart(now)
  const current =
    weekStart instanceof Date ? weekStart : parseLocalDate(weekStart)

  if (current.getTime() < min.getTime()) return min
  if (current.getTime() > max.getTime()) return max
  return current
}

/** 월요일부터 일요일까지 7일 YYYY-MM-DD */
export function getWeekDates(weekStart) {
  const monday =
    weekStart instanceof Date ? weekStart : parseLocalDate(weekStart)

  return Array.from({ length: 7 }, (_, index) =>
    toLocalDateString(addDays(monday, index)),
  )
}

export function formatWeekRangeLabel(weekStart) {
  const dates = getWeekDates(weekStart)
  const start = parseLocalDate(dates[0])
  const end = parseLocalDate(dates[6])

  const startLabel = `${start.getMonth() + 1}월 ${start.getDate()}일`
  const endLabel =
    start.getMonth() === end.getMonth()
      ? `${end.getDate()}일`
      : `${end.getMonth() + 1}월 ${end.getDate()}일`

  return `${startLabel} ~ ${endLabel}`
}

export function formatWeekdayShort(dateString) {
  const parsed = parseLocalDate(dateString)
  return WEEKDAYS[parsed.getDay()]
}

export function getWeekdayLabelsMonFirst() {
  return WEEKDAYS_MON_FIRST
}

function parseClockToMinutes(clock) {
  if (!clock) return null
  const [hours, minutes] = clock.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

/**
 * 타임테이블 한 칸(=1시간) 배수로 위치 계산.
 * 예: 17:00-18:00 → topHours 11, heightHours 1 (06시 기준)
 */
export function getTimeSlotPosition(timeSlot) {
  const [startClock, endClock] = String(timeSlot ?? '')
    .split('-')
    .map((part) => part.trim())

  const startMinutes = parseClockToMinutes(startClock)
  const endMinutes = parseClockToMinutes(endClock)

  if (startMinutes == null || endMinutes == null) return null

  const rangeStart = TIMETABLE_HOUR_START * 60
  const rangeEnd = TIMETABLE_HOUR_END * 60

  const clampedStart = Math.max(startMinutes, rangeStart)
  const clampedEnd = Math.min(endMinutes, rangeEnd)

  if (clampedEnd <= clampedStart) return null

  return {
    topHours: (clampedStart - rangeStart) / 60,
    heightHours: (clampedEnd - clampedStart) / 60,
  }
}

export function getTimetableHourCount() {
  return TIMETABLE_HOUR_END - TIMETABLE_HOUR_START
}

export function getTimetableHourLabels() {
  const labels = []
  for (let hour = TIMETABLE_HOUR_START; hour < TIMETABLE_HOUR_END; hour += 1) {
    labels.push(String(hour).padStart(2, '0'))
  }
  return labels
}

export function getTodayDateString(now = new Date()) {
  return toLocalDateString(now)
}

export function getTimeSlotEndDate(date, timeSlot) {
  const endTime = timeSlot?.split('-')[1]?.trim()

  if (!endTime) {
    return new Date(`${date}T23:59:59`)
  }

  return new Date(`${date}T${endTime}:00`)
}

export function getTimeSlotStartDate(date, timeSlot) {
  const startTime = timeSlot?.split('-')[0]?.trim()

  if (!startTime) {
    return new Date(`${date}T00:00:00`)
  }

  return new Date(`${date}T${startTime}:00`)
}

/** 예약·스케줄이 아직 끝나지 않았는지 (종료 시각 기준) */
export function isUpcomingSchedule(date, timeSlot, now = new Date()) {
  if (!date) return false

  const today = toLocalDateString(now)

  if (date < today) return false
  if (date > today) return true

  return getTimeSlotEndDate(date, timeSlot).getTime() > now.getTime()
}

/** 슬롯 시작 시각이 현재보다 미래인지 (시간 보내기 등 시작 시각 기준) */
export function isFutureTimeSlot(date, timeSlot, now = new Date()) {
  if (!date) return false

  const today = toLocalDateString(now)

  if (date < today) return false
  if (date > today) return true

  return getTimeSlotStartDate(date, timeSlot).getTime() > now.getTime()
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
