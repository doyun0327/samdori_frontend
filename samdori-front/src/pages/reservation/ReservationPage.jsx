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
  fetchCounselorBookingRequests,
} from '../../features/booking/api/bookings'
import { getClientUnreadResponseCount } from '../../features/booking/clientBookingNotifications'
import { BOOKING_STATUS } from '../../features/booking/constants'
import {
  clearAuthSession,
  getAuthSession,
  isCounselor,
} from '../../utils/authSession'
import './ReservationPage.css'

const BOOKINGS_UPDATED_EVENT = 'samdori-bookings-updated'

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

  const loadNotificationCount = useCallback(async () => {
    if (!id) {
      setNotificationCount(0)
      return
    }

    try {
      if (counselor) {
        const requests = await fetchCounselorBookingRequests(id)
        const count = requests.filter(
          (request) => request.status === BOOKING_STATUS.PENDING,
        ).length
        setNotificationCount(count)
        return
      }

      const bookings = await fetchClientBookingRequests(id)
      setNotificationCount(getClientUnreadResponseCount(bookings, id))
    } catch {
      setNotificationCount(0)
    }
  }, [counselor, id])

  useEffect(() => {
    loadNotificationCount()
  }, [loadNotificationCount])

  useEffect(() => {
    const handleBookingsUpdated = () => {
      loadNotificationCount()
    }

    window.addEventListener(BOOKINGS_UPDATED_EVENT, handleBookingsUpdated)
    return () => {
      window.removeEventListener(BOOKINGS_UPDATED_EVENT, handleBookingsUpdated)
    }
  }, [loadNotificationCount])

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
              onPendingCountChange={setNotificationCount}
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
