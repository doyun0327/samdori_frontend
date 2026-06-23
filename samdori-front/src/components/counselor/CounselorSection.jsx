import { useCallback, useEffect } from 'react'
import { fetchCounselorBookingRequests } from '../../features/booking/api/bookings'
import { BOOKING_STATUS } from '../../features/booking/constants'
import AvailabilityManager from './AvailabilityManager'
import BookingRequestList from './BookingRequestList'
import './CounselorSection.css'

// 무슨 메뉴인지 구분
export const COUNSELOR_SECTION = {
  AVAILABILITY: 'availability', //시간 관리
  REQUESTS: 'requests', //예약 요청
}

const BOOKINGS_UPDATED_EVENT = 'samdori-bookings-updated'

export default function CounselorSection({
  counselorId,
  section,
  onPendingCountChange, //대기 중(PENDING) 예약이 몇 건인지」 부모에게 알려주는 콜백 함수
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
