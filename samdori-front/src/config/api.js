// 로컬: npm run dev → localhost
// Cloudflare(master): Production env의 VITE_API_BASE_URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ?? (import.meta.env.DEV ? 'http://localhost:8080' : '')
