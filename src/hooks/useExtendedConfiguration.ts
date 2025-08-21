// src/hooks/useExtendedConfiguration.ts
// ExtendedPCConfiguration管理用カスタムフック（LocalStorage連携）

import { useCallback, useEffect, useState } from 'react';
import { ExtendedPCConfiguration, convertToExtendedConfiguration } from '@/types/extended';
import { localStorageService, ConfigurationHistory } from '@/services/storage/localStorageService';

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
    return convertToExtendedConfiguration({
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
    });
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
          setConfiguration(saved);
          setLastSavedAt(new Date());
          onLoad?.(saved);
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
      localStorageService.startAutoSave(configuration, (savedConfig) => {
        setLastSavedAt(new Date());
        setHasUnsavedChanges(false);
        onSave?.(savedConfig);
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
      const success = localStorageService.saveConfiguration(configuration);
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
        setConfiguration(historyConfig);
        setHasUnsavedChanges(true); // 履歴から読み込んだら未保存状態にする
        onLoad?.(historyConfig);
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
    return localStorageService.exportConfiguration(configuration);
  }, [configuration]);

  // インポート
  const importConfiguration = useCallback((jsonData: string): boolean => {
    try {
      const imported = localStorageService.importConfiguration(jsonData);
      if (imported) {
        setConfiguration(imported);
        setHasUnsavedChanges(true);
        onLoad?.(imported);
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
    
    // パーツ別の詳細
    multiParts: configuration.multiParts,
    constraints: configuration.constraints,
    compatibility: configuration.compatibility,
  };
};

// 軽量版フック（読み取り専用）
export const useExtendedConfigurationRead = () => {
  const [configuration, setConfiguration] = useState<ExtendedPCConfiguration | null>(null);
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
