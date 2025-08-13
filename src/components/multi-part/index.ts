// src/components/multi-part/index.ts
// 🚀 Phase 2.5: 複数搭載対応システムコンポーネントエクスポート

export { default as MultiPartManager } from './MultiPartManager';
export type { MultiPartManagerProps } from './MultiPartManager';

export { default as PartSelectionDialog } from './PartSelectionDialog';
export type { PartSelectionDialogProps } from './PartSelectionDialog';

// 関連型定義のリエクスポート（便利のため）
export type {
  ExtendedPCConfiguration,
  CoreComponents,
  AdditionalComponents,
  PhysicalLimits,
  SlotUsage,
  UnifiedPCConfiguration
} from '@/types';