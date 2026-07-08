import { useCallback, useEffect, useMemo, useState } from 'react'
import AvailabilityCalendar from './AvailabilityCalendar'
import TimeSlotPicker from './TimeSlotPicker'
import { fetchCounselorBookingRequests } from '../../features/booking/api/bookings'
import { getBlockedTimeSlots } from '../../features/booking/bookingUtils'
import { isFutureTimeSlot } from '../../features/booking/formatBooking'
import { searchClients } from '../../features/client/api/clients'
import { formatClientLabel } from '../../features/client/clientUtils'
import { useBookingsUpdatedListener } from '../../features/booking/hooks/useBookingsUpdatedListener'
import { createSlotProposal } from '../../features/slotProposal/api/slotProposals'
import { useSlotProposalsUpdatedListener } from '../../features/slotProposal/hooks/useSlotProposalsUpdatedListener'
import { useAppAlert } from '../../context/AppAlertContext'
import './SendSlotProposal.css'

export default function SendSlotProposal({ counselorId }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedClientLabel, setSelectedClientLabel] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([])
  const [counselorBookings, setCounselorBookings] = useState([])
  const [statusMessage, setStatusMessage] = useState('')
  const [isLoadingBookings, setIsLoadingBookings] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showAlert } = useAppAlert()

  const blockedSlotsOnDate = useMemo(
    () => getBlockedTimeSlots(counselorBookings, selectedDate),
    [counselorBookings, selectedDate],
  )

  const loadBookings = useCallback(async () => {
    if (!counselorId) return

    setIsLoadingBookings(true)

    try {
      const bookings = await fetchCounselorBookingRequests(counselorId)
      setCounselorBookings(bookings)
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '예약 정보를 불러오지 못했습니다.'
      setStatusMessage(errorMessage)
    } finally {
      setIsLoadingBookings(false)
    }
  }, [counselorId])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  useBookingsUpdatedListener(loadBookings)
  useSlotProposalsUpdatedListener(loadBookings)

  useEffect(() => {
    const keyword = searchQuery.trim()

    if (!keyword) {
      setSearchResults([])
      setIsSearching(false)
      return undefined
    }

    let cancelled = false
    setIsSearching(true)

    const timer = window.setTimeout(async () => {
      try {
        const results = await searchClients(keyword)
        if (!cancelled) {
          setSearchResults(results)
        }
      } catch {
        if (!cancelled) {
          setSearchResults([])
          setStatusMessage('고객 검색에 실패했습니다.')
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false)
        }
      }
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [searchQuery])

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value)
    setSelectedClientId('')
    setSelectedClientLabel('')
    setIsSearchOpen(true)
    setStatusMessage('')
  }

  const handleSearchFocus = () => {
    setIsSearchOpen(true)
  }

  const handleSearchBlur = () => {
    window.setTimeout(() => setIsSearchOpen(false), 150)
  }

  const handleSelectClient = (client) => {
    setSelectedClientId(client.id)
    setSelectedClientLabel(formatClientLabel(client))
    setSearchQuery(formatClientLabel(client))
    setIsSearchOpen(false)
    setStatusMessage('')
  }

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
      setStatusMessage('보낼 고객을 검색해 선택해 주세요.')
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
      const clientLabel = selectedClientLabel || '고객'
      await showAlert(`${clientLabel}님에게 ${sentCount}개의 시간을 보냈습니다.`)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '시간 보내기에 실패했습니다.'
      setStatusMessage(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const showSearchResults =
    isSearchOpen && searchQuery.trim().length > 0 && !isSearching

  return (
    <div className="send-slot-proposal">
      <h1>고객에게 시간 보내기</h1>
      <p className="reservation-page__description">
        고객 이름으로 검색해 상담 시간을 제안할 수 있습니다. 이미 예약
        요청·확정된 시간은 선택할 수 없습니다.
      </p>

      <div className="send-slot-proposal__field">
        <label className="send-slot-proposal__label" htmlFor="proposal-client-search">
          고객 검색
        </label>
        <div className="send-slot-proposal__search">
          <input
            id="proposal-client-search"
            type="search"
            className="send-slot-proposal__search-input"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            placeholder="고객 이름을 입력하세요"
            disabled={isSubmitting}
            autoComplete="off"
          />

          {isSearching && (
            <p className="send-slot-proposal__search-status" role="status">
              검색 중...
            </p>
          )}

          {showSearchResults && (
            <ul className="send-slot-proposal__search-results" role="listbox">
              {searchResults.length > 0 ? (
                searchResults.map((client) => (
                  <li key={client.id}>
                    <button
                      type="button"
                      className="send-slot-proposal__search-option"
                      role="option"
                      aria-selected={client.id === selectedClientId}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelectClient(client)}
                    >
                      {formatClientLabel(client)}
                    </button>
                  </li>
                ))
              ) : (
                <li className="send-slot-proposal__search-empty">
                  검색 결과가 없습니다.
                </li>
              )}
            </ul>
          )}
        </div>
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
          disabled={isSubmitting || !selectedClientId}
        />
      </div>

      {selectedClientId && !isLoadingBookings && (
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

      {selectedClientId && isLoadingBookings && (
        <p className="reservation-page__loading" role="status">
          예약 정보를 불러오는 중입니다...
        </p>
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
        disabled={isSubmitting || !selectedClientId}
      >
        {isSubmitting ? '보내는 중...' : '보내기'}
      </button>
    </div>
  )
}
