// src/hooks/useBudgetStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BudgetState {
  budget: number;
  setBudget: (budget: number) => void;
  clearBudget: () => void;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set) => ({
      budget: 0,
      setBudget: (budget: number) => set({ budget }),
      clearBudget: () => set({ budget: 0 }),
    }),
    {
      name: 'pc-builder-budget', // localStorage key
    }
  )
);