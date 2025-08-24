// src/hooks/useExtendedConfiguration.ts
// ExtendedPCConfiguration管理用カスタムフック（LocalStorage連携）

import { useCallback, useEffect, useState } from 'react';
import { PCConfiguration, ExtendedPCConfiguration, convertToExtendedConfiguration } from '@/types';
import { localStorageService, ConfigurationHistory } from '@/services/storage/localStorageService';

// convertToExtendedConfigurationは使用されています（コメントで明示）

export interface UseExtendedConfigurationOptions {
  autoSave?: boolean;
  autoSaveInterval?: number;
  onSave?: (config: ExtendedPCConfiguration) => void;
  onLoad?: (config: ExtendedPCConfiguration) => void;
  onError?: (error: Error) => void;
}

export const useExtendedConfiguration = (options: UseExtendedConfigurationOptions = {}) => {
  const {
    autoSave = true,
    onSave,
    onLoad,
    onError
  } = options;

  // デフォルト構成
  const getDefaultConfiguration = (): ExtendedPCConfiguration => {
    const baseConfig: PCConfiguration = {
      id: `config-${Date.now()}`,
      name: "新しいPC構成",
      parts: {
        cpu: null,
        gpu: null,
        motherboard: null,
        memory: null,
        storage: null,
        psu: null,
        case: null,
        cooler: null,
        monitor: null,
      },
      totalPrice: 0,
      budget: 150000,
      createdAt: new Date(),
      updatedAt: new Date(),
      description: "",
      tags: [],
    };
    return convertToExtendedConfiguration(baseConfig);
  };

  // 状態管理
  const [configuration, setConfiguration] = useState<ExtendedPCConfiguration>(getDefaultConfiguration);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [history, setHistory] = useState<ConfigurationHistory[]>([]);

  // 初期読み込み
  useEffect(() => {
    const loadConfiguration = async () => {
      setIsLoading(true);
      try {
        const saved = localStorageService.loadConfiguration();
        if (saved) {
          const extendedConfig = convertToExtendedConfiguration(saved);
          setConfiguration(extendedConfig);
          setLastSavedAt(new Date());
          onLoad?.(extendedConfig);
        }
        
        // 履歴も読み込み
        const loadedHistory = localStorageService.getConfigurationHistory();
        setHistory(loadedHistory);
        
      } catch (error) {
        console.error('Failed to load configuration:', error);
        onError?.(error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfiguration();
  }, [onLoad, onError]);

  // 自動保存設定
  useEffect(() => {
    if (autoSave && !isLoading) {
      // ExtendedPCConfiguration → PCConfiguration 変換
      const legacyConfig: PCConfiguration = {
        id: configuration.id,
        name: configuration.name,
        parts: configuration.parts,
        totalPrice: configuration.totalPrice,
        totalPowerConsumption: configuration.totalPowerConsumption,
        budget: configuration.budget,
        createdAt: configuration.createdAt,
        updatedAt: configuration.updatedAt,
        description: configuration.description,
        tags: configuration.tags
      };
      
      localStorageService.startAutoSave(legacyConfig, (_savedConfig) => { // eslint-disable-line @typescript-eslint/no-unused-vars
        setLastSavedAt(new Date());
        setHasUnsavedChanges(false);
        onSave?.(configuration);
      });

      return () => {
        localStorageService.stopAutoSave();
      };
    }
  }, [configuration, autoSave, isLoading, onSave]);

  // 手動保存
  const saveConfiguration = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    try {
      // ExtendedPCConfiguration → PCConfiguration 変換
      const legacyConfig: PCConfiguration = {
        id: configuration.id,
        name: configuration.name,
        parts: configuration.parts,
        totalPrice: configuration.totalPrice,
        totalPowerConsumption: configuration.totalPowerConsumption,
        budget: configuration.budget,
        createdAt: configuration.createdAt,
        updatedAt: configuration.updatedAt,
        description: configuration.description,
        tags: configuration.tags
      };
      
      const success = localStorageService.saveConfiguration(legacyConfig);
      if (success) {
        setLastSavedAt(new Date());
        setHasUnsavedChanges(false);
        
        // 履歴を更新
        const updatedHistory = localStorageService.getConfigurationHistory();
        setHistory(updatedHistory);
        
        onSave?.(configuration);
      }
      return success;
    } catch (error) {
      console.error('Failed to save configuration:', error);
      onError?.(error as Error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [configuration, onSave, onError]);

  // 構成更新（変更検出付き）
  const updateConfiguration = useCallback((updater: (prev: ExtendedPCConfiguration) => ExtendedPCConfiguration) => {
    setConfiguration(prev => {
      const updated = updater(prev);
      setHasUnsavedChanges(true);
      return updated;
    });
  }, []);

  // 新規構成作成
  const createNewConfiguration = useCallback(() => {
    const newConfig = getDefaultConfiguration();
    setConfiguration(newConfig);
    setHasUnsavedChanges(true);
    return newConfig;
  }, []);

  // 履歴から読み込み
  const loadFromHistory = useCallback((historyId: string): boolean => {
    try {
      const historyConfig = localStorageService.loadFromHistory(historyId);
      if (historyConfig) {
        const extendedConfig = convertToExtendedConfiguration(historyConfig);
        setConfiguration(extendedConfig);
        setHasUnsavedChanges(true); // 履歴から読み込んだら未保存状態にする
        onLoad?.(extendedConfig);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load from history:', error);
      onError?.(error as Error);
      return false;
    }
  }, [onLoad, onError]);

  // 履歴クリア
  const clearHistory = useCallback((): boolean => {
    try {
      const success = localStorageService.clearHistory();
      if (success) {
        setHistory([]);
      }
      return success;
    } catch (error) {
      console.error('Failed to clear history:', error);
      onError?.(error as Error);
      return false;
    }
  }, [onError]);

  // エクスポート
  const exportConfiguration = useCallback((): string => {
    // ExtendedPCConfiguration → PCConfiguration 変換
    const legacyConfig: PCConfiguration = {
      id: configuration.id,
      name: configuration.name,
      parts: configuration.parts,
      totalPrice: configuration.totalPrice,
      totalPowerConsumption: configuration.totalPowerConsumption,
      budget: configuration.budget,
      createdAt: configuration.createdAt,
      updatedAt: configuration.updatedAt,
      description: configuration.description,
      tags: configuration.tags
    };
    return localStorageService.exportConfiguration(legacyConfig);
  }, [configuration]);

  // インポート
  const importConfiguration = useCallback((jsonData: string): boolean => {
    try {
      const imported = localStorageService.importConfiguration(jsonData);
      if (imported) {
        const extendedConfig = convertToExtendedConfiguration(imported);
        setConfiguration(extendedConfig);
        setHasUnsavedChanges(true);
        onLoad?.(extendedConfig);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      onError?.(error as Error);
      return false;
    }
  }, [onLoad, onError]);

  // ストレージ統計
  const getStorageStats = useCallback(() => {
    return localStorageService.getStorageStats();
  }, []);

  // 全データクリア
  const clearAllData = useCallback((): boolean => {
    try {
      const success = localStorageService.clearAllStorage();
      if (success) {
        setConfiguration(getDefaultConfiguration());
        setHistory([]);
        setLastSavedAt(null);
        setHasUnsavedChanges(false);
      }
      return success;
    } catch (error) {
      console.error('Failed to clear all data:', error);
      onError?.(error as Error);
      return false;
    }
  }, [onError]);

  return {
    // 状態
    configuration,
    isLoading,
    isSaving,
    lastSavedAt,
    hasUnsavedChanges,
    history,

    // アクション
    updateConfiguration,
    saveConfiguration,
    createNewConfiguration,
    loadFromHistory,
    clearHistory,
    exportConfiguration,
    importConfiguration,
    getStorageStats,
    clearAllData,

    // 便利な計算プロパティ
    totalParts: Object.values(configuration.parts).filter(Boolean).length,
    isOverBudget: configuration.totalPrice > (configuration.budget || 0),
    budgetRemaining: (configuration.budget || 0) - configuration.totalPrice,
    
    // パーツ別の詳細（将来拡張用）
    // multiParts: configuration.multiParts, // TODO: 将来実装
    // constraints: configuration.constraints, // TODO: 将来実装
    // compatibility: configuration.compatibility, // TODO: 将来実装
  };
};

// 軽量版フック（読み取り専用）
export const useExtendedConfigurationRead = () => {
  const [configuration, setConfiguration] = useState<PCConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConfiguration = () => {
      setIsLoading(true);
      try {
        const saved = localStorageService.loadConfiguration();
        setConfiguration(saved);
      } catch (error) {
        console.error('Failed to load configuration:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfiguration();
  }, []);

  return {
    configuration,
    isLoading,
    totalParts: configuration ? Object.values(configuration.parts).filter(Boolean).length : 0,
    totalPrice: configuration?.totalPrice || 0,
    budget: configuration?.budget || 0,
  };
};
