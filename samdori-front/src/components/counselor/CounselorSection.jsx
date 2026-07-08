import AvailabilityManager from './AvailabilityManager'
import BookingRequestList from './BookingRequestList'
import ConfirmedBookingList from './ConfirmedBookingList'
import SendSlotProposal from './SendSlotProposal'
import './CounselorSection.css'

export const COUNSELOR_SECTION = {
  AVAILABILITY: 'availability',
  REQUESTS: 'requests',
  BOOKINGS: 'bookings',
  PROPOSALS: 'proposals',
}

export default function CounselorSection({ counselorId, section }) {
  return (
    <div className="counselor-section">
      {section === COUNSELOR_SECTION.AVAILABILITY && (
        <AvailabilityManager counselorId={counselorId} />
      )}
      {section === COUNSELOR_SECTION.REQUESTS && (
        <BookingRequestList counselorId={counselorId} />
      )}
      {section === COUNSELOR_SECTION.BOOKINGS && (
        <ConfirmedBookingList counselorId={counselorId} />
      )}
      {section === COUNSELOR_SECTION.PROPOSALS && (
        <SendSlotProposal counselorId={counselorId} />
      )}
    </div>
  )
}
