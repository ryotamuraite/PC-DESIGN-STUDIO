// src/components/3d/index.ts
// 3Dコンポーネント群エクスポート - Phase 3対応版

// Phase 2 基本3D機能
export { default as PCCaseViewer } from './PCCaseViewer';
export { default as PCCase3D } from './PCCase3D';
export { default as PartsRenderer } from './PartsRenderer';
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as SmartPartLabel } from './SmartPartLabel';

// Phase 3 拡張3D機能
export { default as EnhancedPCCaseViewer } from './EnhancedPCCaseViewer';
export * from './advanced';

// 型エクスポート
export type { PCCaseViewerProps } from './PCCaseViewer';