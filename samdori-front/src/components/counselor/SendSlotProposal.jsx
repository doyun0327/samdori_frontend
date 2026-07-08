import { useCallback, useEffect, useMemo, useState } from 'react'
import AvailabilityCalendar from './AvailabilityCalendar'
import TimeSlotPicker from './TimeSlotPicker'
import { fetchCounselorBookingRequests } from '../../features/booking/api/bookings'
import { getBlockedTimeSlots } from '../../features/booking/bookingUtils'
import { isFutureTimeSlot } from '../../features/booking/formatBooking'
import { searchClients } from '../../features/client/api/clients'
import { formatClientLabel } from '../../features/client/clientUtils'
import { useBookingsUpdatedListener } from '../../features/booking/hooks/useBookingsUpdatedListener'
import {
  createSlotProposal,
  fetchCounselorSlotProposals,
} from '../../features/slotProposal/api/slotProposals'
import {
  getBlockedTimeSlotsFromProposals,
  mergeProposalUpdate,
} from '../../features/slotProposal/slotProposalUtils'
import { useSlotProposalsUpdatedListener } from '../../features/slotProposal/hooks/useSlotProposalsUpdatedListener'
import { useAppAlert } from '../../context/AppAlertContext'
import {
  addFavoriteClient,
  getFavoriteClients,
  isFavoriteClient,
  removeFavoriteClient,
} from '../../utils/favoriteClient'
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
  const [counselorProposals, setCounselorProposals] = useState([])
  const [statusMessage, setStatusMessage] = useState('')
  const [isLoadingBookings, setIsLoadingBookings] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [favoriteClients, setFavoriteClients] = useState(() =>
    getFavoriteClients(counselorId),
  )
  const { showAlert } = useAppAlert()

  const blockedSlotsOnDate = useMemo(() => {
    const fromBookings = getBlockedTimeSlots(counselorBookings, selectedDate)
    const fromProposals = getBlockedTimeSlotsFromProposals(
      counselorProposals,
      selectedDate,
    )

    return [...new Set([...fromBookings, ...fromProposals])]
  }, [counselorBookings, counselorProposals, selectedDate])

  const loadSlotData = useCallback(async ({ silent = false } = {}) => {
    if (!counselorId) return

    if (!silent) {
      setIsLoadingBookings(true)
    }

    try {
      const [bookings, proposals] = await Promise.all([
        fetchCounselorBookingRequests(counselorId),
        fetchCounselorSlotProposals(counselorId),
      ])
      setCounselorBookings(bookings)
      setCounselorProposals(proposals)
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '예약 정보를 불러오지 못했습니다.'
      setStatusMessage(errorMessage)
    } finally {
      if (!silent) {
        setIsLoadingBookings(false)
      }
    }
  }, [counselorId])

  const handleSlotDataUpdate = useCallback(
    (updatedProposal = null) => {
      if (updatedProposal) {
        setCounselorProposals((prev) => mergeProposalUpdate(prev, updatedProposal))
      }

      loadSlotData({ silent: true })
    },
    [loadSlotData],
  )

  useEffect(() => {
    loadSlotData()
  }, [loadSlotData])

  useBookingsUpdatedListener(() => loadSlotData({ silent: true }))
  useSlotProposalsUpdatedListener(handleSlotDataUpdate)

  useEffect(() => {
    if (!counselorId) return undefined

    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') {
        loadSlotData({ silent: true })
      }
    }

    const intervalId = window.setInterval(refreshOnVisible, 10000)

    document.addEventListener('visibilitychange', refreshOnVisible)
    window.addEventListener('focus', refreshOnVisible)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', refreshOnVisible)
      window.removeEventListener('focus', refreshOnVisible)
    }
  }, [counselorId, loadSlotData])

  useEffect(() => {
    setFavoriteClients(getFavoriteClients(counselorId))
  }, [counselorId])

  const favoriteClientIds = useMemo(
    () => new Set(favoriteClients.map((client) => client.id)),
    [favoriteClients],
  )

  const sortedSearchResults = useMemo(() => {
    return [...searchResults].sort((a, b) => {
      const aFavorite = favoriteClientIds.has(a.id)
      const bFavorite = favoriteClientIds.has(b.id)

      if (aFavorite && !bFavorite) return -1
      if (!aFavorite && bFavorite) return 1

      return formatClientLabel(a).localeCompare(formatClientLabel(b), 'ko')
    })
  }, [searchResults, favoriteClientIds])

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

  const handleToggleFavorite = async (client, event) => {
    event.preventDefault()
    event.stopPropagation()

    if (isFavoriteClient(counselorId, client.id)) {
      setFavoriteClients(removeFavoriteClient(counselorId, client.id))
      return
    }

    setFavoriteClients(addFavoriteClient(counselorId, client))
    await showAlert('즐겨찾기에 등록되었습니다.')
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
      const createdProposal = await createSlotProposal({
        counselorId,
        clientId: selectedClientId,
        slots: sendableSlots.map((timeSlot) => ({
          date: selectedDate,
          timeSlot,
        })),
        message,
      })

      setCounselorProposals((prev) => mergeProposalUpdate(prev, createdProposal))
      await loadSlotData({ silent: true })

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

  const showFavoriteDropdown =
    isSearchOpen && searchQuery.trim().length === 0 && favoriteClients.length > 0

  const showSearchResults =
    isSearchOpen && searchQuery.trim().length > 0 && !isSearching

  const renderSearchOption = (client) => {
    const isFavorite = favoriteClientIds.has(client.id)

    return (
      <li key={client.id} className="send-slot-proposal__search-item">
        <button
          type="button"
          className={`send-slot-proposal__favorite${
            isFavorite ? ' send-slot-proposal__favorite--active' : ''
          }`}
          aria-label={
            isFavorite
              ? `${client.name} 즐겨찾기 해제`
              : `${client.name} 즐겨찾기 등록`
          }
          aria-pressed={isFavorite}
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => handleToggleFavorite(client, event)}
        >
          {isFavorite ? '★' : '☆'}
        </button>
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
    )
  }

  return (
    <div className="send-slot-proposal">
      <h1>상담 시간 제안</h1>
      <p className="reservation-page__description">
        이름·휴대폰 뒤 4자리로 검색하거나 즐겨찾기에서 고객을 선택할 수
        있습니다. 예약·제안 중인 시간은 선택할 수 없습니다.
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
            placeholder="이름 또는 휴대폰 뒤 4자리"
            disabled={isSubmitting}
            autoComplete="off"
          />

          {isSearching && (
            <p className="send-slot-proposal__search-status" role="status">
              검색 중...
            </p>
          )}

          {showFavoriteDropdown && (
            <ul className="send-slot-proposal__search-results" role="listbox">
              {favoriteClients.map((client) => renderSearchOption(client))}
            </ul>
          )}

          {showSearchResults && (
            <ul className="send-slot-proposal__search-results" role="listbox">
              {sortedSearchResults.length > 0 ? (
                sortedSearchResults.map((client) => renderSearchOption(client))
              ) : (
                <li className="send-slot-proposal__search-empty">
                  검색 결과가 없습니다.
                </li>
              )}
            </ul>
          )}
        </div>

        {favoriteClients.length > 0 && (
          <div className="send-slot-proposal__favorites">
            <p className="send-slot-proposal__favorites-label">즐겨찾기</p>
            <ul className="send-slot-proposal__favorites-list">
              {favoriteClients.map((client) => (
                <li key={client.id} className="send-slot-proposal__favorites-item">
                  <button
                    type="button"
                    className={`send-slot-proposal__favorites-chip${
                      client.id === selectedClientId
                        ? ' send-slot-proposal__favorites-chip--selected'
                        : ''
                    }`}
                    onClick={() => handleSelectClient(client)}
                  >
                    {formatClientLabel(client)}
                  </button>
                  <button
                    type="button"
                    className="send-slot-proposal__favorites-remove"
                    aria-label={`${client.name} 즐겨찾기 해제`}
                    onClick={(event) => handleToggleFavorite(client, event)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
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
