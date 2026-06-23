import { useEffect } from 'react'
import './SideNavDrawer.css'

export default function SideNavDrawer({
  isOpen,
  onClose,
  title,
  items,
  activeId,
  onSelect,
}) {
  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="side-nav-drawer">
      <button
        type="button"
        className="side-nav-drawer__backdrop"
        aria-label="메뉴 닫기"
        onClick={onClose}
      />

      <nav
        className="side-nav-drawer__panel"
        aria-label={title}
        role="navigation"
      >
        <div className="side-nav-drawer__header">
          <p className="side-nav-drawer__title">{title}</p>
          <button
            type="button"
            className="side-nav-drawer__close"
            onClick={onClose}
            aria-label="메뉴 닫기"
          >
            ✕
          </button>
        </div>

        <ul className="side-nav-drawer__list">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`side-nav-drawer__item${
                  activeId === item.id ? ' side-nav-drawer__item--active' : ''
                }`}
                onClick={() => onSelect(item.id)}
                aria-current={activeId === item.id ? 'page' : undefined}
              >
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className="side-nav-drawer__badge">{item.badge}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
