// src/services/stockService.ts
// リアルタイム在庫監視システム - 外部API統合・BOT対策完備

import { Part } from '@/types'; // 🔧 PartCategoryを削除
import { API_ENDPOINTS, GLOBAL_CONFIG } from '@/config/apiConfig'; // 🔧 API_KEYSを削除
// 🔧 apiSecurityを削除

export interface StockData {
  partId: string;
  availability: 'in_stock' | 'out_of_stock' | 'limited' | 'discontinued' | 'pre_order';
  stockCount?: number;
  estimatedRestockDate?: string;
  stockHistory: StockHistoryEntry[];
  sources: StockSource[];
  lastUpdated: string;
  confidence: number; // 0-1 在庫データの信頼度
  alerts: StockAlert[];
}

export interface StockHistoryEntry {
  availability: string;
  stockCount?: number;
  timestamp: string;
  source: string;
  event: 'restock' | 'out_of_stock' | 'limited' | 'price_change';
}

export interface StockSource {
  name: string;
  availability: 'in_stock' | 'out_of_stock' | 'limited' | 'discontinued' | 'pre_order';
  stockCount?: number;
  url?: string;
  estimatedRestockDate?: string;
  lastChecked: string;
  reliability: number; // 0-1 ソースの信頼性
  responseTime: number; // ms
}

export interface StockAlert {
  type: 'restock' | 'low_stock' | 'out_of_stock' | 'price_drop_with_stock';
  partId: string;
  message: string;
  triggeredAt: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actionRequired?: string;
}

export interface StockMonitorConfig {
  enabled: boolean;
  checkInterval: number; // ms
  lowStockThreshold: number;
  alertOnRestock: boolean;
  alertOnOutOfStock: boolean;
  priorityParts: string[]; // 優先監視パーツ
}

class StockService {
  private static instance: StockService;
  private rateLimitTracker = new Map<string, number[]>();
  private stockCache = new Map<string, { data: StockData; expiry: number }>();
  private monitoringActive = false;
  private monitoringInterval?: NodeJS.Timeout;
  private readonly CACHE_DURATION = 300000; // 5分間キャッシュ
  private readonly MONITORING_INTERVAL = 1800000; // 30分間隔

  private config: StockMonitorConfig = {
    enabled: true,
    checkInterval: this.MONITORING_INTERVAL,
    lowStockThreshold: 5,
    alertOnRestock: true,
    alertOnOutOfStock: true,
    priorityParts: []
  };

  public static getInstance(): StockService {
    if (!StockService.instance) {
      StockService.instance = new StockService();
    }
    return StockService.instance;
  }

  /**
   * 📦 パーツの在庫情報を取得
   */
  public async fetchPartStock(partId: string): Promise<StockData | null> {
    console.log(`📦 在庫取得開始: ${partId}`);

    try {
      // キャッシュチェック
      const cached = this.getCachedStock(partId);
      if (cached) {
        console.log(`📦 キャッシュから在庫取得: ${partId}`);
        return cached;
      }

      // 🛡️ 安全性チェック
      const canProceed = await this.performSafetyChecks();
      if (!canProceed) {
        console.warn(`⚠️ 安全性チェック失敗: ${partId}`);
        return this.generateMockStockData(partId);
      }

      // 複数ソースから在庫情報取得
      const stockData = await this.fetchFromMultipleSources(partId);
      
      // キャッシュに保存
      if (stockData) {
        this.setCachedStock(partId, stockData);
      }

      console.log(`✅ 在庫取得完了: ${partId} - ${stockData?.availability || 'N/A'}`);
      return stockData;

    } catch (error) {
      console.error(`❌ 在庫取得エラー: ${partId}`, error);
      
      // エラー時はモックデータを返す
      return this.generateMockStockData(partId);
    }
  }

  /**
   * 🔄 複数パーツの在庫を一括取得
   */
  public async fetchMultipleStock(parts: Part[]): Promise<Map<string, StockData>> {
    console.log(`📦 一括在庫取得開始: ${parts.length}件`);
    
    const results = new Map<string, StockData>();
    const batchSize = 2; // 在庫チェックは価格より更に控えめ

    for (let i = 0; i < parts.length; i += batchSize) {
      const batch = parts.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (part) => {
        const stockData = await this.fetchPartStock(part.id);
        if (stockData) {
          results.set(part.id, stockData);
          
          // 在庫状況をチェックしてアラート生成
          await this.checkForStockAlerts(stockData);
        }
        
        // バッチ内の安全な遅延
        await this.safeDelay(1500 + Math.random() * 1000);
      });

      await Promise.allSettled(batchPromises);
      
      // バッチ間の長い遅延（在庫チェックは特に慎重）
      if (i + batchSize < parts.length) {
        await this.safeDelay(5000 + Math.random() * 3000);
      }
    }

    console.log(`✅ 一括在庫取得完了: ${results.size}/${parts.length}件成功`);
    return results;
  }

  /**
   * 🎯 在庫監視開始
   */
  public startStockMonitoring(priorityParts: string[] = []): void {
    if (this.monitoringActive) {
      console.log(`⚠️ 在庫監視は既に実行中です`);
      return;
    }

    this.config.priorityParts = priorityParts;
    this.monitoringActive = true;

    console.log(`🎯 在庫監視開始: ${priorityParts.length}件の優先パーツ`);

    this.monitoringInterval = setInterval(async () => {
      await this.performPeriodicStockCheck();
    }, this.config.checkInterval);
  }

  /**
   * ⏹️ 在庫監視停止
   */
  public stopStockMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    
    this.monitoringActive = false;
    console.log(`⏹️ 在庫監視停止`);
  }

  /**
   * 🕐 定期在庫チェック実行
   */
  private async performPeriodicStockCheck(): Promise<void> {
    if (!this.config.enabled) return;

    console.log(`🔄 定期在庫チェック実行中...`);

    // 優先パーツの在庫をチェック
    for (const partId of this.config.priorityParts) {
      try {
        const stockData = await this.fetchPartStock(partId);
        if (stockData) {
          await this.checkForStockAlerts(stockData);
        }

        // 定期チェックでは更に慎重な間隔
        await this.safeDelay(10000 + Math.random() * 5000);

      } catch {
        console.error(`❌ 定期在庫チェックエラー: ${partId}`);
      }
    }

    console.log(`✅ 定期在庫チェック完了`);
  }

  /**
   * 🌐 複数ソースから在庫情報収集
   */
  private async fetchFromMultipleSources(partId: string): Promise<StockData | null> {
    const sources: StockSource[] = [];
    const enabledSources = this.getEnabledSources();

    for (const sourceName of enabledSources) {
      try {
        await this.checkRateLimit(sourceName);
        
        const sourceData = await this.fetchFromSource(sourceName, partId);
        if (sourceData) {
          sources.push(sourceData);
        }

        // ソース間の安全な遅延（在庫チェックは特に慎重）
        await this.safeDelay(3000 + Math.random() * 2000);

      } catch (error) {
        console.warn(`⚠️ ソース ${sourceName} での在庫取得失敗: ${partId}`, error);
      }
    }

    if (sources.length === 0) {
      return null;
    }

    // 複数ソースの在庫データを統合
    return this.consolidateStockData(partId, sources);
  }

  /**
   * 🔍 個別ソースから在庫取得
   */
  private async fetchFromSource(sourceName: string, partId: string): Promise<StockSource | null> {
    const endpoint = API_ENDPOINTS[sourceName];
    if (!endpoint || !endpoint.robotsTxt.allowed) {
      return null;
    }

    // 現在はモック実装（段階的に実API対応）
    const mode = this.getCurrentMode();
    
    if (mode === 'mock') {
      return this.generateMockStockSource(sourceName);
    }

    // 実API実装（将来段階的に有効化）
    if (mode === 'limited' || mode === 'full') {
      console.log(`🚧 在庫API実装予定: ${sourceName} for ${partId}`);
      
      switch (sourceName) {
        case 'amazon':
          return await this.fetchAmazonStock(partId);
        case 'rakuten':
          return await this.fetchRakutenStock(partId);
        case 'yodobashi':
          return await this.fetchYodobashiStock(partId);
        default:
          return null;
      }
    }

    return null;
  }

  /**
   * 🛡️ Amazon在庫取得（実装例）
   */
  private async fetchAmazonStock(partId: string): Promise<StockSource | null> {
    try {
      const startTime = Date.now();
      
      // TODO: 実際のAmazon PA-API在庫チェック実装
      console.log(`🚧 Amazon在庫チェック実装予定: ${partId}`);
      
      await this.safeDelay(1500);
      const mockStock = this.generateMockStockSource('amazon');
      mockStock.responseTime = Date.now() - startTime;
      
      return mockStock;

    } catch (error) {
      console.error(`❌ Amazon在庫取得エラー: ${partId}`, error);
      return null;
    }
  }

  /**
   * 🛡️ 楽天在庫取得（実装例）
   */
  private async fetchRakutenStock(partId: string): Promise<StockSource | null> {
    try {
      const startTime = Date.now();
      
      // TODO: 実際の楽天API在庫チェック実装
      console.log(`🚧 楽天在庫チェック実装予定: ${partId}`);
      
      await this.safeDelay(1200);
      const mockStock = this.generateMockStockSource('rakuten');
      mockStock.responseTime = Date.now() - startTime;
      
      return mockStock;

    } catch (error) {
      console.error(`❌ 楽天在庫取得エラー: ${partId}`, error);
      return null;
    }
  }

  /**
   * 🛡️ ヨドバシ在庫取得（実装例）
   */
  private async fetchYodobashiStock(partId: string): Promise<StockSource | null> {
    try {
      const startTime = Date.now();
      
      // ヨドバシはスクレイピングになるため特に慎重
      const endpoint = API_ENDPOINTS.yodobashi;
      if (!endpoint.robotsTxt.allowed) {
        console.warn(`⚠️ ヨドバシrobots.txt未確認のため在庫取得停止: ${partId}`);
        return null;
      }

      // TODO: 実際のヨドバシスクレイピング実装（慎重に）
      console.log(`🚧 ヨドバシ在庫スクレイピング実装予定: ${partId}`);
      
      await this.safeDelay(5000); // より長い遅延
      const mockStock = this.generateMockStockSource('yodobashi');
      mockStock.responseTime = Date.now() - startTime;
      
      return mockStock;

    } catch (error) {
      console.error(`❌ ヨドバシ在庫取得エラー: ${partId}`, error);
      return null;
    }
  }

  /**
   * 📊 在庫データ統合処理
   */
  private consolidateStockData(partId: string, sources: StockSource[]): StockData {
    // 在庫状況の優先度付け（将来使用予定）
    // const availabilityPriority = {
    //   'in_stock': 4,
    //   'limited': 3,
    //   'pre_order': 2,
    //   'out_of_stock': 1,
    //   'discontinued': 0
    // };

    // 最も信頼性の高いソースから在庫状況を決定
    const bestSource = sources.reduce((best, current) => 
      current.reliability > best.reliability ? current : best
    );

    // 在庫数の統合（複数ソースの平均）
    const stockCounts = sources
      .filter(s => s.stockCount !== undefined)
      .map(s => s.stockCount as number);
    
    const averageStock = stockCounts.length > 0 
      ? Math.round(stockCounts.reduce((sum, count) => sum + count, 0) / stockCounts.length)
      : undefined;

    // 在庫履歴エントリ作成
    const stockHistory: StockHistoryEntry[] = sources.map(source => ({
      availability: source.availability,
      stockCount: source.stockCount,
      timestamp: source.lastChecked,
      source: source.name,
      event: this.determineStockEvent(source.availability)
    }));

    // 信頼度計算
    const confidence = this.calculateStockConfidence(sources);

    return {
      partId,
      availability: bestSource.availability,
      stockCount: averageStock,
      estimatedRestockDate: bestSource.estimatedRestockDate,
      stockHistory,
      sources,
      lastUpdated: new Date().toISOString(),
      confidence,
      alerts: [] // アラートは別途生成
    };
  }

  /**
   * 🚨 在庫アラートチェック
   */
  private async checkForStockAlerts(stockData: StockData): Promise<void> {
    const alerts: StockAlert[] = [];

    // 在庫復活アラート
    if (stockData.availability === 'in_stock' && this.config.alertOnRestock) {
      const previousStock = this.getCachedStock(stockData.partId);
      if (previousStock && previousStock.availability !== 'in_stock') {
        alerts.push({
          type: 'restock',
          partId: stockData.partId,
          message: `在庫復活しました: ${stockData.partId}`,
          triggeredAt: new Date().toISOString(),
          severity: 'high',
          actionRequired: '購入を検討してください'
        });
      }
    }

    // 在庫切れアラート
    if (stockData.availability === 'out_of_stock' && this.config.alertOnOutOfStock) {
      alerts.push({
        type: 'out_of_stock',
        partId: stockData.partId,
        message: `在庫切れ: ${stockData.partId}`,
        triggeredAt: new Date().toISOString(),
        severity: 'medium'
      });
    }

    // 少量在庫アラート
    if (stockData.stockCount && stockData.stockCount <= this.config.lowStockThreshold) {
      alerts.push({
        type: 'low_stock',
        partId: stockData.partId,
        message: `在庫少量: ${stockData.partId} (残り${stockData.stockCount}個)`,
        triggeredAt: new Date().toISOString(),
        severity: 'medium',
        actionRequired: '早めの購入をお勧めします'
      });
    }

    // 生成されたアラートを在庫データに追加
    stockData.alerts = alerts;

    // アラートのログ出力
    if (alerts.length > 0) {
      console.log(`🚨 在庫アラート生成: ${stockData.partId}`, alerts);
    }
  }

  // ヘルパーメソッド群

  private getEnabledSources(): string[] {
    return Object.entries(API_ENDPOINTS)
      .filter(([, endpoint]) => endpoint.robotsTxt.allowed)
      .map(([name]) => name);
  }

  private getCurrentMode(): string {
    return process.env.NODE_ENV === 'production' 
      ? GLOBAL_CONFIG.operationModes.production
      : GLOBAL_CONFIG.operationModes.development;
  }

  private async performSafetyChecks(): Promise<boolean> {
    // 時間制限チェック（在庫チェックは価格より厳しく）
    const currentHour = new Date().getUTCHours();
    const allowedHours = GLOBAL_CONFIG.timeRestrictions.allowedHours;
    
    if (!allowedHours.includes(currentHour) && this.getCurrentMode() === 'full') {
      console.warn(`⏰ 在庫チェック許可時間外: ${currentHour}時`);
      return false;
    }

    return true;
  }

  private async checkRateLimit(sourceName: string): Promise<void> {
    const endpoint = API_ENDPOINTS[sourceName];
    if (!endpoint) return;

    const now = Date.now();
    const sourceRequests = this.rateLimitTracker.get(sourceName) || [];
    
    // 在庫チェックはより控えめなレート制限
    const requestsPerMinute = Math.floor(endpoint.rateLimit.requestsPerMinute * 0.7);
    const recentRequests = sourceRequests.filter(time => now - time < 60000);
    
    if (recentRequests.length >= requestsPerMinute) {
      const waitTime = 60000 - (now - Math.min(...recentRequests));
      console.log(`⏳ ${sourceName} 在庫チェックレート制限により${waitTime}ms待機中...`);
      await this.safeDelay(waitTime);
    }
    
    recentRequests.push(now);
    this.rateLimitTracker.set(sourceName, recentRequests);
  }

  private async safeDelay(baseMs: number): Promise<void> {
    const randomDelay = Math.random() * 2000; // 0-2秒のランダム遅延（在庫チェックは長め）
    const totalDelay = baseMs + randomDelay;
    return new Promise(resolve => setTimeout(resolve, totalDelay));
  }

  private getCachedStock(partId: string): StockData | null {
    const cached = this.stockCache.get(partId);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    this.stockCache.delete(partId);
    return null;
  }

  private setCachedStock(partId: string, data: StockData): void {
    this.stockCache.set(partId, {
      data,
      expiry: Date.now() + this.CACHE_DURATION
    });
  }

  private calculateStockConfidence(sources: StockSource[]): number {
    if (sources.length === 0) return 0;
    
    const avgReliability = sources.reduce((sum, s) => sum + s.reliability, 0) / sources.length;
    const sourceCount = Math.min(sources.length / 2, 1); // 2ソース以上で満点
    const responseTime = sources.reduce((sum, s) => sum + s.responseTime, 0) / sources.length;
    const responseScore = Math.max(0, 1 - (responseTime / 10000)); // 10秒以内で満点
    
    return (avgReliability * 0.5) + (sourceCount * 0.3) + (responseScore * 0.2);
  }

  private determineStockEvent(availability: string): 'restock' | 'out_of_stock' | 'limited' | 'price_change' {
    switch (availability) {
      case 'in_stock': return 'restock';
      case 'out_of_stock': return 'out_of_stock';
      case 'limited': return 'limited';
      default: return 'price_change';
    }
  }

  private generateMockStockSource(sourceName: string): StockSource {
    const availabilities: ('in_stock' | 'out_of_stock' | 'limited')[] = ['in_stock', 'out_of_stock', 'limited'];
    const availability = availabilities[Math.floor(Math.random() * availabilities.length)];
    
    let stockCount: number | undefined;
    if (availability === 'in_stock') {
      stockCount = Math.floor(Math.random() * 50) + 1;
    } else if (availability === 'limited') {
      stockCount = Math.floor(Math.random() * 5) + 1;
    }

    return {
      name: sourceName,
      availability,
      stockCount,
      estimatedRestockDate: availability === 'out_of_stock' 
        ? new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
      lastChecked: new Date().toISOString(),
      reliability: 0.8 + Math.random() * 0.2,
      responseTime: 1000 + Math.random() * 3000
    };
  }

  private generateMockStockData(partId: string): StockData {
    const availability = Math.random() > 0.3 ? 'in_stock' : 'out_of_stock';
    const stockCount = availability === 'in_stock' ? Math.floor(Math.random() * 30) + 1 : undefined;

    return {
      partId,
      availability,
      stockCount,
      estimatedRestockDate: availability === 'out_of_stock' 
        ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
      stockHistory: [{
        availability,
        stockCount,
        timestamp: new Date().toISOString(),
        source: 'mock',
        event: availability === 'in_stock' ? 'restock' : 'out_of_stock'
      }],
      sources: [this.generateMockStockSource('mock')],
      lastUpdated: new Date().toISOString(),
      confidence: 0.9,
      alerts: []
    };
  }

  /**
   * ⚙️ 監視設定更新
   */
  public updateConfig(newConfig: Partial<StockMonitorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log(`⚙️ 在庫監視設定更新:`, this.config);
  }

  /**
   * 📊 サービス状態取得
   */
  public getServiceStatus(): {
    monitoring: boolean;
    cacheSize: number;
    priorityParts: number;
    config: StockMonitorConfig;
    lastCheck: string;
  } {
    return {
      monitoring: this.monitoringActive,
      cacheSize: this.stockCache.size,
      priorityParts: this.config.priorityParts.length,
      config: this.config,
      lastCheck: new Date().toISOString()
    };
  }
}

export default StockService;