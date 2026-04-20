import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  setTokens: (access: string, refresh: string, userId: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      setTokens: (access, refresh, userId) =>
        set({ accessToken: access, refreshToken: refresh, userId }),
      clear: () => set({ accessToken: null, refreshToken: null, userId: null }),
    }),
    {
      name: 'ecopye-auth',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
