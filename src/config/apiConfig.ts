// src/config/apiConfig.ts
// 外部API統合設定 - BOT対策・レート制限最優先

export interface ApiEndpoint {
  name: string;
  baseUrl: string;
  apiKey?: string;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    burstLimit: number;
    delayBetweenRequests: number;
  };
  security: {
    userAgent: string;
    referer?: string;
    acceptLanguage: string;
    timeout: number;
    maxRetries: number;
    retryDelay: number;
  };
  robotsTxt: {
    url: string;
    lastChecked?: string;
    allowed: boolean;
    checkInterval: number; // 24時間ごとにチェック
  };
}

export interface ApiKeyConfig {
  key: string;
  lastRotated: string;
  usageCount: number;
  dailyLimit: number;
  status: 'active' | 'suspended' | 'expired';
}

// 🛡️ 外部API設定 - 安全性最優先
export const API_ENDPOINTS: Record<string, ApiEndpoint> = {
  // 価格.com API（慎重に実装予定）
  kakaku: {
    name: '価格.com',
    baseUrl: process.env.VITE_KAKAKU_API_URL || 'https://api.kakaku.com/v1',
    rateLimit: {
      requestsPerMinute: 20,      // 非常に控えめ
      requestsPerHour: 200,       // 1時間200回以下
      burstLimit: 3,              // 連続3回まで
      delayBetweenRequests: 3000, // 3秒間隔
    },
    security: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      referer: 'https://kakaku.com/',
      acceptLanguage: 'ja-JP,ja;q=0.9,en;q=0.8',
      timeout: 15000,             // 15秒タイムアウト
      maxRetries: 2,              // 最大2回リトライ
      retryDelay: 5000,           // 5秒待機
    },
    robotsTxt: {
      url: 'https://kakaku.com/robots.txt',
      allowed: false,             // 事前確認まで無効化
      checkInterval: 24 * 60 * 60 * 1000, // 24時間
    }
  },

  // Amazon Product Advertising API
  amazon: {
    name: 'Amazon PA-API',
    baseUrl: process.env.VITE_AMAZON_API_URL || 'https://webservices.amazon.co.jp/paapi5',
    rateLimit: {
      requestsPerMinute: 8,       // Amazon公式制限より控えめ
      requestsPerHour: 100,
      burstLimit: 2,
      delayBetweenRequests: 8000, // 8秒間隔
    },
    security: {
      userAgent: 'MyBuildPCConfig/1.0 (https://your-domain.com; contact@your-domain.com)',
      acceptLanguage: 'ja-JP,ja;q=0.9',
      timeout: 20000,             // Amazon APIは少し遅い場合がある
      maxRetries: 3,
      retryDelay: 10000,          // 10秒待機
    },
    robotsTxt: {
      url: 'https://amazon.co.jp/robots.txt',
      allowed: true,              // PA-APIは許可されている
      checkInterval: 24 * 60 * 60 * 1000,
    }
  },

  // 楽天API
  rakuten: {
    name: '楽天API',
    baseUrl: process.env.VITE_RAKUTEN_API_URL || 'https://app.rakuten.co.jp/services/api',
    rateLimit: {
      requestsPerMinute: 15,
      requestsPerHour: 300,       // 楽天の公式制限
      burstLimit: 3,
      delayBetweenRequests: 4000, // 4秒間隔
    },
    security: {
      userAgent: 'MyBuildPCConfig/1.0 (PC構成支援ツール)',
      acceptLanguage: 'ja-JP,ja;q=0.9',
      timeout: 12000,
      maxRetries: 2,
      retryDelay: 3000,
    },
    robotsTxt: {
      url: 'https://rakuten.co.jp/robots.txt',
      allowed: true,              // API利用は許可されている
      checkInterval: 24 * 60 * 60 * 1000,
    }
  },

  // ヨドバシ.com（スクレイピング用 - 将来実装）
  yodobashi: {
    name: 'ヨドバシ.com',
    baseUrl: 'https://www.yodobashi.com',
    rateLimit: {
      requestsPerMinute: 6,       // 非常に控えめ
      requestsPerHour: 50,
      burstLimit: 1,              // 1つずつ
      delayBetweenRequests: 10000, // 10秒間隔
    },
    security: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      referer: 'https://www.google.com/',
      acceptLanguage: 'ja-JP,ja;q=0.9,en;q=0.8',
      timeout: 30000,             // 長めのタイムアウト
      maxRetries: 1,              // スクレイピングはリトライ少なめ
      retryDelay: 15000,          // 長めの待機
    },
    robotsTxt: {
      url: 'https://www.yodobashi.com/robots.txt',
      allowed: false,             // 事前確認必要
      checkInterval: 24 * 60 * 60 * 1000,
    }
  }
};

// 🔐 APIキー管理
export const API_KEYS: Record<string, ApiKeyConfig> = {
  kakaku: {
    key: process.env.VITE_KAKAKU_API_KEY || '',
    lastRotated: new Date().toISOString(),
    usageCount: 0,
    dailyLimit: 1000,
    status: 'active'
  },
  amazon: {
    key: process.env.VITE_AMAZON_ACCESS_KEY || '',
    lastRotated: new Date().toISOString(),
    usageCount: 0,
    dailyLimit: 8640, // Amazon PA-API 公式制限
    status: 'active'
  },
  rakuten: {
    key: process.env.VITE_RAKUTEN_APP_ID || '',
    lastRotated: new Date().toISOString(),
    usageCount: 0,
    dailyLimit: 5000, // 楽天API制限
    status: 'active'
  }
};

// 🌐 グローバル設定
export const GLOBAL_CONFIG = {
  // BOT対策
  botPrevention: {
    randomDelayRange: [500, 2000],    // 0.5-2秒のランダム遅延
    sessionRotation: 3600000,         // 1時間ごとにセッション情報変更
    respectRobotsTxt: true,           // robots.txt必須遵守
    identifyAsBot: false,             // BOTとして識別されない
  },

  // 時間制御
  timeRestrictions: {
    allowedHours: [2, 3, 4, 5],       // 深夜2-5時のみ本格外部アクセス
    weekendOnly: false,               // 平日も許可（深夜なら）
    holidayCheck: true,               // 祝日チェック
  },

  // モード設定
  operationModes: {
    development: 'mock',              // 開発時はモック
    testing: 'limited',               // テスト時は制限付き
    production: 'careful',            // 本番は慎重モード
  },

  // エラーハンドリング
  errorHandling: {
    maxConsecutiveErrors: 5,          // 連続エラー5回で停止
    errorCooldown: 300000,            // 5分間のクールダウン
    logLevel: 'info',                 // ログレベル
    notifyOnError: true,              // エラー通知
  },

  // データ品質
  dataQuality: {
    priceVariationThreshold: 0.3,     // 30%以上の価格変動は要確認
    stockCheckInterval: 3600000,      // 1時間ごと
    newProductCheckInterval: 86400000, // 24時間ごと
  }
};

// 🛡️ セキュリティルール
export const SECURITY_RULES = {
  // アクセス制限
  accessControl: {
    whitelist: ['127.0.0.1', 'localhost'],
    blacklist: [],
    requireAuth: false,
    maxSessionDuration: 3600000,      // 1時間
  },

  // データ保護
  dataProtection: {
    encryptApiKeys: true,
    anonymizeUserData: true,
    retentionPeriod: 7776000000,      // 90日間
    auditLog: true,
  },

  // レート制限
  globalRateLimit: {
    perIP: 100,                       // IP当たり100req/hour
    perSession: 50,                   // セッション当たり50req/hour
    burstProtection: true,
  }
};

// 🔍 監視・メトリクス
export const MONITORING_CONFIG = {
  metrics: {
    trackRequestCount: true,
    trackResponseTime: true,
    trackErrorRate: true,
    trackRateLimitHits: true,
  },
  
  alerts: {
    highErrorRate: 0.1,               // 10%以上のエラー率で警告
    slowResponse: 5000,               // 5秒以上で警告
    rateLimitNear: 0.8,               // 制限の80%で警告
  },

  logging: {
    level: 'info',
    includeRequestDetails: false,     // プライバシー保護
    includeResponseData: false,       // データ保護
    rotateDaily: true,
  }
};

export default {
  API_ENDPOINTS,
  API_KEYS,
  GLOBAL_CONFIG,
  SECURITY_RULES,
  MONITORING_CONFIG
};