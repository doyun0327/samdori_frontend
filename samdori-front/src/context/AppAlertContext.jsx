import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import AppAlert from '../components/ui/AppAlert'

const AppAlertContext = createContext(null)

export function AppAlertProvider({ children }) {
  const [alertState, setAlertState] = useState(null)

  const showAlert = useCallback((message) => {
    return new Promise((resolve) => {
      setAlertState({ message, type: 'alert', resolve })
    })
  }, [])

  const showConfirm = useCallback((message) => {
    return new Promise((resolve) => {
      setAlertState({ message, type: 'confirm', resolve })
    })
  }, [])

  const showCancelReason = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setAlertState({
        message,
        type: 'cancelReason',
        resolve,
        reasonLabel: options.reasonLabel ?? '취소 사유',
        reasonPlaceholder:
          options.reasonPlaceholder ?? '취소 사유를 입력해 주세요.',
        reasonRequired: options.reasonRequired !== false,
      })
    })
  }, [])

  const closeAlert = useCallback((result) => {
    setAlertState((current) => {
      if (!current) return null

      if (current.type === 'confirm') {
        current.resolve(Boolean(result))
      } else if (current.type === 'cancelReason') {
        current.resolve(result ?? null)
      } else {
        current.resolve()
      }

      return null
    })
  }, [])

  const value = useMemo(
    () => ({ showAlert, showConfirm, showCancelReason }),
    [showAlert, showConfirm, showCancelReason],
  )

  return (
    <AppAlertContext.Provider value={value}>
      {children}
      {alertState?.type === 'confirm' ? (
        <AppAlert
          message={alertState.message}
          confirm
          onClose={() => closeAlert(false)}
          onConfirm={() => closeAlert(true)}
        />
      ) : alertState?.type === 'cancelReason' ? (
        <AppAlert
          message={alertState.message}
          withReason
          reasonLabel={alertState.reasonLabel}
          reasonPlaceholder={alertState.reasonPlaceholder}
          reasonRequired={alertState.reasonRequired}
          onClose={() => closeAlert(null)}
          onConfirm={(reason) => closeAlert(reason)}
        />
      ) : (
        alertState && (
          <AppAlert
            message={alertState.message}
            onClose={() => closeAlert()}
          />
        )
      )}
    </AppAlertContext.Provider>
  )
}

export function useAppAlert() {
  const context = useContext(AppAlertContext)

  if (!context) {
    throw new Error('useAppAlert must be used within AppAlertProvider')
  }

  return context
}
