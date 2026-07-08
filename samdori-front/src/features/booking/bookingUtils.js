import { BOOKING_STATUS } from './constants'

export const BOOKINGS_UPDATED_EVENT = 'samdori-bookings-updated'

export function isActiveBookingStatus(status) {
  return (
    status === BOOKING_STATUS.PENDING || status === BOOKING_STATUS.ACCEPTED
  )
}

export function getBlockedTimeSlots(bookings, date) {
  return bookings
    .filter((booking) => isActiveBookingStatus(booking.status))
    .filter((booking) => !date || booking.date === date)
    .map((booking) => booking.timeSlot)
}

export function countPendingBookings(bookings) {
  return bookings.filter((booking) => booking.status === BOOKING_STATUS.PENDING)
    .length
}

/** 상담사 시간 제안을 고객이 확정한 예약 (생성 시 ACCEPTED) */
export function isSlotProposalConfirmedBooking(booking) {
  if (booking?.status !== BOOKING_STATUS.ACCEPTED) return false
  if (!booking.requestedAt || !booking.respondedAt) return false

  const requestedAt = new Date(booking.requestedAt).getTime()
  const respondedAt = new Date(booking.respondedAt).getTime()

  if (Number.isNaN(requestedAt) || Number.isNaN(respondedAt)) return false

  return Math.abs(requestedAt - respondedAt) <= 1000
}

export function canClientCancelBooking(booking, isUpcoming) {
  if (!isUpcoming) return false

  if (booking.status === BOOKING_STATUS.PENDING) {
    return true
  }

  return isSlotProposalConfirmedBooking(booking)
}

export function normalizeBooking(raw) {
  return {
    id: String(raw.id),
    counselorId: String(raw.counselorId ?? raw.counselor_id ?? ''),
    counselorName: raw.counselorName ?? raw.counselor_name ?? '상담사',
    clientId: String(raw.clientId ?? raw.client_id ?? ''),
    clientName: raw.clientName ?? raw.client_name ?? '',
    date: raw.date,
    timeSlot: raw.timeSlot ?? raw.time_slot,
    status: raw.status,
    requestedAt: raw.requestedAt ?? raw.requested_at,
    respondedAt: raw.respondedAt ?? raw.responded_at ?? null,
    cancelledAt: raw.cancelledAt ?? raw.cancelled_at ?? null,
    cancelReason: raw.cancelReason ?? raw.cancel_reason ?? null,
    cancelledBy: raw.cancelledBy ?? raw.cancelled_by ?? null,
  }
}

export function extractBookings(data) {
  const list = Array.isArray(data) ? data : (data?.data ?? data?.bookings ?? [])

  if (!Array.isArray(list)) {
    return []
  }

  return list.map(normalizeBooking)
}

export function notifyBookingsUpdated() {
  window.dispatchEvent(new Event(BOOKINGS_UPDATED_EVENT))
}
