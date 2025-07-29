// src/services/externalApiService.ts
// 外部API統合サービス - Phase 2完全版：実API統合・BOT対策完備

import { Part, PartCategory } from '@/types';
import PriceService, { PriceData } from '@/services/priceService';
import StockService, { StockData } from '@/services/stockService';
import NewProductService from '@/services/newProductService'; // 🔧 NewProductDataを削除
import ApiSecurity from '@/utils/apiSecurity';
// 🔧 API設定インポートを削除

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
  source: string;
}

export interface PriceUpdate {
  partId: string;
  oldPrice: number;
  newPrice: number;
  priceChange: number;
  priceChangePercent: number;
  source: string;
  updatedAt: string;
}

export interface StockInfo {
  partId: string;
  availability: 'in_stock' | 'out_of_stock' | 'limited' | 'discontinued' | 'pre_order'; // 🔧 5状態対応
  stockCount?: number;
  estimatedRestockDate?: string;
  source: string;
  lastChecked: string;
}

// 🔧 API_CONFIGを削除

class ExternalApiService {
  private static instance: ExternalApiService;
  private priceService = PriceService.getInstance();
  private stockService = StockService.getInstance();
  private newProductService = NewProductService.getInstance();
  private apiSecurity = ApiSecurity.getInstance();
  private isInitialized = false;

  public static getInstance(): ExternalApiService {
    if (!ExternalApiService.instance) {
      ExternalApiService.instance = new ExternalApiService();
      ExternalApiService.instance.initialize();
    }
    return ExternalApiService.instance;
  }

  /**
   * 🚀 サービス初期化
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 外部APIサービス初期化開始...');
    
    try {
      // セキュリティシステム初期化確認
      const securityStats = this.apiSecurity.getSecurityStats();
      console.log('🛡️ セキュリティシステム準備完了:', securityStats);

      // 各サービスの健全性確認
      const priceHealth = this.priceService.getServiceHealth();
      const stockStatus = this.stockService.getServiceStatus();
      const newProductStats = this.newProductService.getServiceStats();

      console.log('💰 価格サービス状態:', priceHealth.status);
      console.log('📦 在庫サービス状態:', stockStatus.monitoring ? 'monitoring' : 'standby');
      console.log('🆕 新製品サービス状態:', newProductStats.monitoring ? 'monitoring' : 'standby');

      this.isInitialized = true;
      console.log('✅ 外部APIサービス初期化完了');

    } catch (error) {
      console.error('❌ 外部APIサービス初期化エラー:', error);
    }
  }

  /**
   * 💰 価格情報を更新（統合版）
   */
  public async updatePrices(parts: Part[], source = 'all'): Promise<ApiResponse<PriceUpdate[]>> {
    console.log(`💰 価格情報更新開始: ${parts.length}件のパーツ (統合版)`);

    try {
      // 🛡️ 事前セキュリティチェック
      const securityCheck = await this.apiSecurity.performSecurityCheck(source, undefined, 'medium');
      if (!securityCheck.allowed) {
        return {
          success: false,
          data: [],
          error: `セキュリティチェック失敗: ${securityCheck.reason}`,
          timestamp: new Date().toISOString(),
          source
        };
      }

      const updates: PriceUpdate[] = [];
      
      // 新しいPriceServiceを使用して価格取得
      const priceResults = await this.priceService.fetchMultiplePrices(parts);
      
      for (const [partId, priceData] of priceResults.entries()) {
        const part = parts.find(p => p.id === partId);
        if (!part) continue;

        // PriceDataをPriceUpdateに変換
        const priceUpdate: PriceUpdate = {
          partId: priceData.partId,
          oldPrice: priceData.previousPrice,
          newPrice: priceData.currentPrice,
          priceChange: priceData.priceChange,
          priceChangePercent: priceData.priceChangePercent,
          source: priceData.sources.length > 0 ? priceData.sources[0].name : source,
          updatedAt: priceData.lastUpdated
        };

        updates.push(priceUpdate);
      }

      console.log(`✅ 価格更新完了: ${updates.length}件が更新されました`);

      return {
        success: true,
        data: updates,
        timestamp: new Date().toISOString(),
        source
      };

    } catch (error) {
      console.error('❌ 価格更新エラー:', error);
      
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : '価格更新中にエラーが発生しました',
        timestamp: new Date().toISOString(),
        source
      };
    }
  }

  /**
   * 📦 在庫情報を更新（統合版）
   */
  public async updateStockInfo(parts: Part[], source = 'all'): Promise<ApiResponse<StockInfo[]>> {
    console.log(`📦 在庫情報更新開始: ${parts.length}件のパーツ (統合版)`);

    try {
      // 🛡️ 事前セキュリティチェック
      const securityCheck = await this.apiSecurity.performSecurityCheck(source, undefined, 'medium');
      if (!securityCheck.allowed) {
        return {
          success: false,
          data: [],
          error: `セキュリティチェック失敗: ${securityCheck.reason}`,
          timestamp: new Date().toISOString(),
          source
        };
      }

      const stockUpdates: StockInfo[] = [];
      
      // 新しいStockServiceを使用して在庫取得
      const stockResults = await this.stockService.fetchMultipleStock(parts);
      
      for (const [, stockData] of stockResults.entries()) { // 🔧 partIdを_に変更
        // StockDataをStockInfoに変換
        const stockInfo: StockInfo = {
          partId: stockData.partId,
          availability: stockData.availability,
          stockCount: stockData.stockCount,
          estimatedRestockDate: stockData.estimatedRestockDate,
          source: stockData.sources.length > 0 ? stockData.sources[0].name : source,
          lastChecked: stockData.lastUpdated
        };

        stockUpdates.push(stockInfo);
      }

      console.log(`✅ 在庫情報更新完了: ${stockUpdates.length}件`);

      return {
        success: true,
        data: stockUpdates,
        timestamp: new Date().toISOString(),
        source
      };

    } catch (error) {
      console.error('❌ 在庫情報更新エラー:', error);
      
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : '在庫情報更新中にエラーが発生しました',
        timestamp: new Date().toISOString(),
        source
      };
    }
  }

  /**
   * 🆕 新製品情報を取得（統合版）
   */
  public async fetchNewProducts(category: PartCategory, limit = 10): Promise<ApiResponse<Part[]>> {
    console.log(`🆕 新製品情報取得: ${category} カテゴリ (統合版)`);

    try {
      // 🛡️ 事前セキュリティチェック
      const securityCheck = await this.apiSecurity.performSecurityCheck('all', undefined, 'medium');
      if (!securityCheck.allowed) {
        return {
          success: false,
          data: [],
          error: `セキュリティチェック失敗: ${securityCheck.reason}`,
          timestamp: new Date().toISOString(),
          source: 'multiple'
        };
      }
      
      // 新しいNewProductServiceを使用して新製品取得
      const newProductsData = await this.newProductService.discoverNewProducts(category, limit);
      
      // NewProductDataをPartに変換
      const newProducts: Part[] = newProductsData.map(productData => ({
        id: productData.id,
        name: productData.name,
        category: productData.category,
        price: productData.price,
        manufacturer: productData.manufacturer,
        specifications: productData.specifications,
        availability: productData.availability === 'in_stock' ? 'in_stock' : 'out_of_stock',
        rating: 4 + Math.random(), // 新製品は暫定評価
        reviewCount: Math.floor(Math.random() * 100),
        releaseDate: productData.releaseDate,
        popularity: productData.popularity
      }));
      
      console.log(`✅ 新製品取得完了: ${newProducts.length}件`);

      return {
        success: true,
        data: newProducts,
        timestamp: new Date().toISOString(),
        source: 'multiple'
      };

    } catch (error) {
      console.error('❌ 新製品取得エラー:', error);
      
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : '新製品取得中にエラーが発生しました',
        timestamp: new Date().toISOString(),
        source: 'multiple'
      };
    }
  }

  /**
   * 🎯 在庫監視開始
   */
  public startStockMonitoring(priorityParts: string[] = []): void {
    console.log(`🎯 在庫監視開始: ${priorityParts.length}件の優先パーツ`);
    this.stockService.startStockMonitoring(priorityParts);
  }

  /**
   * ⏹️ 在庫監視停止
   */
  public stopStockMonitoring(): void {
    console.log('⏹️ 在庫監視停止');
    this.stockService.stopStockMonitoring();
  }

  /**
   * 🎯 新製品監視開始
   */
  public startNewProductMonitoring(categories: PartCategory[] = []): void {
    console.log(`🎯 新製品監視開始: ${categories.length}カテゴリ`);
    this.newProductService.startNewProductMonitoring(categories);
  }

  /**
   * ⏹️ 新製品監視停止
   */
  public stopNewProductMonitoring(): void {
    console.log('⏹️ 新製品監視停止');
    this.newProductService.stopNewProductMonitoring();
  }

  /**
   * 💰 個別パーツの価格データ取得
   */
  public async getPartPriceData(partId: string, part?: Part): Promise<PriceData | null> {
    try {
      return await this.priceService.fetchPartPrice(partId, part);
    } catch (error) {
      console.error(`❌ 価格データ取得エラー: ${partId}`, error);
      return null;
    }
  }

  /**
   * 📦 個別パーツの在庫データ取得
   */
  public async getPartStockData(partId: string): Promise<StockData | null> {
    try {
      return await this.stockService.fetchPartStock(partId);
    } catch (error) {
      console.error(`❌ 在庫データ取得エラー: ${partId}`, error);
      return null;
    }
  }

  /**
   * 📈 トレンド分析データ取得
   */
  public getProductTrends(category: PartCategory) {
    return this.newProductService.getTrendAnalysis(category);
  }

  /**
   * 📊 複数カテゴリの新製品一括取得
   */
  public async fetchMultipleCategoryProducts(
    categories: PartCategory[],
    limitPerCategory: number = 10
  ): Promise<Map<PartCategory, Part[]>> {
    try {
      const newProductsMap = await this.newProductService.discoverMultipleCategories(categories, limitPerCategory);
      const partsMap = new Map<PartCategory, Part[]>();

      for (const [category, newProductsData] of newProductsMap.entries()) {
        const parts: Part[] = newProductsData.map(productData => ({
          id: productData.id,
          name: productData.name,
          category: productData.category,
          price: productData.price,
          manufacturer: productData.manufacturer,
          specifications: productData.specifications,
          availability: productData.availability === 'in_stock' ? 'in_stock' : 'out_of_stock',
          rating: 4 + Math.random(),
          reviewCount: Math.floor(Math.random() * 100),
          releaseDate: productData.releaseDate,
          popularity: productData.popularity
        }));
        
        partsMap.set(category, parts);
      }

      return partsMap;
    } catch (error) {
      console.error('❌ 複数カテゴリ新製品取得エラー:', error);
      return new Map();
    }
  }

  /**
   * 📊 セキュリティ・レート制限状況取得
   */
  public getSecurityStatus() {
    return {
      rateLimits: this.apiSecurity.getRateLimitStatus(),
      securityStats: this.apiSecurity.getSecurityStats(),
      auditLog: this.apiSecurity.getAuditLog(10) // 最新10件
    };
  }

  /**
   * 🔧 セキュリティ状態リセット
   */
  public resetSecurityState(): void {
    console.log('🔧 セキュリティ状態リセット実行');
    this.apiSecurity.resetSecurityState();
  }

  /**
   * 🛠️ サービス設定更新
   */
  public updateStockMonitoringConfig(config: {
    enabled?: boolean;
    checkInterval?: number;
    lowStockThreshold?: number;
    alertOnRestock?: boolean;
    alertOnOutOfStock?: boolean;
    priorityParts?: string[];
  }): void { // 🔧 any → 具体的な型に修正
    this.stockService.updateConfig(config);
  }



  /**
   * 📊 サービス統計情報取得
   */
  public getServiceStatistics(): {
    priceService: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      cacheSize: number;
      errorCount: number;
      enabledSources: number;
      lastUpdate: string;
    }; // 🔧 any → 具体的な型
    stockService: {
      monitoring: boolean;
      cacheSize: number;
      priorityParts: number;
      lastCheck: string;
    }; // 🔧 any → 具体的な型
    newProductService: {
      monitoring: boolean;
      cachedProducts: number;
      cachedTrends: number;
      lastDiscovery: string;
    }; // 🔧 any → 具体的な型
    securityService: {
      activeSessions: number;
      totalRequests: number;
      errorRate: number;
      blockedRequests: number;
    }; // 🔧 any → 具体的な型
  } {
    return {
      priceService: this.priceService.getServiceHealth(),
      stockService: this.stockService.getServiceStatus(),
      newProductService: this.newProductService.getServiceStats(),
      securityService: this.apiSecurity.getSecurityStats()
    };
  }

  /**
   * 🚀 統合データ更新（価格+在庫+新製品）
   */
  public async performComprehensiveUpdate(
    parts: Part[],
    categories: PartCategory[] = [],
    options: {
      updatePrices?: boolean;
      updateStock?: boolean;
      discoverNewProducts?: boolean;
      monitoringEnabled?: boolean;
    } = {}
  ): Promise<{
    priceUpdates: ApiResponse<PriceUpdate[]>;
    stockUpdates: ApiResponse<StockInfo[]>;
    newProducts: Map<PartCategory, Part[]>;
    summary: string;
  }> {
    console.log('🚀 統合データ更新開始...');
    
    const results = {
      priceUpdates: { success: false, data: [], timestamp: new Date().toISOString(), source: 'none' } as ApiResponse<PriceUpdate[]>,
      stockUpdates: { success: false, data: [], timestamp: new Date().toISOString(), source: 'none' } as ApiResponse<StockInfo[]>,
      newProducts: new Map<PartCategory, Part[]>(),
      summary: ''
    };

    try {
      // 💰 価格更新
      if (options.updatePrices !== false && parts.length > 0) {
        console.log('💰 価格情報更新中...');
        results.priceUpdates = await this.updatePrices(parts);
      }

      // 📦 在庫更新
      if (options.updateStock !== false && parts.length > 0) {
        console.log('📦 在庫情報更新中...');
        results.stockUpdates = await this.updateStockInfo(parts);
      }

      // 🆕 新製品探索
      if (options.discoverNewProducts !== false && categories.length > 0) {
        console.log('🆕 新製品探索中...');
        results.newProducts = await this.fetchMultipleCategoryProducts(categories, 5);
      }

      // 🎯 監視機能設定
      if (options.monitoringEnabled) {
        console.log('🎯 監視機能有効化...');
        const priorityParts = parts.slice(0, 10).map(p => p.id);
        this.startStockMonitoring(priorityParts);
        this.startNewProductMonitoring(categories);
      }

      // 結果サマリー作成
      const priceCount = results.priceUpdates.success ? results.priceUpdates.data.length : 0;
      const stockCount = results.stockUpdates.success ? results.stockUpdates.data.length : 0;
      const newProductCount = Array.from(results.newProducts.values()).reduce((sum, products) => sum + products.length, 0);
      
      results.summary = `統合更新完了: 価格${priceCount}件, 在庫${stockCount}件, 新製品${newProductCount}件`;
      
      console.log('✅ 統合データ更新完了');
      console.log(results.summary);

      return results;

    } catch (error) {
      console.error('❌ 統合データ更新エラー:', error);
      results.summary = `統合更新エラー: ${error instanceof Error ? error.message : 'Unknown error'}`;
      return results;
    }
  }

  /**
   * 🚑 統合ヘルスチェック（Phase 2完全版）
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, {
      status?: string;
      monitoring?: boolean;
      cacheSize?: number;
      errorCount?: number;
      totalRequests?: number;
      errorRate?: number;
    }>; // 🔧 any → 具体的な型
    responseTime: number;
    phase2Features: {
      priceService: string;
      stockService: string;
      newProductService: string;
      securityService: string;
    };
    recommendations: string[];
  }> {
    const start = Date.now();
    console.log('🚑 統合ヘルスチェック開始 (Phase 2完全版)');
    
    try {
      // 新しいサービス群の健全性チェック
      const priceHealth = this.priceService.getServiceHealth();
      const stockStatus = this.stockService.getServiceStatus();
      const newProductStats = this.newProductService.getServiceStats();
      const securityStats = this.apiSecurity.getSecurityStats();
      
      const services = {
        priceService: priceHealth,
        stockService: stockStatus,
        newProductService: newProductStats,
        securityService: securityStats
      };

      // Phase 2機能状態
      const phase2Features = {
        priceService: priceHealth.status,
        stockService: stockStatus.monitoring ? 'monitoring' : 'standby',
        newProductService: newProductStats.monitoring ? 'monitoring' : 'standby',
        securityService: securityStats.totalRequests > 0 ? 'active' : 'ready'
      };

      // 総合状態判定
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let healthyCount = 0;
      
      if (priceHealth.status === 'healthy') healthyCount++;
      if (stockStatus.monitoring || stockStatus.cacheSize > 0) healthyCount++;
      if (newProductStats.monitoring || newProductStats.cachedProducts > 0) healthyCount++;
      if (securityStats.errorRate < 0.1) healthyCount++;
      
      if (healthyCount >= 3) {
        status = 'healthy';
      } else if (healthyCount >= 2) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      // 推奨事項
      const recommendations: string[] = [];
      if (priceHealth.status !== 'healthy') {
        recommendations.push('価格サービスのエラー状態を確認してください');
      }
      if (!stockStatus.monitoring) {
        recommendations.push('在庫監視を有効化することをお勧めします');
      }
      if (!newProductStats.monitoring) {
        recommendations.push('新製品監視を有効化することをお勧めします');
      }
      if (securityStats.blockedRequests > 10) {
        recommendations.push('セキュリティ設定を確認してください');
      }
      
      const responseTime = Date.now() - start;
      
      console.log(`✅ 統合ヘルスチェック完了: ${status} (${responseTime}ms)`);
      
      return {
        status,
        services,
        responseTime,
        phase2Features,
        recommendations
      };
      
    } catch (error) {
      console.error('❌ ヘルスチェックエラー:', error);
      
      return {
        status: 'unhealthy',
        services: {},
        responseTime: Date.now() - start,
        phase2Features: {
          priceService: 'error',
          stockService: 'error',
          newProductService: 'error',
          securityService: 'error'
        },
        recommendations: ['システムの再起動をお試しください']
      };
    }
  }
}

export default ExternalApiService;
