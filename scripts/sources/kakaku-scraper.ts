// 🌐 価格.com安全スクレイピング実装
// BOT対策・レート制限完璧実装

import { RateLimiter } from '../utils/rateLimiter.js';

export interface PriceInfo {
  price: number;
  currency: 'JPY';
  availability: 'in_stock' | 'out_of_stock' | 'limited' | 'pre_order' | 'discontinued';
  lastUpdated: Date;
  source: 'kakaku';
  confidence: number; // 0-1の信頼度
}

export class KakakuScraper {
  private rateLimiter: RateLimiter;
  
  constructor() {
    // 🛡️ 安全なレート制限設定
    this.rateLimiter = new RateLimiter('kakaku', {
      requestsPerMinute: 15,        // 1分間15リクエスト以下
      delayBetweenRequests: 4000,   // 4秒間隔
      maxConcurrent: 2,             // 同時2リクエスト以下
      burstLimit: 3                 // 連続3リクエスト以下
    });
  }

  /**
   * 🛡️ 安全な価格取得
   */
  async fetchPartPrice(partId: string): Promise<PriceInfo | null> {
    try {
      return await this.rateLimiter.execute(async () => {
        return await this.safeFetchPrice(partId);
      });
    } catch (error) {
      console.error(`価格取得エラー [${partId}]:`, error);
      return null;
    }
  }

  private async safeFetchPrice(partId: string): Promise<PriceInfo> {
    const url = `https://kakaku.com/item/${partId}/`;
    
    // 💪 タイムアウト制御用AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒タイムアウト
    
    try {
      // 🤖 BOT対策済みリクエスト
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ja-JP,ja;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://kakaku.com/',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      return this.parsePrice(html, partId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('リクエストがタイムアウトしました (15秒)');
      }
      throw error;
    }
  }

  /**
   * 🔍 HTML解析による価格抽出
   */
  private parsePrice(html: string, _partId: string): PriceInfo {
    // TODO: 次チャットでcheerio実装
    // 基本的な正規表現による価格抽出（暫定）
    const priceRegex = /価格\s*[:：]\s*¥?\s*([\d,]+)/i;
    const priceMatch = html.match(priceRegex);
    
    if (!priceMatch) {
      throw new Error(`価格情報が見つかりません: ${_partId}`);
    }

    const priceText = priceMatch[1].replace(/,/g, '');
    const price = parseInt(priceText, 10);

    if (isNaN(price) || price <= 0) {
      throw new Error(`無効な価格: ${priceText}`);
    }

    // 在庫状況判定（基本実装）
    const availability = this.determineAvailability(html);

    return {
      price,
      currency: 'JPY',
      availability,
      lastUpdated: new Date(),
      source: 'kakaku',
      confidence: this.calculateConfidence(html, price)
    };
  }

  private determineAvailability(html: string): PriceInfo['availability'] {
    // 在庫状況キーワード判定
    if (html.includes('在庫あり') || html.includes('即納')) return 'in_stock';
    if (html.includes('在庫なし') || html.includes('入荷未定')) return 'out_of_stock';
    if (html.includes('残りわずか') || html.includes('在庫少')) return 'limited';
    if (html.includes('予約') || html.includes('発売予定')) return 'pre_order';
    if (html.includes('生産終了') || html.includes('販売終了')) return 'discontinued';
    
    return 'in_stock'; // デフォルト
  }

  private calculateConfidence(html: string, price: number): number {
    let confidence = 0.8; // 基本信頼度
    
    // 価格の妥当性チェック
    if (price < 100 || price > 1000000) confidence -= 0.3;
    
    // HTMLの品質チェック
    if (html.includes('価格.com')) confidence += 0.1;
    if (html.includes('エラー') || html.includes('error')) confidence -= 0.5;
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * 🧪 テスト用モック実装
   */
  async mockFetchPrice(partId: string): Promise<PriceInfo> {
    // テスト用の遅延
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // partIdを使った決定的なモック価格生成
    const hash = partId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const mockPrice = Math.abs(hash % 50000) + 5000;
    const availabilities: PriceInfo['availability'][] = ['in_stock', 'limited', 'out_of_stock'];
    
    return {
      price: mockPrice,
      currency: 'JPY',
      availability: availabilities[Math.abs(hash) % availabilities.length],
      lastUpdated: new Date(),
      source: 'kakaku',
      confidence: 0.9
    };
  }
}

export default KakakuScraper;