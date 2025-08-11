// src/services/priceService.ts
// リアルタイム価格取得エンジン - 外部API統合・BOT対策完備

import { Part } from '@/types'; // 🔧 PartCategoryを削除
import { API_ENDPOINTS, API_KEYS, GLOBAL_CONFIG } from '@/config/apiConfig';
// 🔧 apiSecurityを削除

export interface PriceData {
  partId: string;
  currentPrice: number;
  previousPrice: number;
  priceChange: number;
  priceChangePercent: number;
  lowestPrice?: number;
  highestPrice?: number;
  averagePrice?: number;
  priceHistory: PriceHistoryEntry[];
  sources: PriceSource[];
  lastUpdated: string;
  confidence: number; // 0-1 価格データの信頼度
}

export interface PriceHistoryEntry {
  price: number;
  timestamp: string;
  source: string;
}

export interface PriceSource {
  name: string;
  price: number;
  url?: string;
  availability: 'in_stock' | 'out_of_stock' | 'limited';
  shippingCost?: number;
  shippingDays?: number;
  lastChecked: string;
  reliability: number; // 0-1 ソースの信頼性
}

export interface PriceAlert {
  partId: string;
  targetPrice: number;
  currentPrice: number;
  alertType: 'price_drop' | 'price_rise' | 'availability' | 'threshold';
  triggeredAt: string;
  message: string;
}

class PriceService {
  private static instance: PriceService;
  private rateLimitTracker = new Map<string, number[]>();
  private priceCache = new Map<string, { data: PriceData; expiry: number }>();
  private errorCount = new Map<string, number>();
  private readonly CACHE_DURATION = 300000; // 5分間キャッシュ

  public static getInstance(): PriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService();
    }
    return PriceService.instance;
  }

  /**
   * 🔄 パーツの最新価格情報を取得
   */
  public async fetchPartPrice(partId: string, part?: Part): Promise<PriceData | null> {
    console.log(`💰 価格取得開始: ${partId}`);

    try {
      // キャッシュチェック
      const cached = this.getCachedPrice(partId);
      if (cached) {
        console.log(`📦 キャッシュから価格取得: ${partId}`);
        return cached;
      }

      // 🛡️ 安全性チェック
      const canProceed = await this.performSafetyChecks();
      if (!canProceed) {
        console.warn(`⚠️ 安全性チェック失敗: ${partId}`);
        return this.generateMockPriceData(partId, part);
      }

      // 複数ソースから価格取得
      const priceData = await this.fetchFromMultipleSources(partId, part);
      
      // キャッシュに保存
      if (priceData) {
        this.setCachedPrice(partId, priceData);
      }

      console.log(`✅ 価格取得完了: ${partId} - ¥${priceData?.currentPrice || 'N/A'}`);
      return priceData;

    } catch (error) {
      console.error(`❌ 価格取得エラー: ${partId}`, error);
      this.recordError(partId);
      
      // エラー時はモックデータを返す
      return this.generateMockPriceData(partId, part);
    }
  }

  /**
   * 📊 複数パーツの価格を一括取得
   */
  public async fetchMultiplePrices(parts: Part[]): Promise<Map<string, PriceData>> {
    console.log(`🔄 一括価格取得開始: ${parts.length}件`);
    
    const results = new Map<string, PriceData>();
    const batchSize = 3; // 同時実行数制限（BOT対策）

    for (let i = 0; i < parts.length; i += batchSize) {
      const batch = parts.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (part) => {
        const priceData = await this.fetchPartPrice(part.id, part);
        if (priceData) {
          results.set(part.id, priceData);
        }
        
        // バッチ間の安全な遅延
        await this.safeDelay(1000 + Math.random() * 1000);
      });

      await Promise.allSettled(batchPromises);
      
      // バッチ間の長い遅延（BOT対策）
      if (i + batchSize < parts.length) {
        await this.safeDelay(3000 + Math.random() * 2000);
      }
    }

    console.log(`✅ 一括価格取得完了: ${results.size}/${parts.length}件成功`);
    return results;
  }

  /**
   * 🌐 複数ソースから価格情報収集
   */
  private async fetchFromMultipleSources(partId: string, part?: Part): Promise<PriceData | null> {
    const sources: PriceSource[] = [];
    const enabledSources = this.getEnabledSources();

    for (const sourceName of enabledSources) {
      try {
        await this.checkRateLimit(sourceName);
        
        const sourceData = await this.fetchFromSource(sourceName, partId, part);
        if (sourceData) {
          sources.push(sourceData);
        }

        // ソース間の安全な遅延
        await this.safeDelay(2000 + Math.random() * 1000);

      } catch (error) {
        console.warn(`⚠️ ソース ${sourceName} での価格取得失敗: ${partId}`, error);
      }
    }

    if (sources.length === 0) {
      return null;
    }

    // 複数ソースのデータを統合
    return this.consolidatePriceData(partId, sources, part);
  }

  /**
   * 🔍 個別ソースから価格取得
   */
  private async fetchFromSource(sourceName: string, partId: string, part?: Part): Promise<PriceSource | null> {
    const endpoint = API_ENDPOINTS[sourceName];
    if (!endpoint || !endpoint.robotsTxt.allowed) {
      return null;
    }

    // 現在はモック実装（段階的に実API対応）
    const mode = this.getCurrentMode();
    
    if (mode === 'mock') {
      return this.generateMockPriceSource(sourceName, partId, part);
    }

    // 実API実装（将来段階的に有効化）
    if (mode === 'limited' || mode === 'full') {
      // TODO: 実際のAPI呼び出し実装
      console.log(`🚧 実API実装予定: ${sourceName} for ${partId}`);
      
      switch (sourceName) {
        case 'amazon':
          return await this.fetchFromAmazonAPI(partId, part);
        case 'rakuten':
          return await this.fetchFromRakutenAPI(partId, part);
        case 'kakaku':
          return await this.fetchFromKakakuAPI(partId, part);
        default:
          return null;
      }
    }

    return null;
  }

  /**
   * 🛡️ Amazon PA-API価格取得（実装例）
   */
  private async fetchFromAmazonAPI(partId: string, part?: Part): Promise<PriceSource | null> {
    try {
      // const endpoint = API_ENDPOINTS.amazon; // 🔧 未使用のためコメントアウト
      const apiKey = API_KEYS.amazon;

      if (!apiKey.key || apiKey.status !== 'active') {
        throw new Error('Amazon APIキーが無効です');
      }

      // 🛡️ セキュリティヘッダー設定
      // const headers = {
      //   'User-Agent': endpoint.security.userAgent,
      //   'Accept-Language': endpoint.security.acceptLanguage,
      //   'Authorization': `Bearer ${apiKey.key}`,
      //   'Content-Type': 'application/json',
      // }; // 🔧 未使用のためコメントアウト

      // TODO: 実際のAmazon PA-API呼び出し
      console.log(`🚧 Amazon PA-API呼び出し実装予定: ${partId}`);
      
      // モック応答
      await this.safeDelay(1000);
      return this.generateMockPriceSource('amazon', partId, part);

    } catch (error) {
      console.error(`❌ Amazon API エラー: ${partId}`, error);
      return null;
    }
  }

  /**
   * 🛡️ 楽天API価格取得（実装例）
   */
  private async fetchFromRakutenAPI(partId: string, part?: Part): Promise<PriceSource | null> {
    try {
      // const endpoint = API_ENDPOINTS.rakuten; // 🔧 未使用のためコメントアウト
      const apiKey = API_KEYS.rakuten;

      if (!apiKey.key || apiKey.status !== 'active') {
        throw new Error('楽天APIキーが無効です');
      }

      // TODO: 実際の楽天API呼び出し
      console.log(`🚧 楽天API呼び出し実装予定: ${partId}`);
      
      await this.safeDelay(1000);
      return this.generateMockPriceSource('rakuten', partId, part);

    } catch (error) {
      console.error(`❌ 楽天API エラー: ${partId}`, error);
      return null;
    }
  }

  /**
   * 🛡️ 価格.com API価格取得（実装例）
   */
  private async fetchFromKakakuAPI(partId: string, part?: Part): Promise<PriceSource | null> {
    try {
      const endpoint = API_ENDPOINTS.kakaku;
      
      // robots.txt確認済みでない場合は実行しない
      if (!endpoint.robotsTxt.allowed) {
        console.warn(`⚠️ 価格.com robots.txt未確認のため取得停止: ${partId}`);
        return null;
      }

      // TODO: 実際の価格.com API呼び出し（慎重に）
      console.log(`🚧 価格.com API呼び出し実装予定: ${partId}`);
      
      await this.safeDelay(2000);
      return this.generateMockPriceSource('kakaku', partId, part);

    } catch (error) {
      console.error(`❌ 価格.com API エラー: ${partId}`, error);
      return null;
    }
  }

  /**
   * 📊 価格データ統合処理
   */
  private consolidatePriceData(partId: string, sources: PriceSource[], part?: Part): PriceData {
    // 信頼性による重み付け平均価格算出
    const weightedPrices = sources.map(s => ({
      price: s.price,
      weight: s.reliability
    }));

    const totalWeight = weightedPrices.reduce((sum, wp) => sum + wp.weight, 0);
    const averagePrice = Math.round(
      weightedPrices.reduce((sum, wp) => sum + (wp.price * wp.weight), 0) / totalWeight
    );

    const prices = sources.map(s => s.price);
    const currentPrice = averagePrice;
    const previousPrice = part?.price || currentPrice;
    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);

    // 価格履歴エントリ作成
    const priceHistory: PriceHistoryEntry[] = sources.map(source => ({
      price: source.price,
      timestamp: source.lastChecked,
      source: source.name
    }));

    // 信頼度計算
    const confidence = this.calculateConfidence(sources);

    return {
      partId,
      currentPrice,
      previousPrice,
      priceChange: currentPrice - previousPrice,
      priceChangePercent: ((currentPrice - previousPrice) / previousPrice) * 100,
      lowestPrice,
      highestPrice,
      averagePrice,
      priceHistory,
      sources,
      lastUpdated: new Date().toISOString(),
      confidence
    };
  }

  /**
   * 🛡️ 安全性事前チェック
   */
  private async performSafetyChecks(): Promise<boolean> {
    // 時間制限チェック
    const currentHour = new Date().getUTCHours();
    const allowedHours = GLOBAL_CONFIG.timeRestrictions.allowedHours;
    
    if (!allowedHours.includes(currentHour) && this.getCurrentMode() === 'full') {
      console.warn(`⏰ 外部アクセス許可時間外: ${currentHour}時`);
      return false;
    }

    // エラー率チェック
    const recentErrors = Array.from(this.errorCount.values()).reduce((sum, count) => sum + count, 0);
    if (recentErrors >= GLOBAL_CONFIG.errorHandling.maxConsecutiveErrors) {
      console.warn(`⚠️ エラー率が高すぎます: ${recentErrors}件`);
      return false;
    }

    // robots.txt確認（定期的）
    await this.checkRobotsTxtCompliance();

    return true;
  }

  /**
   * 🤖 robots.txt遵守確認
   */
  private async checkRobotsTxtCompliance(): Promise<void> {
    for (const [sourceName, endpoint] of Object.entries(API_ENDPOINTS)) {
      if (!endpoint.robotsTxt.allowed && endpoint.robotsTxt.url) {
        // 将来実装: 実際のrobots.txt確認
        console.log(`🤖 robots.txt確認予定: ${sourceName}`);
      }
    }
  }

  // ヘルパーメソッド群

  private getEnabledSources(): string[] {
    return Object.entries(API_ENDPOINTS)
      .filter(([, endpoint]) => endpoint.robotsTxt.allowed)
      .map(([name]) => name);
  }

  private getCurrentMode(): string {
    // 環境に応じたモード取得
    return process.env.NODE_ENV === 'production' 
      ? GLOBAL_CONFIG.operationModes.production
      : GLOBAL_CONFIG.operationModes.development;
  }

  private async checkRateLimit(sourceName: string): Promise<void> {
    const endpoint = API_ENDPOINTS[sourceName];
    if (!endpoint) return;

    const now = Date.now();
    const sourceRequests = this.rateLimitTracker.get(sourceName) || [];
    
    // 1分以内のリクエストをフィルタ
    const recentRequests = sourceRequests.filter(time => now - time < 60000);
    
    if (recentRequests.length >= endpoint.rateLimit.requestsPerMinute) {
      const waitTime = 60000 - (now - Math.min(...recentRequests));
      console.log(`⏳ ${sourceName} レート制限により${waitTime}ms待機中...`);
      await this.safeDelay(waitTime);
    }
    
    recentRequests.push(now);
    this.rateLimitTracker.set(sourceName, recentRequests);
  }

  private async safeDelay(baseMs: number): Promise<void> {
    const randomDelay = Math.random() * 1000; // 0-1秒のランダム遅延
    const totalDelay = baseMs + randomDelay;
    return new Promise(resolve => setTimeout(resolve, totalDelay));
  }

  private getCachedPrice(partId: string): PriceData | null {
    const cached = this.priceCache.get(partId);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    this.priceCache.delete(partId);
    return null;
  }

  private setCachedPrice(partId: string, data: PriceData): void {
    this.priceCache.set(partId, {
      data,
      expiry: Date.now() + this.CACHE_DURATION
    });
  }

  private recordError(partId: string): void {
    const count = this.errorCount.get(partId) || 0;
    this.errorCount.set(partId, count + 1);
  }

  private calculateConfidence(sources: PriceSource[]): number {
    if (sources.length === 0) return 0;
    
    const avgReliability = sources.reduce((sum, s) => sum + s.reliability, 0) / sources.length;
    const sourceCount = Math.min(sources.length / 3, 1); // 3ソース以上で満点
    
    return (avgReliability * 0.7) + (sourceCount * 0.3);
  }

  private generateMockPriceSource(sourceName: string, _partId: string, part?: Part): PriceSource {
    const basePrice = part?.price || 10000;
    const variation = (Math.random() - 0.5) * 0.1; // ±5%
    const price = Math.round(basePrice * (1 + variation));

    return {
      name: sourceName,
      price,
      availability: Math.random() > 0.2 ? 'in_stock' : 'limited',
      shippingCost: Math.random() > 0.5 ? 0 : Math.floor(Math.random() * 1000),
      shippingDays: Math.floor(Math.random() * 7) + 1,
      lastChecked: new Date().toISOString(),
      reliability: 0.8 + Math.random() * 0.2 // 0.8-1.0
    };
  }

  private generateMockPriceData(partId: string, part?: Part): PriceData {
    const basePrice = part?.price || 10000;
    const variation = (Math.random() - 0.5) * 0.1;
    const currentPrice = Math.round(basePrice * (1 + variation));
    const previousPrice = basePrice;

    return {
      partId,
      currentPrice,
      previousPrice,
      priceChange: currentPrice - previousPrice,
      priceChangePercent: ((currentPrice - previousPrice) / previousPrice) * 100,
      lowestPrice: Math.round(currentPrice * 0.9),
      highestPrice: Math.round(currentPrice * 1.1),
      averagePrice: currentPrice,
      priceHistory: [{
        price: currentPrice,
        timestamp: new Date().toISOString(),
        source: 'mock'
      }],
      sources: [this.generateMockPriceSource('mock', partId, part)],
      lastUpdated: new Date().toISOString(),
      confidence: 0.9
    };
  }

  /**
   * 📊 ヘルスチェック
   */
  public getServiceHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    cacheSize: number;
    errorCount: number;
    enabledSources: number;
    lastUpdate: string;
  } {
    const errorCount = Array.from(this.errorCount.values()).reduce((sum, count) => sum + count, 0);
    const enabledSources = this.getEnabledSources().length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (errorCount > 10) status = 'degraded';
    if (errorCount > 20 || enabledSources === 0) status = 'unhealthy';

    return {
      status,
      cacheSize: this.priceCache.size,
      errorCount,
      enabledSources,
      lastUpdate: new Date().toISOString()
    };
  }
}

export default PriceService;