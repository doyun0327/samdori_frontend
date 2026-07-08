import {
  BOOKING_STATUS,
  BOOKING_STATUS_LABEL,
} from '../../features/booking/constants'
import { canClientCancelBooking } from '../../features/booking/bookingUtils'
import {
  formatBookingSchedule,
  formatRequestedAt,
} from '../../features/booking/formatBooking'
import './ClientBookingList.css'

export default function ClientBookingCard({
  booking,
  isUpcoming = false,
  isCancelling = false,
  onCancel,
}) {
  const canCancel = Boolean(onCancel) && canClientCancelBooking(booking, isUpcoming)

  return (
    <article
      className={`client-booking-card${
        isUpcoming ? '' : ' client-booking-card--past'
      }`}
    >
      <div className="client-booking-card__header">
        <p className="client-booking-card__counselor">
          {booking.counselorName ?? '상담사'}
        </p>
        <div className="client-booking-card__badges">
          {isUpcoming && booking.status === BOOKING_STATUS.ACCEPTED && (
            <span className="client-booking-card__timeline client-booking-card__timeline--upcoming">
              예정
            </span>
          )}
          <span
            className={`client-booking-card__status client-booking-card__status--${booking.status.toLowerCase()}`}
          >
            {BOOKING_STATUS_LABEL[booking.status]}
          </span>
        </div>
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

      {booking.status === BOOKING_STATUS.PENDING && isUpcoming && (
        <p className="client-booking-card__hint">
          상담사 승인을 기다리는 중입니다.
        </p>
      )}

      {booking.status === BOOKING_STATUS.ACCEPTED && isUpcoming && (
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
          {booking.cancelledBy === 'COUNSELOR'
            ? '상담사가 예약을 취소했습니다.'
            : '예약이 취소되었습니다.'}
          {booking.cancelReason && (
            <>
              <br />
              사유: {booking.cancelReason}
            </>
          )}
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
