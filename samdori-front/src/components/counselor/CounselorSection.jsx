import { useCallback, useEffect } from 'react'
import AvailabilityManager from './AvailabilityManager'
import BookingRequestList from './BookingRequestList'
import './CounselorSection.css'

// 무슨 메뉴인지 구분
export const COUNSELOR_SECTION = {
  AVAILABILITY: 'availability', //시간 관리
  REQUESTS: 'requests', //예약 요청
}

export default function CounselorSection({ counselorId, section }) {
  return (
    <div className="counselor-section">
      {section === COUNSELOR_SECTION.AVAILABILITY ? (
        <AvailabilityManager counselorId={counselorId} />
      ) : (
        <BookingRequestList counselorId={counselorId} />
      )}
    </div>
  )
}
