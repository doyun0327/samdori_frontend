import { useEffect } from 'react'
import { SLOT_PROPOSALS_UPDATED_EVENT } from '../slotProposalUtils'

export function useSlotProposalsUpdatedListener(callback) {
  useEffect(() => {
    window.addEventListener(SLOT_PROPOSALS_UPDATED_EVENT, callback)
    return () => {
      window.removeEventListener(SLOT_PROPOSALS_UPDATED_EVENT, callback)
    }
  }, [callback])
}
