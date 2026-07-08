import { useCallback, useEffect, useMemo, useState } from 'react'
import AvailabilityCalendar from '../../components/counselor/AvailabilityCalendar'
import TimeSlotPicker from '../../components/counselor/TimeSlotPicker'
import ClientSlotProposals from './ClientSlotProposals'
import { useAppAlert } from '../../context/AppAlertContext'
import { fetchCounselors } from '../../features/client/api/counselors'
import { fetchAvailability } from '../../features/counselor/api/availability'
import {
  createBookingRequest,
  fetchCounselorBookingRequests,
} from '../../features/booking/api/bookings'
import { getBlockedTimeSlots } from '../../features/booking/bookingUtils'
import { useBookingsUpdatedListener } from '../../features/booking/hooks/useBookingsUpdatedListener'
import {
  formatBookingSchedule,
  isFutureTimeSlot,
} from '../../features/booking/formatBooking'
import {
  getFavoriteCounselorId,
  setFavoriteCounselorId as persistFavoriteCounselorId,
} from '../../utils/favoriteCounselor'

export default function ClientBookingSection({
  clientName,
  clientId,
  onBookingCreated,
  onProposalCountChange,
}) {
  const [counselors, setCounselors] = useState([]) // API에서 불러온 전체 상담사 목록
  const [selectedCounselorId, setSelectedCounselorId] = useState('') // 예약 대상으로 선택한 상담사 ID
  const [searchQuery, setSearchQuery] = useState('') // 상담사 검색 입력값
  const [isSearchOpen, setIsSearchOpen] = useState(false) // 상담사 검색 결과 드롭다운 표시 여부
  const [availableSlots, setAvailableSlots] = useState([]) // 선택한 상담사의 예약 가능 슬롯 목록
  const [counselorBookings, setCounselorBookings] = useState([])
  const [selectedDate, setSelectedDate] = useState('') // 예약할 날짜 (YYYY-MM-DD)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('') // 예약할 시간대
  const [message, setMessage] = useState('') // 안내·에러·예약 확인 메시지
  const [isLoadingCounselors, setIsLoadingCounselors] = useState(false) // 상담사 목록 로딩 중 여부
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false) // 상담 가능 시간 로딩 중 여부
  const [isSubmitting, setIsSubmitting] = useState(false) // 예약 요청 전송 중 여부
  const [favoriteCounselorId, setFavoriteCounselorId] = useState(() =>
    getFavoriteCounselorId(clientId),
  )
  const { showAlert, showConfirm } = useAppAlert()

  const openedDates = useMemo(
    () => [...new Set(availableSlots.map((slot) => slot.date))].sort(),
    [availableSlots],
  )

  const availableSlotsOnDate = useMemo(
    () =>
      availableSlots
        .filter((slot) => slot.date === selectedDate)
        .map((slot) => slot.timeSlot),
    [availableSlots, selectedDate],
  )

  const blockedSlotsOnDate = useMemo(
    () => getBlockedTimeSlots(counselorBookings, selectedDate),
    [counselorBookings, selectedDate],
  )

  const filteredCounselors = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()
    const list = keyword
      ? counselors.filter((counselor) =>
          counselor.name.toLowerCase().includes(keyword),
        )
      : counselors

    if (!favoriteCounselorId) return list

    const favorite = list.find(
      (counselor) => String(counselor.id) === favoriteCounselorId,
    )
    const rest = list.filter(
      (counselor) => String(counselor.id) !== favoriteCounselorId,
    )

    return favorite ? [favorite, ...rest] : list
  }, [counselors, favoriteCounselorId, searchQuery])

  useEffect(() => {
    setFavoriteCounselorId(getFavoriteCounselorId(clientId))
  }, [clientId])

  useEffect(() => {
    let cancelled = false

    async function loadCounselors() {
      setIsLoadingCounselors(true)
      setMessage('')

      try {
        const list = await fetchCounselors()
        if (cancelled) return

        setCounselors(list)

        const savedFavoriteId = getFavoriteCounselorId(clientId)
        const favorite = list.find(
          (counselor) => String(counselor.id) === savedFavoriteId,
        )

        if (favorite) {
          setSelectedCounselorId(String(favorite.id))
          setSearchQuery(favorite.name)
          return
        }

        if (savedFavoriteId) {
          persistFavoriteCounselorId(clientId, null)
          setFavoriteCounselorId(null)
        }

        if (list.length === 1) {
          setSelectedCounselorId(String(list[0].id))
          setSearchQuery(list[0].name)
        }
      } catch (error) {
        if (!cancelled) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : '상담사 목록을 불러오지 못했습니다.'
          setMessage(errorMessage)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCounselors(false)
        }
      }
    }

    loadCounselors()

    return () => {
      cancelled = true
    }
  }, [clientId])

  const loadCounselorAvailability = useCallback(async () => {
    if (!selectedCounselorId) {
      setAvailableSlots([])
      setCounselorBookings([])
      return
    }

    setIsLoadingAvailability(true)
    setMessage('')
    setSelectedDate('')
    setSelectedTimeSlot('')

    try {
      const [slots, bookings] = await Promise.all([
        fetchAvailability(Number(selectedCounselorId)),
        fetchCounselorBookingRequests(Number(selectedCounselorId)).catch(
          () => [],
        ),
      ])
      setAvailableSlots(slots)
      setCounselorBookings(bookings)
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '상담 가능 시간을 불러오지 못했습니다.'
      setMessage(errorMessage)
    } finally {
      setIsLoadingAvailability(false)
    }
  }, [selectedCounselorId])

  useEffect(() => {
    loadCounselorAvailability()
  }, [loadCounselorAvailability])

  useBookingsUpdatedListener(loadCounselorAvailability)

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value)
    setSelectedCounselorId('')
    setIsSearchOpen(true)
    setMessage('')
  }

  const handleSearchFocus = () => {
    setIsSearchOpen(true)
  }

  const handleSearchBlur = () => {
    window.setTimeout(() => setIsSearchOpen(false), 150)
  }

  const handleSelectCounselor = (counselor) => {
    setSelectedCounselorId(String(counselor.id))
    setSearchQuery(counselor.name)
    setIsSearchOpen(false)
    setMessage('')
  }

  const handleToggleFavorite = async (counselor, event) => {
    event.preventDefault()
    event.stopPropagation()

    const counselorId = String(counselor.id)

    if (favoriteCounselorId === counselorId) {
      persistFavoriteCounselorId(clientId, null)
      setFavoriteCounselorId(null)
      return
    }

    if (favoriteCounselorId) {
      const confirmed = await showConfirm(
        '즐겨찾기는 한명만 설정이 가능합니다.\n변경하시겠습니까?',
      )
      if (!confirmed) return
    }

    persistFavoriteCounselorId(clientId, counselorId)
    setFavoriteCounselorId(counselorId)
    handleSelectCounselor(counselor)
    await showAlert('즐겨찾기에 등록되었습니다.')
  }

  const handleDateChange = (date) => {
    setSelectedDate(date)
    setSelectedTimeSlot('')
    setMessage('')
  }

  const handleSelectTimeSlot = (timeSlot) => {
    if (blockedSlotsOnDate.includes(timeSlot)) return
    if (!isFutureTimeSlot(selectedDate, timeSlot)) return

    setSelectedTimeSlot(timeSlot)
    setMessage('')
  }

  const handleConfirm = async () => {
    if (!selectedCounselorId) {
      setMessage('상담사를 선택해 주세요.')
      return
    }

    if (!selectedDate) {
      setMessage('예약할 날짜를 선택해 주세요.')
      return
    }

    if (!selectedTimeSlot) {
      setMessage('예약할 시간을 선택해 주세요.')
      return
    }

    if (blockedSlotsOnDate.includes(selectedTimeSlot)) {
      setMessage('이미 예약 요청 또는 확정된 시간입니다.')
      return
    }

    if (!isFutureTimeSlot(selectedDate, selectedTimeSlot)) {
      setMessage('지나간 시간은 예약할 수 없습니다.')
      return
    }

    const counselorName =
      counselors.find((counselor) => String(counselor.id) === selectedCounselorId)
        ?.name ?? '상담사'

    setIsSubmitting(true)
    setMessage('')

    try {
      await createBookingRequest({
        counselorId: selectedCounselorId,
        clientId,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
      })

      setMessage(
        `${counselorName} 상담사 ${formatBookingSchedule(selectedDate, selectedTimeSlot)} 예약 요청을 보냈습니다.`,
      )
      setSelectedTimeSlot('')
      onBookingCreated?.()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '예약 요청에 실패했습니다.'
      setMessage(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <ClientSlotProposals
        clientId={clientId}
        onBooked={onBookingCreated}
        onProposalCountChange={onProposalCountChange}
      />

      <h1>{clientName}님, 상담을 예약해 보세요</h1>
      <p className="reservation-page__description">
        상담사를 검색해 선택하거나 즐겨찾기로 등록해 주세요. 즐겨찾기한
        상담사가 다음 예약 시 자동으로 선택됩니다.
      </p>

      <div className="client-booking__field">
        <label className="client-booking__label" htmlFor="counselor-search">
          상담사 검색
        </label>
        <div className="client-booking__search">
          <input
            id="counselor-search"
            type="search"
            className="client-booking__search-input"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            placeholder={
              isLoadingCounselors
                ? '상담사 목록 불러오는 중...'
                : '상담사 이름을 입력하세요'
            }
            disabled={isLoadingCounselors || isLoadingAvailability || isSubmitting}
            autoComplete="off"
          />

          {isSearchOpen && !isLoadingCounselors && counselors.length > 0 && (
            <ul className="client-booking__search-results" role="listbox">
              {filteredCounselors.length > 0 ? (
                filteredCounselors.map((counselor) => {
                  const isFavorite =
                    String(counselor.id) === favoriteCounselorId

                  return (
                    <li key={counselor.id} className="client-booking__search-item">
                      <button
                        type="button"
                        className={`client-booking__favorite${
                          isFavorite ? ' client-booking__favorite--active' : ''
                        }`}
                        aria-label={
                          isFavorite
                            ? `${counselor.name} 즐겨찾기 해제`
                            : `${counselor.name} 즐겨찾기 등록`
                        }
                        aria-pressed={isFavorite}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => handleToggleFavorite(counselor, event)}
                      >
                        {isFavorite ? '★' : '☆'}
                      </button>
                      <button
                        type="button"
                        className="client-booking__search-option"
                        role="option"
                        aria-selected={
                          String(counselor.id) === selectedCounselorId
                        }
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleSelectCounselor(counselor)}
                      >
                        {`${counselor.name} (${counselor.centerName})`}
                      </button>
                    </li>
                  )
                })
              ) : (
                <li className="client-booking__search-empty">
                  검색 결과가 없습니다.
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {selectedCounselorId && (
        <>
          {isLoadingAvailability ? (
            <p className="reservation-page__loading" role="status">
              상담 가능 시간을 불러오는 중입니다...
            </p>
          ) : openedDates.length === 0 ? (
            <p className="reservation-page__empty-state" role="status">
              선택한 상담사에게 예약 가능한 시간이 없습니다.
            </p>
          ) : (
            <>
              <AvailabilityCalendar
                selectedDate={selectedDate}
                openedDates={openedDates}
                onChange={handleDateChange}
                onlyOpenedSelectable
              />

              {selectedDate && (
                <>
                  {availableSlotsOnDate.length === 0 ? (
                    <p className="reservation-page__empty-state" role="status">
                      이 날짜에 예약 가능한 시간이 없습니다.
                    </p>
                  ) : (
                    <TimeSlotPicker
                      mode="book"
                      selectedDate={selectedDate}
                      selectedSlots={selectedTimeSlot ? [selectedTimeSlot] : []}
                      availableSlots={availableSlotsOnDate}
                      blockedSlots={blockedSlotsOnDate}
                      disabled={isLoadingAvailability}
                      onToggle={handleSelectTimeSlot}
                    />
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      {message && (
        <p className="reservation-page__message" role="status">
          {message}
        </p>
      )}

      <button
        className="reservation-page__confirm-button"
        type="button"
        onClick={handleConfirm}
        disabled={
          isLoadingCounselors ||
          isLoadingAvailability ||
          isSubmitting ||
          !selectedCounselorId ||
          openedDates.length === 0
        }
      >
        {isSubmitting ? '요청 중...' : '예약하기'}
      </button>
    </>
  )
}
