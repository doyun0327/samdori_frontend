import { Link } from 'react-router-dom'
import './HomePage.css'

export default function HomePage() {
  return (
    <main className="home-page">
      <div className="home-page__content">
        <p className="home-page__badge">상담 예약</p>
        <h1>전문 상담을 더 쉽게</h1>
        <p className="home-page__description">
          회원가입 후 원하는 시간에 상담을 예약해 보세요.
        </p>
        <Link className="home-page__cta" to="/signup">
          회원가입
        </Link>
      </div>
    </main>
  )
}
