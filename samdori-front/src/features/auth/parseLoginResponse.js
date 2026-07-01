export function parseLoginResponse(raw) {
  const user = raw?.data ?? raw?.user ?? raw

  return {
    id: user?.id ?? user?.userId ?? null,
    name: user?.name ?? null,
    role: user?.role ?? null,
  }
}
