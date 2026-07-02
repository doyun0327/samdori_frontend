import { useEffect, useMemo, useState } from 'react'
import './AvailabilityCalendar.css'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isSameMonth(date, viewDate) {
  return (
    date.getFullYear() === viewDate.getFullYear() &&
    date.getMonth() === viewDate.getMonth()
  )
}

function getTodayKey() {
  return toDateKey(new Date())
}

function isBeforeToday(date) {
  return toDateKey(date) < getTodayKey()
}

function isToday(date) {
  return toDateKey(date) === getTodayKey()
}

export default function AvailabilityCalendar({
  selectedDate,
  openedDates,
  onChange,
  onlyOpenedSelectable = false,
}) {
  const [viewDate, setViewDate] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  const openedSet = useMemo(() => {
    const set = new Set()

    for (const dateKey of openedDates) {
      if (dateKey >= getTodayKey()) {
        set.add(dateKey)
      }
    }

    return set
  }, [openedDates])

  useEffect(() => {
    if (selectedDate && selectedDate < getTodayKey()) {
      onChange('')
    }
  }, [onChange, selectedDate])

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startOffset = firstDay.getDay()
    const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7

    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - startOffset + 1
      return new Date(year, month, dayNumber)
    })
  }, [viewDate])

  const monthLabel = `${viewDate.getFullYear()}년 ${viewDate.getMonth() + 1}월`

  const moveMonth = (offset) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1))
  }

  const selectDate = (date) => {
    if (!isSameMonth(date, viewDate) || isBeforeToday(date)) return

    const key = toDateKey(date)
    if (onlyOpenedSelectable && !openedSet.has(key)) return

    onChange(key)
  }

  return (
    <div className="availability-calendar">
      <div className="availability-calendar__header">
        <button type="button" className="availability-calendar__nav" onClick={() => moveMonth(-1)}>
          ‹
        </button>
        <h2 className="availability-calendar__month">{monthLabel}</h2>
        <button type="button" className="availability-calendar__nav" onClick={() => moveMonth(1)}>
          ›
        </button>
      </div>

      <div className="availability-calendar__weekdays">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className="availability-calendar__weekday">
            {weekday}
          </span>
        ))}
      </div>

      <div className="availability-calendar__grid">
        {calendarDays.map((date) => {
          const key = toDateKey(date)
          const inMonth = isSameMonth(date, viewDate)
          const isPast = isBeforeToday(date)
          const isOpened = !isPast && openedSet.has(key)
          const isSelected = !isPast && selectedDate === key
          const isTodayDate = isToday(date)

          // 오늘·미래만 선택 가능 (과거만 비활성)
          const isDisabled =
            !inMonth || isPast || (onlyOpenedSelectable && !isOpened)

          return (
            <button
              key={key}
              type="button"
              className={`availability-calendar__day${
                !inMonth ? ' availability-calendar__day--outside' : ''
              }${isPast ? ' availability-calendar__day--disabled' : ''}${
                isTodayDate ? ' availability-calendar__day--today' : ''
              }${isOpened ? ' availability-calendar__day--opened' : ''}${
                isSelected ? ' availability-calendar__day--selected' : ''
              }`}
              onClick={() => selectDate(date)}
              disabled={isDisabled}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
