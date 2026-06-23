import { API_BASE_URL } from '../../../config/api'
import {
  countPendingBookings,
  extractBookings,
  normalizeBooking,
  notifyBookingsUpdated,
} from '../bookingUtils'

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok || data.success === false) {
    throw new Error(data.message ?? '예약 처리에 실패했습니다.')
  }

  return data
}

export async function createBookingRequest({
  counselorId,
  clientId,
  date,
  timeSlot,
}) {
  const data = await requestJson(`${API_BASE_URL}/api/bookings`, {
    method: 'POST',
    body: JSON.stringify({
      clientId: Number(clientId),
      counselorId: Number(counselorId),
      date,
      timeSlot,
    }),
  })

  notifyBookingsUpdated()

  const booking = data?.data ?? data
  return normalizeBooking(booking)
}


export async function fetchCounselorBookingRequests(counselorId) {
  const data = await requestJson(
    `${API_BASE_URL}/api/bookings/counselor?counselorId=${counselorId}`,
  )

  return extractBookings(data)
}

export async function fetchClientBookingRequests(clientId) {
  if (clientId == null || clientId === '') {
    return []
  }

  const data = await requestJson(
    `${API_BASE_URL}/api/bookings/client?clientId=${clientId}`,
  )

  return extractBookings(data)
}

export async function fetchCounselorPendingCount(counselorId) {
  const requests = await fetchCounselorBookingRequests(counselorId)
  return countPendingBookings(requests)
}

export async function acceptBookingRequest(bookingId, counselorId) {
  const data = await requestJson(
    `${API_BASE_URL}/api/bookings/${bookingId}/accept`,
    {
      method: 'PATCH',
      body: JSON.stringify({ counselorId: Number(counselorId) }),
    },
  )

  notifyBookingsUpdated()

  const booking = data?.data ?? data
  return normalizeBooking(booking)
}

export async function rejectBookingRequest(bookingId, counselorId) {
  const data = await requestJson(
    `${API_BASE_URL}/api/bookings/${bookingId}/reject`,
    {
      method: 'PATCH',
      body: JSON.stringify({ counselorId: Number(counselorId) }),
    },
  )

  notifyBookingsUpdated()

  const booking = data?.data ?? data
  return normalizeBooking(booking)
}

export async function cancelClientBookingRequest(bookingId, clientId) {
  const data = await requestJson(
    `${API_BASE_URL}/api/bookings/${bookingId}/cancel`,
    {
      method: 'PATCH',
      body: JSON.stringify({ clientId: Number(clientId) }),
    },
  )

  notifyBookingsUpdated()

  const booking = data?.data ?? data
  return normalizeBooking(booking)
}
