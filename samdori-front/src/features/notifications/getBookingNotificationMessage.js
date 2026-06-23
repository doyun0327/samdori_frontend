import { BOOKING_STATUS } from '../booking/constants'
import {
  isBookingForClient,
  isBookingForCounselor,
  isClientResponseStatus,
} from '../booking/clientBookingNotifications'
import { isClient, isCounselor } from '../../utils/authSession'

export function getBookingNotificationMessage(booking, role) {
  if (!booking) {
    return null
  }

  if (isCounselor(role) && booking.status === BOOKING_STATUS.PENDING) {
    const name = booking.clientName || '내담자'
    return `${name}님의 예약 요청이 도착했습니다.`
  }

  if (isClient(role) && isClientResponseStatus(booking.status)) {
    const name = booking.counselorName || '상담사'
    if (booking.status === BOOKING_STATUS.ACCEPTED) {
      return `${name}님이 예약을 수락했습니다.`
    }
    if (booking.status === BOOKING_STATUS.REJECTED) {
      return `${name}님이 예약을 거절했습니다.`
    }
  }

  return null
}

export function isRelevantBookingUpdate(booking, userId, role) {
  if (!booking || !userId) {
    return false
  }

  if (isCounselor(role)) {
    return (
      booking.status === BOOKING_STATUS.PENDING &&
      isBookingForCounselor(booking, userId)
    )
  }

  if (isClient(role)) {
    return (
      isClientResponseStatus(booking.status) &&
      isBookingForClient(booking, userId)
    )
  }

  return false
}
