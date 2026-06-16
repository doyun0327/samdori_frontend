import { useState } from 'react'
import { useSignup } from '../../../features/auth/hooks/useSignup'
import {
  toSignupPayload,
  validateSignupForm,
} from '../../../features/auth/validators/signupValidator'
import './SignupForm.css'

const INITIAL_VALUES = {
  loginId: '',
  name: '',
  phoneNumber: '',
  email: '',
  password: '',
  passwordConfirm: '',
}

const FIELDS = [
  {
    name: 'loginId',
    label: '아이디',
    type: 'text',
    placeholder: '영문, 숫자 4~20자',
    autoComplete: 'username',
  },
  {
    name: 'name',
    label: '이름',
    type: 'text',
    placeholder: '성함을 입력해 주세요',
    autoComplete: 'name',
  },
  {
    name: 'phoneNumber',
    label: '휴대폰 번호',
    type: 'tel',
    placeholder: '010-1234-5678',
    autoComplete: 'tel',
    inputMode: 'tel',
  },
  {
    name: 'email',
    label: '이메일',
    type: 'email',
    placeholder: 'example@email.com',
    autoComplete: 'email',
  },
  {
    name: 'password',
    label: '비밀번호',
    type: 'password',
    placeholder: '8자 이상 입력',
    autoComplete: 'new-password',
  },
  {
    name: 'passwordConfirm',
    label: '비밀번호 확인',
    type: 'password',
    placeholder: '비밀번호를 다시 입력',
    autoComplete: 'new-password',
  },
]

function formatPhoneNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export default function SignupForm() {
  const [values, setValues] = useState(INITIAL_VALUES)
  const [fieldErrors, setFieldErrors] = useState({})
  const { submitSignup, isLoading, error, isSuccess } = useSignup()

  const handleChange = (event) => {
    const { name, value } = event.target
    const nextValue = name === 'phoneNumber' ? formatPhoneNumber(value) : value

    setValues((prev) => ({ ...prev, [name]: nextValue }))

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const errors = validateSignupForm(values)
    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) return

    try {
      await submitSignup(toSignupPayload(values))
      setValues(INITIAL_VALUES)
    } catch {
      // error state is handled in useSignup
    }
  }

  if (isSuccess) {
    return (
      <div className="signup-form__success" role="status">
        <div className="signup-form__success-icon" aria-hidden="true">
          ✓
        </div>
        <h2>회원가입이 완료되었습니다</h2>
        <p>이제 상담 예약을 진행하실 수 있습니다.</p>
      </div>
    )
  }

  return (
    <form className="signup-form" onSubmit={handleSubmit} noValidate>
      <div className="signup-form__fields">
        {FIELDS.map((field) => (
          <label key={field.name} className="signup-form__field">
            <span className="signup-form__label">
              {field.label}
              <span className="signup-form__required" aria-hidden="true">
                *
              </span>
            </span>
            <input
              className={`signup-form__input${
                fieldErrors[field.name] ? ' signup-form__input--error' : ''
              }`}
              name={field.name}
              type={field.type}
              value={values[field.name]}
              onChange={handleChange}
              placeholder={field.placeholder}
              autoComplete={field.autoComplete}
              inputMode={field.inputMode}
              disabled={isLoading}
            />
            {fieldErrors[field.name] && (
              <span className="signup-form__error" role="alert">
                {fieldErrors[field.name]}
              </span>
            )}
          </label>
        ))}
      </div>

      {error && (
        <p className="signup-form__server-error" role="alert">
          {error}
        </p>
      )}

      <button className="signup-form__submit" type="submit" disabled={isLoading}>
        {isLoading ? '가입 처리 중...' : '회원가입'}
      </button>

      <p className="signup-form__notice">
        가입 후 바로 상담 예약 서비스를 이용하실 수 있습니다.
      </p>
    </form>
  )
}
