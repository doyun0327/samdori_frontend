import { useCallback, useEffect, useMemo, useState } from 'react'
import AvailabilityCalendar from './AvailabilityCalendar'
import TimeSlotPicker from './TimeSlotPicker'
import { fetchCounselorBookingRequests } from '../../features/booking/api/bookings'
import { getBlockedTimeSlots } from '../../features/booking/bookingUtils'
import { isFutureTimeSlot } from '../../features/booking/formatBooking'
import { useBookingsUpdatedListener } from '../../features/booking/hooks/useBookingsUpdatedListener'
import { createSlotProposal } from '../../features/slotProposal/api/slotProposals'
import { useSlotProposalsUpdatedListener } from '../../features/slotProposal/hooks/useSlotProposalsUpdatedListener'
import { extractClientsFromBookings } from '../../features/slotProposal/slotProposalUtils'
import { useAppAlert } from '../../context/AppAlertContext'
import './SendSlotProposal.css'

export default function SendSlotProposal({ counselorId }) {
  const [clients, setClients] = useState([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [message, setMessage] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([])
  const [counselorBookings, setCounselorBookings] = useState([])
  const [statusMessage, setStatusMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showAlert } = useAppAlert()

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  )

  const blockedSlotsOnDate = useMemo(
    () => getBlockedTimeSlots(counselorBookings, selectedDate),
    [counselorBookings, selectedDate],
  )

  const loadData = useCallback(async () => {
    if (!counselorId) return

    setIsLoading(true)

    try {
      const bookings = await fetchCounselorBookingRequests(counselorId)
      setCounselorBookings(bookings)
      setClients(extractClientsFromBookings(bookings))
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '고객 목록을 불러오지 못했습니다.'
      setStatusMessage(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [counselorId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useBookingsUpdatedListener(loadData)
  useSlotProposalsUpdatedListener(loadData)

  const handleDateChange = (date) => {
    setSelectedDate(date)
    setSelectedTimeSlots([])
    setStatusMessage('')
  }

  const handleToggleTimeSlot = (timeSlot) => {
    if (blockedSlotsOnDate.includes(timeSlot)) return
    if (!isFutureTimeSlot(selectedDate, timeSlot)) return

    setSelectedTimeSlots((prev) => {
      if (prev.includes(timeSlot)) {
        return prev.filter((slot) => slot !== timeSlot)
      }
      return [...prev, timeSlot].sort()
    })
    setStatusMessage('')
  }

  const handleSend = async () => {
    if (!selectedClientId) {
      setStatusMessage('보낼 고객을 선택해 주세요.')
      return
    }

    if (!selectedDate) {
      setStatusMessage('보낼 날짜를 선택해 주세요.')
      return
    }

    if (selectedTimeSlots.length === 0) {
      setStatusMessage('보낼 시간을 하나 이상 선택해 주세요.')
      return
    }

    const sendableSlots = selectedTimeSlots.filter((timeSlot) =>
      isFutureTimeSlot(selectedDate, timeSlot),
    )

    if (sendableSlots.length === 0) {
      setStatusMessage('보낼 시간을 하나 이상 선택해 주세요.')
      return
    }

    setIsSubmitting(true)
    setStatusMessage('')

    const sentCount = sendableSlots.length

    try {
      await createSlotProposal({
        counselorId,
        clientId: selectedClientId,
        slots: sendableSlots.map((timeSlot) => ({
          date: selectedDate,
          timeSlot,
        })),
        message,
      })

      setSelectedTimeSlots([])
      setMessage('')
      const clientLabel = selectedClient?.name ?? '고객'
      await showAlert(`${clientLabel}님에게 ${sentCount}개의 시간을 보냈습니다.`)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '시간 보내기에 실패했습니다.'
      setStatusMessage(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="send-slot-proposal">
      <h1>고객에게 시간 보내기</h1>
      <p className="reservation-page__description">
        예약 이력이 있는 고객에게 상담 시간을 제안할 수 있습니다. 이미 예약
        요청·확정된 시간은 선택할 수 없습니다.
      </p>

      <div className="send-slot-proposal__field">
        <label className="send-slot-proposal__label" htmlFor="proposal-client">
          고객 선택
        </label>
        {isLoading ? (
          <p className="reservation-page__loading" role="status">
            고객 목록을 불러오는 중입니다...
          </p>
        ) : clients.length === 0 ? (
          <p className="reservation-page__empty-state" role="status">
            예약 이력이 있는 고객이 없습니다. 예약 요청을 받은 뒤 이용할 수
            있습니다.
          </p>
        ) : (
          <select
            id="proposal-client"
            className="send-slot-proposal__select"
            value={selectedClientId}
            onChange={(event) => {
              setSelectedClientId(event.target.value)
              setStatusMessage('')
            }}
            disabled={isSubmitting}
          >
            <option value="">고객을 선택하세요</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="send-slot-proposal__field">
        <label className="send-slot-proposal__label" htmlFor="proposal-message">
          메시지 (선택)
        </label>
        <textarea
          id="proposal-message"
          className="send-slot-proposal__message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="예: 아래 시간 중 편하신 시간을 선택해 주세요."
          rows={3}
          disabled={isSubmitting || clients.length === 0}
        />
      </div>

      {selectedClientId && !isLoading && (
        <>
          <AvailabilityCalendar
            selectedDate={selectedDate}
            openedDates={[]}
            onChange={handleDateChange}
          />

          {selectedDate && (
            <TimeSlotPicker
              mode="send"
              selectedDate={selectedDate}
              selectedSlots={selectedTimeSlots}
              blockedSlots={blockedSlotsOnDate}
              disabled={isSubmitting}
              onToggle={handleToggleTimeSlot}
            />
          )}
        </>
      )}

      {selectedTimeSlots.length > 0 && (
        <p className="reservation-page__selected-count">
          전송 예정 {selectedTimeSlots.length}개
        </p>
      )}

      {statusMessage && (
        <p className="reservation-page__message" role="status">
          {statusMessage}
        </p>
      )}

      <button
        type="button"
        className="reservation-page__confirm-button"
        onClick={handleSend}
        disabled={isLoading || isSubmitting || clients.length === 0}
      >
        {isSubmitting ? '보내는 중...' : '보내기'}
      </button>
    </div>
  )
}
