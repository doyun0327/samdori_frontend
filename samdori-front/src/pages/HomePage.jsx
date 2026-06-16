import LoginForm from '../components/auth/login'
import './HomePage.css'

export default function HomePage() {
  return (
    <main className="home-page">
      <div className="home-page__content">
        <div className="home-page__hero">
          <p className="home-page__badge">상담 예약</p>
          <h1>전문 상담을 더 쉽게</h1>
          <p className="home-page__description">
            로그인 후 원하는 시간에 상담을 예약해 보세요.
          </p>
        </div>

        <section className="home-page__card">
          <LoginForm />
        </section>
      </div>
    </main>
  )
}
