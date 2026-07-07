import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import './AppAlert.css'

export default function AppAlert({
  message,
  confirm = false,
  onClose,
  onConfirm,
}) {
  useEffect(() => {
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
  }, [onClose])

  return createPortal(
    <div className="app-alert" onClick={confirm ? undefined : onClose}>
      <div
        className="app-alert__dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="app-alert-message"
        onClick={(event) => event.stopPropagation()}
      >
        <p id="app-alert-message" className="app-alert__message">
          {message}
        </p>

        {confirm ? (
          <div className="app-alert__actions">
            <button
              type="button"
              className="app-alert__button app-alert__button--secondary"
              onClick={onClose}
            >
              아니오
            </button>
            <button
              type="button"
              className="app-alert__button"
              onClick={onConfirm}
              autoFocus
            >
              네
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="app-alert__button"
            onClick={onClose}
            autoFocus
          >
            확인
          </button>
        )}
      </div>
    </div>,
    document.body,
  )
}
