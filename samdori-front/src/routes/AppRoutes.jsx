import { Routes, Route } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import ReservationPage from '../pages/reservation'
import SignupPage from '../pages/auth/SignupPage'
import { COUNSELOR_BOOKINGS_PATH, COUNSELOR_PROPOSALS_PATH, COUNSELOR_REQUESTS_PATH, RESERVATION_PATH } from './paths'

export { COUNSELOR_BOOKINGS_PATH, COUNSELOR_PROPOSALS_PATH, COUNSELOR_REQUESTS_PATH, RESERVATION_PATH } from './paths'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path={COUNSELOR_REQUESTS_PATH} element={<ReservationPage />} />
      <Route path={COUNSELOR_BOOKINGS_PATH} element={<ReservationPage />} />
      <Route path={COUNSELOR_PROPOSALS_PATH} element={<ReservationPage />} />
      <Route path={RESERVATION_PATH} element={<ReservationPage />} />
      <Route path="/signup" element={<SignupPage />} />
    </Routes>
  )
}
