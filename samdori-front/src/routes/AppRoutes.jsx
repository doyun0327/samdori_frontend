import { Routes, Route } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import WelcomePage from '../pages/WelcomePage'
import SignupPage from '../pages/auth/SignupPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<WelcomePage />} />
      <Route path="/signup" element={<SignupPage />} />
    </Routes>
  )
}
