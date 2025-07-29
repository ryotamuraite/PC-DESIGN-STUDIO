// src/utils/apiSecurity.ts
// 外部API安全アクセス制御 - BOT対策・セキュリティ最優先

import { API_ENDPOINTS, GLOBAL_CONFIG, SECURITY_RULES } from '@/config/apiConfig';

export interface SecurityCheckResult {
  allowed: boolean;
  reason?: string;
  waitTime?: number;
  suggestions?: string[];
}

export interface RateLimitStatus {
  source: string;
  requestsInLastMinute: number;
  requestsInLastHour: number;
  isNearLimit: boolean;
  nextAvailableTime?: number;
}

export interface BotPreventionMeasures {
  userAgent: string;
  referer?: string;
  acceptLanguage: string;
  randomDelay: number;
  sessionId: string;
  fingerprint: string;
}

export interface AuditLogEntry {
  timestamp: string;
  source: string;
  action: string;
  partId?: string;
  result: 'success' | 'failure' | 'blocked';
  reason?: string;
  responseTime?: number;
  ipAddress?: string;
  userAgent?: string;
}

class ApiSecurity {
  private static instance: ApiSecurity;
  private rateLimitTracker = new Map<string, number[]>();
  private errorTracker = new Map<string, { count: number; lastError: number }>();
  private sessionTracker = new Map<string, { created: number; requestCount: number }>();
  private auditLog: AuditLogEntry[] = [];
  private currentSessionId: string;
  private botPreventionCache = new Map<string, BotPreventionMeasures>();

  public static getInstance(): ApiSecurity {
    if (!ApiSecurity.instance) {
      ApiSecurity.instance = new ApiSecurity();
    }
    return ApiSecurity.instance;
  }

  constructor() {
    this.currentSessionId = this.generateSessionId();
    this.initializeSecurityMeasures();
  }

  /**
   * 🛡️ 外部API呼び出し前の総合セキュリティチェック
   */
  public async performSecurityCheck(
    source: string, 
    partId?: string, 
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<SecurityCheckResult> {
    console.log(`🔍 セキュリティチェック開始: ${source} ${partId ? `(${partId})` : ''}`);

    // 1. 基本的な許可チェック
    const basicCheck = this.checkBasicPermissions(source);
    if (!basicCheck.allowed) {
      return basicCheck;
    }

    // 2. 時間制限チェック
    const timeCheck = this.checkTimeRestrictions();
    if (!timeCheck.allowed) {
      return timeCheck;
    }

    // 3. レート制限チェック
    const rateLimitCheck = await this.checkRateLimit(source);
    if (!rateLimitCheck.allowed) {
      return rateLimitCheck;
    }

    // 4. エラー率チェック
    const errorCheck = this.checkErrorRate(source);
    if (!errorCheck.allowed) {
      return errorCheck;
    }

    // 5. セッション制限チェック
    const sessionCheck = this.checkSessionLimits();
    if (!sessionCheck.allowed) {
      return sessionCheck;
    }

    // 6. robots.txt遵守チェック
    const robotsCheck = await this.checkRobotsCompliance(source);
    if (!robotsCheck.allowed) {
      return robotsCheck;
    }

    // 7. 負荷軽減チェック
    const loadCheck = this.checkServerLoad(priority);
    if (!loadCheck.allowed) {
      return loadCheck;
    }

    console.log(`✅ セキュリティチェック通過: ${source}`);
    return { allowed: true };
  }

  /**
   * 🔒 基本許可チェック
   */
  private checkBasicPermissions(source: string): SecurityCheckResult {
    const endpoint = API_ENDPOINTS[source];
    
    if (!endpoint) {
      return {
        allowed: false,
        reason: `不明なAPIソース: ${source}`,
        suggestions: ['設定されているAPIソースを確認してください']
      };
    }

    if (!endpoint.robotsTxt.allowed) {
      return {
        allowed: false,
        reason: `${source} へのアクセスが許可されていません`,
        suggestions: [
          'robots.txt確認を実行してください',
          'API利用許可を取得してください',
          'モックモードでの動作確認をお勧めします'
        ]
      };
    }

    return { allowed: true };
  }

  /**
   * ⏰ 時間制限チェック
   */
  private checkTimeRestrictions(): SecurityCheckResult {
    const currentHour = new Date().getUTCHours();
    const allowedHours = GLOBAL_CONFIG.timeRestrictions.allowedHours;
    const isWeekend = this.isWeekend();

    // 開発・テストモードでは時間制限を緩和
    const mode = this.getCurrentMode();
    if (mode === 'mock') {
      return { allowed: true };
    }

    // 深夜時間帯チェック
    if (!allowedHours.includes(currentHour)) {
      const nextAllowedHour = this.getNextAllowedHour();
      const waitTime = this.calculateWaitTime(nextAllowedHour);

      return {
        allowed: false,
        reason: `外部アクセス許可時間外です (現在: ${currentHour}時 UTC)`,
        waitTime,
        suggestions: [
          `許可時間: ${allowedHours.join(', ')}時 (UTC)`,
          `次回許可時間まで: ${Math.round(waitTime / 3600000)}時間`,
          'モックモードでの動作確認をお勧めします'
        ]
      };
    }

    // 週末制限チェック
    if (GLOBAL_CONFIG.timeRestrictions.weekendOnly && !isWeekend) {
      return {
        allowed: false,
        reason: '週末のみ外部アクセスが許可されています',
        suggestions: ['週末に再実行してください', 'モックモードをご利用ください']
      };
    }

    return { allowed: true };
  }

  /**
   * 📊 レート制限チェック
   */
  private async checkRateLimit(source: string): Promise<SecurityCheckResult> {
    const endpoint = API_ENDPOINTS[source];
    if (!endpoint) return { allowed: false, reason: 'エンドポイントが見つかりません' };

    const now = Date.now();
    const sourceRequests = this.rateLimitTracker.get(source) || [];

    // 1分間のリクエスト数チェック
    const recentRequests = sourceRequests.filter(time => now - time < 60000);
    const requestsPerMinute = endpoint.rateLimit.requestsPerMinute;

    if (recentRequests.length >= requestsPerMinute) {
      const oldestRequest = Math.min(...recentRequests);
      const waitTime = 60000 - (now - oldestRequest);

      return {
        allowed: false,
        reason: `${source} のレート制限に達しました (${recentRequests.length}/${requestsPerMinute} req/min)`,
        waitTime,
        suggestions: [
          `${Math.round(waitTime / 1000)}秒後に再試行してください`,
          'リクエスト間隔を長くしてください',
          'バッチサイズを小さくしてください'
        ]
      };
    }

    // 1時間のリクエスト数チェック
    const hourlyRequests = sourceRequests.filter(time => now - time < 3600000);
    const requestsPerHour = endpoint.rateLimit.requestsPerHour;

    if (hourlyRequests.length >= requestsPerHour) {
      const waitTime = 3600000 - (now - Math.min(...hourlyRequests));

      return {
        allowed: false,
        reason: `${source} の時間あたりレート制限に達しました (${hourlyRequests.length}/${requestsPerHour} req/hour)`,
        waitTime,
        suggestions: [
          `${Math.round(waitTime / 60000)}分後に再試行してください`,
          '優先度の高いパーツのみに絞ってください'
        ]
      };
    }

    // バースト制限チェック
    const burstRequests = sourceRequests.filter(time => now - time < 10000); // 10秒以内
    const burstLimit = endpoint.rateLimit.burstLimit;

    if (burstRequests.length >= burstLimit) {
      const waitTime = 10000;

      return {
        allowed: false,
        reason: `${source} のバースト制限に達しました (${burstRequests.length}/${burstLimit} req/10s)`,
        waitTime,
        suggestions: [
          `${Math.round(waitTime / 1000)}秒後に再試行してください`,
          'リクエスト間隔を長くしてください'
        ]
      };
    }

    // レート制限警告（80%到達時）
    if (recentRequests.length >= requestsPerMinute * 0.8) {
      console.warn(`⚠️ ${source} レート制限警告: ${recentRequests.length}/${requestsPerMinute} req/min`);
    }

    return { allowed: true };
  }

  /**
   * ❌ エラー率チェック
   */
  private checkErrorRate(source: string): SecurityCheckResult {
    const errorInfo = this.errorTracker.get(source);
    const maxErrors = GLOBAL_CONFIG.errorHandling.maxConsecutiveErrors;
    const cooldownPeriod = GLOBAL_CONFIG.errorHandling.errorCooldown;

    if (!errorInfo) {
      return { allowed: true };
    }

    // 連続エラー数チェック
    if (errorInfo.count >= maxErrors) {
      const timeSinceLastError = Date.now() - errorInfo.lastError;
      
      if (timeSinceLastError < cooldownPeriod) {
        const waitTime = cooldownPeriod - timeSinceLastError;

        return {
          allowed: false,
          reason: `${source} で連続エラーが発生しています (${errorInfo.count}回)`,
          waitTime,
          suggestions: [
            `${Math.round(waitTime / 60000)}分後に再試行してください`,
            'ネットワーク接続を確認してください',
            'APIキーの有効性を確認してください',
            'モックモードでの動作確認をお勧めします'
          ]
        };
      }

      // クールダウン期間が過ぎたらエラーカウントリセット
      this.errorTracker.delete(source);
    }

    return { allowed: true };
  }

  /**
   * 🎫 セッション制限チェック
   */
  private checkSessionLimits(): SecurityCheckResult {
    const sessionInfo = this.sessionTracker.get(this.currentSessionId);
    const maxDuration = SECURITY_RULES.accessControl.maxSessionDuration;
    const maxRequests = SECURITY_RULES.globalRateLimit.perSession;

    if (!sessionInfo) {
      // 新しいセッションを作成
      this.sessionTracker.set(this.currentSessionId, {
        created: Date.now(),
        requestCount: 0
      });
      return { allowed: true };
    }

    // セッション継続時間チェック
    const sessionAge = Date.now() - sessionInfo.created;
    if (sessionAge > maxDuration) {
      return {
        allowed: false,
        reason: 'セッションの有効期限が切れました',
        suggestions: [
          'アプリケーションを再起動してください',
          '新しいセッションを開始してください'
        ]
      };
    }

    // セッション内リクエスト数チェック
    if (sessionInfo.requestCount >= maxRequests) {
      const waitTime = maxDuration - sessionAge;

      return {
        allowed: false,
        reason: `セッション内リクエスト制限に達しました (${sessionInfo.requestCount}/${maxRequests})`,
        waitTime,
        suggestions: [
          '新しいセッションを開始してください',
          'リクエスト数を削減してください'
        ]
      };
    }

    return { allowed: true };
  }

  /**
   * 🤖 robots.txt遵守チェック
   */
  private async checkRobotsCompliance(source: string): Promise<SecurityCheckResult> {
    const endpoint = API_ENDPOINTS[source];
    if (!endpoint || !endpoint.robotsTxt) {
      return { allowed: true };
    }

    // robots.txt確認済みかチェック
    if (!endpoint.robotsTxt.allowed) {
      return {
        allowed: false,
        reason: `${source} のrobots.txt確認が未完了です`,
        suggestions: [
          'robots.txt確認を実行してください',
          'API利用許可を確認してください',
          'モックモードをご利用ください'
        ]
      };
    }

    // 定期的なrobots.txt再確認（24時間ごと）
    const lastChecked = endpoint.robotsTxt.lastChecked 
      ? new Date(endpoint.robotsTxt.lastChecked).getTime()
      : 0;
    
    const timeSinceCheck = Date.now() - lastChecked;
    const checkInterval = endpoint.robotsTxt.checkInterval;

    if (timeSinceCheck > checkInterval) {
      console.log(`🤖 ${source} robots.txt再確認が必要です`);
      // TODO: 実際のrobots.txt確認実装
    }

    return { allowed: true };
  }

  /**
   * ⚡ サーバー負荷チェック
   */
  private checkServerLoad(priority: 'low' | 'medium' | 'high'): SecurityCheckResult {
    // 現在のリクエスト負荷を計算
    const allRequests = Array.from(this.rateLimitTracker.values())
      .flat()
      .filter(time => Date.now() - time < 60000);

    const currentLoad = allRequests.length;
    const maxLoad = SECURITY_RULES.globalRateLimit.perIP;

    // 負荷が高い場合は優先度に応じて制限
    if (currentLoad >= maxLoad * 0.8) { // 80%以上で制限開始
      if (priority === 'low') {
        return {
          allowed: false,
          reason: 'システム負荷が高いため低優先度リクエストを制限中',
          suggestions: [
            '優先度の高いパーツのみに絞ってください',
            '時間をおいて再試行してください'
          ]
        };
      }

      if (priority === 'medium' && currentLoad >= maxLoad * 0.9) {
        return {
          allowed: false,
          reason: 'システム負荷が非常に高いため中優先度リクエストを制限中',
          suggestions: [
            '最重要パーツのみに絞ってください',
            '時間をおいて再試行してください'
          ]
        };
      }
    }

    return { allowed: true };
  }

  /**
   * 🎭 BOT対策措置の生成
   */
  public generateBotPreventionMeasures(source: string): BotPreventionMeasures {
    const cached = this.botPreventionCache.get(source);
    const now = Date.now();

    // キャッシュされた措置が有効かチェック（1時間有効）
    if (cached && (now - parseInt(cached.sessionId)) < 3600000) {
      return cached;
    }

    const endpoint = API_ENDPOINTS[source];
    const config = GLOBAL_CONFIG.botPrevention;

    const measures: BotPreventionMeasures = {
      userAgent: endpoint?.security.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      referer: endpoint?.security.referer,
      acceptLanguage: endpoint?.security.acceptLanguage || 'ja-JP,ja;q=0.9,en;q=0.8',
      randomDelay: this.generateRandomDelay(config.randomDelayRange as [number, number]), // 🔧 型キャスト
      sessionId: this.currentSessionId,
      fingerprint: this.generateFingerprint(source)
    };

    // キャッシュに保存
    this.botPreventionCache.set(source, measures);

    return measures;
  }

  /**
   * 📝 API呼び出し記録
   */
  public recordApiCall(
    source: string,
    action: string,
    result: 'success' | 'failure' | 'blocked',
    partId?: string,
    responseTime?: number,
    reason?: string
  ): void {
    // レート制限追跡に記録
    if (result === 'success') {
      const requests = this.rateLimitTracker.get(source) || [];
      requests.push(Date.now());
      this.rateLimitTracker.set(source, requests);

      // セッション内リクエスト数更新
      const sessionInfo = this.sessionTracker.get(this.currentSessionId);
      if (sessionInfo) {
        sessionInfo.requestCount++;
      }
    }

    // エラー追跡に記録
    if (result === 'failure') {
      const errorInfo = this.errorTracker.get(source) || { count: 0, lastError: 0 };
      errorInfo.count++;
      errorInfo.lastError = Date.now();
      this.errorTracker.set(source, errorInfo);
    } else if (result === 'success') {
      // 成功時はエラーカウントリセット
      this.errorTracker.delete(source);
    }

    // 監査ログに記録
    const logEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      source,
      action,
      partId,
      result,
      reason,
      responseTime,
      ipAddress: this.getClientIP(),
      userAgent: this.botPreventionCache.get(source)?.userAgent
    };

    this.auditLog.push(logEntry);

    // ログサイズ制限（最新1000件のみ保持）
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }

    // 重要なイベントをコンソールに出力
    if (result === 'blocked' || (result === 'failure' && this.errorTracker.get(source)?.count === 1)) {
      console.log(`📝 API呼び出し記録: ${source} - ${result} ${reason ? `(${reason})` : ''}`);
    }
  }

  /**
   * 📊 レート制限状況取得
   */
  public getRateLimitStatus(source?: string): RateLimitStatus[] {
    const sources = source ? [source] : Object.keys(API_ENDPOINTS);
    const now = Date.now();

    return sources.map(src => {
      const endpoint = API_ENDPOINTS[src];
      const requests = this.rateLimitTracker.get(src) || [];
      
      const requestsInLastMinute = requests.filter(time => now - time < 60000).length;
      const requestsInLastHour = requests.filter(time => now - time < 3600000).length;
      
      const isNearLimit = requestsInLastMinute >= (endpoint?.rateLimit.requestsPerMinute || 0) * 0.8;
      
      let nextAvailableTime: number | undefined;
      if (requestsInLastMinute >= (endpoint?.rateLimit.requestsPerMinute || 0)) {
        const oldestRequest = Math.min(...requests.filter(time => now - time < 60000));
        nextAvailableTime = oldestRequest + 60000;
      }

      return {
        source: src,
        requestsInLastMinute,
        requestsInLastHour,
        isNearLimit,
        nextAvailableTime
      };
    });
  }

  /**
   * 🔍 監査ログ取得
   */
  public getAuditLog(
    limit: number = 100,
    source?: string,
    result?: 'success' | 'failure' | 'blocked'
  ): AuditLogEntry[] {
    let filteredLog = this.auditLog;

    if (source) {
      filteredLog = filteredLog.filter(entry => entry.source === source);
    }

    if (result) {
      filteredLog = filteredLog.filter(entry => entry.result === result);
    }

    return filteredLog.slice(-limit).reverse(); // 最新から表示
  }

  /**
   * 🧹 セキュリティ状態リセット
   */
  public resetSecurityState(): void {
    this.rateLimitTracker.clear();
    this.errorTracker.clear();
    this.sessionTracker.clear();
    this.auditLog = [];
    this.botPreventionCache.clear();
    this.currentSessionId = this.generateSessionId();

    console.log(`🧹 セキュリティ状態リセット完了`);
  }

  // ヘルパーメソッド群

  private initializeSecurityMeasures(): void {
    // 定期的なクリーンアップ（1時間ごと）
    setInterval(() => {
      this.cleanupOldData();
    }, 3600000);

    console.log(`🛡️ セキュリティシステム初期化完了: セッション ${this.currentSessionId}`);
  }

  private cleanupOldData(): void {
    const now = Date.now();
    
    // 古いレート制限データクリーンアップ
    for (const [source, requests] of this.rateLimitTracker.entries()) {
      const recentRequests = requests.filter(time => now - time < 3600000);
      if (recentRequests.length === 0) {
        this.rateLimitTracker.delete(source);
      } else {
        this.rateLimitTracker.set(source, recentRequests);
      }
    }

    // 古いエラーデータクリーンアップ
    for (const [source, errorInfo] of this.errorTracker.entries()) {
      if (now - errorInfo.lastError > 3600000) { // 1時間経過
        this.errorTracker.delete(source);
      }
    }

    console.log(`🧹 セキュリティデータクリーンアップ完了`);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFingerprint(source: string): string {
    const components = [
      source,
      this.currentSessionId,
      Date.now().toString(),
      Math.random().toString()
    ];
    
    return btoa(components.join('|')).substr(0, 16);
  }

  private generateRandomDelay(range: [number, number]): number {
    const [min, max] = range;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private getCurrentMode(): string {
    return process.env.NODE_ENV === 'production' 
      ? GLOBAL_CONFIG.operationModes.production
      : GLOBAL_CONFIG.operationModes.development;
  }

  private isWeekend(): boolean {
    const day = new Date().getDay();
    return day === 0 || day === 6; // 日曜日または土曜日
  }

  private getNextAllowedHour(): number {
    const allowedHours = GLOBAL_CONFIG.timeRestrictions.allowedHours;
    const currentHour = new Date().getUTCHours();
    
    // 今日の残りの許可時間を探す
    for (const hour of allowedHours) {
      if (hour > currentHour) {
        return hour;
      }
    }
    
    // 今日に許可時間がない場合は翌日の最初の許可時間
    return allowedHours[0] + 24;
  }

  private calculateWaitTime(nextAllowedHour: number): number {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const hoursToWait = nextAllowedHour - currentHour;
    const minutesToWait = 60 - now.getUTCMinutes();
    
    return (hoursToWait - 1) * 3600000 + minutesToWait * 60000;
  }

  private getClientIP(): string {
    // ブラウザ環境では実際のIPは取得できないのでプレースホルダー
    return '127.0.0.1';
  }

  /**
   * 📊 セキュリティ統計取得
   */
  public getSecurityStats(): {
    activeSessions: number;
    totalRequests: number;
    errorRate: number;
    blockedRequests: number;
    topSources: Array<{ source: string; requests: number }>;
  } {
    const totalRequests = this.auditLog.filter(entry => entry.result === 'success').length;
    const totalErrors = this.auditLog.filter(entry => entry.result === 'failure').length;
    const blockedRequests = this.auditLog.filter(entry => entry.result === 'blocked').length;
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

    // ソース別リクエスト数
    const sourceCount = new Map<string, number>();
    for (const entry of this.auditLog) {
      sourceCount.set(entry.source, (sourceCount.get(entry.source) || 0) + 1);
    }

    const topSources = Array.from(sourceCount.entries())
      .map(([source, requests]) => ({ source, requests }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 5);

    return {
      activeSessions: this.sessionTracker.size,
      totalRequests,
      errorRate: Math.round(errorRate * 100) / 100,
      blockedRequests,
      topSources
    };
  }
}

export default ApiSecurity;