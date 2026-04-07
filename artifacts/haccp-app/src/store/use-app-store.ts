import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminSession {
  userId: number;
  name: string;
  email: string;
  role: string;
  assignedMarketIds?: number[];
  permissions?: string[];
}

type MarketSelectionMode = 'gps' | 'manual';

interface AppState {
  selectedMarketId: number | null;
  setSelectedMarketId: (id: number | null) => void;
  marketSelectionMode: MarketSelectionMode | null;
  setMarketSelectionMode: (mode: MarketSelectionMode | null) => void;
  selectedYear: number;
  selectedMonth: number;
  setDate: (year: number, month: number) => void;
  adminSession: AdminSession | null;
  setAdminSession: (session: AdminSession | null) => void;
  isAdmin: () => boolean;
  hasPermission: (key: string) => boolean;
  canAccessMarket: (marketId: number) => boolean;
  isGpsLocked: () => boolean;
  deviceAuthorized: boolean;
  setDeviceAuthorized: (v: boolean) => void;
  deviceToken: string | null;
  setDeviceToken: (token: string | null) => void;
  // Hydration guard: true sobald Zustand aus localStorage geladen hat
  _hasHydrated: boolean;
  _setHasHydrated: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      selectedMarketId: null,
      setSelectedMarketId: (id) => set({ selectedMarketId: id }),
      marketSelectionMode: null,
      setMarketSelectionMode: (mode) => set({ marketSelectionMode: mode }),
      selectedYear: new Date().getFullYear(),
      selectedMonth: new Date().getMonth() + 1,
      setDate: (year, month) => set({ selectedYear: year, selectedMonth: month }),
      adminSession: null,
      setAdminSession: (session) => {
        if (session === null) {
          set({ adminSession: null, selectedMarketId: null, marketSelectionMode: null });
        } else {
          set({ adminSession: session });
        }
      },
      isAdmin: () => {
        const s = get().adminSession;
        return s?.role === 'ADMIN' || s?.role === 'SUPERADMIN' || s?.role === 'BEREICHSLEITUNG';
      },
      hasPermission: (key: string) => {
        const s = get().adminSession;
        if (!s) return false;
        if (s.role === 'SUPERADMIN') return true;
        return s.permissions?.includes(key) ?? false;
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
      isGpsLocked: () => {
        const s = get().adminSession;
        if (!s) return true;
        return false;
      },
      deviceAuthorized: false,
      setDeviceAuthorized: (v) => set({ deviceAuthorized: v }),
      deviceToken: null,
      setDeviceToken: (token) => set({ deviceToken: token, deviceAuthorized: !!token }),
      _hasHydrated: false,
      _setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'haccp-app-storage',
      partialize: (state) => ({
        adminSession: state.adminSession,
        selectedMarketId: state.selectedMarketId,
        marketSelectionMode: state.marketSelectionMode,
        selectedYear: state.selectedYear,
        selectedMonth: state.selectedMonth,
        deviceAuthorized: state.deviceAuthorized,
        deviceToken: state.deviceToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true);
      },
    }
  )
);
