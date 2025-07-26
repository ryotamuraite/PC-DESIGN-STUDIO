// src/hooks/useConfigStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PCConfig, ConfigStore, PartCategory, Part } from '@/types/index';

const initialConfig: PCConfig = {
  id: 'current',
  name: '新しい構成',
  budget: 200000,
  parts: {},
  totalPrice: 0,
  totalPowerConsumption: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      currentConfig: initialConfig,
      savedConfigs: [],
      budget: 200000,

      setBudget: (budget: number) =>
        set((state) => ({
          budget,
          currentConfig: {
            ...state.currentConfig,
            budget,
            updatedAt: new Date(),
          },
        })),

      addPart: (category: PartCategory, part: Part) =>
        set((state) => {
          const newParts = { ...state.currentConfig.parts, [category]: part };
          const totalPrice = Object.values(newParts).reduce(
            (sum, p) => sum + (p?.price || 0),
            0
          );
          const totalPowerConsumption = Object.values(newParts).reduce(
            (sum, p) => sum + (p?.powerConsumption || 0),
            0
          );

          return {
            currentConfig: {
              ...state.currentConfig,
              parts: newParts,
              totalPrice,
              totalPowerConsumption,
              updatedAt: new Date(),
            },
          };
        }),

      removePart: (category: PartCategory) =>
        set((state) => {
          const newParts = { ...state.currentConfig.parts };
          delete newParts[category];
          
          const totalPrice = Object.values(newParts).reduce(
            (sum, p) => sum + (p?.price || 0),
            0
          );
          const totalPowerConsumption = Object.values(newParts).reduce(
            (sum, p) => sum + (p?.powerConsumption || 0),
            0
          );

          return {
            currentConfig: {
              ...state.currentConfig,
              parts: newParts,
              totalPrice,
              totalPowerConsumption,
              updatedAt: new Date(),
            },
          };
        }),

      saveConfig: (name: string) =>
        set((state) => {
          const newConfig: PCConfig = {
            ...state.currentConfig,
            id: Date.now().toString(),
            name,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          return {
            savedConfigs: [...state.savedConfigs, newConfig],
          };
        }),

      loadConfig: (id: string) =>
        set((state) => {
          const config = state.savedConfigs.find((c) => c.id === id);
          if (config) {
            return {
              currentConfig: { ...config, id: 'current' },
              budget: config.budget,
            };
          }
          return state;
        }),

      deleteConfig: (id: string) =>
        set((state) => ({
          savedConfigs: state.savedConfigs.filter((c) => c.id !== id),
        })),
    }),
    {
      name: 'pc-config-store',
    }
  )
);