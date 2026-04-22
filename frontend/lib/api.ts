const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('ecopye_token') : null

const request = async (path: string, options: RequestInit = {}) => {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}

export const api = {
  // Auth
  sendOTP: (phone: string, purpose: string) =>
    request('/api/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone, purpose }) }),
  register: (data: object) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (phone: string, pin: string, totpCode?: string) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ phone, pin, totpCode }) }),
  setupFace: (descriptor: number[]) =>
    request('/api/auth/setup-face', { method: 'POST', body: JSON.stringify({ faceDescriptor: descriptor }) }),
  verifyFace: (descriptor: number[]) =>
    request('/api/auth/verify-face', { method: 'POST', body: JSON.stringify({ faceDescriptor: descriptor }) }),
  setupTOTP: () =>
    request('/api/auth/setup-totp', { method: 'POST' }),
  confirmTOTP: (token: string) =>
    request('/api/auth/confirm-totp', { method: 'POST', body: JSON.stringify({ token }) }),
  me: () => request('/api/auth/me'),

  // Wallet
  getWallet: () => request('/api/wallet'),
  getTransactions: (page = 1, type?: string) =>
    request(`/api/wallet/transactions?page=${page}${type ? `&type=${type}` : ''}`),
  getStats: () => request('/api/wallet/stats'),

  // Transfer
  lookupUser: (phone: string) =>
    request('/api/transfer/lookup', { method: 'POST', body: JSON.stringify({ phone }) }),
  sendMoney: (data: object) =>
    request('/api/transfer/send', { method: 'POST', body: JSON.stringify(data) }),

  // QR
  generateQR: (data: object) =>
    request('/api/qr/generate', { method: 'POST', body: JSON.stringify(data) }),
  payQR: (data: object) =>
    request('/api/qr/pay', { method: 'POST', body: JSON.stringify(data) }),

  // Bills
  getProviders: () => request('/api/bills/providers'),
  payBill: (data: object) =>
    request('/api/bills/pay', { method: 'POST', body: JSON.stringify(data) }),
  getBillHistory: () => request('/api/bills/history'),

  // Cagnotte
  createCagnotte: (data: object) =>
    request('/api/cagnotte/create', { method: 'POST', body: JSON.stringify(data) }),
  getMyCagnottes: () => request('/api/cagnotte'),
  getPublicCagnottes: (type?: string, search?: string) =>
    request(`/api/cagnotte/public${type ? `?type=${type}` : ''}${search ? `&search=${search}` : ''}`),
  getCagnotte: (shareCode: string) =>
    request(`/api/cagnotte/${shareCode}`),
  contribute: (shareCode: string, data: object) =>
    request(`/api/cagnotte/${shareCode}/contribute`, { method: 'POST', body: JSON.stringify(data) }),
}

export const setToken = (token: string) => localStorage.setItem('ecopye_token', token)
export const clearToken = () => localStorage.removeItem('ecopye_token')
export const isLoggedIn = () => !!getToken()
