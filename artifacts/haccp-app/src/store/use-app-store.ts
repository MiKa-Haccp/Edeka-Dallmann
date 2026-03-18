import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminSession {
  userId: number;
  name: string;
  email: string;
  role: string;
  assignedMarketIds?: number[];
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
  canAccessMarket: (marketId: number) => boolean;
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
        return s?.role === 'ADMIN' || s?.role === 'SUPERADMIN' || s?.role === 'BEREICHSLEITUNG';
      },
      canAccessMarket: (marketId: number) => {
        const s = get().adminSession;
        if (!s) return true;
        if (s.role === 'SUPERADMIN' || s.role === 'ADMIN' || s.role === 'BEREICHSLEITUNG') return true;
        if (s.role === 'MARKTLEITER') {
          return s.assignedMarketIds?.includes(marketId) ?? false;
        }
        return true;
      },
    }),
    {
      name: 'haccp-app-storage',
      partialize: (state) => ({
        adminSession: state.adminSession,
        selectedYear: state.selectedYear,
        selectedMonth: state.selectedMonth,
      }),
    }
  )
);
