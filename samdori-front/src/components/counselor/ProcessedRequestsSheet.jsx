import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { formatScheduleDateHeader } from '../../features/booking/formatBooking'
import BookingRequestCard from './BookingRequestCard'
import '../client/PastBookingsSheet.css'
import './BookingRequestList.css'

function groupByDate(requests) {
  const groups = []

  requests.forEach((request) => {
    const lastGroup = groups[groups.length - 1]

    if (!lastGroup || lastGroup.date !== request.date) {
      groups.push({ date: request.date, requests: [request] })
      return
    }

    lastGroup.requests.push(request)
  })

  return groups
}

export default function ProcessedRequestsSheet({ requests, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const groups = groupByDate(requests)

  return createPortal(
    <div className="past-bookings-sheet" onClick={onClose}>
      <div
        className="past-bookings-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="processed-requests-sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="past-bookings-sheet__header">
          <h2
            id="processed-requests-sheet-title"
            className="past-bookings-sheet__title"
          >
            처리 기록
          </h2>
          <span className="past-bookings-sheet__count">{requests.length}건</span>
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
          <div className="booking-request-list__groups">
            {groups.map((group) => (
              <section key={group.date} className="booking-request-list__day-group">
                <h3 className="booking-request-list__date">
                  {formatScheduleDateHeader(group.date)}
                </h3>
                <ul className="booking-request-list__items">
                  {group.requests.map((request) => (
                    <li key={request.id}>
                      <BookingRequestCard request={request} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
