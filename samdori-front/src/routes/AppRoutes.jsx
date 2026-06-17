import { Routes, Route } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import ReservationPage from '../pages/reservation'
import SignupPage from '../pages/auth/SignupPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/reservation" element={<ReservationPage />} />
      <Route path="/signup" element={<SignupPage />} />
    </Routes>
  )
}
