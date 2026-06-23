import { useEffect } from 'react'
import { BOOKINGS_UPDATED_EVENT } from '../bookingUtils'

export function useBookingsUpdatedListener(callback) {
  useEffect(() => {
    window.addEventListener(BOOKINGS_UPDATED_EVENT, callback)
    return () => {
      window.removeEventListener(BOOKINGS_UPDATED_EVENT, callback)
    }
  }, [callback])
}
