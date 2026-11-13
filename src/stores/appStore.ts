import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings, WeatherData } from '../types';
import { setMockMode } from '../api/weatherApi';

interface AppState {
  // Weather data
  data: WeatherData | null;
  loading: boolean;
  setData: (data: WeatherData) => void;
  setLoading: (loading: boolean) => void;

  // Settings
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  toggleForecast: (name: string) => void;

  // UI State
  activeView: 'forecast' | 'map';
  setActiveView: (view: 'forecast' | 'map') => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  mockMode: boolean;
  setMockMode: (enabled: boolean) => void;
}

const defaultSettings: Settings = {
  units: 'ms',
  horizon: 120,
  tableStep: 3,
  hiddenForecasts: new Set(),
  mapModel: 'dmi',
  mapBase: 'dark',
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      data: null,
      loading: false,
      setData: (data) => set({ data }),
      setLoading: (loading) => set({ loading }),

      settings: defaultSettings,
      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),
      toggleForecast: (name) =>
        set((state) => {
          const newHidden = new Set(state.settings.hiddenForecasts);
          if (newHidden.has(name)) {
            newHidden.delete(name);
          } else {
            newHidden.add(name);
          }
          return {
            settings: { ...state.settings, hiddenForecasts: newHidden },
          };
        }),

      activeView: 'forecast',
      setActiveView: (view) => set({ activeView: view }),
      drawerOpen: false,
      setDrawerOpen: (open) => set({ drawerOpen: open }),
      mockMode: true,
      setMockMode: (enabled) => {
        setMockMode(enabled);
        return set({ mockMode: enabled });
      },
    }),
    {
      name: 'windapp-store',
      partialize: (state) => ({
        settings: {
          ...state.settings,
          hiddenForecasts: Array.from(state.settings.hiddenForecasts),
        },
        mockMode: state.mockMode,
      }),
    }
  )
);
