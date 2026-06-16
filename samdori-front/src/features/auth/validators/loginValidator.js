export function validateLoginForm(values) {
  const errors = {}

  if (!values.loginId?.trim()) {
    errors.loginId = '아이디를 입력해 주세요.'
  }

  if (!values.password) {
    errors.password = '비밀번호를 입력해 주세요.'
  }

  return errors
}

export function toLoginPayload(values) {
  return {
    loginId: values.loginId.trim(),
    password: values.password,
  }
}
