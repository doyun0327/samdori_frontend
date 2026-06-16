import { useLocation, Navigate, useNavigate } from 'react-router-dom'
import './WelcomePage.css'

export default function WelcomePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const name = location.state?.name ?? sessionStorage.getItem('userName')

  const handleLogout = () => {
    sessionStorage.removeItem('userName')
    navigate('/', { replace: true })
  }

  if (!name) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="welcome-page">
      <div className="welcome-page__content">
        <p className="welcome-page__badge">상담 예약</p>
        <h1>{name}님 안녕하세요</h1>
        <p className="welcome-page__description">
          오늘도 편안한 상담 되시길 바랍니다.
        </p>
        <button className="welcome-page__logout" type="button" onClick={handleLogout}>
          로그아웃
        </button>
      </div>
    </main>
  )
}
