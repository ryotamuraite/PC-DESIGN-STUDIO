// src/services/externalApiService.ts
// 外部API連携サービス - 価格情報・在庫情報の取得

import { Part, PartCategory } from '@/types';

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
  availability: 'in_stock' | 'out_of_stock' | 'limited';
  stockCount?: number;
  estimatedRestockDate?: string;
  source: string;
  lastChecked: string;
}

// API設定
const API_CONFIG = {
  endpoints: {
    // 実際のAPIエンドポイント（環境変数から取得）
    kakaku: process.env.VITE_KAKAKU_API_URL || 'https://api.kakaku.com/v1',
    amazon: process.env.VITE_AMAZON_API_URL || 'https://api.amazon.com/v1',
    rakuten: process.env.VITE_RAKUTEN_API_URL || 'https://api.rakuten.com/v1',
    // モック用エンドポイント
    mock: '/api/mock'
  },
  timeout: 10000, // 10秒
  retryCount: 3,
  retryDelay: 1000, // 1秒
  rateLimit: {
    requestsPerMinute: 60,
    burstLimit: 10
  }
};

class ExternalApiService {
  private static instance: ExternalApiService;
  // リクエストキューは将来の実装用に保持
  // private requestQueue: Array<() => Promise<unknown>> = [];
  // private isProcessingQueue = false;
  private rateLimitTracker = new Map<string, number[]>();

  public static getInstance(): ExternalApiService {
    if (!ExternalApiService.instance) {
      ExternalApiService.instance = new ExternalApiService();
    }
    return ExternalApiService.instance;
  }

  /**
   * 価格情報を更新
   */
  public async updatePrices(parts: Part[], source = 'all'): Promise<ApiResponse<PriceUpdate[]>> {
    console.log(`🔄 価格情報更新開始: ${parts.length}件のパーツ`);

    try {
      const updates: PriceUpdate[] = [];
      
      for (const part of parts) {
        // レート制限チェック
        await this.checkRateLimit(source);
        
        const priceUpdate = await this.fetchPartPrice(part, source);
        if (priceUpdate) {
          updates.push(priceUpdate);
        }
        
        // 短い間隔で次のリクエスト（BOT扱い回避）
        await this.delay(200);
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
   * 在庫情報を更新
   */
  public async updateStockInfo(parts: Part[], source = 'all'): Promise<ApiResponse<StockInfo[]>> {
    console.log(`📦 在庫情報更新開始: ${parts.length}件のパーツ`);

    try {
      const stockUpdates: StockInfo[] = [];
      
      for (const part of parts) {
        await this.checkRateLimit(source);
        
        const stockInfo = await this.fetchPartStock(part, source);
        if (stockInfo) {
          stockUpdates.push(stockInfo);
        }
        
        await this.delay(150);
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
   * 新製品情報を取得
   */
  public async fetchNewProducts(category: PartCategory, limit = 10): Promise<ApiResponse<Part[]>> {
    console.log(`🆕 新製品情報取得: ${category} カテゴリ`);

    try {
      await this.checkRateLimit('all');
      
      // 実際の実装では外部APIを呼び出し
      const newProducts = await this.fetchNewProductsFromAPI(category, limit);
      
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
   * パーツの価格を取得
   */
  private async fetchPartPrice(part: Part, source: string): Promise<PriceUpdate | null> {
    try {
      // モック実装（実際のAPIに置き換え）
      const mockPrice = this.generateMockPrice(part);
      
      if (mockPrice !== part.price) {
        return {
          partId: part.id,
          oldPrice: part.price,
          newPrice: mockPrice,
          priceChange: mockPrice - part.price,
          priceChangePercent: ((mockPrice - part.price) / part.price) * 100,
          source,
          updatedAt: new Date().toISOString()
        };
      }
      
      return null;
    } catch (error) {
      console.warn(`⚠️ ${part.id} の価格取得失敗:`, error);
      return null;
    }
  }

  /**
   * パーツの在庫情報を取得
   */
  private async fetchPartStock(part: Part, source: string): Promise<StockInfo | null> {
    try {
      // モック実装（実際のAPIに置き換え）
      const mockStock = this.generateMockStock();
      
      return {
        partId: part.id,
        availability: mockStock.availability,
        stockCount: mockStock.stockCount,
        estimatedRestockDate: mockStock.estimatedRestockDate,
        source,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      console.warn(`⚠️ ${part.id} の在庫情報取得失敗:`, error);
      return null;
    }
  }

  /**
   * 新製品をAPIから取得
   */
  private async fetchNewProductsFromAPI(category: PartCategory, limit: number): Promise<Part[]> {
    // モック実装（実際のAPIに置き換え）
    await this.delay(500); // API呼び出しシミュレート
    
    return this.generateMockNewProducts(category, limit);
  }

  /**
   * レート制限チェック
   */
  private async checkRateLimit(source: string): Promise<void> {
    const now = Date.now();
    const sourceRequests = this.rateLimitTracker.get(source) || [];
    
    // 1分以内のリクエストをフィルタ
    const recentRequests = sourceRequests.filter(time => now - time < 60000);
    
    if (recentRequests.length >= API_CONFIG.rateLimit.requestsPerMinute) {
      const oldestRequest = Math.min(...recentRequests);
      const waitTime = 60000 - (now - oldestRequest);
      
      console.log(`⏳ レート制限により${waitTime}ms待機中...`);
      await this.delay(waitTime);
    }
    
    // リクエスト記録を更新
    recentRequests.push(now);
    this.rateLimitTracker.set(source, recentRequests);
  }

  /**
   * 遅延処理
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * モック価格生成（開発用）
   */
  private generateMockPrice(part: Part): number {
    // 基準価格から±5%の範囲でランダムに変動
    const variation = (Math.random() - 0.5) * 0.1; // -5% to +5%
    const newPrice = Math.round(part.price * (1 + variation));
    return Math.max(newPrice, 1000); // 最低1000円
  }

  /**
   * モック在庫情報生成（開発用）
   */
  private generateMockStock(): {
    availability: 'in_stock' | 'out_of_stock' | 'limited';
    stockCount?: number;
    estimatedRestockDate?: string;
  } {
    const random = Math.random();
    
    if (random < 0.8) {
      return {
        availability: 'in_stock',
        stockCount: Math.floor(Math.random() * 50) + 1
      };
    } else if (random < 0.95) {
      return {
        availability: 'limited',
        stockCount: Math.floor(Math.random() * 5) + 1
      };
    } else {
      const restockDate = new Date();
      restockDate.setDate(restockDate.getDate() + Math.floor(Math.random() * 14) + 1);
      
      return {
        availability: 'out_of_stock',
        estimatedRestockDate: restockDate.toISOString()
      };
    }
  }

  /**
   * モック新製品生成（開発用）
   */
  private generateMockNewProducts(category: PartCategory, limit: number): Part[] {
    const mockProducts: Part[] = [];
    
    for (let i = 0; i < limit; i++) {
      mockProducts.push({
        id: `new-${category}-${Date.now()}-${i}`,
        name: `新製品 ${category.toUpperCase()} ${i + 1}`,
        category,
        price: Math.floor(Math.random() * 100000) + 10000,
        manufacturer: ['Intel', 'AMD', 'NVIDIA', 'Corsair', 'ASUS'][Math.floor(Math.random() * 5)],
        specifications: {},
        availability: 'in_stock',
        rating: 4 + Math.random(),
        reviewCount: Math.floor(Math.random() * 1000),
        releaseDate: new Date().toISOString(),
        popularity: Math.floor(Math.random() * 100)
      });
    }
    
    return mockProducts;
  }

  /**
   * ヘルスチェック
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, boolean>;
    responseTime: number;
  }> {
    const start = Date.now();
    const services: Record<string, boolean> = {};
    
    // 各APIサービスの健全性をチェック
    for (const [serviceName] of Object.entries(API_CONFIG.endpoints)) {
      try {
        // 実際の実装では各APIのヘルスエンドポイントを呼び出し
        // const response = await fetch(`${endpoint}/health`);
        // services[serviceName] = response.ok;
        
        // モック実装
        await this.delay(100);
        services[serviceName] = Math.random() > 0.1; // 90%の確率で正常
      } catch {
        services[serviceName] = false;
      }
    }
    
    const responseTime = Date.now() - start;
    const healthyServices = Object.values(services).filter(Boolean).length;
    const totalServices = Object.keys(services).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyServices === totalServices) {
      status = 'healthy';
    } else if (healthyServices > 0) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }
    
    return {
      status,
      services,
      responseTime
    };
  }
}

export default ExternalApiService;
