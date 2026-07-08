import { useCallback, useEffect, useRef } from 'react'
import {
  connectNotificationStream,
  disconnectNotificationStream,
} from '../api/notificationStream'

export function useNotificationStream({
  userId,
  role,
  onBookingUpdated,
  onSlotProposalUpdated,
}) {
  const eventSourceRef = useRef(null)
  const onBookingUpdatedRef = useRef(onBookingUpdated)
  const onSlotProposalUpdatedRef = useRef(onSlotProposalUpdated)

  onBookingUpdatedRef.current = onBookingUpdated
  onSlotProposalUpdatedRef.current = onSlotProposalUpdated

  const disconnect = useCallback(() => {
    disconnectNotificationStream(eventSourceRef.current, { log: true })
    eventSourceRef.current = null
  }, [])

  useEffect(() => {
    if (!userId || !role) {
      return undefined
    }

    eventSourceRef.current = connectNotificationStream(userId, role, {
      onBookingUpdated: (booking) => onBookingUpdatedRef.current?.(booking),
      onSlotProposalUpdated: (proposal) =>
        onSlotProposalUpdatedRef.current?.(proposal),
    })

    return () => {
      disconnectNotificationStream(eventSourceRef.current)
      eventSourceRef.current = null
    }
  }, [userId, role])

  return { disconnect }
}
