// src/types/api.ts
// 外部API型定義 - Phase2完全版

// ==============================================
// 🎯 既存ApiEndpoint型をインポート（型統一）
// ==============================================

// 既存のApiEndpoint型を再エクスポート
export type { ApiEndpoint } from '../config/apiConfig';

// ==============================================
// 🌟 Amazon PA-API型定義
// ==============================================

export interface AmazonAPIPayload {
  Keywords: string;
  SearchIndex: string;
  ItemCount: number;
  Resources: string[];
  PartnerTag: string;
  PartnerType: string;
  Marketplace: string;
}

export interface AmazonAPIResponse {
  SearchResult: {
    Items: AmazonItem[];
  };
}

export interface AmazonItem {
  ASIN: string;
  ItemInfo: {
    Title: {
      DisplayValue: string;
    };
    Features?: {
      DisplayValues: string[];
    };
  };
  Offers: {
    Listings: Array<{
      Price: {
        Amount: number;
        Currency: string;
      };
      Availability: {
        Message: string;
      };
    }>;
  };
  Images?: {
    Primary: {
      Medium: {
        URL: string;
        Height: number;
        Width: number;
      };
    };
  };
}

export interface AmazonMatchResult {
  price: number;
  url: string;
  availability: 'in_stock' | 'limited' | 'out_of_stock';
  shippingCost: number;
  shippingDays: number;
}

// ==============================================
// 🏪 楽天API型定義  
// ==============================================

export interface RakutenAPIResponse {
  Items: Array<{
    Item: RakutenItemDetail;
  }>;
  count: number;
  page: number;
  first: number;
  last: number;
  hits: number;
  pageCount: number;
}

export interface RakutenItemDetail {
  itemName: string;
  itemPrice: number;
  itemUrl: string;
  availability: number;
  postageFlag: number;
  shopName: string;
  reviewAverage: number;
  reviewCount: number;
  itemCode: string;
  genreId: string;
  imageFlag: number;
  taxFlag: number;
  affiliateUrl: string;
  shopCode: string;
  shopUrl: string;
}

export interface RakutenItem {
  Item: RakutenItemDetail;
}

export interface RakutenMatchResult {
  price: number;
  url: string;
  availability: 'in_stock' | 'out_of_stock';
  shippingCost: number;
  shippingDays: number;
}

// ==============================================
// 💰 価格.com API型定義
// ==============================================

export interface KakakuAPIResponse {
  products: KakakuProduct[];
  totalCount: number;
  page: number;
  resultsPerPage: number;
}

export interface KakakuProduct {
  id: string;
  name: string;
  price: number;
  url: string;
  shop: string;
  stock: boolean;
  rating: number;
  reviewCount: number;
  category?: string;
  brand?: string;
  model?: string;
  specifications?: Record<string, string>;
}

export interface KakakuMatchResult {
  price: number;
  url: string;
  availability: 'in_stock' | 'out_of_stock';
  shippingCost: number;
  shippingDays: number;
}

// ==============================================
// 🔧 ヘルパー型定義
// ==============================================

export type ApiProvider = 'amazon' | 'rakuten' | 'kakaku';

export interface ApiCallResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  retryAfter?: number;
}

export interface ApiRateLimitInfo {
  remaining: number;
  resetTime: number;
  totalRequests: number;
}

// ==============================================
// 🛡️ セキュリティ関連型定義
// ==============================================

export interface ApiSecurityConfig {
  userAgent: string;
  maxRetries: number;
  timeoutMs: number;
  respectRobotsTxt: boolean;
  delayBetweenRequests: number;
  maxConcurrentRequests: number;
}

// ==============================================
// 📊 エラーハンドリング型定義
// ==============================================

export interface ApiError {
  provider: ApiProvider;
  endpoint: string;
  statusCode: number;
  message: string;
  timestamp: string;
  retryable: boolean;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
