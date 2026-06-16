const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/
const LOGIN_ID_PATTERN = /^[a-zA-Z0-9_]{4,20}$/

export function validateSignupForm(values) {
  const errors = {}

  if (!values.loginId?.trim()) {
    errors.loginId = '아이디를 입력해 주세요.'
  } else if (!LOGIN_ID_PATTERN.test(values.loginId.trim())) {
    errors.loginId = '아이디는 4~20자의 영문, 숫자, _만 사용할 수 있습니다.'
  }

  if (!values.name?.trim()) {
    errors.name = '이름을 입력해 주세요.'
  }

  if (!values.phoneNumber?.trim()) {
    errors.phoneNumber = '휴대폰 번호를 입력해 주세요.'
  } else if (!PHONE_PATTERN.test(values.phoneNumber.replace(/\s/g, ''))) {
    errors.phoneNumber = '올바른 휴대폰 번호 형식이 아닙니다.'
  }

  if (!values.email?.trim()) {
    errors.email = '이메일을 입력해 주세요.'
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = '올바른 이메일 형식이 아닙니다.'
  }

  if (!values.password) {
    errors.password = '비밀번호를 입력해 주세요.'
  } else if (values.password.length < 8) {
    errors.password = '비밀번호는 8자 이상이어야 합니다.'
  }

  if (!values.passwordConfirm) {
    errors.passwordConfirm = '비밀번호 확인을 입력해 주세요.'
  } else if (values.password !== values.passwordConfirm) {
    errors.passwordConfirm = '비밀번호가 일치하지 않습니다.'
  }

  return errors
}

export function toSignupPayload(values) {
  return {
    loginId: values.loginId.trim(),
    name: values.name.trim(),
    phoneNumber: values.phoneNumber.replace(/\s/g, ''),
    email: values.email.trim(),
    password: values.password,
  }
}
