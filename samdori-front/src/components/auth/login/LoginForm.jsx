import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLogin } from '../../../features/auth/hooks/useLogin'
import { saveAuthSession } from '../../../utils/authSession'
import { registerSamdoriDeviceToken } from '../../../utils/samdoriPushContext'
import {
  toLoginPayload,
  validateLoginForm,
} from '../../../features/auth/validators/loginValidator'
import './LoginForm.css'

const INITIAL_VALUES = {
  loginId: '',
  password: '',
}

export default function LoginForm() {
  const navigate = useNavigate()
  const [values, setValues] = useState(INITIAL_VALUES)
  const [fieldErrors, setFieldErrors] = useState({})
  const { submitLogin, isLoading, error, clearError } = useLogin()

  const handleChange = (event) => {
    const { name, value } = event.target

    setValues((prev) => ({ ...prev, [name]: value }))

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }

    if (error) {
      clearError()
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const errors = validateLoginForm(values)
    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) return

    // ① 로그인 → ② 주입된 fcmToken으로 DB 저장
    const userData = await submitLogin(toLoginPayload(values))
    const { id, name, role } = userData ?? {}

    if (!name || id == null) return

    saveAuthSession({ name, role, id })

    await registerSamdoriDeviceToken(id)
    navigate('/reservation')
  }

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <label className="login-form__field">
        <span className="login-form__label">아이디</span>
        <input
          className={`login-form__input${
            fieldErrors.loginId ? ' login-form__input--error' : ''
          }`}
          name="loginId"
          type="text"
          value={values.loginId}
          onChange={handleChange}
          placeholder="아이디를 입력해 주세요"
          autoComplete="username"
          disabled={isLoading}
        />
        {fieldErrors.loginId && (
          <span className="login-form__error" role="alert">
            {fieldErrors.loginId}
          </span>
        )}
      </label>

      <label className="login-form__field">
        <span className="login-form__label">비밀번호</span>
        <input
          className={`login-form__input${
            fieldErrors.password ? ' login-form__input--error' : ''
          }`}
          name="password"
          type="password"
          value={values.password}
          onChange={handleChange}
          placeholder="비밀번호를 입력해 주세요"
          autoComplete="current-password"
          disabled={isLoading}
        />
        {fieldErrors.password && (
          <span className="login-form__error" role="alert">
            {fieldErrors.password}
          </span>
        )}
      </label>

      {error !== '' && (
        <p className="login-form__server-error" role="alert">
          {error}
        </p>
      )}

      <button className="login-form__submit" type="submit" disabled={isLoading}>
        {isLoading ? '로그인 중...' : '로그인'}
      </button>

      <p className="login-form__signup">
        아직 계정이 없으신가요?{' '}
        <Link className="login-form__signup-link" to="/signup">
          회원가입
        </Link>
      </p>
    </form>
  )
}
