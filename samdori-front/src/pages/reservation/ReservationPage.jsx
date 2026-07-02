import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import UserNavBar from '../../components/layout/UserNavBar'
import SideNavDrawer from '../../components/layout/SideNavDrawer'
import CounselorSection, {
  COUNSELOR_SECTION,
} from '../../components/counselor/CounselorSection'
import ClientSection, {
  CLIENT_SECTION,
} from '../../components/client/ClientSection'
import {
  COUNSELOR_REQUESTS_PATH,
  RESERVATION_PATH,
} from '../../routes/paths'
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
import { clearPersistedSession } from '../../utils/loginPersistence'
import {
  getBookingNotificationMessage,
  isRelevantBookingUpdate,
} from '../../features/notifications/getBookingNotificationMessage'
import { useNotificationStream } from '../../features/notifications/hooks/useNotificationStream'
import './ReservationPage.css'

export default function ReservationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { name, role, id } = getAuthSession()
  const counselor = isCounselor(role)

  const counselorSection =
    location.pathname === COUNSELOR_REQUESTS_PATH
      ? COUNSELOR_SECTION.REQUESTS
      : COUNSELOR_SECTION.AVAILABILITY

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

  // 상담사 메뉴 URL: /reservation(시간 관리), /reservation/requests(예약 요청)
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
      {
        id: COUNSELOR_SECTION.AVAILABILITY,
        label: '시간 관리',
        path: RESERVATION_PATH,
      },
      {
        id: COUNSELOR_SECTION.REQUESTS,
        label: '예약 요청',
        path: COUNSELOR_REQUESTS_PATH,
        badge: notificationCount,
      },
    ],
    [notificationCount],
  )

  const handleLogout = () => {
    disconnectStream()
    clearAuthSession()
    clearPersistedSession()
    navigate('/', { replace: true, state: { fromLogout: true } })
  }

  const handleNotificationClick = () => {
    if (counselor) {
      navigate(COUNSELOR_REQUESTS_PATH)
      return
    }

    setClientSection(CLIENT_SECTION.LIST)
  }

  const handleCounselorNavSelect = (item) => {
    navigate(item.path)
    setIsDrawerOpen(false)
  }

  if (!name) {
    return <Navigate to="/" replace />
  }

  if (!counselor && location.pathname === COUNSELOR_REQUESTS_PATH) {
    return <Navigate to={RESERVATION_PATH} replace />
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
