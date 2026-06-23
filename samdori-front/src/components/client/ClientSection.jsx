import { useEffect, useState } from 'react'
import ClientBookingList from './ClientBookingList'
import ClientBookingSection from './ClientBookingSection'
import { markClientResponsesAsRead } from '../../features/booking/clientBookingNotifications'
import { fetchClientBookingRequests } from '../../features/booking/api/bookings'
import '../counselor/CounselorSection.css'
import './ClientBookingList.css'

export const CLIENT_SECTION = {
  BOOK: 'book',
  LIST: 'list',
}

export default function ClientSection({
  clientName,
  clientId,
  section, // 지금 탭 (book / list)
  onSectionChange,//탭 바꿀 때 
  onResponsesViewed,//🔔 알림 숫자 다시 계산 (읽음 처리 후)
}) {
  const [pendingTabCount, setPendingTabCount] = useState(0)

  const listTabLabel =
    pendingTabCount > 0 ? `내 예약 (${pendingTabCount})` : '내 예약'

  const handleBookingCreated = () => {
    onSectionChange(CLIENT_SECTION.LIST)
  }

  useEffect(() => {
    if (section !== CLIENT_SECTION.LIST || !clientId) return undefined

    let cancelled = false

    async function markResponsesRead() {
      try {
        const bookings = await fetchClientBookingRequests(clientId)
        if (!cancelled) {
          markClientResponsesAsRead(clientId, bookings)
          onResponsesViewed?.()
        }
      } catch {
        if (!cancelled) {
          onResponsesViewed?.()
        }
      }
    }

    markResponsesRead()

    return () => {
      cancelled = true
    }
  }, [section, clientId, onResponsesViewed])

  return (
    <div className="counselor-section">
      <div
        className="reservation-page__section-toggle"
        role="tablist"
        aria-label="내담자 메뉴"
      >
        <button
          type="button"
          role="tab"
          aria-selected={section === CLIENT_SECTION.BOOK}
          className={`reservation-page__section-button${
            section === CLIENT_SECTION.BOOK
              ? ' reservation-page__section-button--active'
              : ''
          }`}
          onClick={() => onSectionChange(CLIENT_SECTION.BOOK)}
        >
          예약하기
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={section === CLIENT_SECTION.LIST}
          className={`reservation-page__section-button${
            section === CLIENT_SECTION.LIST
              ? ' reservation-page__section-button--active'
              : ''
          }`}
          onClick={() => onSectionChange(CLIENT_SECTION.LIST)}
        >
          {listTabLabel}
        </button>
      </div>

      {section === CLIENT_SECTION.BOOK ? (
        <ClientBookingSection
          clientName={clientName}
          clientId={clientId}
          onBookingCreated={handleBookingCreated}
        />
      ) : (
        <div className="client-booking-list-section">
          <h1>내 예약</h1>
          <p className="reservation-page__description">
            예약 요청 상태를 확인할 수 있습니다. 승인 대기, 확정, 거절
            상태가 표시됩니다.
          </p>
          <ClientBookingList
            clientId={clientId}
            onPendingCountChange={setPendingTabCount}
          />
        </div>
      )}
    </div>
  )
}
