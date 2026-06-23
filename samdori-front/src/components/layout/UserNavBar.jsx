import './UserNavBar.css'

export default function UserNavBar({
  name,
  onLogout,
  notificationCount = 0,
  onNotificationClick,
  showMenuButton = false,
  onMenuClick,
}) {
  const showBadge = notificationCount > 0

  return (
    <header className="user-nav">
      <div className="user-nav__inner">
        <div className="user-nav__start">
          {showMenuButton && (
            <button
              type="button"
              className="user-nav__menu-button"
              onClick={onMenuClick}
              aria-label="메뉴 열기"
            >
              <span className="user-nav__menu-icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>
          )}
          <p className="user-nav__brand">상담 예약</p>
        </div>

        <div className="user-nav__menu">
          {onNotificationClick && (
            <button
              type="button"
              className="user-nav__notification"
              onClick={onNotificationClick}
              aria-label={
                showBadge
                  ? `알림 ${notificationCount}건, 확인하기`
                  : '알림 확인하기'
              }
            >
              <span className="user-nav__notification-icon" aria-hidden="true">
                🔔
              </span>
              {showBadge && (
                <span className="user-nav__notification-badge">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
          )}
          <span className="user-nav__name">{name}님</span>
          <button className="user-nav__logout" type="button" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </div>
    </header>
  )
}
