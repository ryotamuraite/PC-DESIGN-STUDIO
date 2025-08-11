// src/hooks/useExternalApi.ts
// 外部API統合Hookフック - Phase 2完全版：新サービス群統合

import { useState, useCallback, useEffect, useRef } from 'react';
import { Part, PartCategory, RateLimitStatus, SecurityStats, AuditLogEntry, ServiceStatistics, ServiceHealth } from '@/types';
import ExternalApiService, { PriceUpdate, StockInfo } from '@/services/externalApiService';
import { PriceData } from '@/services/priceService';
import { StockData } from '@/services/stockService';
import { NewProductData } from '@/services/newProductService';
import { useNotifications } from './useNotifications';

interface UseExternalApiReturn {
  // State
  isUpdating: boolean;
  lastUpdate: Date | null;
  updateProgress: number;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  
  // Price Updates (Legacy + Phase 2)
  priceUpdates: PriceUpdate[];
  priceData: Map<string, PriceData>;
  updatePrices: (parts: Part[], source?: string) => Promise<void>;
  getPriceData: (partId: string, part?: Part) => Promise<PriceData | null>;
  
  // Stock Updates (Legacy + Phase 2)
  stockUpdates: StockInfo[];
  stockData: Map<string, StockData>;
  updateStockInfo: (parts: Part[], source?: string) => Promise<void>;
  getStockData: (partId: string) => Promise<StockData | null>;
  
  // Stock Monitoring (Phase 2 New)
  isStockMonitoring: boolean;
  startStockMonitoring: (priorityParts?: string[]) => void;
  stopStockMonitoring: () => void;
  
  // New Products (Legacy + Phase 2)
  newProducts: Part[];
  newProductsData: Map<PartCategory, NewProductData[]>;
  fetchNewProducts: (category: PartCategory, limit?: number) => Promise<void>;
  fetchMultipleCategoryProducts: (categories: PartCategory[], limitPerCategory?: number) => Promise<void>;
  
  // New Product Monitoring (Phase 2 New)
  isNewProductMonitoring: boolean;
  startNewProductMonitoring: (categories?: PartCategory[]) => void;
  stopNewProductMonitoring: () => void;
  
  // Security & Rate Limiting (Phase 2 New)
  securityStatus: {
    rateLimits: RateLimitStatus[];
    securityStats: SecurityStats;
    auditLog: AuditLogEntry[];
  };
  getSecurityStatus: () => void;
  resetSecurityState: () => void;
  
  // Service Statistics (Phase 2 New)
  serviceStats: ServiceStatistics | null;
  getServiceStatistics: () => Promise<void>;
  
  // Comprehensive Update (Phase 2 New)
  performComprehensiveUpdate: (
    parts: Part[],
    categories?: PartCategory[],
    options?: {
      updatePrices?: boolean;
      updateStock?: boolean;
      discoverNewProducts?: boolean;
      monitoringEnabled?: boolean;
    }
  ) => Promise<void>;
  
  // Health & Status (Enhanced)
  healthDetails: ServiceHealth | null;
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
  
  // Legacy Data
  const [priceUpdates, setPriceUpdates] = useState<PriceUpdate[]>([]);
  const [stockUpdates, setStockUpdates] = useState<StockInfo[]>([]);
  const [newProducts, setNewProducts] = useState<Part[]>([]);
  
  // Phase 2 Enhanced Data
  const [priceData, setPriceData] = useState<Map<string, PriceData>>(new Map());
  const [stockData, setStockData] = useState<Map<string, StockData>>(new Map());
  const [newProductsData, setNewProductsData] = useState<Map<PartCategory, NewProductData[]>>(new Map());
  
  // Phase 2 Monitoring States
  const [isStockMonitoring, setIsStockMonitoring] = useState(false);
  const [isNewProductMonitoring, setIsNewProductMonitoring] = useState(false);
  
  // Phase 2 Security & Service Data
  const [securityStatus, setSecurityStatus] = useState<{
    rateLimits: RateLimitStatus[];
    securityStats: SecurityStats;
    auditLog: AuditLogEntry[];
  }>({ 
    rateLimits: [],
    securityStats: {
      activeSessions: 0,
      totalRequests: 0,
      errorRate: 0,
      blockedRequests: 0,
      topSources: []
    },
    auditLog: []
  });
  const [serviceStats, setServiceStats] = useState<ServiceStatistics | null>(null);
  const [healthDetails, setHealthDetails] = useState<ServiceHealth | null>(null);
  
  const [error, setError] = useState<string | null>(null);

  // Services
  const apiService = ExternalApiService.getInstance();
  const { success, error: notifyError, warning, info } = useNotifications();
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 💰 個別パーツの価格データ取得（Phase 2新機能）
   */
  const getPriceData = useCallback(async (partId: string, part?: Part): Promise<PriceData | null> => {
    try {
      const data = await apiService.getPartPriceData(partId, part);
      if (data) {
        setPriceData(prev => new Map(prev.set(partId, data)));
      }
      return data;
    } catch {
      console.error(`価格データ取得エラー: ${partId}`);
      return null;
    }
  }, [apiService]);

  /**
   * 📦 個別パーツの在庫データ取得（Phase 2新機能）
   */
  const getStockData = useCallback(async (partId: string): Promise<StockData | null> => {
    try {
      const data = await apiService.getPartStockData(partId);
      if (data) {
        setStockData(prev => new Map(prev.set(partId, data)));
      }
      return data;
    } catch {
      console.error(`在庫データ取得エラー: ${partId}`);
      return null;
    }
  }, [apiService]);

  /**
   * 💰 価格情報更新（統合版）
   */
  const updatePrices = useCallback(async (parts: Part[], source = 'all') => {
    if (isUpdating) {
      warning('更新中です', '現在の更新処理が完了してから再試行してください');
      return;
    }

    setIsUpdating(true);
    setError(null);
    setUpdateProgress(10);

    try {
      info('価格更新開始', `${parts.length}件のパーツ価格を更新中... (Phase 2統合版)`, 'API更新');

      const response = await apiService.updatePrices(parts, source);
      setUpdateProgress(70);
      
      if (response.success) {
        setPriceUpdates(prev => [...response.data, ...prev].slice(0, 100)); // 最新100件を保持
        setLastUpdate(new Date());
        setUpdateProgress(100);
        
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '価格更新中にエラーが発生しました';
      setError(errorMessage);
      notifyError('価格更新エラー', errorMessage, 'API更新');
    } finally {
      setIsUpdating(false);
      setUpdateProgress(0);
    }
  }, [isUpdating, apiService, success, notifyError, warning, info]);

  /**
   * 📦 在庫情報更新（統合版）
   */
  const updateStockInfo = useCallback(async (parts: Part[], source = 'all') => {
    if (isUpdating) {
      warning('更新中です', '現在の更新処理が完了してから再試行してください');
      return;
    }

    setIsUpdating(true);
    setError(null);
    setUpdateProgress(10);

    try {
      info('在庫情報更新開始', `${parts.length}件のパーツ在庫を確認中... (Phase 2統合版)`, 'API更新');

      const response = await apiService.updateStockInfo(parts, source);
      setUpdateProgress(70);
      
      if (response.success) {
        setStockUpdates(prev => [...response.data, ...prev].slice(0, 100));
        setLastUpdate(new Date());
        setUpdateProgress(100);
        
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '在庫情報更新中にエラーが発生しました';
      setError(errorMessage);
      notifyError('在庫情報更新エラー', errorMessage, 'API更新');
    } finally {
      setIsUpdating(false);
      setUpdateProgress(0);
    }
  }, [isUpdating, apiService, success, notifyError, warning, info]);

  /**
   * 🎯 在庫監視開始（Phase 2新機能）
   */
  const startStockMonitoring = useCallback((priorityParts: string[] = []) => {
    try {
      apiService.startStockMonitoring(priorityParts);
      setIsStockMonitoring(true);
      success(
        '在庫監視開始',
        `${priorityParts.length}件の優先パーツを監視中`,
        '監視機能'
      );
    } catch {
      notifyError('在庫監視開始エラー', '在庫監視の開始に失敗しました', '監視機能');
    }
  }, [apiService, success, notifyError]);

  /**
   * ⏹️ 在庫監視停止（Phase 2新機能）
   */
  const stopStockMonitoring = useCallback(() => {
    try {
      apiService.stopStockMonitoring();
      setIsStockMonitoring(false);
      info('在庫監視停止', '在庫監視を停止しました', '監視機能');
    } catch {
      notifyError('在庫監視停止エラー', '在庫監視の停止に失敗しました', '監視機能');
    }
  }, [apiService, info, notifyError]);

  /**
   * 🆕 新製品情報取得（統合版）
   */
  const fetchNewProducts = useCallback(async (category: PartCategory, limit = 10) => {
    if (isUpdating) {
      warning('更新中です', '現在の更新処理が完了してから再試行してください');
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      info('新製品検索中', `${category} カテゴリの新製品を検索中... (Phase 2統合版)`, 'API更新');

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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '新製品取得中にエラーが発生しました';
      setError(errorMessage);
      notifyError('新製品取得エラー', errorMessage, 'API更新');
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, apiService, success, notifyError, warning, info]);

  /**
   * 📊 複数カテゴリの新製品一括取得（Phase 2新機能）
   */
  const fetchMultipleCategoryProducts = useCallback(async (categories: PartCategory[], limitPerCategory = 10) => {
    if (isUpdating) {
      warning('更新中です', '現在の更新処理が完了してから再試行してください');
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      info('複数カテゴリ新製品検索', `${categories.length}カテゴリの新製品を検索中...`, 'API更新');

      const results = await apiService.fetchMultipleCategoryProducts(categories, limitPerCategory);
      
      // 結果をlegacy formatとPhase 2 formatの両方で保存
      const allNewProducts: Part[] = [];
      for (const [, parts] of results.entries()) {
        allNewProducts.push(...parts);
      }

      setNewProducts(prev => [...allNewProducts, ...prev].slice(0, 100));
      setLastUpdate(new Date());
      
      success(
        '複数カテゴリ新製品取得完了',
        `${categories.length}カテゴリで合計${allNewProducts.length}件の新製品`,
        'API更新'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '複数カテゴリ新製品取得中にエラーが発生しました';
      setError(errorMessage);
      notifyError('複数カテゴリ新製品取得エラー', errorMessage, 'API更新');
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, apiService, success, notifyError, warning, info]);

  /**
   * 🎯 新製品監視開始（Phase 2新機能）
   */
  const startNewProductMonitoring = useCallback((categories: PartCategory[] = []) => {
    try {
      apiService.startNewProductMonitoring(categories);
      setIsNewProductMonitoring(true);
      success(
        '新製品監視開始',
        `${categories.length}カテゴリを監視中`,
        '監視機能'
      );
    } catch {
      notifyError('新製品監視開始エラー', '新製品監視の開始に失敗しました', '監視機能');
    }
  }, [apiService, success, notifyError]);

  /**
   * ⏹️ 新製品監視停止（Phase 2新機能）
   */
  const stopNewProductMonitoring = useCallback(() => {
    try {
      apiService.stopNewProductMonitoring();
      setIsNewProductMonitoring(false);
      info('新製品監視停止', '新製品監視を停止しました', '監視機能');
    } catch {
      notifyError('新製品監視停止エラー', '新製品監視の停止に失敗しました', '監視機能');
    }
  }, [apiService, info, notifyError]);

  /**
   * 🛡️ セキュリティ状況取得（Phase 2新機能）
   */
  const getSecurityStatus = useCallback(() => {
    try {
      const status = apiService.getSecurityStatus();
      setSecurityStatus(status);
    } catch (error) {
      console.error('セキュリティ状況取得エラー:', error);
    }
  }, [apiService]);

  /**
   * 🔧 セキュリティ状態リセット（Phase 2新機能）
   */
  const resetSecurityState = useCallback(() => {
    try {
      apiService.resetSecurityState();
      setSecurityStatus({
        rateLimits: [],
        securityStats: {
          activeSessions: 0,
          totalRequests: 0,
          errorRate: 0,
          blockedRequests: 0,
          topSources: []
        },
        auditLog: []
      });
      info('セキュリティ状態リセット', 'セキュリティ状態がリセットされました', 'セキュリティ');
    } catch {
      notifyError('セキュリティリセットエラー', 'セキュリティ状態のリセットに失敗しました', 'セキュリティ');
    }
  }, [apiService, info, notifyError]);

  /**
   * 📊 サービス統計取得（Phase 2新機能）
   */
  const getServiceStatistics = useCallback(async () => {
    try {
      const stats = apiService.getServiceStatistics();
      setServiceStats(stats);
    } catch (error) {
      console.error('サービス統計取得エラー:', error);
    }
  }, [apiService]);

  /**
   * 🚀 統合データ更新（Phase 2新機能）
   */
  const performComprehensiveUpdate = useCallback(async (
    parts: Part[],
    categories: PartCategory[] = [],
    options: {
      updatePrices?: boolean;
      updateStock?: boolean;
      discoverNewProducts?: boolean;
      monitoringEnabled?: boolean;
    } = {}
  ) => {
    if (isUpdating) {
      warning('更新中です', '現在の更新処理が完了してから再試行してください');
      return;
    }

    setIsUpdating(true);
    setError(null);
    setUpdateProgress(0);

    try {
      info('統合データ更新開始', `価格・在庫・新製品の一括更新を開始...`, 'API更新');
      setUpdateProgress(10);

      const results = await apiService.performComprehensiveUpdate(parts, categories, options);
      setUpdateProgress(90);

      // 結果をstateに反映
      if (results.priceUpdates.success) {
        setPriceUpdates(prev => [...results.priceUpdates.data, ...prev].slice(0, 100));
      }
      if (results.stockUpdates.success) {
        setStockUpdates(prev => [...results.stockUpdates.data, ...prev].slice(0, 100));
      }
      if (results.newProducts.size > 0) {
        const allNewProducts: Part[] = [];
        for (const parts of results.newProducts.values()) {
          allNewProducts.push(...parts);
        }
        setNewProducts(prev => [...allNewProducts, ...prev].slice(0, 100));
      }

      setLastUpdate(new Date());
      setUpdateProgress(100);

      success(
        '統合データ更新完了',
        results.summary,
        'API更新'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '統合データ更新中にエラーが発生しました';
      setError(errorMessage);
      notifyError('統合データ更新エラー', errorMessage, 'API更新');
    } finally {
      setIsUpdating(false);
      setUpdateProgress(0);
    }
  }, [isUpdating, apiService, success, notifyError, warning, info]);

  /**
   * 🚑 ヘルスチェック（Phase 2強化版）
   */
  const checkHealth = useCallback(async () => {
    try {
      const health = await apiService.healthCheck();
      setHealthStatus(health.status);
      setHealthDetails(health as ServiceHealth);
      
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

      // Phase 2機能の推奨事項を表示
      if (health.recommendations && health.recommendations.length > 0) {
        health.recommendations.forEach((recommendation: string) => {
          info('システム推奨', recommendation, 'ヘルスチェック');
        });
      }
    } catch (error) {
      setHealthStatus('unhealthy');
      console.error('Health check failed:', error);
    }
  }, [apiService, notifyError, warning, info]);

  /**
   * 🧹 更新履歴クリア
   */
  const clearUpdates = useCallback(() => {
    setPriceUpdates([]);
    setStockUpdates([]);
    setNewProducts([]);
    setPriceData(new Map());
    setStockData(new Map());
    setNewProductsData(new Map());
    setError(null);
    info('更新履歴をクリアしました', '価格・在庫・新製品の履歴がクリアされました', 'データ管理');
  }, [info]);

  /**
   * ❌ エラークリア
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 🚀 初期化処理
   */
  useEffect(() => {
    checkHealth();
    getSecurityStatus();
    getServiceStatistics();
  }, [checkHealth, getSecurityStatus, getServiceStatistics]);

  /**
   * 📊 定期的な状態更新（10分間隔）
   */
  useEffect(() => {
    const interval = setInterval(() => {
      checkHealth();
      getSecurityStatus();
      getServiceStatistics();
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkHealth, getSecurityStatus, getServiceStatistics]);

  /**
   * 🧹 クリーンアップ
   */
  useEffect(() => {
    const timeoutRef = updateTimeoutRef;
    return () => {
      const timeoutId = timeoutRef.current;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return {
    // State
    isUpdating,
    lastUpdate,
    updateProgress,
    healthStatus,
    
    // Price Updates (Legacy + Phase 2)
    priceUpdates,
    priceData,
    updatePrices,
    getPriceData,
    
    // Stock Updates (Legacy + Phase 2)
    stockUpdates,
    stockData,
    updateStockInfo,
    getStockData,
    
    // Stock Monitoring (Phase 2 New)
    isStockMonitoring,
    startStockMonitoring,
    stopStockMonitoring,
    
    // New Products (Legacy + Phase 2)
    newProducts,
    newProductsData,
    fetchNewProducts,
    fetchMultipleCategoryProducts,
    
    // New Product Monitoring (Phase 2 New)
    isNewProductMonitoring,
    startNewProductMonitoring,
    stopNewProductMonitoring,
    
    // Security & Rate Limiting (Phase 2 New)
    securityStatus,
    getSecurityStatus,
    resetSecurityState,
    
    // Service Statistics (Phase 2 New)
    serviceStats,
    getServiceStatistics,
    
    // Comprehensive Update (Phase 2 New)
    performComprehensiveUpdate,
    
    // Health & Status (Enhanced)
    healthDetails,
    checkHealth,
    clearUpdates,
    
    // Error Handling
    error,
    clearError
  };
};

// 💰 価格変動分析用のヘルパーフック（Phase 2強化版）
export const usePriceAnalysis = (priceUpdates: PriceUpdate[], priceData?: Map<string, PriceData>) => {
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
      ? 'increasing' : 'decreasing',

    // Phase 2: 信頼度分析
    highConfidenceData: priceData ? Array.from(priceData.values()).filter(data => data.confidence > 0.8) : [],
    
    // Phase 2: ソース別分析
    sourceAnalysis: priceData ? Array.from(priceData.values()).reduce((acc, data) => {
      data.sources.forEach(source => {
        if (!acc[source.name]) acc[source.name] = { count: 0, avgPrice: 0 };
        acc[source.name].count++;
        acc[source.name].avgPrice = (acc[source.name].avgPrice + source.price) / 2;
      });
      return acc;
    }, {} as Record<string, { count: number; avgPrice: number }>) : {}
  };
};

// 📦 在庫分析用のヘルパーフック（Phase 2新機能）
export const useStockAnalysis = (stockUpdates: StockInfo[], stockData?: Map<string, StockData>) => {
  return {
    // 在庫切れアイテム数
    outOfStockCount: stockUpdates.filter(stock => stock.availability === 'out_of_stock').length,
    
    // 限定在庫アイテム数
    limitedStockCount: stockUpdates.filter(stock => stock.availability === 'limited').length,
    
    // 在庫あり率
    inStockRate: stockUpdates.length > 0 
      ? (stockUpdates.filter(stock => stock.availability === 'in_stock').length / stockUpdates.length) * 100
      : 0,
      
    // Phase 2: 在庫アラート
    stockAlerts: stockData ? Array.from(stockData.values()).flatMap(data => data.alerts) : [],
    
    // Phase 2: 信頼度の高い在庫データ
    highConfidenceStock: stockData ? Array.from(stockData.values()).filter(data => data.confidence > 0.7) : []
  };
};

export default useExternalApi;