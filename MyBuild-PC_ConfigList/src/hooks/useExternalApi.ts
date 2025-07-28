// src/hooks/useExternalApi.ts
// 外部API連携用のカスタムフック

import { useState, useCallback, useEffect } from 'react';
import { Part, PartCategory } from '@/types';
import ExternalApiService, { PriceUpdate, StockInfo } from '@/services/externalApiService';
import { useNotifications } from './useNotifications';

interface UseExternalApiReturn {
  // State
  isUpdating: boolean;
  lastUpdate: Date | null;
  updateProgress: number;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  
  // Price Updates
  priceUpdates: PriceUpdate[];
  updatePrices: (parts: Part[], source?: string) => Promise<void>;
  
  // Stock Updates
  stockUpdates: StockInfo[];
  updateStockInfo: (parts: Part[], source?: string) => Promise<void>;
  
  // New Products
  newProducts: Part[];
  fetchNewProducts: (category: PartCategory, limit?: number) => Promise<void>;
  
  // Health & Status
  checkHealth: () => Promise<void>;
  clearUpdates: () => void;
  
  // Error Handling
  error: string | null;
  clearError: () => void;
}

export const useExternalApi = (): UseExternalApiReturn => {
  // State
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'degraded' | 'unhealthy' | 'unknown'>('unknown');
  const [priceUpdates, setPriceUpdates] = useState<PriceUpdate[]>([]);
  const [stockUpdates, setStockUpdates] = useState<StockInfo[]>([]);
  const [newProducts, setNewProducts] = useState<Part[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Services
  const apiService = ExternalApiService.getInstance();
  const { success, error: notifyError, warning, info } = useNotifications();

  /**
   * 価格情報更新
   */
  const updatePrices = useCallback(async (parts: Part[], source = 'all') => {
    if (isUpdating) {
      warning('更新中です', '現在の更新処理が完了してから再試行してください');
      return;
    }

    setIsUpdating(true);
    setError(null);
    setUpdateProgress(0);

    try {
      info('価格更新開始', `${parts.length}件のパーツ価格を更新中...`, 'API更新');

      const response = await apiService.updatePrices(parts, source);
      
      if (response.success) {
        setPriceUpdates(prev => [...response.data, ...prev].slice(0, 100)); // 最新100件を保持
        setLastUpdate(new Date());
        
        const significantUpdates = response.data.filter(update => 
          Math.abs(update.priceChangePercent) > 5
        );
        
        if (significantUpdates.length > 0) {
          success(
            '価格情報を更新しました',
            `${response.data.length}件更新 (${significantUpdates.length}件で大幅変動)`,
            'API更新'
          );
        } else {
          success(
            '価格情報を更新しました',
            `${response.data.length}件のパーツ価格を更新`,
            'API更新'
          );
        }
      } else {
        throw new Error(response.error || '価格更新に失敗しました');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '価格更新中にエラーが発生しました';
      setError(errorMessage);
      notifyError('価格更新エラー', errorMessage, 'API更新');
    } finally {
      setIsUpdating(false);
      setUpdateProgress(0);
    }
  }, [isUpdating, apiService, success, notifyError, warning, info]);

  /**
   * 在庫情報更新
   */
  const updateStockInfo = useCallback(async (parts: Part[], source = 'all') => {
    if (isUpdating) {
      warning('更新中です', '現在の更新処理が完了してから再試行してください');
      return;
    }

    setIsUpdating(true);
    setError(null);
    setUpdateProgress(0);

    try {
      info('在庫情報更新開始', `${parts.length}件のパーツ在庫を確認中...`, 'API更新');

      const response = await apiService.updateStockInfo(parts, source);
      
      if (response.success) {
        setStockUpdates(prev => [...response.data, ...prev].slice(0, 100));
        setLastUpdate(new Date());
        
        const outOfStockCount = response.data.filter(stock => 
          stock.availability === 'out_of_stock'
        ).length;
        
        if (outOfStockCount > 0) {
          warning(
            '在庫情報を更新しました',
            `${response.data.length}件更新 (${outOfStockCount}件が在庫切れ)`,
            'API更新'
          );
        } else {
          success(
            '在庫情報を更新しました',
            `${response.data.length}件のパーツ在庫を確認`,
            'API更新'
          );
        }
      } else {
        throw new Error(response.error || '在庫情報更新に失敗しました');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '在庫情報更新中にエラーが発生しました';
      setError(errorMessage);
      notifyError('在庫情報更新エラー', errorMessage, 'API更新');
    } finally {
      setIsUpdating(false);
      setUpdateProgress(0);
    }
  }, [isUpdating, apiService, success, notifyError, warning, info]);

  /**
   * 新製品情報取得
   */
  const fetchNewProducts = useCallback(async (category: PartCategory, limit = 10) => {
    if (isUpdating) {
      warning('更新中です', '現在の更新処理が完了してから再試行してください');
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      info('新製品検索中', `${category} カテゴリの新製品を検索中...`, 'API更新');

      const response = await apiService.fetchNewProducts(category, limit);
      
      if (response.success) {
        setNewProducts(prev => [...response.data, ...prev].slice(0, 50));
        setLastUpdate(new Date());
        
        if (response.data.length > 0) {
          success(
            '新製品を発見しました',
            `${category} カテゴリで${response.data.length}件の新製品`,
            'API更新'
          );
        } else {
          info(
            '新製品なし',
            `${category} カテゴリに新製品はありませんでした`,
            'API更新'
          );
        }
      } else {
        throw new Error(response.error || '新製品取得に失敗しました');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '新製品取得中にエラーが発生しました';
      setError(errorMessage);
      notifyError('新製品取得エラー', errorMessage, 'API更新');
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, apiService, success, notifyError, warning, info]);

  /**
   * ヘルスチェック
   */
  const checkHealth = useCallback(async () => {
    try {
      const health = await apiService.healthCheck();
      setHealthStatus(health.status);
      
      if (health.status === 'unhealthy') {
        notifyError(
          'API接続エラー',
          'すべての外部APIサービスに接続できません',
          'システム'
        );
      } else if (health.status === 'degraded') {
        warning(
          'API接続警告',
          '一部の外部APIサービスに問題があります',
          'システム'
        );
      }
    } catch (err) {
      setHealthStatus('unhealthy');
      console.error('Health check failed:', err);
    }
  }, [apiService, notifyError, warning]);

  /**
   * 更新履歴クリア
   */
  const clearUpdates = useCallback(() => {
    setPriceUpdates([]);
    setStockUpdates([]);
    setNewProducts([]);
    setError(null);
    info('更新履歴をクリアしました', '価格・在庫・新製品の履歴がクリアされました', 'データ管理');
  }, [info]);

  /**
   * エラークリア
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 初期ヘルスチェック
   */
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  /**
   * 定期ヘルスチェック（5分間隔）
   */
  useEffect(() => {
    const interval = setInterval(checkHealth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return {
    // State
    isUpdating,
    lastUpdate,
    updateProgress,
    healthStatus,
    
    // Price Updates
    priceUpdates,
    updatePrices,
    
    // Stock Updates
    stockUpdates,
    updateStockInfo,
    
    // New Products
    newProducts,
    fetchNewProducts,
    
    // Health & Status
    checkHealth,
    clearUpdates,
    
    // Error Handling
    error,
    clearError
  };
};

// 価格変動分析用のヘルパーフック
export const usePriceAnalysis = (priceUpdates: PriceUpdate[]) => {
  return {
    // 最大値上がり
    maxPriceIncrease: priceUpdates.reduce((max, update) => 
      update.priceChange > max.priceChange ? update : max, 
      { priceChange: 0 } as PriceUpdate
    ),
    
    // 最大値下がり
    maxPriceDecrease: priceUpdates.reduce((min, update) => 
      update.priceChange < min.priceChange ? update : min, 
      { priceChange: 0 } as PriceUpdate
    ),
    
    // 平均変動率
    averageChangePercent: priceUpdates.length > 0 
      ? priceUpdates.reduce((sum, update) => sum + update.priceChangePercent, 0) / priceUpdates.length
      : 0,
    
    // 変動率の高いアイテム（±10%以上）
    volatileItems: priceUpdates.filter(update => Math.abs(update.priceChangePercent) >= 10),
    
    // 最近の傾向
    recentTrend: priceUpdates.slice(0, 10).reduce((sum, update) => sum + update.priceChange, 0) > 0 
      ? 'increasing' : 'decreasing'
  };
};

export default useExternalApi;
