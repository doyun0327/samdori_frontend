import { useState } from 'react'
import { login } from '../api/login'

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const submitLogin = async (payload) => {
    setIsLoading(true)
    setError('')

    const result = await login(payload)

    if (!result.success) {
      setError(result.message ?? '로그인에 실패했습니다.')
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    return result.data
  }

  const clearError = () => setError('')

  return { submitLogin, isLoading, error, clearError }
}
