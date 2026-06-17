import './UserNavBar.css'

export default function UserNavBar({ name, onLogout }) {
  return (
    <header className="user-nav">
      <div className="user-nav__inner">
        <p className="user-nav__brand">상담 예약</p>
        <div className="user-nav__menu">
          <span className="user-nav__name">{name}님</span>
          <button className="user-nav__logout" type="button" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </div>
    </header>
  )
}
