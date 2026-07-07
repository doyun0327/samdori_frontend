import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import ClientBookingCard from './ClientBookingCard'
import './PastBookingsSheet.css'

export default function PastBookingsSheet({ bookings, onClose }) {
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

  return createPortal(
    <div className="past-bookings-sheet" onClick={onClose}>
      <div
        className="past-bookings-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="past-bookings-sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="past-bookings-sheet__header">
          <h2 id="past-bookings-sheet-title" className="past-bookings-sheet__title">
            지난 상담
          </h2>
          <span className="past-bookings-sheet__count">{bookings.length}건</span>
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
          <ul className="client-booking-list">
            {bookings.map((booking) => (
              <li key={booking.id}>
                <ClientBookingCard booking={booking} isUpcoming={false} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>,
    document.body,
  )
}
