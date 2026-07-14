import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  cancelCounselorBookingRequest,
  fetchCounselorBookingRequests,
} from '../../features/booking/api/bookings'
import { BOOKING_STATUS } from '../../features/booking/constants'
import {
  clampWeekStart,
  formatScheduleDateHeader,
  formatTimeSlotRange,
  formatWeekRangeLabel,
  formatWeekdayShort,
  getMaxWeekStart,
  getMinWeekStart,
  getMondayOfWeek,
  getTimeSlotPosition,
  getTimetableHourCount,
  getTimetableHourLabels,
  getTodayDateString,
  getWeekDates,
  isUpcomingSchedule,
  shiftWeekStart,
} from '../../features/booking/formatBooking'
import { useBookingsUpdatedListener } from '../../features/booking/hooks/useBookingsUpdatedListener'
import { useAppAlert } from '../../context/AppAlertContext'
import '../client/PastBookingsSheet.css'
import './CounselorScheduleList.css'

const HOUR_LABELS = getTimetableHourLabels()
const HOUR_COUNT = getTimetableHourCount()

const BLOCK_GREEN_COLORS = [
  '#2d6a6a',
  '#3a8f6e',
  '#1f7a5c',
  '#4c9b7a',
  '#266d58',
  '#55a884',
  '#34806a',
  '#449675',
]

function getBookingBlockColor(bookingId) {
  const key = String(bookingId)
  let hash = 0

  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }

  return BLOCK_GREEN_COLORS[hash % BLOCK_GREEN_COLORS.length]
}

function ScheduleDetailSheet({
  booking,
  isCancelling,
  onClose,
  onCancel,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  if (!booking) return null

  return createPortal(
    <div className="past-bookings-sheet" onClick={onClose}>
      <div
        className="past-bookings-sheet__panel counselor-schedule-detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="past-bookings-sheet__header">
          <h2
            id="schedule-detail-title"
            className="past-bookings-sheet__title"
          >
            상담 상세
          </h2>
          <button
            type="button"
            className="past-bookings-sheet__close"
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="past-bookings-sheet__body">
          <dl className="counselor-schedule-detail__meta">
            <div>
              <dt>고객</dt>
              <dd>{booking.clientName}님</dd>
            </div>
            <div>
              <dt>일정</dt>
              <dd>{formatScheduleDateHeader(booking.date)}</dd>
            </div>
            <div>
              <dt>시간</dt>
              <dd>{formatTimeSlotRange(booking.timeSlot)}</dd>
            </div>
          </dl>

          <button
            type="button"
            className="counselor-schedule-detail__cancel"
            onClick={() => onCancel(booking.id)}
            disabled={isCancelling}
          >
            {isCancelling ? '취소 중...' : '일정 취소'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default function ConfirmedBookingList({ counselorId }) {
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [cancellingId, setCancellingId] = useState('')
  const [message, setMessage] = useState('')
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek())
  const [selectedBooking, setSelectedBooking] = useState(null)
  const { showCancelReason } = useAppAlert()

  const today = getTodayDateString()
  const minWeekStart = useMemo(() => getMinWeekStart(), [])
  const maxWeekStart = useMemo(() => getMaxWeekStart(), [])

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart])
  const canGoPrev = weekStart.getTime() > minWeekStart.getTime()
  const canGoNext = weekStart.getTime() < maxWeekStart.getTime()

  const loadBookings = useCallback(async () => {
    if (!counselorId) return

    setIsLoading(true)

    try {
      const list = await fetchCounselorBookingRequests(counselorId)
      setBookings(list)
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '상담 스케줄을 불러오지 못했습니다.'
      setMessage(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [counselorId])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  useBookingsUpdatedListener(loadBookings)

  const weekBookings = useMemo(() => {
    const dateSet = new Set(weekDates)

    return bookings.filter(
      (booking) =>
        booking.status === BOOKING_STATUS.ACCEPTED &&
        dateSet.has(booking.date) &&
        isUpcomingSchedule(booking.date, booking.timeSlot),
    )
  }, [bookings, weekDates])

  const bookingsByDate = useMemo(() => {
    const map = new Map(weekDates.map((date) => [date, []]))

    weekBookings.forEach((booking) => {
      const list = map.get(booking.date)
      if (list) list.push(booking)
    })

    return map
  }, [weekBookings, weekDates])

  const handlePrevWeek = () => {
    setWeekStart((prev) => clampWeekStart(shiftWeekStart(prev, -1)))
  }

  const handleNextWeek = () => {
    setWeekStart((prev) => clampWeekStart(shiftWeekStart(prev, 1)))
  }

  const handleCancel = async (bookingId) => {
    const reason = await showCancelReason('확정된 상담 일정을 취소하시겠습니까?')
    if (reason === null) return

    setCancellingId(bookingId)
    setMessage('')

    try {
      await cancelCounselorBookingRequest(bookingId, counselorId, reason)
      setSelectedBooking(null)
      await loadBookings()
      setMessage('상담 일정이 취소되었습니다.')
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '일정 취소에 실패했습니다.'
      setMessage(errorMessage)
    } finally {
      setCancellingId('')
    }
  }

  return (
    <div className="counselor-schedule">
      <div className="counselor-schedule__header">
        <div>
          <h1>상담 스케줄</h1>
          <p className="reservation-page__description">
            한 주 단위로 확정된 상담을 확인할 수 있습니다. 오늘부터 앞으로
            4주까지 볼 수 있습니다.
          </p>
        </div>
        {!isLoading && (
          <p className="counselor-schedule__summary" aria-live="polite">
            이번 주 <strong>{weekBookings.length}</strong>건
          </p>
        )}
      </div>

      <div className="counselor-schedule__week-nav">
        <button
          type="button"
          className="counselor-schedule__week-button"
          onClick={handlePrevWeek}
          disabled={!canGoPrev}
          aria-label="이전 주"
        >
          ‹
        </button>
        <p className="counselor-schedule__week-label">
          {formatWeekRangeLabel(weekStart)}
        </p>
        <button
          type="button"
          className="counselor-schedule__week-button"
          onClick={handleNextWeek}
          disabled={!canGoNext}
          aria-label="다음 주"
        >
          ›
        </button>
      </div>

      {isLoading && (
        <p className="reservation-page__loading" role="status">
          상담 스케줄을 불러오는 중입니다...
        </p>
      )}

      {!isLoading && (
        <div
          className="counselor-timetable"
          aria-label="주간 상담 타임테이블"
          style={{ '--timetable-hour-count': HOUR_COUNT }}
        >
          <div className="counselor-timetable__header-row">
            <div className="counselor-timetable__corner" aria-hidden="true" />
            <div className="counselor-timetable__days">
              {weekDates.map((date) => {
                const dayNumber = parseInt(date.slice(8), 10)
                const isToday = date === today

                return (
                  <div
                    key={date}
                    className={`counselor-timetable__day-header${
                      isToday ? ' counselor-timetable__day-header--today' : ''
                    }`}
                  >
                    <span className="counselor-timetable__weekday">
                      {formatWeekdayShort(date)}
                    </span>
                    <span className="counselor-timetable__daynum">{dayNumber}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="counselor-timetable__body">
            <div className="counselor-timetable__hours" aria-hidden="true">
              {HOUR_LABELS.map((hour) => (
                <div key={hour} className="counselor-timetable__hour">
                  {hour}
                </div>
              ))}
            </div>

            <div className="counselor-timetable__columns">
              {weekDates.map((date) => {
                const dayBookings = bookingsByDate.get(date) ?? []

                return (
                  <div key={date} className="counselor-timetable__column">
                    {HOUR_LABELS.map((hour, hourIndex) => {
                      const startingBookings = dayBookings.filter((booking) => {
                        const position = getTimeSlotPosition(booking.timeSlot)
                        return (
                          position != null &&
                          Math.abs(position.topHours - hourIndex) < 0.001
                        )
                      })

                      return (
                        <div
                          key={`${date}-${hour}`}
                          className="counselor-timetable__cell"
                        >
                          {startingBookings.map((booking) => {
                            const position = getTimeSlotPosition(booking.timeSlot)
                            if (!position) return null

                            return (
                              <button
                                key={booking.id}
                                type="button"
                                className="counselor-timetable__block"
                                style={{
                                  height: `calc(var(--timetable-hour-height) * ${position.heightHours})`,
                                  backgroundColor: getBookingBlockColor(booking.id),
                                }}
                                onClick={() => setSelectedBooking(booking)}
                                title={`${booking.clientName} · ${formatTimeSlotRange(booking.timeSlot)}`}
                              >
                                <span className="counselor-timetable__block-name">
                                  {booking.clientName}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {message && (
        <p className="reservation-page__message" role="status">
          {message}
        </p>
      )}

      {selectedBooking && (
        <ScheduleDetailSheet
          booking={selectedBooking}
          isCancelling={cancellingId === selectedBooking.id}
          onClose={() => setSelectedBooking(null)}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
