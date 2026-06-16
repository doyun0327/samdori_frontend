import SignupForm from '../../components/auth/signup'
import './SignupPage.css'

export default function SignupPage() {
  return (
    <main className="signup-page">
      <div className="signup-page__hero">
        <p className="signup-page__badge">상담 예약</p>
        <h1>회원가입</h1>
        <p className="signup-page__description">
          간단한 정보 입력 후 전문 상담 예약을 시작해 보세요.
        </p>
      </div>

      <section className="signup-page__card">
        <SignupForm />
      </section>
    </main>
  )
}
