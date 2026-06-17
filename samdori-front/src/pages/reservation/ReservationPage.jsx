import { useEffect, useMemo, useState } from 'react'
import { useLocation, Navigate, useNavigate } from 'react-router-dom'
import UserNavBar from '../../components/layout/UserNavBar'
import AvailabilityCalendar from '../../components/counselor/AvailabilityCalendar'
import TimeSlotPicker from '../../components/counselor/TimeSlotPicker'
import {
  createAvailability,
  deleteAvailability,
} from '../../features/counselor/api/availability'
import {
  clearAuthSession,
  getAuthSession,
  isCounselor,
  saveAuthSession,
} from '../../utils/authSession'
import './ReservationPage.css'

const AVAILABILITY_MODE = {
  REGISTER: 'register',
  UNREGISTER: 'unregister',
}

export default function ReservationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const session = getAuthSession()
  const name = location.state?.name ?? session.name
  const role = location.state?.role ?? session.role
  const id = location.state?.id ?? session.id
  const [mode, setMode] = useState(AVAILABILITY_MODE.REGISTER)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([])
  const [registeredSlots, setRegisteredSlots] = useState([])
  const [confirmMessage, setConfirmMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const openedDates = useMemo(
    () => [...new Set(registeredSlots.map((slot) => slot.date))].sort(),
    [registeredSlots],
  )

  const registeredSlotsOnDate = useMemo(
    () =>
      registeredSlots
        .filter((slot) => slot.date === selectedDate)
        .map((slot) => slot.timeSlot),
    [registeredSlots, selectedDate],
  )

  const hasRegisteredSlotsOnDate = registeredSlotsOnDate.length > 0
  const isRegisterMode = mode === AVAILABILITY_MODE.REGISTER

  useEffect(() => {
    if (location.state?.name && location.state?.role) {
      saveAuthSession({
        name: location.state.name,
        role: location.state.role,
        id: location.state.id,
      })
    }
  }, [location.state])

  const handleLogout = () => {
    clearAuthSession()
    navigate('/', { replace: true })
  }

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
    setSelectedTimeSlots([])
    setConfirmMessage('')
  }

  const handleDateChange = (date) => {
    setSelectedDate(date)
    setSelectedTimeSlots([])
    setConfirmMessage('')
  }

  const handleToggleTimeSlot = (timeSlot) => {
    setSelectedTimeSlots((prev) => {
      if (prev.includes(timeSlot)) {
        return prev.filter((slot) => slot !== timeSlot)
      }
      return [...prev, timeSlot].sort()
    })
    setConfirmMessage('')
  }

  const handleConfirm = async () => {
    if (!selectedDate) {
      setConfirmMessage('상담 가능한 날짜를 선택해 주세요.')
      return
    }

    if (selectedTimeSlots.length === 0) {
      setConfirmMessage(
        isRegisterMode
          ? '등록할 시간을 하나 이상 선택해 주세요.'
          : '해제할 시간을 하나 이상 선택해 주세요.',
      )
      return
    }

    if (!id) {
      setConfirmMessage('상담사 정보를 찾을 수 없습니다. 다시 로그인해 주세요.')
      return
    }

    setIsSubmitting(true)
    setConfirmMessage('')

    const payload = {
      id: Number(id),
      date: selectedDate,
      timeSlots: selectedTimeSlots,
    }

    try {
      if (isRegisterMode) {
        await createAvailability(payload)

        setRegisteredSlots((prev) => [
          ...prev,
          ...selectedTimeSlots.map((timeSlot) => ({
            date: selectedDate,
            timeSlot,
          })),
        ])
        setConfirmMessage(
          `${selectedDate} ${selectedTimeSlots.length}개 시간이 등록되었습니다.`,
        )
      } else {
        await deleteAvailability(payload)

        setRegisteredSlots((prev) =>
          prev.filter(
            (slot) =>
              !(
                slot.date === selectedDate &&
                selectedTimeSlots.includes(slot.timeSlot)
              ),
          ),
        )
        setConfirmMessage(
          `${selectedDate} ${selectedTimeSlots.length}개 시간이 해제되었습니다.`,
        )
      }

      setSelectedTimeSlots([])
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '상담 가능 시간 처리에 실패했습니다.'
      setConfirmMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!name) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="reservation-page">
      <UserNavBar name={name} onLogout={handleLogout} />

      <main className="reservation-page__main">
        <div className="reservation-page__content">
          {isCounselor(role) ? (
            <>
              <h1>상담 가능한 날짜를 선택해주세요</h1>
              <p className="reservation-page__description">
                먼저 등록 또는 해제 모드를 선택한 뒤, 날짜와 시간을 고르고
                확인을 눌러 주세요.
              </p>

              <div
                className="reservation-page__mode-toggle"
                role="tablist"
                aria-label="상담 가능 시간 모드"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={isRegisterMode}
                  className={`reservation-page__mode-button${
                    isRegisterMode ? ' reservation-page__mode-button--active' : ''
                  }`}
                  onClick={() => handleModeChange(AVAILABILITY_MODE.REGISTER)}
                  disabled={isSubmitting}
                >
                  등록
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isRegisterMode}
                  className={`reservation-page__mode-button${
                    !isRegisterMode ? ' reservation-page__mode-button--active' : ''
                  }`}
                  onClick={() => handleModeChange(AVAILABILITY_MODE.UNREGISTER)}
                  disabled={isSubmitting}
                >
                  해제
                </button>
              </div>

              <AvailabilityCalendar
                selectedDate={selectedDate}
                openedDates={openedDates}
                onChange={handleDateChange}
              />

              {selectedDate && (
                <>
                  {!isRegisterMode && !hasRegisteredSlotsOnDate ? (
                    <p className="reservation-page__empty-state" role="status">
                      이 날짜에 등록된 시간이 없습니다. 다른 날짜를 선택해
                      주세요.
                    </p>
                  ) : (
                    <TimeSlotPicker
                      mode={mode}
                      selectedSlots={selectedTimeSlots}
                      registeredSlots={registeredSlotsOnDate}
                      disabled={isSubmitting}
                      onToggle={handleToggleTimeSlot}
                    />
                  )}
                </>
              )}

              {selectedTimeSlots.length > 0 && (
                <p className="reservation-page__selected-count">
                  {isRegisterMode ? '등록 예정' : '해제 예정'}{' '}
                  {selectedTimeSlots.length}개
                </p>
              )}

              {confirmMessage && (
                <p className="reservation-page__message" role="status">
                  {confirmMessage}
                </p>
              )}

              <button
                className={`reservation-page__confirm-button${
                  !isRegisterMode
                    ? ' reservation-page__confirm-button--unregister'
                    : ''
                }`}
                type="button"
                onClick={handleConfirm}
                disabled={
                  isSubmitting ||
                  (!isRegisterMode &&
                    selectedDate &&
                    !hasRegisteredSlotsOnDate)
                }
              >
                {isSubmitting
                  ? '처리 중...'
                  : isRegisterMode
                    ? '등록하기'
                    : '해제하기'}
              </button>
            </>
          ) : (
            <>
              <p className="reservation-page__badge">상담 예약</p>
              <h1>{name}님 안녕하세요</h1>
              <p className="reservation-page__description">
                오늘도 편안한 상담 되시길 바랍니다.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
