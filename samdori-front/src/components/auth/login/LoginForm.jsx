import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLogin } from '../../../features/auth/hooks/useLogin'
import { getAuthSession, saveAuthSession } from '../../../utils/authSession'
import {
  getSavedLoginId,
  isKeepLoginEnabled,
  saveLoginPersistence,
} from '../../../utils/loginPersistence'
import { registerSamdoriDeviceToken } from '../../../utils/samdoriPushContext'
import {
  toLoginPayload,
  validateLoginForm,
} from '../../../features/auth/validators/loginValidator'
import './LoginForm.css'

export default function LoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const [values, setValues] = useState(() => ({
    loginId: getSavedLoginId(),
    password: '',
  }))
  const [keepLogin, setKeepLogin] = useState(isKeepLoginEnabled)
  const [blockPasswordAutofill, setBlockPasswordAutofill] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const { submitLogin, isLoading, error, clearError } = useLogin()

  useEffect(() => {
    const fromLogout = location.state?.fromLogout

    if (fromLogout) {
      setValues({
        loginId: getSavedLoginId(),
        password: '',
      })
      setKeepLogin(isKeepLoginEnabled())
      setBlockPasswordAutofill(true)
      navigate('.', { replace: true, state: null })
      return
    }

    const savedLoginId = getSavedLoginId()
    if (savedLoginId) {
      setValues((prev) => ({ ...prev, loginId: savedLoginId, password: '' }))
    }

    const { name } = getAuthSession()
    if (name) {
      navigate('/reservation', { replace: true })
    }
  }, [location.state, navigate])

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
    saveLoginPersistence({
      keepLogin,
      loginId: values.loginId.trim(),
      session: { name, role, id },
    })

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
          autoComplete={blockPasswordAutofill ? 'new-password' : 'current-password'}
          onFocus={() => setBlockPasswordAutofill(false)}
          disabled={isLoading}
        />
        {fieldErrors.password && (
          <span className="login-form__error" role="alert">
            {fieldErrors.password}
          </span>
        )}
      </label>

      <label className="login-form__remember">
        <input
          type="checkbox"
          checked={keepLogin}
          onChange={(event) => setKeepLogin(event.target.checked)}
          disabled={isLoading}
        />
        <span>아이디 저장</span>
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
