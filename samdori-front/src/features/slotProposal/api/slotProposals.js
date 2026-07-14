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

function extractProposal(data) {
  return normalizeSlotProposal(data?.data ?? data)
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

  const proposal = extractProposal(data)
  notifySlotProposalsUpdated(proposal)
  return proposal
}

function extractCount(data) {
  if (typeof data === 'number') {
    return data
  }

  const payload = data?.data ?? data
  const raw = payload?.count ?? payload

  const count = Number(raw)
  return Number.isFinite(count) ? count : 0
}

export async function fetchClientSlotProposalCount(clientId) {
  if (clientId == null || clientId === '') {
    return 0
  }

  const data = await requestJson(
    `${API_BASE_URL}/api/slot-proposals/client/count?clientId=${clientId}`,
  )

  return extractCount(data)
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

export async function fetchCounselorSlotProposalCount(counselorId) {
  if (counselorId == null || counselorId === '') {
    return 0
  }

  const data = await requestJson(
    `${API_BASE_URL}/api/slot-proposals/counselor/count?counselorId=${counselorId}`,
  )

  return extractCount(data)
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

  const proposal = extractProposal(data)
  notifySlotProposalsUpdated(proposal)
  return proposal
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

  const proposal = extractProposal(data)
  notifySlotProposalsUpdated(proposal)
  return proposal
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

  const payload = data?.data ?? data

  if (payload?.proposal) {
    notifySlotProposalsUpdated(payload.proposal)
  } else {
    notifySlotProposalsUpdated()
  }

  return payload
}
