import { useMemo, useState } from 'react'
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

function isPastDate(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return target < today
}

function isToday(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return target.getTime() === today.getTime()
}

export default function AvailabilityCalendar({ selectedDate, openedDates, onChange }) {
  const [viewDate, setViewDate] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  const openedSet = useMemo(() => new Set(openedDates), [openedDates])

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
    if (!isSameMonth(date, viewDate) || isPastDate(date)) return
    onChange(toDateKey(date))
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
          const isPast = isPastDate(date)
          const isOpened = openedSet.has(key)
          const isSelected = selectedDate === key
          const isTodayDate = isToday(date)

          const isDisabled = !inMonth || isPast

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
