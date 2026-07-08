import {
  BOOKING_STATUS,
  BOOKING_STATUS_LABEL,
} from '../../features/booking/constants'
import {
  formatBookingSchedule,
  formatRequestedAt,
  isUpcomingSchedule,
} from '../../features/booking/formatBooking'
import './BookingRequestList.css'

export default function BookingRequestCard({
  request,
  isProcessing = false,
  isCancelling = false,
  onAccept,
  onReject,
  onCancel,
}) {
  const isPending = request.status === BOOKING_STATUS.PENDING
  const isPast = !isUpcomingSchedule(request.date, request.timeSlot)
  const canCancel =
    Boolean(onCancel) &&
    request.status === BOOKING_STATUS.ACCEPTED &&
    isUpcomingSchedule(request.date, request.timeSlot)

  return (
    <article
      className={`booking-request-card${
        isPast ? ' booking-request-card--past' : ''
      }`}
    >
      <div className="booking-request-card__header">
        <p className="booking-request-card__client">{request.clientName}님</p>
        <span
          className={`booking-request-card__status booking-request-card__status--${request.status.toLowerCase()}`}
        >
          {BOOKING_STATUS_LABEL[request.status]}
        </span>
      </div>

      <p className="booking-request-card__schedule">
        {formatBookingSchedule(request.date, request.timeSlot)}
      </p>
      <p className="booking-request-card__meta">
        요청 {formatRequestedAt(request.requestedAt)}
        {request.respondedAt &&
          ` · 처리 ${formatRequestedAt(request.respondedAt)}`}
        {request.cancelReason && ` · 사유 ${request.cancelReason}`}
      </p>

      {isPending && onAccept && onReject && (
        <div className="booking-request-card__actions">
          <button
            type="button"
            className="booking-request-card__accept"
            onClick={() => onAccept(request.id)}
            disabled={isProcessing}
          >
            {isProcessing ? '처리 중...' : '수락'}
          </button>
          <button
            type="button"
            className="booking-request-card__reject"
            onClick={() => onReject(request.id)}
            disabled={isProcessing}
          >
            거절
          </button>
        </div>
      )}

      {canCancel && (
        <button
          type="button"
          className="booking-request-card__cancel"
          onClick={() => onCancel(request.id)}
          disabled={isCancelling}
        >
          {isCancelling ? '취소 중...' : '취소하기'}
        </button>
      )}
    </article>
  )
}
