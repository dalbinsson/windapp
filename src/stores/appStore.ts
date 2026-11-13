import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings, WeatherData, Units } from '../types';
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
    (set) => {
      setMockMode(false);
      return {
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
        mockMode: false,
        setMockMode: (enabled) => {
          setMockMode(enabled);
          set({ mockMode: enabled });
        },
      };
    },
    {
      name: 'windapp-store',
      partialize: (state) => ({
        settings: {
          units: state.settings.units,
          horizon: state.settings.horizon,
          tableStep: state.settings.tableStep,
          hiddenForecasts: Array.from(state.settings.hiddenForecasts),
          mapModel: state.settings.mapModel,
          mapBase: state.settings.mapBase,
        },
        mockMode: state.mockMode,
      }),
      merge: (persisted, current): AppState => {
        const p = persisted as Record<string, unknown>;
        const settings = (p?.settings as Record<string, unknown>) || {};
        const units = (settings.units as Units) ?? current.settings.units;
        const horizon = (settings.horizon as number) ?? current.settings.horizon;
        const tableStep = (settings.tableStep as number) ?? current.settings.tableStep;
        const mapModel = (settings.mapModel as string) ?? current.settings.mapModel;
        const mapBase = (settings.mapBase as string) ?? current.settings.mapBase;
        const mockMode = (settings.mockMode as boolean) ?? current.mockMode;
        return {
          ...current,
          settings: {
            units: units as Units,
            horizon: horizon as 24 | 48 | 72 | 120 | 168 | 240,
            tableStep: tableStep as 1 | 3 | 6 | 12,
            hiddenForecasts: new Set(Array.isArray(settings.hiddenForecasts) ? (settings.hiddenForecasts as string[]) : []),
            mapModel: mapModel as 'dmi' | 'nordic' | 'ecmwf',
            mapBase: mapBase as 'dark' | 'light' | 'carto',
          },
          mockMode,
        };
      },
    }
  )
);
