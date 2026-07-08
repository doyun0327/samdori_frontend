import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  acceptBookingRequest,
  fetchCounselorBookingRequests,
  rejectBookingRequest,
} from '../../features/booking/api/bookings'
import { BOOKING_STATUS } from '../../features/booking/constants'
import { isUpcomingSchedule } from '../../features/booking/formatBooking'
import { useBookingsUpdatedListener } from '../../features/booking/hooks/useBookingsUpdatedListener'
import BookingRequestCard from './BookingRequestCard'
import ProcessedRequestsSheet from './ProcessedRequestsSheet'
import './BookingRequestList.css'

function sortByScheduleDesc(a, b) {
  const dateCompare = b.date.localeCompare(a.date)
  if (dateCompare !== 0) return dateCompare

  return (b.timeSlot ?? '').localeCompare(a.timeSlot ?? '')
}

function sortByScheduleAsc(a, b) {
  return sortByScheduleDesc(b, a)
}

function isProcessedRecord(request) {
  if (request.status === BOOKING_STATUS.PENDING) return false

  if (
    request.status === BOOKING_STATUS.ACCEPTED &&
    isUpcomingSchedule(request.date, request.timeSlot)
  ) {
    return false
  }

  return true
}

export default function BookingRequestList({ counselorId }) {
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [processingId, setProcessingId] = useState('')
  const [message, setMessage] = useState('')
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const loadRequests = useCallback(async () => {
    if (!counselorId) return

    setIsLoading(true)

    try {
      const list = await fetchCounselorBookingRequests(counselorId)
      setRequests(list)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '예약 요청을 불러오지 못했습니다.'
      setMessage(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [counselorId])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  useBookingsUpdatedListener(loadRequests)

  const pendingRequests = useMemo(
    () =>
      requests
        .filter((request) => request.status === BOOKING_STATUS.PENDING)
        .sort(sortByScheduleAsc),
    [requests],
  )

  const pendingRequestIds = useMemo(
    () => pendingRequests.map((request) => request.id),
    [pendingRequests],
  )

  const prevPendingIdsRef = useRef(null)

  useEffect(() => {
    const currentIds = new Set(pendingRequestIds)
    const prevIds = prevPendingIdsRef.current

    if (prevIds !== null) {
      const hasNewPending = pendingRequestIds.some((id) => !prevIds.has(id))
      if (hasNewPending) {
        setMessage('')
      }
    }

    prevPendingIdsRef.current = currentIds
  }, [pendingRequestIds])

  const processedRecords = useMemo(
    () => requests.filter(isProcessedRecord).sort(sortByScheduleDesc),
    [requests],
  )

  const handleAccept = async (requestId) => {
    setProcessingId(requestId)
    setMessage('')

    try {
      await acceptBookingRequest(requestId, counselorId)
      await loadRequests()
      setMessage('예약 요청을 수락했습니다.')
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '예약 수락에 실패했습니다.'
      setMessage(errorMessage)
    } finally {
      setProcessingId('')
    }
  }

  const handleReject = async (requestId) => {
    const confirmed = window.confirm('이 예약 요청을 거절하시겠습니까?')
    if (!confirmed) return

    setProcessingId(requestId)
    setMessage('')

    try {
      await rejectBookingRequest(requestId, counselorId)
      await loadRequests()
      setMessage('예약 요청을 거절했습니다.')
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '예약 거절에 실패했습니다.'
      setMessage(errorMessage)
    } finally {
      setProcessingId('')
    }
  }

  return (
    <div className="booking-request-list">
      <div className="booking-request-list__header">
        <h1>예약 요청</h1>
        {pendingRequests.length > 0 && (
          <span className="booking-request-list__pending-count">
            대기 {pendingRequests.length}건
          </span>
        )}
      </div>
      <p className="reservation-page__description">
        대기 중인 예약 요청을 수락하거나 거절할 수 있습니다. 확정된 일정은
        상담 스케줄에서 확인하세요.
      </p>

      {isLoading && (
        <p className="reservation-page__loading" role="status">
          예약 요청을 불러오는 중입니다...
        </p>
      )}

      {!isLoading && pendingRequests.length === 0 && (
        <p className="reservation-page__empty-state" role="status">
          대기 중인 예약 요청이 없습니다.
        </p>
      )}

      {!isLoading && pendingRequests.length > 0 && (
        <ul className="booking-request-list__items">
          {pendingRequests.map((request) => (
            <li key={request.id}>
              <BookingRequestCard
                request={request}
                isProcessing={processingId === request.id}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            </li>
          ))}
        </ul>
      )}

      {message && (
        <p className="reservation-page__message" role="status">
          {message}
        </p>
      )}

      {!isLoading && processedRecords.length > 0 && (
        <button
          type="button"
          className="booking-request-list__history-link"
          onClick={() => setIsHistoryOpen(true)}
        >
          <span>처리 기록 {processedRecords.length}건 보기</span>
          <span className="booking-request-list__history-link-arrow" aria-hidden="true">
            ›
          </span>
        </button>
      )}

      {isHistoryOpen && (
        <ProcessedRequestsSheet
          requests={processedRecords}
          onClose={() => setIsHistoryOpen(false)}
        />
      )}
    </div>
  )
}
