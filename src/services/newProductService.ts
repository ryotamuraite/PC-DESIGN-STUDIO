// src/services/newProductService.ts
// 自動新製品検出システム - 外部API統合・トレンド分析

import { PartCategory } from '@/types'; // 🔧 Partを削除
import { API_ENDPOINTS, GLOBAL_CONFIG } from '@/config/apiConfig'; // 🔧 API_KEYSを削除
import ApiSecurity from '@/utils/apiSecurity';
// 🔧 PriceServiceを削除

export interface NewProductData {
  id: string;
  name: string;
  category: PartCategory;
  manufacturer: string;
  price: number;
  releaseDate: string;
  discoveredAt: string;
  sources: NewProductSource[];
  specifications: Record<string, string | number | boolean>; // 🔧 any → 具体的な型に修正
  availability: 'pre_order' | 'in_stock' | 'coming_soon';
  popularity: number; // 0-100
  trendScore: number; // 0-100 トレンド度
  confidence: number; // 0-1 データの信頼度
  alerts: NewProductAlert[];
}

export interface NewProductSource {
  name: string;
  url?: string;
  price?: number;
  availability: string;
  releaseDate?: string;
  lastChecked: string;
  reliability: number;
}

export interface NewProductAlert {
  type: 'new_release' | 'price_announcement' | 'availability_change' | 'trending';
  productId: string;
  message: string;
  triggeredAt: string;
  severity: 'info' | 'medium' | 'high';
  actionSuggested?: string;
}

export interface TrendAnalysis {
  category: PartCategory;
  trendingKeywords: string[];
  emergingManufacturers: string[];
  priceRanges: { min: number; max: number; average: number };
  releaseFrequency: number; // 製品リリース頻度（月あたり）
  lastUpdated: string;
}

export interface ProductFilter {
  categories?: PartCategory[];
  manufacturers?: string[];
  priceRange?: { min: number; max: number };
  releasedAfter?: string;
  minPopularity?: number;
  minTrendScore?: number;
}

class NewProductService {
  private static instance: NewProductService;
  private apiSecurity = ApiSecurity.getInstance();
  // 🔧 priceServiceを削除
  private productCache = new Map<string, { data: NewProductData[]; expiry: number }>();
  private trendCache = new Map<PartCategory, { data: TrendAnalysis; expiry: number }>();
  private monitoringActive = false;
  private monitoringInterval?: NodeJS.Timeout;
  private readonly CACHE_DURATION = 3600000; // 1時間キャッシュ
  private readonly MONITORING_INTERVAL = 21600000; // 6時間間隔

  public static getInstance(): NewProductService {
    if (!NewProductService.instance) {
      NewProductService.instance = new NewProductService();
    }
    return NewProductService.instance;
  }

  /**
   * 🆕 新製品を検索・取得
   */
  public async discoverNewProducts(
    category: PartCategory,
    limit: number = 20,
    filter?: ProductFilter
  ): Promise<NewProductData[]> {
    console.log(`🆕 新製品検索開始: ${category} カテゴリ (最大${limit}件)`);

    try {
      // キャッシュチェック
      const cacheKey = `${category}_${JSON.stringify(filter)}`;
      const cached = this.getCachedProducts(cacheKey);
      if (cached) {
        console.log(`📦 キャッシュから新製品取得: ${category}`);
        return cached.slice(0, limit);
      }

      // 🛡️ セキュリティチェック
      const securityCheck = await this.apiSecurity.performSecurityCheck('all', undefined, 'medium');
      if (!securityCheck.allowed) {
        console.warn(`⚠️ セキュリティチェック失敗: ${securityCheck.reason}`);
        return this.generateMockNewProducts(category, limit, filter);
      }

      // 複数ソースから新製品情報収集
      const newProducts = await this.fetchFromMultipleSources(category, limit, filter);
      
      // トレンド分析実行
      const trendsAnalyzed = await this.analyzeTrends(newProducts);
      
      // 人気度・トレンド度計算
      const productsWithScores = await this.calculatePopularityScores(trendsAnalyzed);

      // アラート生成
      await this.generateNewProductAlerts(productsWithScores);

      // キャッシュに保存
      this.setCachedProducts(cacheKey, productsWithScores);

      console.log(`✅ 新製品検索完了: ${category} - ${productsWithScores.length}件発見`);
      return productsWithScores.slice(0, limit);

    } catch (error) {
      console.error(`❌ 新製品検索エラー: ${category}`, error);
      
      // エラー時はモックデータを返す
      return this.generateMockNewProducts(category, limit, filter);
    }
  }

  /**
   * 📊 複数カテゴリの新製品を一括取得
   */
  public async discoverMultipleCategories(
    categories: PartCategory[],
    limitPerCategory: number = 10
  ): Promise<Map<PartCategory, NewProductData[]>> {
    console.log(`🔄 複数カテゴリ新製品検索: ${categories.length}カテゴリ`);
    
    const results = new Map<PartCategory, NewProductData[]>();

    for (const category of categories) {
      try {
        const products = await this.discoverNewProducts(category, limitPerCategory);
        results.set(category, products);

        // カテゴリ間の安全な遅延（新製品検索は控えめ）
        await this.safeDelay(5000 + Math.random() * 3000);

      } catch (error) {
        console.error(`❌ カテゴリ ${category} の新製品検索エラー:`, error);
        results.set(category, []);
      }
    }

    console.log(`✅ 複数カテゴリ新製品検索完了: ${results.size}/${categories.length}カテゴリ成功`);
    return results;
  }

  /**
   * 🎯 新製品監視開始
   */
  public startNewProductMonitoring(categories: PartCategory[] = []): void {
    if (this.monitoringActive) {
      console.log(`⚠️ 新製品監視は既に実行中です`);
      return;
    }

    this.monitoringActive = true;
    console.log(`🎯 新製品監視開始: ${categories.length}カテゴリ`);

    this.monitoringInterval = setInterval(async () => {
      await this.performPeriodicProductCheck(categories);
    }, this.MONITORING_INTERVAL);
  }

  /**
   * ⏹️ 新製品監視停止
   */
  public stopNewProductMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    
    this.monitoringActive = false;
    console.log(`⏹️ 新製品監視停止`);
  }

  /**
   * 🕐 定期新製品チェック
   */
  private async performPeriodicProductCheck(categories: PartCategory[]): Promise<void> {
    console.log(`🔄 定期新製品チェック実行中...`);

    for (const category of categories) {
      try {
        const newProducts = await this.discoverNewProducts(category, 5);
        
        // 真に新しい製品をフィルタ（1週間以内）
        const recentProducts = newProducts.filter(product => {
          const releaseDate = new Date(product.releaseDate);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return releaseDate > weekAgo;
        });

        if (recentProducts.length > 0) {
          console.log(`🆕 ${category} で新製品発見: ${recentProducts.length}件`);
        }

        // 定期チェックでは更に慎重な間隔
        await this.safeDelay(30000 + Math.random() * 15000);

      } catch (error) {
        console.error(`❌ 定期新製品チェックエラー: ${category}`, error);
      }
    }

    console.log(`✅ 定期新製品チェック完了`);
  }

  /**
   * 🌐 複数ソースから新製品情報収集
   */
  private async fetchFromMultipleSources(
    category: PartCategory,
    limit: number,
    filter?: ProductFilter
  ): Promise<NewProductData[]> {
    const allProducts: NewProductData[] = [];
    const enabledSources = this.getEnabledSources();

    for (const sourceName of enabledSources) {
      try {
        const securityCheck = await this.apiSecurity.performSecurityCheck(sourceName, undefined, 'medium');
        if (!securityCheck.allowed) {
          console.warn(`⚠️ ${sourceName} セキュリティチェック失敗: ${securityCheck.reason}`);
          continue;
        }

        const sourceProducts = await this.fetchFromSource(sourceName, category, limit, filter);
        if (sourceProducts.length > 0) {
          allProducts.push(...sourceProducts);
        }

        // API呼び出し記録
        this.apiSecurity.recordApiCall(sourceName, 'new_products_fetch', 'success', undefined, undefined);

        // ソース間の安全な遅延
        await this.safeDelay(4000 + Math.random() * 2000);

      } catch (error) {
        console.warn(`⚠️ ソース ${sourceName} での新製品取得失敗: ${category}`, error);
        this.apiSecurity.recordApiCall(sourceName, 'new_products_fetch', 'failure', undefined, undefined, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // 重複除去・マージ
    return this.deduplicateProducts(allProducts);
  }

  /**
   * 🔍 個別ソースから新製品取得
   */
  private async fetchFromSource(
    sourceName: string,
    category: PartCategory,
    limit: number,
    filter?: ProductFilter
  ): Promise<NewProductData[]> {
    const endpoint = API_ENDPOINTS[sourceName];
    if (!endpoint || !endpoint.robotsTxt.allowed) {
      return [];
    }

    // 現在はモック実装（段階的に実API対応）
    const mode = this.getCurrentMode();
    
    if (mode === 'mock') {
      return this.generateMockNewProducts(category, Math.min(limit, 5), filter);
    }

    // 実API実装（将来段階的に有効化）
    if (mode === 'limited' || mode === 'full') {
      console.log(`🚧 新製品API実装予定: ${sourceName} for ${category}`);
      
      switch (sourceName) {
        case 'amazon':
          return await this.fetchAmazonNewProducts(category, limit, filter);
        case 'rakuten':
          return await this.fetchRakutenNewProducts(category, limit, filter);
        case 'kakaku':
          return await this.fetchKakakuNewProducts(category, limit, filter);
        default:
          return [];
      }
    }

    return [];
  }

  /**
   * 🛡️ Amazon新製品取得（実装例）
   */
  private async fetchAmazonNewProducts(
    category: PartCategory,
    limit: number,
    filter?: ProductFilter
  ): Promise<NewProductData[]> {
    try {
      // TODO: 実際のAmazon PA-API新製品検索実装
      console.log(`🚧 Amazon新製品検索実装予定: ${category}`);
      
      await this.safeDelay(2000);
      return this.generateMockNewProducts(category, Math.min(limit, 3), filter);

    } catch (error) {
      console.error(`❌ Amazon新製品検索エラー: ${category}`, error);
      return [];
    }
  }

  /**
   * 🛡️ 楽天新製品取得（実装例）
   */
  private async fetchRakutenNewProducts(
    category: PartCategory,
    limit: number,
    filter?: ProductFilter
  ): Promise<NewProductData[]> {
    try {
      // TODO: 実際の楽天API新製品検索実装
      console.log(`🚧 楽天新製品検索実装予定: ${category}`);
      
      await this.safeDelay(1800);
      return this.generateMockNewProducts(category, Math.min(limit, 4), filter);

    } catch (error) {
      console.error(`❌ 楽天新製品検索エラー: ${category}`, error);
      return [];
    }
  }

  /**
   * 🛡️ 価格.com新製品取得（実装例）
   */
  private async fetchKakakuNewProducts(
    category: PartCategory,
    limit: number,
    filter?: ProductFilter
  ): Promise<NewProductData[]> {
    try {
      // TODO: 実際の価格.com API新製品検索実装（慎重に）
      console.log(`🚧 価格.com新製品検索実装予定: ${category}`);
      
      await this.safeDelay(3000);
      return this.generateMockNewProducts(category, Math.min(limit, 2), filter);

    } catch (error) {
      console.error(`❌ 価格.com新製品検索エラー: ${category}`, error);
      return [];
    }
  }

  /**
   * 📈 トレンド分析実行
   */
  private async analyzeTrends(products: NewProductData[]): Promise<NewProductData[]> {
    console.log(`📈 トレンド分析開始: ${products.length}製品`);

    // カテゴリ別でグループ化
    const byCategory = new Map<PartCategory, NewProductData[]>();
    for (const product of products) {
      const categoryProducts = byCategory.get(product.category) || [];
      categoryProducts.push(product);
      byCategory.set(product.category, categoryProducts);
    }

    // 各カテゴリでトレンド分析
    for (const [category, categoryProducts] of byCategory.entries()) {
      const trendAnalysis = await this.generateTrendAnalysis(category, categoryProducts);
      
      // トレンド分析をキャッシュ
      this.trendCache.set(category, {
        data: trendAnalysis,
        expiry: Date.now() + this.CACHE_DURATION
      });

      // トレンドスコア計算
      for (const product of categoryProducts) {
        product.trendScore = this.calculateTrendScore(product, trendAnalysis);
      }
    }

    console.log(`✅ トレンド分析完了`);
    return products;
  }

  /**
   * 📊 人気度スコア計算
   */
  private async calculatePopularityScores(products: NewProductData[]): Promise<NewProductData[]> {
    for (const product of products) {
      // 基本人気度要素
      let popularityScore = 0;

      // 価格帯による補正
      const categoryAverage = this.getCategoryAveragePrice(product.category);
      const priceRatio = product.price / categoryAverage;
      if (priceRatio <= 1.2) popularityScore += 30; // 適正価格
      if (priceRatio <= 0.8) popularityScore += 20; // 安価
      if (priceRatio >= 2.0) popularityScore -= 15; // 高価

      // リリース日による補正
      const releaseDate = new Date(product.releaseDate);
      const daysSinceRelease = (Date.now() - releaseDate.getTime()) / (24 * 60 * 60 * 1000);
      if (daysSinceRelease <= 7) popularityScore += 25; // 最新
      if (daysSinceRelease <= 30) popularityScore += 15; // 新しい
      if (daysSinceRelease >= 365) popularityScore -= 20; // 古い

      // メーカーによる補正
      const popularManufacturers = ['Intel', 'AMD', 'NVIDIA', 'Corsair', 'ASUS'];
      if (popularManufacturers.includes(product.manufacturer)) {
        popularityScore += 20;
      }

      // ソース数による補正
      popularityScore += Math.min(product.sources.length * 5, 25);

      // 正規化（0-100）
      product.popularity = Math.max(0, Math.min(100, popularityScore));
    }

    return products;
  }

  /**
   * 🚨 新製品アラート生成
   */
  private async generateNewProductAlerts(products: NewProductData[]): Promise<void> {
    for (const product of products) {
      const alerts: NewProductAlert[] = [];

      // 注目新製品アラート
      if (product.trendScore >= 80 && product.popularity >= 70) {
        alerts.push({
          type: 'trending',
          productId: product.id,
          message: `注目の新製品: ${product.name} (トレンド度${product.trendScore})`,
          triggeredAt: new Date().toISOString(),
          severity: 'high',
          actionSuggested: '詳細を確認することをお勧めします'
        });
      }

      // 新リリースアラート
      const releaseDate = new Date(product.releaseDate);
      const daysSinceRelease = (Date.now() - releaseDate.getTime()) / (24 * 60 * 60 * 1000);
      if (daysSinceRelease <= 3) {
        alerts.push({
          type: 'new_release',
          productId: product.id,
          message: `新製品リリース: ${product.name}`,
          triggeredAt: new Date().toISOString(),
          severity: 'medium'
        });
      }

      // 価格発表アラート
      if (product.availability === 'pre_order' && product.price > 0) {
        alerts.push({
          type: 'price_announcement',
          productId: product.id,
          message: `価格発表: ${product.name} - ¥${product.price.toLocaleString()}`,
          triggeredAt: new Date().toISOString(),
          severity: 'info'
        });
      }

      product.alerts = alerts;

      // アラートのログ出力
      if (alerts.length > 0) {
        console.log(`🚨 新製品アラート生成: ${product.name}`, alerts.length);
      }
    }
  }

  // ヘルパーメソッド群

  private generateTrendAnalysis(category: PartCategory, products: NewProductData[]): TrendAnalysis {
    // キーワード分析
    const keywords = new Map<string, number>();
    const manufacturers = new Map<string, number>();
    const prices: number[] = [];

    for (const product of products) {
      // 名前からキーワード抽出
      const nameWords = product.name.toLowerCase().split(/\s+/);
      for (const word of nameWords) {
        if (word.length > 2) {
          keywords.set(word, (keywords.get(word) || 0) + 1);
        }
      }

      // メーカー統計
      manufacturers.set(product.manufacturer, (manufacturers.get(product.manufacturer) || 0) + 1);

      // 価格統計
      if (product.price > 0) {
        prices.push(product.price);
      }
    }

    // トレンドキーワード抽出（出現頻度上位）
    const trendingKeywords = Array.from(keywords.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([keyword]) => keyword);

    // 新興メーカー（少ないが注目されているメーカー）
    const emergingManufacturers = Array.from(manufacturers.entries())
      .filter(([, count]) => count >= 1 && count <= 3)
      .map(([manufacturer]) => manufacturer);

    // 価格レンジ
    const priceRanges = prices.length > 0 ? {
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length)
    } : { min: 0, max: 0, average: 0 };

    // リリース頻度（月あたり）
    const releaseFrequency = products.length / 1; // 1ヶ月間での頻度として概算

    return {
      category,
      trendingKeywords,
      emergingManufacturers,
      priceRanges,
      releaseFrequency,
      lastUpdated: new Date().toISOString()
    };
  }

  private calculateTrendScore(product: NewProductData, trendAnalysis: TrendAnalysis): number {
    let trendScore = 0;

    // トレンドキーワードマッチ
    const productName = product.name.toLowerCase();
    const keywordMatches = trendAnalysis.trendingKeywords.filter(keyword => 
      productName.includes(keyword)
    ).length;
    trendScore += keywordMatches * 10;

    // 新興メーカーボーナス
    if (trendAnalysis.emergingManufacturers.includes(product.manufacturer)) {
      trendScore += 20;
    }

    // 価格レンジでの位置
    const { min, max, average } = trendAnalysis.priceRanges;
    if (product.price >= min && product.price <= max) {
      trendScore += 15;
      if (Math.abs(product.price - average) / average <= 0.2) {
        trendScore += 10; // 平均価格近辺
      }
    }

    // リリース頻度による補正
    if (trendAnalysis.releaseFrequency > 10) {
      trendScore += 15; // 活発なカテゴリ
    }

    // ソース信頼度による補正
    const avgReliability = product.sources.reduce((sum, s) => sum + s.reliability, 0) / product.sources.length;
    trendScore += avgReliability * 20;

    return Math.max(0, Math.min(100, trendScore));
  }

  private deduplicateProducts(products: NewProductData[]): NewProductData[] {
    const seen = new Map<string, NewProductData>();

    for (const product of products) {
      // 名前とメーカーの組み合わせで重複判定
      const key = `${product.manufacturer}_${product.name}`.toLowerCase();
      
      if (!seen.has(key)) {
        seen.set(key, product);
      } else {
        // 既存製品とソース情報をマージ
        const existing = seen.get(key)!;
        existing.sources.push(...product.sources);
        existing.confidence = Math.max(existing.confidence, product.confidence);
      }
    }

    return Array.from(seen.values()).sort((a, b) => b.trendScore - a.trendScore);
  }

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

  private getCategoryAveragePrice(category: PartCategory): number {
    // カテゴリ別の平均価格（概算）
    const averagePrices: Record<PartCategory, number> = {
      cpu: 35000,
      gpu: 60000,
      motherboard: 15000,
      memory: 8000,
      storage: 12000,
      psu: 10000,
      cooler: 5000, // 🔧 cpu_cooler → cooler に修正
      case: 8000,
      monitor: 25000, // 🔧 不足カテゴリ追加
      other: 5000     // 🔧 不足カテゴリ追加
    };

    return averagePrices[category] || 20000;
  }

  private async safeDelay(baseMs: number): Promise<void> {
    const randomDelay = Math.random() * 3000; // 0-3秒のランダム遅延
    const totalDelay = baseMs + randomDelay;
    return new Promise(resolve => setTimeout(resolve, totalDelay));
  }

  private getCachedProducts(key: string): NewProductData[] | null {
    const cached = this.productCache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    this.productCache.delete(key);
    return null;
  }

  private setCachedProducts(key: string, data: NewProductData[]): void {
    this.productCache.set(key, {
      data,
      expiry: Date.now() + this.CACHE_DURATION
    });
  }

  private generateMockNewProducts(
    category: PartCategory,
    limit: number,
    filter?: ProductFilter
  ): NewProductData[] {
    const products: NewProductData[] = [];
    const manufacturers = ['Intel', 'AMD', 'NVIDIA', 'Corsair', 'ASUS', 'MSI', 'Gigabyte'];
    
    for (let i = 0; i < limit; i++) {
      const manufacturer = manufacturers[Math.floor(Math.random() * manufacturers.length)];
      const releaseDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      const product: NewProductData = {
        id: `new-${category}-${Date.now()}-${i}`,
        name: `${manufacturer} ${category.toUpperCase()} ${2025 + Math.floor(Math.random() * 2)}`,
        category,
        manufacturer,
        price: Math.floor(Math.random() * 100000) + 10000,
        releaseDate: releaseDate.toISOString(),
        discoveredAt: new Date().toISOString(),
        sources: [{
          name: 'mock',
          lastChecked: new Date().toISOString(),
          reliability: 0.9,
          availability: 'in_stock' // 🔧 availabilityプロパティ追加
        }],
        specifications: {},
        availability: Math.random() > 0.5 ? 'in_stock' : 'pre_order',
        popularity: Math.floor(Math.random() * 100),
        trendScore: Math.floor(Math.random() * 100),
        confidence: 0.8 + Math.random() * 0.2,
        alerts: []
      };

      // フィルタ適用
      if (filter) {
        if (filter.categories && !filter.categories.includes(category)) continue;
        if (filter.manufacturers && !filter.manufacturers.includes(manufacturer)) continue;
        if (filter.priceRange) {
          if (product.price < filter.priceRange.min || product.price > filter.priceRange.max) continue;
        }
        if (filter.releasedAfter) {
          if (releaseDate < new Date(filter.releasedAfter)) continue;
        }
        if (filter.minPopularity && product.popularity < filter.minPopularity) continue;
        if (filter.minTrendScore && product.trendScore < filter.minTrendScore) continue;
      }

      products.push(product);
    }

    return products;
  }

  /**
   * 📊 トレンド分析結果取得
   */
  public getTrendAnalysis(category: PartCategory): TrendAnalysis | null {
    const cached = this.trendCache.get(category);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    return null;
  }

  /**
   * 📈 サービス統計取得
   */
  public getServiceStats(): {
    monitoring: boolean;
    cachedProducts: number;
    cachedTrends: number;
    lastDiscovery: string;
  } {
    return {
      monitoring: this.monitoringActive,
      cachedProducts: this.productCache.size,
      cachedTrends: this.trendCache.size,
      lastDiscovery: new Date().toISOString()
    };
  }
}

export default NewProductService;