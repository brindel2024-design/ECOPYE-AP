import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  phone: string
  fullName: string
  email?: string
  isVerified: boolean
  kycStatus: string
  totpEnabled: boolean
}

interface Wallet {
  balance: number
  currency: string
  isLocked: boolean
}

interface AppState {
  user: User | null
  wallet: Wallet | null
  isAuthenticated: boolean
  faceVerified: boolean

  setUser: (user: User) => void
  setWallet: (wallet: Wallet) => void
  setFaceVerified: (v: boolean) => void
  logout: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      wallet: null,
      isAuthenticated: false,
      faceVerified: false,

      setUser: (user) => set({ user, isAuthenticated: true }),
      setWallet: (wallet) => set({ wallet }),
      setFaceVerified: (v) => set({ faceVerified: v }),
      logout: () => {
        localStorage.removeItem('ecopye_token')
        set({ user: null, wallet: null, isAuthenticated: false, faceVerified: false })
      },
    }),
    { name: 'ecopye-store', partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }) }
  )
)
