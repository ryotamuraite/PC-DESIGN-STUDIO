// 🛡️ 外部API安全アクセス - レート制限クラス
// BOT対策・負荷配慮・完璧実装

export interface RateLimitConfig {
  requestsPerMinute: number;
  delayBetweenRequests: number;  // ミリ秒
  maxConcurrent: number;
  burstLimit: number;
  backoffMultiplier?: number;    // 失敗時のバックオフ倍率
}

export interface RequestStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageDelay: number;
  lastRequestTime: number;
}

export class RateLimiter {
  private queue: Array<{
    fn: () => Promise<unknown>;
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
    timestamp: number;
  }> = [];
  
  private executing = 0;
  private lastRequestTime = 0;
  private requestHistory: number[] = [];
  private stats: RequestStats;

  constructor(
    private source: string,
    private config: RateLimitConfig
  ) {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageDelay: 0,
      lastRequestTime: 0
    };

    // デフォルト値設定
    this.config.backoffMultiplier = config.backoffMultiplier || 2;
  }

  /**
   * 🛡️ 安全な実行 - レート制限付き
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        fn,
        resolve,
        reject,
        timestamp: Date.now()
      });

      this.processQueue();
    });
  }

  /**
   * 📊 キュー処理
   */
  private async processQueue(): Promise<void> {
    // 同時実行制限チェック
    if (this.executing >= this.config.maxConcurrent) {
      return;
    }

    // キューが空の場合
    if (this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift()!;
    this.executing++;

    try {
      // ⏱️ レート制限待機
      await this.waitForRateLimit();

      // 📊 統計更新
      this.stats.totalRequests++;
      this.stats.lastRequestTime = Date.now();

      // 🚀 実際の処理実行
      const result = await task.fn();
      
      // ✅ 成功処理
      this.stats.successfulRequests++;
      task.resolve(result);

    } catch (error) {
      // ❌ エラー処理
      this.stats.failedRequests++;
      console.warn(`[${this.source}] リクエスト失敗:`, error);
      task.reject(error);

    } finally {
      this.executing--;
      this.updateRequestHistory();
      
      // 次のタスク処理
      setTimeout(() => this.processQueue(), 100);
    }
  }

  /**
   * ⏱️ レート制限待機
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    
    // 1. 基本間隔チェック
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.config.delayBetweenRequests) {
      const delay = this.config.delayBetweenRequests - timeSinceLastRequest;
      await this.delay(delay);
    }

    // 2. 分間制限チェック
    await this.enforcePerMinuteLimit();

    // 3. バースト制限チェック
    await this.enforceBurstLimit();

    this.lastRequestTime = Date.now();
  }

  /**
   * 📊 分間制限の強制
   */
  private async enforcePerMinuteLimit(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    // 過去1分間のリクエスト数カウント
    const recentRequests = this.requestHistory.filter(time => time > oneMinuteAgo);

    if (recentRequests.length >= this.config.requestsPerMinute) {
      // 最古のリクエストから1分経過するまで待機
      const oldestRequest = Math.min(...recentRequests);
      const waitTime = (oldestRequest + 60 * 1000) - now;
      
      if (waitTime > 0) {
        console.log(`[${this.source}] 分間制限: ${waitTime}ms 待機`);
        await this.delay(waitTime);
      }
    }
  }

  /**
   * ⚡ バースト制限の強制
   */
  private async enforceBurstLimit(): Promise<void> {
    const now = Date.now();
    const burstWindow = 10 * 1000; // 10秒間
    const burstStart = now - burstWindow;

    const burstRequests = this.requestHistory.filter(time => time > burstStart);

    if (burstRequests.length >= this.config.burstLimit) {
      const waitTime = burstWindow;
      console.log(`[${this.source}] バースト制限: ${waitTime}ms 待機`);
      await this.delay(waitTime);
    }
  }

  /**
   * 📈 リクエスト履歴更新
   */
  private updateRequestHistory(): void {
    const now = Date.now();
    this.requestHistory.push(now);

    // 古い履歴を削除（過去2分のみ保持）
    const twoMinutesAgo = now - 2 * 60 * 1000;
    this.requestHistory = this.requestHistory.filter(time => time > twoMinutesAgo);

    // 平均遅延計算
    if (this.stats.totalRequests > 1) {
      const totalDelay = this.requestHistory.reduce((sum, time, index) => {
        if (index === 0) return sum;
        return sum + (time - this.requestHistory[index - 1]);
      }, 0);
      this.stats.averageDelay = totalDelay / (this.requestHistory.length - 1);
    }
  }

  /**
   * ⏳ 遅延ヘルパー
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 📊 統計情報取得
   */
  getStats(): RequestStats {
    return { ...this.stats };
  }

  /**
   * 🔄 統計リセット
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageDelay: 0,
      lastRequestTime: 0
    };
    this.requestHistory = [];
  }

  /**
   * 📈 詳細レポート生成
   */
  generateReport(): string {
    const successRate = this.stats.totalRequests > 0 
      ? (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2)
      : '0.00';

    return `
🛡️ レート制限レポート [${this.source}]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 総リクエスト数: ${this.stats.totalRequests}
✅ 成功: ${this.stats.successfulRequests} (${successRate}%)
❌ 失敗: ${this.stats.failedRequests}
⏱️ 平均遅延: ${this.stats.averageDelay.toFixed(0)}ms
🕐 最終リクエスト: ${new Date(this.stats.lastRequestTime).toLocaleString()}
🔄 実行中: ${this.executing}/${this.config.maxConcurrent}
📋 キュー: ${this.queue.length}件待機
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }
}

export default RateLimiter;