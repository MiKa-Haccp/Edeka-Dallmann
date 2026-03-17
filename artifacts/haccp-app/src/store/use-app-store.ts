import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminSession {
  userId: number;
  name: string;
  email: string;
  role: string;
}

interface AppState {
  selectedMarketId: number | null;
  setSelectedMarketId: (id: number | null) => void;
  selectedYear: number;
  selectedMonth: number;
  setDate: (year: number, month: number) => void;
  adminSession: AdminSession | null;
  setAdminSession: (session: AdminSession | null) => void;
  isAdmin: () => boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      selectedMarketId: null,
      setSelectedMarketId: (id) => set({ selectedMarketId: id }),
      selectedYear: new Date().getFullYear(),
      selectedMonth: new Date().getMonth() + 1,
      setDate: (year, month) => set({ selectedYear: year, selectedMonth: month }),
      adminSession: null,
      setAdminSession: (session) => set({ adminSession: session }),
      isAdmin: () => {
        const s = get().adminSession;
        return s?.role === 'ADMIN' || s?.role === 'SUPERADMIN';
      },
    }),
    {
      name: 'haccp-app-storage',
    }
  )
);
