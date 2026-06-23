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
  window.dispatchEvent(new Event('samdori-bookings-updated'))
}
