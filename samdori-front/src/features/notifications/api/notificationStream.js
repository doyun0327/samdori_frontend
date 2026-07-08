import { API_BASE_URL } from '../../../config/api'
import { normalizeBooking, notifyBookingsUpdated } from '../../booking/bookingUtils'
import {
  normalizeSlotProposal,
  notifySlotProposalsUpdated,
} from '../../slotProposal/slotProposalUtils'

const BOOKING_UPDATED_EVENT = 'booking-updated'
const SLOT_PROPOSAL_UPDATED_EVENT = 'slot-proposal-updated'

function buildStreamUrl(userId, role) {
  const params = new URLSearchParams({
    userId: String(userId),
    role: String(role),
  })

  return `${API_BASE_URL}/api/notifications/stream?${params.toString()}`
}

function parseBookingEvent(event) {
  if (!event?.data) {
    return null
  }

  try {
    return normalizeBooking(JSON.parse(event.data))
  } catch {
    return null
  }
}

function parseSlotProposalEvent(event) {
  if (!event?.data) {
    return null
  }

  try {
    return normalizeSlotProposal(JSON.parse(event.data))
  } catch {
    return null
  }
}

function createMessageHandler(onBookingUpdated) {
  return (event) => {
    const booking = parseBookingEvent(event)
    if (booking) {
      onBookingUpdated?.(booking)
    }
    notifyBookingsUpdated()
  }
}

function createSlotProposalHandler(onSlotProposalUpdated) {
  return (event) => {
    const proposal = parseSlotProposalEvent(event)
    if (proposal) {
      onSlotProposalUpdated?.(proposal)
    }
    notifySlotProposalsUpdated()
  }
}

export function connectNotificationStream(
  userId,
  role,
  { onBookingUpdated, onSlotProposalUpdated } = {},
) {
  if (!userId || !role) {
    return null
  }

  const eventSource = new EventSource(buildStreamUrl(userId, role))
  const handleMessage = createMessageHandler(onBookingUpdated)
  const handleSlotProposal = createSlotProposalHandler(onSlotProposalUpdated)

  eventSource.onopen = () => {
    console.log('[SSE] 연결 성공', { userId, role })
  }

  eventSource.addEventListener(BOOKING_UPDATED_EVENT, handleMessage)
  eventSource.addEventListener(SLOT_PROPOSAL_UPDATED_EVENT, handleSlotProposal)
  eventSource.onmessage = handleMessage

  return eventSource
}

export function disconnectNotificationStream(eventSource, { log = false } = {}) {
  if (!eventSource) {
    return
  }

  eventSource.close()

  if (log) {
    console.log('[SSE] 연결 해제')
  }
}
