import { useState } from 'react'
import { createUser } from '../api/signup'

export function useSignup() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const submitSignup = async (payload) => {
    setIsLoading(true)
    setError(null)
    setIsSuccess(false)

    try {
      await createUser(payload)
      setIsSuccess(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : '회원가입에 실패했습니다.'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { submitSignup, isLoading, error, isSuccess }
}
