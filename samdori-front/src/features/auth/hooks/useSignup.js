import { useState } from 'react'
import { createUser } from '../api/signup'

export function useSignup() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const submitSignup = async (payload) => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await createUser(payload)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : '회원가입에 실패했습니다.'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { submitSignup, isLoading, error }
}
