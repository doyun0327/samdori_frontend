import { API_BASE_URL } from '../../../config/api'
import {
  extractSlotProposals,
  normalizeSlotProposal,
  notifySlotProposalsUpdated,
} from '../slotProposalUtils'

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok || data.success === false) {
    throw new Error(data.message ?? '시간 제안 처리에 실패했습니다.')
  }

  return data
}

export async function createSlotProposal({
  counselorId,
  clientId,
  slots,
  message,
}) {
  const data = await requestJson(`${API_BASE_URL}/api/slot-proposals`, {
    method: 'POST',
    body: JSON.stringify({
      counselorId: Number(counselorId),
      clientId: Number(clientId),
      slots,
      message: message?.trim() ?? '',
    }),
  })

  notifySlotProposalsUpdated()

  const proposal = data?.data ?? data
  return normalizeSlotProposal(proposal)
}

export async function fetchClientSlotProposals(clientId) {
  if (clientId == null || clientId === '') {
    return []
  }

  const data = await requestJson(
    `${API_BASE_URL}/api/slot-proposals/client?clientId=${clientId}`,
  )

  return extractSlotProposals(data)
}

export async function fetchCounselorSlotProposals(counselorId) {
  if (counselorId == null || counselorId === '') {
    return []
  }

  const data = await requestJson(
    `${API_BASE_URL}/api/slot-proposals/counselor?counselorId=${counselorId}`,
  )

  return extractSlotProposals(data)
}

export async function cancelSlotProposal(proposalId, counselorId) {
  const data = await requestJson(
    `${API_BASE_URL}/api/slot-proposals/${proposalId}/cancel`,
    {
      method: 'PATCH',
      body: JSON.stringify({ counselorId: Number(counselorId) }),
    },
  )

  notifySlotProposalsUpdated()

  const proposal = data?.data ?? data
  return normalizeSlotProposal(proposal)
}

export async function declineClientSlotProposal(
  proposalId,
  { clientId, date, timeSlot },
) {
  const data = await requestJson(
    `${API_BASE_URL}/api/slot-proposals/${proposalId}/decline`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        clientId: Number(clientId),
        date,
        timeSlot,
      }),
    },
  )

  notifySlotProposalsUpdated()

  const proposal = data?.data ?? data
  return normalizeSlotProposal(proposal)
}

export async function bookSlotFromProposal(proposalId, { clientId, date, timeSlot }) {
  const data = await requestJson(
    `${API_BASE_URL}/api/slot-proposals/${proposalId}/book`,
    {
      method: 'POST',
      body: JSON.stringify({
        clientId: Number(clientId),
        date,
        timeSlot,
      }),
    },
  )

  notifySlotProposalsUpdated()

  return data?.data ?? data
}
