import { useCallback, useEffect } from 'react'
import { fetchCounselorBookingRequests } from '../../features/booking/api/bookings'
import { BOOKING_STATUS } from '../../features/booking/constants'
import AvailabilityManager from './AvailabilityManager'
import BookingRequestList from './BookingRequestList'
import './CounselorSection.css'

export const COUNSELOR_SECTION = {
  AVAILABILITY: 'availability',
  REQUESTS: 'requests',
}

const BOOKINGS_UPDATED_EVENT = 'samdori-bookings-updated'

export default function CounselorSection({
  counselorId,
  section,
  onPendingCountChange,
}) {
  const loadPendingCount = useCallback(async () => {
    if (!counselorId) return

    try {
      const requests = await fetchCounselorBookingRequests(counselorId)
      const count = requests.filter(
        (request) => request.status === BOOKING_STATUS.PENDING,
      ).length
      onPendingCountChange?.(count)
    } catch {
      onPendingCountChange?.(0)
    }
  }, [counselorId, onPendingCountChange])

  useEffect(() => {
    loadPendingCount()
  }, [loadPendingCount])

  useEffect(() => {
    const handleBookingsUpdated = () => {
      loadPendingCount()
    }

    window.addEventListener(BOOKINGS_UPDATED_EVENT, handleBookingsUpdated)
    return () => {
      window.removeEventListener(BOOKINGS_UPDATED_EVENT, handleBookingsUpdated)
    }
  }, [loadPendingCount])

  return (
    <div className="counselor-section">
      {section === COUNSELOR_SECTION.AVAILABILITY ? (
        <AvailabilityManager counselorId={counselorId} />
      ) : (
        <BookingRequestList
          counselorId={counselorId}
          onPendingCountChange={onPendingCountChange}
        />
      )}
    </div>
  )
}
