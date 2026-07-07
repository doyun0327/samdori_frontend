import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import './AppAlert.css'

export default function AppAlert({
  message,
  confirm = false,
  withReason = false,
  reasonLabel = '취소 사유',
  reasonPlaceholder = '취소 사유를 입력해 주세요.',
  reasonRequired = true,
  onClose,
  onConfirm,
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

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

  const handleConfirm = () => {
    if (!withReason) {
      onConfirm()
      return
    }

    const trimmedReason = reason.trim()

    if (reasonRequired && !trimmedReason) {
      setError('취소 사유를 입력해 주세요.')
      return
    }

    onConfirm(trimmedReason)
  }

  return createPortal(
    <div
      className="app-alert"
      onClick={confirm || withReason ? undefined : onClose}
    >
      <div
        className={`app-alert__dialog${
          withReason ? ' app-alert__dialog--with-reason' : ''
        }`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="app-alert-message"
        onClick={(event) => event.stopPropagation()}
      >
        <p id="app-alert-message" className="app-alert__message">
          {message}
        </p>

        {withReason && (
          <div className="app-alert__reason">
            <label className="app-alert__reason-label" htmlFor="app-alert-reason">
              {reasonLabel}
            </label>
            <textarea
              id="app-alert-reason"
              className="app-alert__reason-input"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value)
                if (error) setError('')
              }}
              placeholder={reasonPlaceholder}
              rows={3}
              autoFocus
            />
            {error && (
              <p className="app-alert__reason-error" role="alert">
                {error}
              </p>
            )}
          </div>
        )}

        {confirm || withReason ? (
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
              onClick={handleConfirm}
              autoFocus={!withReason}
            >
              {withReason ? '취소하기' : '네'}
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
