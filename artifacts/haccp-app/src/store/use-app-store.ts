import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  selectedMarketId: number | null;
  setSelectedMarketId: (id: number | null) => void;
  selectedYear: number;
  selectedMonth: number;
  setDate: (year: number, month: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedMarketId: null,
      setSelectedMarketId: (id) => set({ selectedMarketId: id }),
      selectedYear: new Date().getFullYear(),
      selectedMonth: new Date().getMonth() + 1, // 1-12
      setDate: (year, month) => set({ selectedYear: year, selectedMonth: month }),
    }),
    {
      name: 'haccp-app-storage',
    }
  )
);
