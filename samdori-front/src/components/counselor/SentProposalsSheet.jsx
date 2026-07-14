import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  formatScheduleDateHeader,
  formatTimeSlotRange,
} from '../../features/booking/formatBooking'
import {
  SLOT_PROPOSAL_STATUS_LABEL,
} from '../../features/slotProposal/constants'
import '../client/PastBookingsSheet.css'

function sortProposalsDesc(a, b) {
  return String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
}

export default function SentProposalsSheet({ proposals, onClose }) {
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

  const sorted = [...proposals].sort(sortProposalsDesc)

  return createPortal(
    <div className="past-bookings-sheet" onClick={onClose}>
      <div
        className="past-bookings-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sent-proposals-sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="past-bookings-sheet__header">
          <h2
            id="sent-proposals-sheet-title"
            className="past-bookings-sheet__title"
          >
            보낸 제안 기록
          </h2>
          <span className="past-bookings-sheet__count">{proposals.length}건</span>
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
          {sorted.length === 0 ? (
            <p className="reservation-page__empty-state" role="status">
              보낸 제안 기록이 없습니다.
            </p>
          ) : (
            <ul className="sent-proposals-sheet__list">
              {sorted.map((proposal) => (
                <li key={proposal.id} className="sent-proposals-sheet__item">
                  <div className="sent-proposals-sheet__item-top">
                    <p className="sent-proposals-sheet__client">
                      {proposal.clientName || '고객'}
                    </p>
                    <span className="sent-proposals-sheet__status">
                      {SLOT_PROPOSAL_STATUS_LABEL[proposal.status] ??
                        proposal.status}
                    </span>
                  </div>
                  {proposal.message?.trim() && (
                    <p className="sent-proposals-sheet__message">
                      {proposal.message}
                    </p>
                  )}
                  <ul className="sent-proposals-sheet__slots">
                    {proposal.slots.map((slot) => (
                      <li key={`${slot.date}-${slot.timeSlot}`}>
                        {formatScheduleDateHeader(slot.date)}{' '}
                        {formatTimeSlotRange(slot.timeSlot)}
                        {slot.status ? ` · ${slot.status}` : ''}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
