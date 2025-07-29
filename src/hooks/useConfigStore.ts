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
  totalPowerConsumption: 0, // 初期化を追加
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      currentConfig: initialConfig,
      savedConfigs: [],
      budget: 200000,
      
      // 🔧 Phase 2 新プロパティ追加
      monitoringConfig: {
        stockMonitoring: { enabled: false, checkInterval: 300000, lowStockThreshold: 5, alertOnRestock: true, alertOnOutOfStock: true, priorityParts: [] },
        newProductMonitoring: { enabled: false, categories: [], checkInterval: 3600000 },
        priceMonitoring: { enabled: false, thresholds: {}, alertOnSignificantChange: true }
      },
      alertManager: { priceAlerts: [], stockAlerts: [], newProductAlerts: [], systemAlerts: [] },
      serviceStats: null,
      securityStatus: { rateLimits: [], securityStats: { activeSessions: 0, totalRequests: 0, errorRate: 0, blockedRequests: 0, topSources: [] }, auditLog: [] },

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
            (sum, p) => {
              if (!p) return sum;
              // specifications.power または specifications.tdp から電力消費量を取得
              const power = (p.specifications?.power as number) || 
                           (p.specifications?.tdp as number) || 
                           0;
              return sum + power;
            },
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
            (sum, p) => {
              if (!p) return sum;
              // specifications.power または specifications.tdp から電力消費量を取得
              const power = (p.specifications?.power as number) || 
                           (p.specifications?.tdp as number) || 
                           0;
              return sum + power;
            },
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
      
      // 🔧 Phase 2 新メソッド追加
      updateMonitoringConfig: (config) =>
        set((state) => ({
          monitoringConfig: { ...state.monitoringConfig, ...config },
        })),
      
      addAlert: (alert) =>
        set((state) => {
          const alertManager = { ...state.alertManager };
          if ('type' in alert && (alert.type === 'new_release' || alert.type === 'price_announcement' || alert.type === 'availability_change' || alert.type === 'trending')) {
            alertManager.newProductAlerts = [...alertManager.newProductAlerts, alert as import('@/types').NewProductAlert]; // 🔧 any → 具体的な型
          } else if ('type' in alert && (alert.type === 'restock' || alert.type === 'low_stock' || alert.type === 'out_of_stock' || alert.type === 'price_drop_with_stock')) {
            alertManager.stockAlerts = [...alertManager.stockAlerts, alert as import('@/types').StockAlert]; // 🔧 any → 具体的な型
          } else if ('alertType' in alert) {
            alertManager.priceAlerts = [...alertManager.priceAlerts, alert as import('@/types').PriceAlert]; // 🔧 any → 具体的な型
          } else {
            alertManager.systemAlerts = [...alertManager.systemAlerts, alert as import('@/types').SystemAlert]; // 🔧 any → 具体的な型
          }
          return { alertManager };
        }),
      
      clearAlerts: (type) =>
        set((state) => {
          const alertManager = { ...state.alertManager };
          if (!type) {
            alertManager.priceAlerts = [];
            alertManager.stockAlerts = [];
            alertManager.newProductAlerts = [];
            alertManager.systemAlerts = [];
          } else if (type === 'price') {
            alertManager.priceAlerts = [];
          } else if (type === 'stock') {
            alertManager.stockAlerts = [];
          } else if (type === 'newProduct') {
            alertManager.newProductAlerts = [];
          } else if (type === 'system') {
            alertManager.systemAlerts = [];
          }
          return { alertManager };
        }),
      
      updateServiceStats: (stats) =>
        set({ serviceStats: stats }),
    }),
    {
      name: 'pc-config-store',
    }
  )
);