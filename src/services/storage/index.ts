// src/services/storage/index.ts
// ストレージサービス統合エクスポート

export {
  LocalStorageService,
  localStorageService,
  useLocalStorage,
  type StorageConfig,
  type ConfigurationHistory
} from './localStorageService';

// 将来的な拡張用（セッションストレージ、IndexedDB等）
// export { SessionStorageService } from './sessionStorageService';
// export { IndexedDBService } from './indexedDBService';
// export { CloudStorageService } from './cloudStorageService';
