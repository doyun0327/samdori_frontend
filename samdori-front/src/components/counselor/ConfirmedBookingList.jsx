import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchCounselorBookingRequests } from '../../features/booking/api/bookings'
import { BOOKING_STATUS } from '../../features/booking/constants'
import {
  formatScheduleDateHeader,
  formatTimeSlotRange,
  isUpcomingSchedule,
} from '../../features/booking/formatBooking'
import { useBookingsUpdatedListener } from '../../features/booking/hooks/useBookingsUpdatedListener'
import './CounselorScheduleList.css'

function sortBySchedule(bookings) {
  return [...bookings].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date)
    if (dateCompare !== 0) return dateCompare

    return (a.timeSlot ?? '').localeCompare(b.timeSlot ?? '')
  })
}

function groupByDate(bookings) {
  const groups = []

  bookings.forEach((booking) => {
    const lastGroup = groups[groups.length - 1]

    if (!lastGroup || lastGroup.date !== booking.date) {
      groups.push({ date: booking.date, bookings: [booking] })
      return
    }

    lastGroup.bookings.push(booking)
  })

  return groups
}

function ScheduleBookingItem({ booking }) {
  return (
    <li className="counselor-schedule__item">
      <time className="counselor-schedule__time" dateTime={booking.timeSlot}>
        {formatTimeSlotRange(booking.timeSlot)}
      </time>
      <div className="counselor-schedule__details">
        <p className="counselor-schedule__client">{booking.clientName}님</p>
        <span className="counselor-schedule__status">확정</span>
      </div>
    </li>
  )
}

export default function ConfirmedBookingList({ counselorId }) {
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const loadBookings = useCallback(async () => {
    if (!counselorId) return

    setIsLoading(true)

    try {
      const list = await fetchCounselorBookingRequests(counselorId)
      setBookings(list)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '상담 스케줄을 불러오지 못했습니다.'
      setMessage(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [counselorId])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  useBookingsUpdatedListener(loadBookings)

  const upcomingSchedules = useMemo(() => {
    const upcoming = bookings.filter(
      (booking) =>
        booking.status === BOOKING_STATUS.ACCEPTED &&
        isUpcomingSchedule(booking.date, booking.timeSlot),
    )

    return groupByDate(sortBySchedule(upcoming))
  }, [bookings])

  const upcomingCount = useMemo(
    () => upcomingSchedules.reduce((count, group) => count + group.bookings.length, 0),
    [upcomingSchedules],
  )

  return (
    <div className="counselor-schedule">
      <div className="counselor-schedule__header">
        <div>
          <h1>상담 스케줄</h1>
          <p className="reservation-page__description">
            아직 진행되지 않은 확정 상담 일정만 모아서 확인할 수 있습니다.
          </p>
        </div>
        {!isLoading && upcomingCount > 0 && (
          <p className="counselor-schedule__summary" aria-live="polite">
            남은 상담 <strong>{upcomingCount}</strong>건
          </p>
        )}
      </div>

      {isLoading && (
        <p className="reservation-page__loading" role="status">
          상담 스케줄을 불러오는 중입니다...
        </p>
      )}

      {!isLoading && upcomingCount === 0 && (
        <p className="reservation-page__empty-state" role="status">
          남은 상담 일정이 없습니다.
        </p>
      )}

      {!isLoading && upcomingCount > 0 && (
        <div className="counselor-schedule__days">
          {upcomingSchedules.map((group) => (
            <section key={group.date} className="counselor-schedule__day">
              <h2 className="counselor-schedule__date">
                {formatScheduleDateHeader(group.date)}
              </h2>
              <ul className="counselor-schedule__items">
                {group.bookings.map((booking) => (
                  <ScheduleBookingItem key={booking.id} booking={booking} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {message && (
        <p className="reservation-page__message" role="status">
          {message}
        </p>
      )}
    </div>
  )
}
