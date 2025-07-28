#!/usr/bin/env node
/**
 * データ更新スクリプト
 * 外部APIからパーツ情報を取得し、ローカルデータベースを更新
 * 
 * 使用方法:
 * node scripts/update-data.js --category=cpu
 * node scripts/update-data.js --category=all --force
 */

const fs = require('fs').promises;
const path = require('path');

// 設定
const CONFIG = {
  dataDir: path.join(__dirname, '../src/data'),
  apiEndpoints: {
    cpu: 'https://api.example.com/cpu',
    gpu: 'https://api.example.com/gpu',
    motherboard: 'https://api.example.com/motherboard',
    memory: 'https://api.example.com/memory',
    storage: 'https://api.example.com/storage',
    psu: 'https://api.example.com/psu',
    case: 'https://api.example.com/case',
    cooler: 'https://api.example.com/cooler'
  },
  retryCount: 3,
  retryDelay: 5000 // 5秒
};

/**
 * メイン実行関数
 */
async function main() {
  const args = parseArguments();
  
  console.log('🚀 データ更新スクリプト開始');
  console.log(`対象カテゴリ: ${args.category}`);
  console.log(`強制更新: ${args.force}`);
  
  try {
    if (args.category === 'all') {
      await updateAllCategories(args.force);
    } else {
      await updateCategory(args.category, args.force);
    }
    
    console.log('✅ データ更新完了');
  } catch (error) {
    console.error('❌ データ更新エラー:', error.message);
    process.exit(1);
  }
}

/**
 * コマンドライン引数解析
 */
function parseArguments() {
  const args = {
    category: 'all',
    force: false
  };
  
  process.argv.forEach(arg => {
    if (arg.startsWith('--category=')) {
      args.category = arg.split('=')[1];
    }
    if (arg === '--force') {
      args.force = true;
    }
  });
  
  // カテゴリ検証
  const validCategories = ['all', 'cpu', 'gpu', 'motherboard', 'memory', 'storage', 'psu', 'case', 'cooler'];
  if (!validCategories.includes(args.category)) {
    throw new Error(`無効なカテゴリ: ${args.category}. 有効な値: ${validCategories.join(', ')}`);
  }
  
  return args;
}

/**
 * 全カテゴリ更新
 */
async function updateAllCategories(force = false) {
  const categories = ['cpu', 'gpu', 'motherboard', 'memory', 'storage', 'psu', 'case', 'cooler'];
  const results = [];
  
  for (const category of categories) {
    try {
      console.log(`\n📦 ${category} を更新中...`);
      const result = await updateCategory(category, force);
      results.push({ category, success: true, ...result });
    } catch (error) {
      console.error(`❌ ${category} 更新エラー:`, error.message);
      results.push({ category, success: false, error: error.message });
    }
  }
  
  // 結果サマリー
  console.log('\n📊 更新結果サマリー:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.category}: ${result.success ? `${result.updatedCount || 0}件更新` : result.error}`);
  });
  
  return results;
}

/**
 * 特定カテゴリ更新
 */
async function updateCategory(category, force = false) {
  console.log(`🔄 ${category} データを取得中...`);
  
  // 既存データ確認
  const existingData = await loadExistingData(category);
  const lastUpdate = existingData?.lastUpdate ? new Date(existingData.lastUpdate) : null;
  const now = new Date();
  
  // 強制更新でない場合、最終更新から24時間未満はスキップ
  if (!force && lastUpdate && (now - lastUpdate) < 24 * 60 * 60 * 1000) {
    console.log(`ℹ️ ${category} は最近更新されているためスキップ`);
    return { skipped: true, lastUpdate: lastUpdate.toISOString() };
  }
  
  // 外部APIからデータ取得
  const newData = await fetchDataFromAPI(category);
  
  // データ検証
  const validatedData = validateData(newData, category);
  
  // データ更新
  const updatedData = mergeData(existingData, validatedData);
  updatedData.lastUpdate = now.toISOString();
  
  // ファイル保存
  await saveData(category, updatedData);
  
  console.log(`✅ ${category} 更新完了: ${validatedData.length}件`);
  
  return {
    updatedCount: validatedData.length,
    lastUpdate: now.toISOString()
  };
}

/**
 * 既存データ読み込み
 */
async function loadExistingData(category) {
  const filePath = path.join(CONFIG.dataDir, `${category}Parts.json`);
  
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`ℹ️ ${category} の既存データなし`);
      return null;
    }
    throw error;
  }
}

/**
 * 外部APIからデータ取得
 */
async function fetchDataFromAPI(category) {
  const endpoint = CONFIG.apiEndpoints[category];
  
  if (!endpoint) {
    throw new Error(`${category} のAPIエンドポイントが設定されていません`);
  }
  
  console.log(`🌐 API呼び出し: ${endpoint}`);
  
  // リトライロジック付きでAPI呼び出し
  for (let i = 0; i < CONFIG.retryCount; i++) {
    try {
      // 実際のAPI呼び出し（現在はモック）
      const mockData = generateMockData(category);
      
      // 実際の実装では以下のようになる：
      // const response = await fetch(endpoint, {
      //   headers: {
      //     'User-Agent': 'MyBuild-PC-ConfigList/1.0.0',
      //     'Authorization': `Bearer ${process.env.API_TOKEN}`
      //   }
      // });
      // if (!response.ok) {
      //   throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      // }
      // const data = await response.json();
      
      console.log(`✅ API応答成功: ${mockData.length}件取得`);
      return mockData;
      
    } catch (error) {
      console.warn(`⚠️ API呼び出し失敗 (試行 ${i + 1}/${CONFIG.retryCount}):`, error.message);
      
      if (i < CONFIG.retryCount - 1) {
        console.log(`⏳ ${CONFIG.retryDelay}ms 待機中...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
      } else {
        throw new Error(`API呼び出しが${CONFIG.retryCount}回失敗しました: ${error.message}`);
      }
    }
  }
}

/**
 * モックデータ生成（開発用）
 */
function generateMockData(category) {
  const baseData = {
    cpu: [
      { id: 'cpu-mock-1', name: 'Intel Core i7-13700K', price: 45000, manufacturer: 'Intel' },
      { id: 'cpu-mock-2', name: 'AMD Ryzen 7 7700X', price: 42000, manufacturer: 'AMD' }
    ],
    gpu: [
      { id: 'gpu-mock-1', name: 'NVIDIA RTX 4070 Ti', price: 95000, manufacturer: 'NVIDIA' },
      { id: 'gpu-mock-2', name: 'AMD RX 7800 XT', price: 85000, manufacturer: 'AMD' }
    ]
  };
  
  return baseData[category] || [];
}

/**
 * データ検証
 */
function validateData(data, category) {
  if (!Array.isArray(data)) {
    throw new Error(`${category} データが配列ではありません`);
  }
  
  const validatedData = data.filter(item => {
    // 必須フィールドチェック
    if (!item.id || !item.name || !item.price || !item.manufacturer) {
      console.warn(`⚠️ 無効なデータをスキップ:`, item);
      return false;
    }
    
    // 価格が正の数値かチェック
    if (typeof item.price !== 'number' || item.price <= 0) {
      console.warn(`⚠️ 無効な価格をスキップ:`, item);
      return false;
    }
    
    return true;
  });
  
  console.log(`✅ データ検証完了: ${data.length}件中${validatedData.length}件が有効`);
  return validatedData;
}

/**
 * データマージ
 */
function mergeData(existingData, newData) {
  if (!existingData || !existingData.parts) {
    return {
      parts: newData,
      version: '1.0.0',
      lastUpdate: new Date().toISOString()
    };
  }
  
  // 既存データとマージ（IDベース）
  const existingParts = existingData.parts || [];
  const mergedParts = [...newData];
  
  // 新しいデータにない既存パーツを追加（廃盤商品等を保持）
  existingParts.forEach(existingPart => {
    if (!newData.find(newPart => newPart.id === existingPart.id)) {
      mergedParts.push({ ...existingPart, discontinued: true });
    }
  });
  
  return {
    ...existingData,
    parts: mergedParts,
    lastUpdate: new Date().toISOString()
  };
}

/**
 * データ保存
 */
async function saveData(category, data) {
  const filePath = path.join(CONFIG.dataDir, `${category}Parts.json`);
  
  // ディレクトリ確認・作成
  await fs.mkdir(CONFIG.dataDir, { recursive: true });
  
  // データ保存
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  
  console.log(`💾 データ保存完了: ${filePath}`);
}

// スクリプト実行
if (require.main === module) {
  main().catch(error => {
    console.error('❌ スクリプト実行エラー:', error);
    process.exit(1);
  });
}

module.exports = {
  updateCategory,
  updateAllCategories,
  loadExistingData,
  fetchDataFromAPI,
  validateData,
  mergeData,
  saveData
};
