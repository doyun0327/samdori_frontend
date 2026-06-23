import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import UserNavBar from '../../components/layout/UserNavBar'
import SideNavDrawer from '../../components/layout/SideNavDrawer'
import CounselorSection, {
  COUNSELOR_SECTION,
} from '../../components/counselor/CounselorSection'
import ClientSection, {
  CLIENT_SECTION,
} from '../../components/client/ClientSection'
import {
  fetchClientBookingRequests,
  fetchCounselorPendingCount,
} from '../../features/booking/api/bookings'
import { getClientUnreadResponseCount } from '../../features/booking/clientBookingNotifications'
import { useBookingsUpdatedListener } from '../../features/booking/hooks/useBookingsUpdatedListener'
import {
  clearAuthSession,
  getAuthSession,
  isClient,
  isCounselor,
} from '../../utils/authSession'
import {
  getBookingNotificationMessage,
  isRelevantBookingUpdate,
} from '../../features/notifications/getBookingNotificationMessage'
import { useNotificationStream } from '../../features/notifications/hooks/useNotificationStream'
import './ReservationPage.css'

export default function ReservationPage() {
  const navigate = useNavigate()
  const { name, role, id } = getAuthSession()
  const counselor = isCounselor(role)

  const [counselorSection, setCounselorSection] = useState(
    COUNSELOR_SECTION.AVAILABILITY,
  )
  const [clientSection, setClientSection] = useState(CLIENT_SECTION.BOOK)
  const [notificationCount, setNotificationCount] = useState(0)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [toast, setToast] = useState('')

  const loadNotificationCount = useCallback(async () => {
    if (!id) {
      setNotificationCount(0)
      return
    }

    try {
      if (counselor) {
        setNotificationCount(await fetchCounselorPendingCount(id))
        return
      }

      const bookings = await fetchClientBookingRequests(id)
      setNotificationCount(getClientUnreadResponseCount(bookings, id))
    } catch {
      setNotificationCount(0)
    }
  }, [counselor, id])

  const handleBookingUpdated = useCallback(
    (booking) => {
      if (isRelevantBookingUpdate(booking, id, role)) {
        const message = getBookingNotificationMessage(booking, role)
        if (message) {
          setToast(message)
        }
      }

      loadNotificationCount()
    },
    [id, loadNotificationCount, role],
  )

  // 페이지 들어올 때 연결, 나갈 때 해제 호출
  // url 이 reservation 일 때만 연결이 되도록 해둔건데.. 메뉴에 따라 url 변경된다면 이부분 수정 해야 함
  const { disconnect: disconnectStream } = useNotificationStream({
    userId: id,
    role,
    onBookingUpdated: handleBookingUpdated,
  })

  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const timer = window.setTimeout(() => setToast(''), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  useBookingsUpdatedListener(loadNotificationCount)

  useEffect(() => {
    loadNotificationCount()
  }, [loadNotificationCount])

  useEffect(() => {
    if (!isClient(role) || !id) {
      return undefined
    }

    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') {
        loadNotificationCount()
      }
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadNotificationCount()
      }
    }, 10000)

    document.addEventListener('visibilitychange', refreshOnVisible)
    window.addEventListener('focus', loadNotificationCount)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', refreshOnVisible)
      window.removeEventListener('focus', loadNotificationCount)
    }
  }, [id, loadNotificationCount, role])

  const counselorNavItems = useMemo(
    () => [
      { id: COUNSELOR_SECTION.AVAILABILITY, label: '시간 관리' },
      {
        id: COUNSELOR_SECTION.REQUESTS,
        label: '예약 요청',
        badge: notificationCount,
      },
    ],
    [notificationCount],
  )

  const handleLogout = () => {
    disconnectStream()
    clearAuthSession()
    navigate('/', { replace: true })
  }

  const handleNotificationClick = () => {
    if (counselor) {
      setCounselorSection(COUNSELOR_SECTION.REQUESTS)
      return
    }

    setClientSection(CLIENT_SECTION.LIST)
  }

  const handleCounselorNavSelect = (sectionId) => {
    setCounselorSection(sectionId)
    setIsDrawerOpen(false)
  }

  if (!name) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="reservation-page">
      <UserNavBar
        name={name}
        onLogout={handleLogout}
        notificationCount={notificationCount}
        onNotificationClick={handleNotificationClick}
        showMenuButton={counselor}
        onMenuClick={() => setIsDrawerOpen(true)}
      />

      {counselor && (
        <SideNavDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title="메뉴"
          items={counselorNavItems}
          activeId={counselorSection}
          onSelect={handleCounselorNavSelect}
        />
      )}

      <main className="reservation-page__main">
        <div className="reservation-page__content">
          {counselor ? (
            <CounselorSection
              counselorId={id}
              section={counselorSection}
            />
          ) : (
            <ClientSection
              clientName={name}
              clientId={id}
              section={clientSection}
              onSectionChange={setClientSection}
              onResponsesViewed={loadNotificationCount}
            />
          )}
        </div>
      </main>
    </div>
  )
}
