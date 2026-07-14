// 로컬: npm run dev → .env.development (localhost:8080)
// 운영: npm run build → .env.production (Railway)
// https://samdorifrontend.idoyun781.workers.dev(운영 URL)
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? 'http://localhost:8080' : '')
