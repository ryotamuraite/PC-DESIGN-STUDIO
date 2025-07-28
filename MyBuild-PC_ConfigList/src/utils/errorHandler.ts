// src/utils/errorHandler.ts
// グローバルエラーハンドリングシステム

import { NotificationManager } from './notificationHelpers';

export interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  stack?: string;
  component?: string;
  action?: string;
  userId?: string;
}

export type ErrorType =
  | 'network'
  | 'validation'
  | 'api'
  | 'storage'
  | 'computation'
  | 'permission'
  | 'timeout'
  | 'unknown';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  additionalData?: Record<string, unknown>;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: AppError[] = [];
  private maxQueueSize = 100;
  private notificationManager = NotificationManager.getInstance();

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * エラーを処理
   */
  public handleError(
    error: Error | string,
    type: ErrorType = 'unknown',
    severity: ErrorSeverity = 'medium',
    context?: ErrorContext
  ): AppError {
    const appError = this.createAppError(error, type, severity, context);
    
    // エラーログ出力
    this.logError(appError);
    
    // エラーキューに追加
    this.addToQueue(appError);
    
    // 通知表示
    this.showNotification(appError);
    
    // 重要度が高い場合の追加処理
    if (severity === 'critical') {
      this.handleCriticalError(appError);
    }
    
    return appError;
  }

  /**
   * ネットワークエラー専用ハンドラー
   */
  public handleNetworkError(error: Error, context?: ErrorContext): AppError {
    const isOffline = !navigator.onLine;
    const isTimeout = error.message.includes('timeout') || error.message.includes('TIMEOUT');
    
    let severity: ErrorSeverity = 'medium';
    if (isOffline) {
      severity = 'high';
      // オフライン時はエラーメッセージを上書き
    } else if (isTimeout) {
      severity = 'medium';
      // タイムアウト時はエラーメッセージを上書き
    }
    
    return this.handleError(error, 'network', severity, {
      ...context,
      additionalData: {
        isOffline,
        isTimeout,
        connectionType: (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType || 'unknown'
      }
    });
  }

  /**
   * API エラー専用ハンドラー
   */
  public handleApiError(
    response: Response | Error, 
    endpoint: string, 
    context?: ErrorContext
  ): AppError {
    let message = 'API エラーが発生しました';
    let severity: ErrorSeverity = 'medium';
    let details: Record<string, unknown> = { endpoint };
    
    if (response instanceof Response) {
      message = `API エラー: ${response.status} ${response.statusText}`;
      severity = response.status >= 500 ? 'high' : 'medium';
      details = {
        ...details,
        status: response.status,
        statusText: response.statusText,
        url: response.url
      };
    } else {
      message = response.message || 'API 通信エラー';
      details = { ...details, originalError: response.message };
    }
    
    return this.handleError(message, 'api', severity, {
      ...context,
      additionalData: details
    });
  }

  /**
   * バリデーションエラー専用ハンドラー
   */
  public handleValidationError(
    field: string, 
    value: unknown, 
    rule: string, 
    context?: ErrorContext
  ): AppError {
    const message = `入力検証エラー: ${field}`;
    
    return this.handleError(message, 'validation', 'low', {
      ...context,
      additionalData: {
        field,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        rule
      }
    });
  }

  /**
   * 非同期処理エラー専用ハンドラー
   */
  public async handleAsyncError<T>(
    asyncOperation: () => Promise<T>,
    operationName: string,
    context?: ErrorContext
  ): Promise<T | null> {
    try {
      return await asyncOperation();
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'computation',
        'medium',
        {
          ...context,
          action: operationName
        }
      );
      return null;
    }
  }

  /**
   * AppError オブジェクト作成
   */
  private createAppError(
    error: Error | string,
    type: ErrorType,
    severity: ErrorSeverity,
    context?: ErrorContext
  ): AppError {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    return {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message: errorObj.message,
      details: context?.additionalData || {},
      timestamp: new Date(),
      stack: errorObj.stack,
      component: context?.component,
      action: context?.action,
      userId: context?.userId
    };
  }

  /**
   * エラーログ出力
   */
  private logError(error: AppError): void {
    const logLevel = {
      low: 'info',
      medium: 'warn',
      high: 'error',
      critical: 'error'
    }[error.severity] as 'info' | 'warn' | 'error';
    
    const logMessage = `[${error.type.toUpperCase()}] ${error.message}`;
    const logDetails = {
      id: error.id,
      component: error.component,
      action: error.action,
      details: error.details,
      timestamp: error.timestamp.toISOString()
    };
    
    console[logLevel](logMessage, logDetails);
    
    // 開発環境ではスタックトレースも出力
    if (process.env.NODE_ENV === 'development' && error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }

  /**
   * エラーキューに追加
   */
  private addToQueue(error: AppError): void {
    this.errorQueue.unshift(error);
    
    // キューサイズ制限
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(0, this.maxQueueSize);
    }
  }

  /**
   * 通知表示
   */
  private showNotification(error: AppError): void {
    const notificationType = {
      low: 'info' as const,
      medium: 'warning' as const,
      high: 'error' as const,
      critical: 'error' as const
    }[error.severity];
    
    // 短時間に同じエラーが複数回発生した場合は通知を抑制
    const recentSimilarErrors = this.errorQueue.filter(e => 
      e.type === error.type && 
      e.component === error.component &&
      Date.now() - e.timestamp.getTime() < 5000 // 5秒以内
    );
    
    if (recentSimilarErrors.length <= 1) {
      this.notificationManager.addNotification({
        id: error.id,
        type: notificationType,
        title: this.getErrorTitle(error),
        message: error.message,
        timestamp: error.timestamp,
        category: 'エラー',
        autoHide: error.severity === 'low'
      });
    }
  }

  /**
   * クリティカルエラーの追加処理
   */
  private handleCriticalError(error: AppError): void {
    // クリティカルエラー時の緊急処理
    console.error('🚨 CRITICAL ERROR DETECTED:', error);
    
    // セッションデータの保存
    this.saveEmergencySession();
    
    // エラーレポートの準備
    this.prepareErrorReport(error);
  }

  /**
   * エラータイトル生成
   */
  private getErrorTitle(error: AppError): string {
    const titles = {
      network: 'ネットワークエラー',
      validation: '入力エラー',
      api: 'APIエラー',
      storage: 'データ保存エラー',
      computation: '処理エラー',
      permission: '権限エラー',
      timeout: 'タイムアウトエラー',
      unknown: 'エラーが発生しました'
    };
    
    return titles[error.type] || titles.unknown;
  }

  /**
   * 緊急セッション保存
   */
  private saveEmergencySession(): void {
    try {
      const emergencyData = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        errors: this.errorQueue.slice(0, 10) // 最新10件のエラー
      };
      
      localStorage.setItem('emergency_session', JSON.stringify(emergencyData));
    } catch (err) {
      console.error('緊急セッション保存失敗:', err);
    }
  }

  /**
   * エラーレポート準備
   */
  private prepareErrorReport(error: AppError): void {
    const report = {
      error,
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      },
      recentErrors: this.errorQueue.slice(0, 5)
    };
    
    // 開発環境では詳細レポートをコンソールに出力
    if (process.env.NODE_ENV === 'development') {
      console.error('📊 ERROR REPORT:', report);
    }
    
    // 本番環境では外部サービスに送信（実装予定）
    // this.sendErrorReport(report);
  }

  /**
   * エラーキュー取得
   */
  public getErrorQueue(): AppError[] {
    return [...this.errorQueue];
  }

  /**
   * エラーキュークリア
   */
  public clearErrorQueue(): void {
    this.errorQueue = [];
  }

  /**
   * エラー統計取得
   */
  public getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recentCount: number;
  } {
    const now = Date.now();
    const recentThreshold = 60 * 60 * 1000; // 1時間
    
    const byType = this.errorQueue.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<ErrorType, number>);
    
    const bySeverity = this.errorQueue.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<ErrorSeverity, number>);
    
    const recentCount = this.errorQueue.filter(error => 
      now - error.timestamp.getTime() < recentThreshold
    ).length;
    
    return {
      total: this.errorQueue.length,
      byType,
      bySeverity,
      recentCount
    };
  }
}

// グローバルエラーハンドラーをセットアップ
export const setupGlobalErrorHandler = (): void => {
  const errorHandler = ErrorHandler.getInstance();
  
  // キャッチされなかったエラー
  window.addEventListener('error', (event) => {
    errorHandler.handleError(
      event.error || new Error(event.message),
      'unknown',
      'high',
      {
        component: 'Global',
        action: 'uncaught-error',
        additionalData: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      }
    );
  });
  
  // キャッチされなかったPromise rejection
  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      'unknown',
      'high',
      {
        component: 'Global',
        action: 'unhandled-promise-rejection'
      }
    );
  });
  
  // ネットワーク状態変化の監視
  window.addEventListener('online', () => {
    NotificationManager.getInstance().success(
      'ネットワーク復旧',
      'インターネット接続が復旧しました',
      'ネットワーク'
    );
  });
  
  window.addEventListener('offline', () => {
    NotificationManager.getInstance().warning(
      'ネットワーク切断',
      'インターネット接続が切断されました',
      'ネットワーク'
    );
  });
};

export default ErrorHandler;
