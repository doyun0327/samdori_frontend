import { useCallback, useEffect, useState } from 'react'
import {
  cancelClientBookingRequest,
  fetchClientBookingRequests,
} from '../../features/booking/api/bookings'
import {
  BOOKING_STATUS,
  BOOKING_STATUS_LABEL,
} from '../../features/booking/constants'
import {
  formatBookingSchedule,
  formatRequestedAt,
} from '../../features/booking/formatBooking'
import { countPendingBookings } from '../../features/booking/bookingUtils'
import { useBookingsUpdatedListener } from '../../features/booking/hooks/useBookingsUpdatedListener'
import './ClientBookingList.css'

function ClientBookingCard({ booking, isCancelling, onCancel }) {
  const canCancel = booking.status === BOOKING_STATUS.PENDING

  return (
    <article className="client-booking-card">
      <div className="client-booking-card__header">
        <p className="client-booking-card__counselor">
          {booking.counselorName ?? '상담사'}
        </p>
        <span
          className={`client-booking-card__status client-booking-card__status--${booking.status.toLowerCase()}`}
        >
          {BOOKING_STATUS_LABEL[booking.status]}
        </span>
      </div>

      <p className="client-booking-card__schedule">
        {formatBookingSchedule(booking.date, booking.timeSlot)}
      </p>

      <p className="client-booking-card__meta">
        요청 {formatRequestedAt(booking.requestedAt)}
        {booking.respondedAt &&
          ` · 처리 ${formatRequestedAt(booking.respondedAt)}`}
        {booking.cancelledAt &&
          ` · 취소 ${formatRequestedAt(booking.cancelledAt)}`}
      </p>

      {booking.status === BOOKING_STATUS.PENDING && (
        <p className="client-booking-card__hint">
          상담사 승인을 기다리는 중입니다.
        </p>
      )}

      {booking.status === BOOKING_STATUS.ACCEPTED && (
        <p className="client-booking-card__hint client-booking-card__hint--accepted">
          예약이 확정되었습니다.
        </p>
      )}

      {booking.status === BOOKING_STATUS.REJECTED && (
        <p className="client-booking-card__hint client-booking-card__hint--rejected">
          상담사가 예약을 거절했습니다. 다른 시간을 선택해 주세요.
        </p>
      )}

      {booking.status === BOOKING_STATUS.CANCELLED && (
        <p className="client-booking-card__hint client-booking-card__hint--rejected">
          예약을 취소했습니다.
        </p>
      )}

      {canCancel && (
        <button
          type="button"
          className="client-booking-card__cancel"
          onClick={() => onCancel(booking.id)}
          disabled={isCancelling}
        >
          {isCancelling ? '취소 중...' : '예약 취소'}
        </button>
      )}
    </article>
  )
}

export default function ClientBookingList({ clientId, onPendingCountChange }) {
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [cancellingId, setCancellingId] = useState('')
  const [message, setMessage] = useState('')

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

  const handleCancel = async (bookingId) => {
    const confirmed = window.confirm('이 예약을 취소하시겠습니까?')
    if (!confirmed) return

    setCancellingId(bookingId)
    setMessage('')

    try {
      await cancelClientBookingRequest(bookingId, clientId)
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
      <ul className="client-booking-list">
        {bookings.map((booking) => (
          <li key={booking.id}>
            <ClientBookingCard
              booking={booking}
              isCancelling={cancellingId === booking.id}
              onCancel={handleCancel}
            />
          </li>
        ))}
      </ul>

      {message && (
        <p className="reservation-page__message" role="status">
          {message}
        </p>
      )}
    </>
  )
}
