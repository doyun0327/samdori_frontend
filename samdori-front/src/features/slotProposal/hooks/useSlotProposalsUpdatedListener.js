import { useEffect } from 'react'
import { SLOT_PROPOSALS_UPDATED_EVENT } from '../slotProposalUtils'

export function useSlotProposalsUpdatedListener(callback) {
  useEffect(() => {
    const handler = (event) => {
      callback(event.detail?.proposal ?? null)
    }

    window.addEventListener(SLOT_PROPOSALS_UPDATED_EVENT, handler)
    return () => {
      window.removeEventListener(SLOT_PROPOSALS_UPDATED_EVENT, handler)
    }
  }, [callback])
}
