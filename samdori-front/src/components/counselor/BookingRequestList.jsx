import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  acceptBookingRequest,
  fetchCounselorBookingRequests,
  rejectBookingRequest,
} from '../../features/booking/api/bookings'
import {
  BOOKING_STATUS,
  BOOKING_STATUS_LABEL,
} from '../../features/booking/constants'
import {
  formatBookingSchedule,
  formatRequestedAt,
} from '../../features/booking/formatBooking'
import { useBookingsUpdatedListener } from '../../features/booking/hooks/useBookingsUpdatedListener'
import './BookingRequestList.css'

const REQUEST_FILTER = {
  PENDING: 'pending',
  COMPLETED: 'completed',
}

function BookingRequestCard({ request, isProcessing, onAccept, onReject }) {
  const isPending = request.status === BOOKING_STATUS.PENDING

  return (
    <article className="booking-request-card">
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
      </p>

      {isPending && (
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
    </article>
  )
}

export default function BookingRequestList({ counselorId }) {
  const [requests, setRequests] = useState([])
  const [filter, setFilter] = useState(REQUEST_FILTER.PENDING)
  const [isLoading, setIsLoading] = useState(false)
  const [processingId, setProcessingId] = useState('')
  const [message, setMessage] = useState('')

  const loadRequests = useCallback(async () => {
    // 상담사 ID가 없으면 API 호출 없이 종료
    if (!counselorId) return

    // 목록 로딩 중 UI 표시
    setIsLoading(true)

    try {
      // 서버에서 이 상담사에게 온 예약 요청 전체 목록 조회
      const list = await fetchCounselorBookingRequests(counselorId)
      // 화면에 보여줄 예약 요청 목록 state 갱신
      setRequests(list)
    } catch (error) {
      // API 실패 시 에러 메시지 추출 (Error 객체면 message, 아니면 기본 문구)
      const errorMessage =
        error instanceof Error ? error.message : '예약 요청을 불러오지 못했습니다.'
      // 사용자에게 보여줄 안내/에러 메시지 설정
      setMessage(errorMessage)
    } finally {
      // 성공·실패와 관계없이 로딩 상태 해제
      setIsLoading(false)
    }
  }, [counselorId])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  useBookingsUpdatedListener(loadRequests)

  const filteredRequests = useMemo(() => {
    if (filter === REQUEST_FILTER.PENDING) {
      return requests.filter((request) => request.status === BOOKING_STATUS.PENDING)
    }

    return requests.filter((request) => request.status !== BOOKING_STATUS.PENDING)
  }, [filter, requests])

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
      <h1>예약 요청</h1>
      <p className="reservation-page__description">
        내담자가 보낸 예약 요청을 확인하고 수락 또는 거절할 수 있습니다.
      </p>

      <div
        className="reservation-page__mode-toggle booking-request-list__filter"
        role="tablist"
        aria-label="예약 요청 필터"
      >
        <button
          type="button"
          role="tab"
          aria-selected={filter === REQUEST_FILTER.PENDING}
          className={`reservation-page__mode-button${
            filter === REQUEST_FILTER.PENDING
              ? ' reservation-page__mode-button--active'
              : ''
          }`}
          onClick={() => {
            setFilter(REQUEST_FILTER.PENDING)
            setMessage('')
          }}
        >
          대기 중
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === REQUEST_FILTER.COMPLETED}
          className={`reservation-page__mode-button${
            filter === REQUEST_FILTER.COMPLETED
              ? ' reservation-page__mode-button--active'
              : ''
          }`}
          onClick={() => {
            setFilter(REQUEST_FILTER.COMPLETED)
            setMessage('')
          }}
        >
          처리 완료
        </button>
      </div>

      {isLoading && (
        <p className="reservation-page__loading" role="status">
          예약 요청을 불러오는 중입니다...
        </p>
      )}

      {!isLoading && filteredRequests.length === 0 && (
        <p className="reservation-page__empty-state" role="status">
          {filter === REQUEST_FILTER.PENDING
            ? '대기 중인 예약 요청이 없습니다.'
            : '처리 완료된 예약 요청이 없습니다.'}
        </p>
      )}

      {!isLoading && filteredRequests.length > 0 && (
        <ul className="booking-request-list__items">
          {filteredRequests.map((request) => (
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
    </div>
  )
}
