import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  bookSlotFromProposal,
  declineClientSlotProposal,
  fetchClientSlotProposalCount,
  fetchClientSlotProposals,
} from '../../features/slotProposal/api/slotProposals'
import { useSlotProposalsUpdatedListener } from '../../features/slotProposal/hooks/useSlotProposalsUpdatedListener'
import { useAppAlert } from '../../context/AppAlertContext'
import {
  formatBookingSchedule,
  formatScheduleDateHeader,
  formatTimeSlotRange,
} from '../../features/booking/formatBooking'
import {
  filterActiveProposals,
  mergeProposalsByCounselor,
  removeSlotFromProposals,
} from '../../features/slotProposal/slotProposalUtils'
import './ClientSlotProposals.css'

const DEFAULT_PROPOSAL_MESSAGE = '아래 시간 중 편하신 시간을 선택해 주세요.'

function groupSlotsByDate(slots) {
  const groups = []

  slots.forEach((slot) => {
    const lastGroup = groups[groups.length - 1]

    if (!lastGroup || lastGroup.date !== slot.date) {
      groups.push({ date: slot.date, slots: [slot] })
      return
    }

    lastGroup.slots.push(slot)
  })

  return groups
}

function getSlotKey(proposalId, slot) {
  return `${proposalId}-${slot.date}-${slot.timeSlot}`
}

function getProposalSlotKeySet(proposalList) {
  const keys = new Set()

  proposalList.forEach((proposal) => {
    proposal.slots.forEach((slot) => {
      keys.add(getSlotKey(proposal.id, slot))
    })
  })

  return keys
}

function ProposalSlotOption({
  slot,
  processingKey,
  disabled,
  onConfirm,
  onDecline,
}) {
  const key = getSlotKey(slot.proposalId, slot)
  const isConfirming = processingKey === `${key}:confirm`
  const isDeclining = processingKey === `${key}:decline`

  return (
    <div className="client-slot-proposal-card__slot">
      <span className="client-slot-proposal-card__slot-time">
        {formatTimeSlotRange(slot.timeSlot)}
      </span>
      <div className="client-slot-proposal-card__slot-actions">
        <button
          type="button"
          className="client-slot-proposal-card__slot-button client-slot-proposal-card__slot-button--decline"
          onClick={onDecline}
          disabled={disabled}
        >
          {isDeclining ? '처리 중...' : '취소'}
        </button>
        <button
          type="button"
          className="client-slot-proposal-card__slot-button client-slot-proposal-card__slot-button--confirm"
          onClick={onConfirm}
          disabled={disabled}
        >
          {isConfirming ? '처리 중...' : '확정'}
        </button>
      </div>
    </div>
  )
}

function ProposalCard({
  group,
  processingKey,
  onConfirmSlot,
  onDeclineSlot,
}) {
  const displayMessage = group.message?.trim() || DEFAULT_PROPOSAL_MESSAGE
  const slotCount = group.slots.length
  const isBusy = Boolean(processingKey)

  if (slotCount === 0) {
    return null
  }

  return (
    <article className="client-slot-proposal-card">
      <div className="client-slot-proposal-card__top">
        <div className="client-slot-proposal-card__avatar" aria-hidden="true">
          {group.counselorName?.charAt(0) ?? '상'}
        </div>
        <div className="client-slot-proposal-card__intro">
          <p className="client-slot-proposal-card__counselor">
            {group.counselorName} 상담사
          </p>
        </div>
      </div>

      <blockquote className="client-slot-proposal-card__message">
        {displayMessage}
      </blockquote>

      <div className="client-slot-proposal-card__schedule">
        {groupSlotsByDate(group.slots).map((dayGroup) => (
          <div
            key={`${group.counselorId}-${dayGroup.date}`}
            className="client-slot-proposal-card__day"
          >
            <p className="client-slot-proposal-card__date">
              {formatScheduleDateHeader(dayGroup.date)}
            </p>
            <div className="client-slot-proposal-card__slots">
              {dayGroup.slots.map((slot) => {
                const key = getSlotKey(slot.proposalId, slot)

                return (
                  <ProposalSlotOption
                    key={key}
                    slot={slot}
                    processingKey={processingKey}
                    disabled={isBusy}
                    onConfirm={() => onConfirmSlot(slot.proposalId, slot, group)}
                    onDecline={() => onDeclineSlot(slot.proposalId, slot, group)}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}

export default function ClientSlotProposals({
  clientId,
  onBooked,
  onProposalCountChange,
}) {
  const [proposalCount, setProposalCount] = useState(0)
  const [proposals, setProposals] = useState([])
  const [isListLoaded, setIsListLoaded] = useState(false)
  const [isCountLoading, setIsCountLoading] = useState(false)
  const [isListLoading, setIsListLoading] = useState(false)
  const [processingKey, setProcessingKey] = useState('')
  const [message, setMessage] = useState('')
  const [isCompact, setIsCompact] = useState(false)
  const knownSlotKeysRef = useRef(new Set())
  const isListLoadedRef = useRef(false)
  const { showConfirm } = useAppAlert()

  useEffect(() => {
    isListLoadedRef.current = isListLoaded
  }, [isListLoaded])

  const applyLocalSlotRemoval = useCallback((proposalId, slot) => {
    setProposals((prev) =>
      removeSlotFromProposals(prev, {
        proposalId,
        date: slot.date,
        timeSlot: slot.timeSlot,
      }),
    )
  }, [])

  const loadCount = useCallback(async () => {
    if (!clientId) {
      setProposalCount(0)
      onProposalCountChange?.(0)
      return
    }

    setIsCountLoading(true)

    try {
      const count = await fetchClientSlotProposalCount(clientId)
      setProposalCount(count)
      onProposalCountChange?.(count)
    } catch {
      setProposalCount(0)
      onProposalCountChange?.(0)
    } finally {
      setIsCountLoading(false)
    }
  }, [clientId, onProposalCountChange])

  const loadProposals = useCallback(async () => {
    if (!clientId) {
      setProposals([])
      setIsListLoaded(false)
      return
    }

    setIsListLoading(true)

    try {
      const list = await fetchClientSlotProposals(clientId)
      setProposals(filterActiveProposals(list))
      setIsListLoaded(true)
    } catch {
      setProposals([])
    } finally {
      setIsListLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    setIsListLoaded(false)
    setProposals([])
    loadCount()
  }, [loadCount])

  const handleProposalUpdated = useCallback(() => {
    loadCount()
    if (isListLoadedRef.current) {
      loadProposals()
    }
  }, [loadCount, loadProposals])

  useSlotProposalsUpdatedListener(handleProposalUpdated)

  useEffect(() => {
    if (!isListLoaded) return

    const nextKeys = getProposalSlotKeySet(proposals)
    const hasNewSlots = [...nextKeys].some(
      (key) => !knownSlotKeysRef.current.has(key),
    )

    if (hasNewSlots) {
      setMessage('')
      setIsCompact(false)
    }

    knownSlotKeysRef.current = nextKeys
  }, [proposals, isListLoaded])

  const mergedProposalGroups = useMemo(
    () => mergeProposalsByCounselor(proposals),
    [proposals],
  )

  const handleOpenList = () => {
    setMessage('')
    setIsCompact(false)
    loadProposals()
  }

  const handleConfirmSlot = async (proposalId, slot, group) => {
    const scheduleLabel = formatBookingSchedule(slot.date, slot.timeSlot)
    const confirmed = await showConfirm(
      `${group.counselorName} 상담사\n${scheduleLabel}\n이 시간으로 확정하시겠습니까?`,
    )
    if (!confirmed) return

    const key = `${getSlotKey(proposalId, slot)}:confirm`
    setProcessingKey(key)
    setMessage('')

    try {
      await bookSlotFromProposal(proposalId, {
        clientId,
        date: slot.date,
        timeSlot: slot.timeSlot,
      })
      applyLocalSlotRemoval(proposalId, slot)
      setMessage(
        `${group.counselorName} 상담사 ${scheduleLabel} 예약을 확정했습니다.`,
      )
      loadCount()
      onBooked?.()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '예약 확정에 실패했습니다.'
      setMessage(errorMessage)
    } finally {
      setProcessingKey('')
    }
  }

  const handleDeclineSlot = async (proposalId, slot, group) => {
    const scheduleLabel = formatBookingSchedule(slot.date, slot.timeSlot)
    const confirmed = await showConfirm(
      `${group.counselorName} 상담사의\n${scheduleLabel} 제안을 거절하시겠습니까?`,
    )
    if (!confirmed) return

    const key = `${getSlotKey(proposalId, slot)}:decline`
    setProcessingKey(key)
    setMessage('')

    try {
      await declineClientSlotProposal(proposalId, {
        clientId,
        date: slot.date,
        timeSlot: slot.timeSlot,
      })
      applyLocalSlotRemoval(proposalId, slot)
      setIsCompact(true)
      setMessage(`${scheduleLabel} 제안을 거절했습니다.`)
      loadCount()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '제안 거절에 실패했습니다.'
      setMessage(errorMessage)
    } finally {
      setProcessingKey('')
    }
  }

  if (isCountLoading && !isListLoaded) {
    return (
      <section className="client-slot-proposals client-slot-proposals--loading">
        <p className="client-slot-proposals__loading" role="status">
          받은 시간 제안을 확인하는 중입니다...
        </p>
      </section>
    )
  }

  if (!isListLoaded) {
    if (proposalCount <= 0 && !message) {
      return null
    }

    return (
      <section className="client-slot-proposals" aria-label="받은 시간 제안">
        {proposalCount > 0 && (
          <>
            <div className="client-slot-proposals__banner">
              <div
                className="client-slot-proposals__banner-icon"
                aria-hidden="true"
              >
                🔔
              </div>
              <div className="client-slot-proposals__banner-copy">
                <p className="client-slot-proposals__eyebrow">새 요청</p>
                <h2 className="client-slot-proposals__title">상담 시간 제안</h2>
              </div>
            </div>
            <button
              type="button"
              className="client-slot-proposals__open-list"
              onClick={handleOpenList}
              disabled={isListLoading}
            >
              <span>
                {isListLoading
                  ? '불러오는 중...'
                  : `받은 시간 제안 ${proposalCount}건 보기`}
              </span>
              <span
                className="client-slot-proposals__open-list-arrow"
                aria-hidden="true"
              >
                ›
              </span>
            </button>
          </>
        )}
        {message && (
          <p className="client-slot-proposals__feedback" role="status">
            {message}
          </p>
        )}
      </section>
    )
  }

  if (isListLoading && mergedProposalGroups.length === 0) {
    return (
      <section className="client-slot-proposals client-slot-proposals--loading">
        <p className="client-slot-proposals__loading" role="status">
          받은 시간 제안을 불러오는 중입니다...
        </p>
      </section>
    )
  }

  if (mergedProposalGroups.length === 0) {
    if (!message) {
      return null
    }

    return (
      <section aria-label="받은 시간 제안">
        <p className="client-slot-proposals__feedback" role="status">
          {message}
        </p>
      </section>
    )
  }

  const sectionClassName = isCompact ? undefined : 'client-slot-proposals'

  return (
    <section className={sectionClassName} aria-label="받은 시간 제안">
      {!isCompact && (
        <div className="client-slot-proposals__banner">
          <div className="client-slot-proposals__banner-icon" aria-hidden="true">
            🔔
          </div>
          <div className="client-slot-proposals__banner-copy">
            <p className="client-slot-proposals__eyebrow">새 요청</p>
            <h2 className="client-slot-proposals__title">상담 시간 제안</h2>
          </div>
        </div>
      )}

      <div className="client-slot-proposals__list">
        {mergedProposalGroups.map((group) => (
          <ProposalCard
            key={group.counselorId}
            group={group}
            processingKey={processingKey}
            onConfirmSlot={handleConfirmSlot}
            onDeclineSlot={handleDeclineSlot}
          />
        ))}
      </div>

      {message && (
        <p className="client-slot-proposals__feedback" role="status">
          {message}
        </p>
      )}
    </section>
  )
}
