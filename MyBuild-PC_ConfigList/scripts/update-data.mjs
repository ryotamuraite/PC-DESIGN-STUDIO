#!/usr/bin/env node

/**
 * PCデータ自動更新スクリプト (JavaScript版)
 * 外部アクセスを慎重に実装 - BOT対策・負荷軽減重視
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// ESModules対応
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🛡️ 安全な外部アクセス設定
const SAFETY_CONFIG = {
  // レート制限（外部サイト配慮）
  rateLimit: {
    requestsPerMinute: 30,        // 1分間に30リクエスト以下
    requestsPerHour: 300,         // 1時間に300リクエスト以下
    burstLimit: 5,                // 連続5リクエスト以下
    delayBetweenRequests: 2000,   // リクエスト間隔: 2秒
    delayBetweenBursts: 10000,    // バースト間隔: 10秒
  },
  
  // BOT対策
  botPrevention: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    acceptLanguage: 'ja-JP,ja;q=0.9,en;q=0.8',
    referer: '',
    sessionVariation: true,       // セッション毎に微調整
  },
  
  // タイムアウト・リトライ
  reliability: {
    timeout: 15000,               // 15秒タイムアウト
    maxRetries: 3,
    retryDelay: 5000,
    backoffMultiplier: 2,
  }
};

class SafeDataUpdater {
  constructor(options) {
    this.options = options;
    this.requestCount = 0;
    this.requestTimes = [];
    this.startTime = Date.now();
    
    this.logSafety('🚀 データ更新開始', {
      mode: options.mode,
      type: options.type,
      dryRun: options.dryRun
    });
  }

  /**
   * メイン更新処理
   */
  async update() {
    const result = {
      success: false,
      dataType: this.options.type,
      mode: this.options.mode,
      totalItems: 0,
      updatedItems: 0,
      errors: [],
      duration: 0,
      timestamp: new Date().toISOString()
    };

    try {
      // 🛡️ 安全性事前チェック
      await this.performSafetyChecks();

      // 📊 データタイプ別更新実行
      switch (this.options.type) {
        case 'prices':
          await this.updatePrices(result);
          break;
        case 'stock':
          await this.updateStock(result);
          break;
        case 'new_products':
          await this.updateNewProducts(result);
          break;
        case 'all':
          await this.updateAll(result);
          break;
      }

      result.success = result.errors.length === 0;
      result.duration = Date.now() - this.startTime;

      this.logSafety('✅ 更新完了', result);

    } catch (error) {
      result.errors.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.logSafety('❌ 更新失敗', { error: error instanceof Error ? error.message : 'Unknown' });
    }

    // 📊 結果保存
    if (!this.options.dryRun) {
      await this.saveResults(result);
    }

    return result;
  }

  /**
   * 🛡️ 安全性事前チェック
   */
  async performSafetyChecks() {
    this.logSafety('🔍 安全性チェック開始');

    // 実行時間チェック
    const currentHour = new Date().getUTCHours();
    if (this.options.mode !== 'mock' && currentHour >= 8 && currentHour <= 18) {
      this.logSafety('⚠️ 平日昼間の外部アクセスを検出');
      
      if (this.options.mode === 'full') {
        throw new Error('平日昼間の本格外部アクセスは制限されています');
      }
    }

    // 外部アクセス時の追加チェック
    if (this.options.mode !== 'mock') {
      this.logSafety('🌐 外部アクセスモード - 慎重な設定確認');
      
      // robots.txt確認（モック）
      await this.checkRobotsTxt();
      
      // レート制限準備
      this.setupRateLimit();
    }

    this.logSafety('✅ 安全性チェック完了');
  }

  /**
   * 💰 価格情報更新
   */
  async updatePrices(result) {
    this.logSafety('💰 価格情報更新開始');

    const mockParts = await this.loadMockPartsData();
    result.totalItems = mockParts.length;

    for (const part of mockParts) {
      try {
        const priceUpdate = await this.fetchPartPrice(part);
        
        if (priceUpdate && !this.options.dryRun) {
          // データファイル更新
          await this.updatePartData(part.id, { price: priceUpdate.newPrice });
          result.updatedItems++;
        }

        // 🛡️ 安全な間隔制御
        await this.safeDelay();

      } catch (error) {
        const errorMsg = `Price update failed for ${part.id}: ${error instanceof Error ? error.message : 'Unknown'}`;
        result.errors.push(errorMsg);
        this.logSafety('⚠️ 価格更新エラー', { partId: part.id, error: errorMsg });
      }
    }

    this.logSafety('💰 価格情報更新完了', { 
      updated: result.updatedItems, 
      total: result.totalItems 
    });
  }

  /**
   * 📦 在庫情報更新
   */
  async updateStock(result) {
    this.logSafety('📦 在庫情報更新開始');

    // モック実装（段階的に実外部API対応）
    const mockUpdates = this.generateMockStockUpdates();
    result.totalItems = mockUpdates.length;
    result.updatedItems = mockUpdates.length;

    if (!this.options.dryRun) {
      await this.saveStockData(mockUpdates);
    }

    this.logSafety('📦 在庫情報更新完了');
  }

  /**
   * 🆕 新製品情報更新
   */
  async updateNewProducts(result) {
    this.logSafety('🆕 新製品情報更新開始');

    // モック実装
    const newProducts = this.generateMockNewProducts();
    result.totalItems = newProducts.length;
    result.updatedItems = newProducts.length;

    if (!this.options.dryRun) {
      await this.saveNewProductsData(newProducts);
    }

    this.logSafety('🆕 新製品情報更新完了');
  }

  /**
   * 🔄 全データ更新
   */
  async updateAll(result) {
    this.logSafety('🔄 全データ更新開始');

    const subResults = {
      prices: { ...result },
      stock: { ...result },
      newProducts: { ...result }
    };

    await this.updatePrices(subResults.prices);
    await this.updateStock(subResults.stock);
    await this.updateNewProducts(subResults.newProducts);

    // 結果統合
    result.totalItems = subResults.prices.totalItems + subResults.stock.totalItems + subResults.newProducts.totalItems;
    result.updatedItems = subResults.prices.updatedItems + subResults.stock.updatedItems + subResults.newProducts.updatedItems;
    result.errors = [...subResults.prices.errors, ...subResults.stock.errors, ...subResults.newProducts.errors];

    this.logSafety('🔄 全データ更新完了');
  }

  /**
   * 🛡️ 外部API安全アクセス
   */
  async fetchPartPrice(part) {
    if (this.options.mode === 'mock') {
      // モック実装
      const variation = (Math.random() - 0.5) * 0.1;
      const newPrice = Math.round(part.price * (1 + variation));
      
      return newPrice !== part.price ? {
        partId: part.id,
        oldPrice: part.price,
        newPrice,
        source: 'mock'
      } : null;
    }

    // 実外部API実装（慎重に段階実装）
    if (this.options.mode === 'limited' || this.options.mode === 'full') {
      this.logSafety('🌐 外部API呼び出し準備', { partId: part.id });
      
      // TODO: 実際のAPI呼び出し実装
      // - 適切なUser-Agent設定
      // - レート制限遵守
      // - エラーハンドリング
      
      throw new Error('外部API実装は次段階で実装予定');
    }

    return null;
  }

  /**
   * ⏱️ 安全な遅延制御
   */
  async safeDelay() {
    if (this.options.mode === 'mock') {
      // モックは短い間隔
      await this.delay(100);
      return;
    }

    // 外部アクセス時の慎重な間隔制御
    const baseDelay = SAFETY_CONFIG.rateLimit.delayBetweenRequests;
    const randomVariation = Math.random() * 1000; // 0-1秒のランダム
    const totalDelay = baseDelay + randomVariation;

    this.logSafety('⏱️ 安全な間隔制御', { delay: totalDelay });
    await this.delay(totalDelay);
  }

  /**
   * 🤖 robots.txt確認（モック）
   */
  async checkRobotsTxt() {
    this.logSafety('🤖 robots.txt確認');
    
    // TODO: 実際のrobots.txt確認実装
    // 各対象サイトのrobots.txtを確認し、BOT許可状況をチェック
    
    this.logSafety('✅ robots.txt確認完了（モック）');
  }

  /**
   * 📊 レート制限設定
   */
  setupRateLimit() {
    this.requestTimes = [];
    this.requestCount = 0;
    this.logSafety('📊 レート制限初期化');
  }

  /**
   * 📁 モックデータ読み込み
   */
  async loadMockPartsData() {
    // 実際のデータファイルから読み込み（またはモック生成）
    return [
      { id: 'cpu-001', name: 'Intel Core i5-13400F', price: 32000, category: 'cpu' },
      { id: 'cpu-002', name: 'AMD Ryzen 5 7600X', price: 35000, category: 'cpu' },
      { id: 'gpu-001', name: 'RTX 4060', price: 45000, category: 'gpu' },
      { id: 'mb-001', name: 'ASUS PRIME B550M-A', price: 12000, category: 'motherboard' },
      { id: 'ram-001', name: 'Corsair Vengeance 16GB', price: 8000, category: 'memory' }
    ];
  }

  /**
   * 💾 部品データ更新
   */
  async updatePartData(partId, updates) {
    this.logSafety('💾 部品データ更新', { partId, updates });
    
    if (!this.options.dryRun) {
      // TODO: 実際のデータファイル更新実装
      const dataPath = path.join(__dirname, '../data/parts-data.json');
      
      try {
        // 簡単なJSONファイル更新のモック
        const timestamp = new Date().toISOString();
        const updateRecord = {
          partId,
          updates,
          timestamp,
          source: this.options.mode
        };
        
        this.logSafety('💾 データ更新記録', updateRecord);
      } catch (error) {
        this.logSafety('❌ データ更新失敗', { partId, error });
      }
    }
  }

  /**
   * 📊 結果保存
   */
  async saveResults(result) {
    const resultsPath = path.join(__dirname, '../data/update-results.json');
    
    try {
      await fs.mkdir(path.dirname(resultsPath), { recursive: true });
      await fs.writeFile(resultsPath, JSON.stringify(result, null, 2));
      this.logSafety('💾 結果保存完了', { path: resultsPath });
    } catch (error) {
      this.logSafety('❌ 結果保存失敗', { error });
    }
  }

  // ヘルパーメソッド群
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateMockStockUpdates() {
    return [
      { partId: 'cpu-001', availability: 'in_stock', stockCount: 25, source: 'mock' },
      { partId: 'cpu-002', availability: 'in_stock', stockCount: 18, source: 'mock' },
      { partId: 'gpu-001', availability: 'limited', stockCount: 3, source: 'mock' },
      { partId: 'mb-001', availability: 'in_stock', stockCount: 42, source: 'mock' },
      { partId: 'ram-001', availability: 'out_of_stock', estimatedRestockDate: '2025-08-01', source: 'mock' }
    ];
  }

  generateMockNewProducts() {
    const categories = ['cpu', 'gpu', 'motherboard', 'memory', 'storage'];
    const newProducts = [];
    
    for (let i = 0; i < 3; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      newProducts.push({
        id: `new-${category}-${Date.now()}-${i}`,
        name: `新製品 ${category.toUpperCase()} ${i + 1}`,
        category,
        price: Math.floor(Math.random() * 50000) + 10000,
        manufacturer: ['Intel', 'AMD', 'NVIDIA', 'Corsair', 'ASUS'][Math.floor(Math.random() * 5)],
        releaseDate: new Date().toISOString(),
        source: 'mock'
      });
    }
    
    return newProducts;
  }

  async saveStockData(data) {
    this.logSafety('💾 在庫データ保存', { count: data.length });
    
    if (!this.options.dryRun) {
      const stockPath = path.join(__dirname, '../data/stock-updates.json');
      try {
        await fs.mkdir(path.dirname(stockPath), { recursive: true });
        await fs.writeFile(stockPath, JSON.stringify(data, null, 2));
        this.logSafety('✅ 在庫データ保存完了');
      } catch (error) {
        this.logSafety('❌ 在庫データ保存失敗', { error });
      }
    }
  }

  async saveNewProductsData(data) {
    this.logSafety('💾 新製品データ保存', { count: data.length });
    
    if (!this.options.dryRun) {
      const newProductsPath = path.join(__dirname, '../data/new-products.json');
      try {
        await fs.mkdir(path.dirname(newProductsPath), { recursive: true });
        await fs.writeFile(newProductsPath, JSON.stringify(data, null, 2));
        this.logSafety('✅ 新製品データ保存完了');
      } catch (error) {
        this.logSafety('❌ 新製品データ保存失敗', { error });
      }
    }
  }

  /**
   * 🔍 安全性ログ
   */
  logSafety(message, data) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, data };
    
    if (this.options.verbose) {
      console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    } else {
      console.log(`${message}`);
    }
  }
}

/**
 * 🚀 メイン実行
 */
async function main() {
  const args = process.argv.slice(2);
  
  // コマンドライン引数解析
  const options = {
    type: getArgValue(args, '--type', 'all'),
    mode: getArgValue(args, '--mode', 'mock'),
    dryRun: getArgValue(args, '--dry-run', 'true') === 'true',
    verbose: args.includes('--verbose')
  };

  console.log('🎯 PC構成データ自動更新スクリプト');
  console.log('🛡️ 外部アクセス安全第一 - 段階的実装');
  console.log('');

  try {
    const updater = new SafeDataUpdater(options);
    const result = await updater.update();
    
    // 📊 結果表示
    console.log('');
    console.log('📊 === 更新結果サマリー ===');
    console.log(`✅ 成功: ${result.success}`);
    console.log(`📋 データタイプ: ${result.dataType}`);
    console.log(`🔧 モード: ${result.mode}`);
    console.log(`📊 総アイテム: ${result.totalItems}`);
    console.log(`🔄 更新アイテム: ${result.updatedItems}`);
    console.log(`⚠️ エラー数: ${result.errors.length}`);
    console.log(`⏱️ 実行時間: ${result.duration}ms`);
    
    if (result.errors.length > 0) {
      console.log('');
      console.log('❌ エラー詳細:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    // 🔍 詳細情報表示（verbose モード）
    if (options.verbose) {
      console.log('');
      console.log('🔍 === 詳細実行情報 ===');
      console.log(`🕐 開始時刻: ${new Date(result.timestamp).toLocaleString()}`);
      console.log(`⏱️ 実行時間: ${(result.duration / 1000).toFixed(2)}秒`);
      console.log(`🛡️ 安全性モード: ${result.mode}`);
      console.log(`🧪 ドライラン: ${options.dryRun ? 'Yes' : 'No'}`);
    }

    // 終了コード設定
    process.exit(result.success ? 0 : 1);

  } catch (error) {
    console.error('💥 致命的エラー:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

/**
 * 引数取得ヘルパー
 */
function getArgValue(args, flag, defaultValue) {
  const index = args.findIndex(arg => arg.startsWith(flag));
  if (index === -1) return defaultValue;
  
  const arg = args[index];
  if (arg.includes('=')) {
    return arg.split('=')[1];
  }
  
  return args[index + 1] || defaultValue;
}

// スクリプト実行
if (import.meta.url === `file://${__filename}`) {
  main().catch(console.error);
}

export { SafeDataUpdater };
