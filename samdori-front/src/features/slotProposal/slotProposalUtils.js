import {
  PROPOSAL_SLOT_STATUS,
  SLOT_PROPOSAL_STATUS,
} from './constants'

export const SLOT_PROPOSALS_UPDATED_EVENT = 'samdori-slot-proposals-updated'

function normalizeSlot(slot) {
  return {
    date: slot.date,
    timeSlot: slot.timeSlot ?? slot.time_slot,
    status: slot.status ?? PROPOSAL_SLOT_STATUS.PENDING,
  }
}

export function normalizeSlotProposal(raw) {
  const slots = raw.slots ?? raw.slotList ?? raw.slot_list ?? []

  return {
    id: String(raw.id),
    counselorId: String(raw.counselorId ?? raw.counselor_id ?? ''),
    counselorName: raw.counselorName ?? raw.counselor_name ?? '상담사',
    clientId: String(raw.clientId ?? raw.client_id ?? ''),
    clientName: raw.clientName ?? raw.client_name ?? '',
    message: raw.message ?? '',
    status: raw.status ?? SLOT_PROPOSAL_STATUS.PENDING,
    slots: Array.isArray(slots) ? slots.map(normalizeSlot) : [],
    createdAt: raw.createdAt ?? raw.created_at ?? null,
    expiresAt: raw.expiresAt ?? raw.expires_at ?? null,
  }
}

export function extractSlotProposals(data) {
  const list = Array.isArray(data)
    ? data
    : (data?.data ?? data?.proposals ?? [])

  if (!Array.isArray(list)) {
    return []
  }

  return list.map(normalizeSlotProposal)
}

export function isPendingProposalSlot(slot) {
  return slot?.status === PROPOSAL_SLOT_STATUS.PENDING
}

export function getPendingSlots(proposal) {
  return (proposal?.slots ?? []).filter(isPendingProposalSlot)
}

export function withPendingSlotsOnly(proposal) {
  const pendingSlots = getPendingSlots(proposal)

  if (pendingSlots.length === 0) {
    return null
  }

  return {
    ...proposal,
    slots: pendingSlots,
  }
}

export function filterActiveProposals(proposals) {
  return proposals.map(withPendingSlotsOnly).filter(Boolean)
}

export function isActiveSlotProposal(proposal) {
  if (!proposal) return false

  if (getPendingSlots(proposal).length > 0) {
    return true
  }

  return (
    proposal.status === SLOT_PROPOSAL_STATUS.PENDING &&
    (proposal.slots?.length ?? 0) > 0
  )
}

export function removeSlotFromProposals(
  proposals,
  { proposalId, date, timeSlot },
) {
  return proposals
    .map((proposal) => {
      if (proposal.id !== String(proposalId)) {
        return proposal
      }

      const remainingSlots = proposal.slots.filter(
        (slot) => !(slot.date === date && slot.timeSlot === timeSlot),
      )

      if (remainingSlots.length === 0) {
        return null
      }

      return {
        ...proposal,
        slots: remainingSlots,
      }
    })
    .filter(Boolean)
}

export function notifySlotProposalsUpdated() {
  window.dispatchEvent(new Event(SLOT_PROPOSALS_UPDATED_EVENT))
}

function sortSlots(slots) {
  return [...slots].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date)
    if (dateCompare !== 0) return dateCompare

    return (a.timeSlot ?? '').localeCompare(b.timeSlot ?? '')
  })
}

export function mergeProposalsByCounselor(proposals) {
  const groups = new Map()

  filterActiveProposals(proposals).forEach((proposal) => {
    const counselorKey = String(proposal.counselorId)
    const slotsWithProposal = proposal.slots.map((slot) => ({
      ...slot,
      proposalId: proposal.id,
    }))

    if (slotsWithProposal.length === 0) {
      return
    }

    const existing = groups.get(counselorKey)

    if (!existing) {
      groups.set(counselorKey, {
        counselorId: proposal.counselorId,
        counselorName: proposal.counselorName,
        message: proposal.message ?? '',
        createdAt: proposal.createdAt ?? null,
        slots: slotsWithProposal,
      })
      return
    }

    existing.slots.push(...slotsWithProposal)

    if (proposal.message?.trim()) {
      existing.message = proposal.message
    }

    if (
      proposal.createdAt &&
      (!existing.createdAt || proposal.createdAt > existing.createdAt)
    ) {
      existing.createdAt = proposal.createdAt
    }
  })

  return [...groups.values()]
    .map((group) => {
      const uniqueSlots = new Map()

      group.slots.forEach((slot) => {
        uniqueSlots.set(
          `${slot.proposalId}-${slot.date}-${slot.timeSlot}`,
          slot,
        )
      })

      return {
        ...group,
        slots: sortSlots([...uniqueSlots.values()]),
      }
    })
    .filter((group) => group.slots.length > 0)
}
