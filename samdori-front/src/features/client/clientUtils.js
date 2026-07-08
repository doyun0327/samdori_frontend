export function getPhoneLastFour(phoneNumber) {
  const digits = String(phoneNumber ?? '').replace(/\D/g, '')

  if (digits.length < 4) {
    return digits.padStart(4, '0')
  }

  return digits.slice(-4)
}

export function formatClientLabel(client) {
  const name = client?.name?.trim() || '고객'
  const lastFour = getPhoneLastFour(client?.phoneNumber)

  return `${name}(${lastFour})`
}

export function normalizeClient(raw) {
  return {
    id: String(raw.id),
    name: raw.name ?? '',
    phoneNumber: raw.phoneNumber ?? raw.phone_number ?? '',
  }
}
