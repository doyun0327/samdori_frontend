import { BOOKING_STATUS } from './constants'

function storageKey(clientId) {
  return `samdori_client_read_responses_${clientId}`
}

function readIdSet(clientId) {
  try {
    const raw = localStorage.getItem(storageKey(clientId))
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function writeIdSet(clientId, ids) {
  localStorage.setItem(storageKey(clientId), JSON.stringify([...ids]))
}

export function isClientResponseStatus(status) {
  return (
    status === BOOKING_STATUS.ACCEPTED || status === BOOKING_STATUS.REJECTED
  )
}

export function isBookingForClient(booking, clientId) {
  return Boolean(
    booking && clientId && String(booking.clientId) === String(clientId),
  )
}

export function isBookingForCounselor(booking, counselorId) {
  return Boolean(
    booking && counselorId && String(booking.counselorId) === String(counselorId),
  )
}

export function getClientUnreadResponseCount(bookings, clientId) {
  if (!clientId) return 0

  const readIds = readIdSet(clientId)

  return bookings.filter(
    (booking) =>
      isClientResponseStatus(booking.status) && !readIds.has(String(booking.id)),
  ).length
}

export function markClientResponsesAsRead(clientId, bookings) {
  if (!clientId) return

  const readIds = readIdSet(clientId)

  bookings.forEach((booking) => {
    if (isClientResponseStatus(booking.status)) {
      readIds.add(String(booking.id))
    }
  })

  writeIdSet(clientId, readIds)
}
