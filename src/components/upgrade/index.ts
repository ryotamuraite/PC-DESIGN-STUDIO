// src/components/upgrade/index.ts
// Phase 3: アップグレード機能エクスポート

export { PCDiagnostic } from './PCDiagnostic';
export { UpgradePlanner } from './UpgradePlanner';
export { UpgradeSimulator } from '../UpgradeSimulator/UpgradeSimulator';

// 型エクスポート
export type {
  BottleneckAnalysis,
  UpgradeRecommendation,
  SimulationResult,
  BenchmarkResult,
  PowerAnalysis,
  ThermalResult,
  ComparisonResult
} from '@/types/upgrade';
