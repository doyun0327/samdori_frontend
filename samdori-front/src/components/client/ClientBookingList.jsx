import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  cancelClientBookingRequest,
  fetchClientBookingRequests,
} from '../../features/booking/api/bookings'
import { BOOKING_STATUS } from '../../features/booking/constants'
import { isUpcomingSchedule } from '../../features/booking/formatBooking'
import { countPendingBookings } from '../../features/booking/bookingUtils'
import { useBookingsUpdatedListener } from '../../features/booking/hooks/useBookingsUpdatedListener'
import { useAppAlert } from '../../context/AppAlertContext'
import ClientBookingCard from './ClientBookingCard'
import PastBookingsSheet from './PastBookingsSheet'
import './ClientBookingList.css'

function isUpcomingBooking(booking) {
  if (
    booking.status === BOOKING_STATUS.REJECTED ||
    booking.status === BOOKING_STATUS.CANCELLED ||
    booking.cancelledAt ||
    booking.cancelledBy
  ) {
    return false
  }

  return isUpcomingSchedule(booking.date, booking.timeSlot)
}

function sortByScheduleAsc(a, b) {
  const dateCompare = a.date.localeCompare(b.date)
  if (dateCompare !== 0) return dateCompare

  return (a.timeSlot ?? '').localeCompare(b.timeSlot ?? '')
}

function sortByScheduleDesc(a, b) {
  return sortByScheduleAsc(b, a)
}

export default function ClientBookingList({ clientId, onPendingCountChange }) {
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [cancellingId, setCancellingId] = useState('')
  const [message, setMessage] = useState('')
  const [isPastModalOpen, setIsPastModalOpen] = useState(false)
  const { showCancelReason } = useAppAlert()

  const loadBookings = useCallback(async () => {
    if (!clientId) {
      setBookings([])
      onPendingCountChange?.(0)
      return
    }

    setIsLoading(true)

    try {
      const list = await fetchClientBookingRequests(clientId)
      setBookings(list)
      onPendingCountChange?.(countPendingBookings(list))
    } catch {
      setBookings([])
      onPendingCountChange?.(0)
    } finally {
      setIsLoading(false)
    }
  }, [clientId, onPendingCountChange])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  useBookingsUpdatedListener(loadBookings)

  const { upcomingBookings, pastBookings } = useMemo(() => {
    const upcoming = []
    const past = []

    bookings.forEach((booking) => {
      if (isUpcomingBooking(booking)) {
        upcoming.push(booking)
        return
      }

      past.push(booking)
    })

    return {
      upcomingBookings: [...upcoming].sort(sortByScheduleAsc),
      pastBookings: [...past].sort(sortByScheduleDesc),
    }
  }, [bookings])

  const handleCancel = async (bookingId) => {
    const reason = await showCancelReason('예약을 취소하시겠습니까?')
    if (reason === null) return

    setCancellingId(bookingId)
    setMessage('')

    try {
      await cancelClientBookingRequest(bookingId, clientId, reason)
      await loadBookings()
      setMessage('예약이 취소되었습니다.')
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '예약 취소에 실패했습니다.'
      setMessage(errorMessage)
    } finally {
      setCancellingId('')
    }
  }

  if (isLoading) {
    return (
      <p className="reservation-page__loading" role="status">
        내 예약을 불러오는 중입니다...
      </p>
    )
  }

  if (bookings.length === 0) {
    return (
      <p className="reservation-page__empty-state" role="status">
        아직 예약 내역이 없습니다. 새 예약을 신청해 보세요.
      </p>
    )
  }

  return (
    <>
      <section className="client-booking-upcoming">
        <div className="client-booking-upcoming__header">
          <h2 className="client-booking-upcoming__title">남은 상담</h2>
          {upcomingBookings.length > 0 && (
            <span className="client-booking-upcoming__count">
              {upcomingBookings.length}건
            </span>
          )}
        </div>

        {upcomingBookings.length === 0 ? (
          <p className="client-booking-upcoming__empty" role="status">
            남은 상담 일정이 없습니다.
          </p>
        ) : (
          <ul className="client-booking-list">
            {upcomingBookings.map((booking) => (
              <li key={booking.id}>
                <ClientBookingCard
                  booking={booking}
                  isUpcoming
                  isCancelling={cancellingId === booking.id}
                  onCancel={handleCancel}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {pastBookings.length > 0 && (
        <button
          type="button"
          className="client-booking-past-link"
          onClick={() => setIsPastModalOpen(true)}
        >
          <span>지난 상담 {pastBookings.length}건 보기</span>
          <span className="client-booking-past-link__arrow" aria-hidden="true">
            ›
          </span>
        </button>
      )}

      {isPastModalOpen && (
        <PastBookingsSheet
          bookings={pastBookings}
          onClose={() => setIsPastModalOpen(false)}
        />
      )}

      {message && (
        <p className="reservation-page__message" role="status">
          {message}
        </p>
      )}
    </>
  )
}
