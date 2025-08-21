// src/services/storage/localStorageService.ts
// ExtendedPCConfiguration用LocalStorage管理サービス

import { ExtendedPCConfiguration } from '@/types/extended';

const STORAGE_KEYS = {
  EXTENDED_CONFIGURATION: 'pc-design-studio:extended-configuration',
  CONFIGURATION_HISTORY: 'pc-design-studio:configuration-history',
  USER_PREFERENCES: 'pc-design-studio:user-preferences',
  AUTO_SAVE_ENABLED: 'pc-design-studio:auto-save-enabled',
} as const;

export interface StorageConfig {
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // milliseconds
  maxHistoryCount: number;
}

export interface ConfigurationHistory {
  id: string;
  timestamp: number;
  configuration: ExtendedPCConfiguration;
  label?: string;
}

/**
 * LocalStorage管理サービス
 * ExtendedPCConfigurationの保存・読み込み・履歴管理
 */
export class LocalStorageService {
  private static instance: LocalStorageService;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private currentConfig: ExtendedPCConfiguration | null = null;

  private constructor() {}

  static getInstance(): LocalStorageService {
    if (!LocalStorageService.instance) {
      LocalStorageService.instance = new LocalStorageService();
    }
    return LocalStorageService.instance;
  }

  /**
   * 現在の構成を保存
   */
  saveConfiguration(configuration: ExtendedPCConfiguration): boolean {
    try {
      const serialized = JSON.stringify({
        ...configuration,
        savedAt: new Date().toISOString()
      });
      
      localStorage.setItem(STORAGE_KEYS.EXTENDED_CONFIGURATION, serialized);
      this.currentConfig = configuration;
      
      // 履歴に追加
      this.addToHistory(configuration);
      
      console.log('Configuration saved to localStorage:', configuration.name);
      return true;
    } catch (error) {
      console.error('Failed to save configuration:', error);
      return false;
    }
  }

  /**
   * 保存済み構成を読み込み
   */
  loadConfiguration(): ExtendedPCConfiguration | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXTENDED_CONFIGURATION);
      if (!saved) {
        return null;
      }

      const parsed = JSON.parse(saved);
      // 日付オブジェクトを復元
      parsed.createdAt = new Date(parsed.createdAt);
      parsed.updatedAt = new Date(parsed.updatedAt);
      
      this.currentConfig = parsed;
      console.log('Configuration loaded from localStorage:', parsed.name);
      return parsed;
    } catch (error) {
      console.error('Failed to load configuration:', error);
      return null;
    }
  }

  /**
   * 構成履歴に追加
   */
  private addToHistory(configuration: ExtendedPCConfiguration, label?: string): void {
    try {
      const history = this.getConfigurationHistory();
      const newEntry: ConfigurationHistory = {
        id: `history-${Date.now()}`,
        timestamp: Date.now(),
        configuration: { ...configuration },
        label
      };

      history.unshift(newEntry);

      // 最大履歴数を超えた場合は古いものを削除
      const config = this.getStorageConfig();
      if (history.length > config.maxHistoryCount) {
        history.splice(config.maxHistoryCount);
      }

      localStorage.setItem(STORAGE_KEYS.CONFIGURATION_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to add to history:', error);
    }
  }

  /**
   * 構成履歴を取得
   */
  getConfigurationHistory(): ConfigurationHistory[] {
    try {
      const history = localStorage.getItem(STORAGE_KEYS.CONFIGURATION_HISTORY);
      if (!history) {
        return [];
      }

      const parsed = JSON.parse(history);
      // 日付オブジェクトを復元
      return parsed.map((entry: any) => ({
        ...entry,
        configuration: {
          ...entry.configuration,
          createdAt: new Date(entry.configuration.createdAt),
          updatedAt: new Date(entry.configuration.updatedAt)
        }
      }));
    } catch (error) {
      console.error('Failed to load configuration history:', error);
      return [];
    }
  }

  /**
   * 履歴から構成を復元
   */
  loadFromHistory(historyId: string): ExtendedPCConfiguration | null {
    try {
      const history = this.getConfigurationHistory();
      const entry = history.find(h => h.id === historyId);
      
      if (!entry) {
        console.warn('History entry not found:', historyId);
        return null;
      }

      return entry.configuration;
    } catch (error) {
      console.error('Failed to load from history:', error);
      return null;
    }
  }

  /**
   * 履歴をクリア
   */
  clearHistory(): boolean {
    try {
      localStorage.removeItem(STORAGE_KEYS.CONFIGURATION_HISTORY);
      console.log('Configuration history cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear history:', error);
      return false;
    }
  }

  /**
   * 自動保存開始
   */
  startAutoSave(
    configuration: ExtendedPCConfiguration,
    onSave?: (config: ExtendedPCConfiguration) => void
  ): void {
    const config = this.getStorageConfig();
    if (!config.autoSaveEnabled) {
      return;
    }

    this.stopAutoSave();
    
    this.autoSaveTimer = setInterval(() => {
      if (this.currentConfig && this.hasConfigurationChanged(configuration)) {
        this.saveConfiguration(configuration);
        onSave?.(configuration);
      }
    }, config.autoSaveInterval);

    console.log(`Auto-save started with interval: ${config.autoSaveInterval}ms`);
  }

  /**
   * 自動保存停止
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      console.log('Auto-save stopped');
    }
  }

  /**
   * 構成が変更されたかチェック
   */
  private hasConfigurationChanged(newConfig: ExtendedPCConfiguration): boolean {
    if (!this.currentConfig) {
      return true;
    }

    // 簡単な変更検出（JSON文字列比較）
    const currentSerialized = JSON.stringify({
      ...this.currentConfig,
      updatedAt: null,
      savedAt: null
    });
    const newSerialized = JSON.stringify({
      ...newConfig,
      updatedAt: null,
      savedAt: null
    });

    return currentSerialized !== newSerialized;
  }

  /**
   * ストレージ設定を取得
   */
  getStorageConfig(): StorageConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      const defaultConfig: StorageConfig = {
        autoSaveEnabled: true,
        autoSaveInterval: 30000, // 30秒
        maxHistoryCount: 20
      };

      if (!saved) {
        return defaultConfig;
      }

      const parsed = JSON.parse(saved);
      return { ...defaultConfig, ...parsed };
    } catch (error) {
      console.error('Failed to load storage config:', error);
      return {
        autoSaveEnabled: true,
        autoSaveInterval: 30000,
        maxHistoryCount: 20
      };
    }
  }

  /**
   * ストレージ設定を保存
   */
  saveStorageConfig(config: Partial<StorageConfig>): boolean {
    try {
      const current = this.getStorageConfig();
      const updated = { ...current, ...config };
      
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));
      console.log('Storage config saved:', updated);
      return true;
    } catch (error) {
      console.error('Failed to save storage config:', error);
      return false;
    }
  }

  /**
   * 構成をエクスポート（JSON）
   */
  exportConfiguration(configuration: ExtendedPCConfiguration): string {
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      configuration
    }, null, 2);
  }

  /**
   * 構成をインポート（JSON）
   */
  importConfiguration(jsonData: string): ExtendedPCConfiguration | null {
    try {
      const parsed = JSON.parse(jsonData);
      
      if (!parsed.configuration) {
        throw new Error('Invalid export format');
      }

      const config = parsed.configuration;
      // 日付オブジェクトを復元
      config.createdAt = new Date(config.createdAt);
      config.updatedAt = new Date(config.updatedAt);

      console.log('Configuration imported:', config.name);
      return config;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      return null;
    }
  }

  /**
   * ストレージサイズを取得
   */
  getStorageStats(): {
    totalSize: number;
    configSize: number;
    historySize: number;
    preferencesSize: number;
  } {
    const getSize = (key: string): number => {
      const data = localStorage.getItem(key);
      return data ? new Blob([data]).size : 0;
    };

    const configSize = getSize(STORAGE_KEYS.EXTENDED_CONFIGURATION);
    const historySize = getSize(STORAGE_KEYS.CONFIGURATION_HISTORY);
    const preferencesSize = getSize(STORAGE_KEYS.USER_PREFERENCES);
    const totalSize = configSize + historySize + preferencesSize;

    return {
      totalSize,
      configSize,
      historySize,
      preferencesSize
    };
  }

  /**
   * ストレージをクリア
   */
  clearAllStorage(): boolean {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      this.currentConfig = null;
      this.stopAutoSave();
      console.log('All storage cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  }
}

// シングルトンインスタンスをエクスポート
export const localStorageService = LocalStorageService.getInstance();

// 便利な関数をエクスポート
export const useLocalStorage = () => {
  return {
    save: (config: ExtendedPCConfiguration) => localStorageService.saveConfiguration(config),
    load: () => localStorageService.loadConfiguration(),
    getHistory: () => localStorageService.getConfigurationHistory(),
    loadFromHistory: (id: string) => localStorageService.loadFromHistory(id),
    clearHistory: () => localStorageService.clearHistory(),
    startAutoSave: (config: ExtendedPCConfiguration, onSave?: (config: ExtendedPCConfiguration) => void) => 
      localStorageService.startAutoSave(config, onSave),
    stopAutoSave: () => localStorageService.stopAutoSave(),
    export: (config: ExtendedPCConfiguration) => localStorageService.exportConfiguration(config),
    import: (jsonData: string) => localStorageService.importConfiguration(jsonData),
    getStats: () => localStorageService.getStorageStats(),
    clearAll: () => localStorageService.clearAllStorage(),
    getConfig: () => localStorageService.getStorageConfig(),
    saveConfig: (config: Partial<StorageConfig>) => localStorageService.saveStorageConfig(config)
  };
};
