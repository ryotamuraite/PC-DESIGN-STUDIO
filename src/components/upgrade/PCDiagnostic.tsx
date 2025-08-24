// src/components/upgrade/PCDiagnostic.tsx
// Phase 3: 既存PCアップグレード診断UI - 市場初の差別化機能

import React, { useState } from 'react';
import { upgradeAnalyzer } from '../../services/upgradeAnalyzer';
import {
  CurrentPCConfiguration,
  BottleneckAnalysis,
  BottleneckResult,
  PerformanceMetrics,
  CompatibilityIssue
} from '../../types/upgrade';

// ===========================================
// 🎯 メインコンポーネント
// ===========================================

interface PCDiagnosticProps {
  onBack?: () => void;
  onDiagnosisComplete?: (analysis: BottleneckAnalysis) => void;
}

export const PCDiagnostic: React.FC<PCDiagnosticProps> = ({ onBack, onDiagnosisComplete }) => {
  // ステート管理
  const [activeTab, setActiveTab] = useState<'input' | 'results'>('input');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<BottleneckAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // PC構成データ
  const [pcConfig, setPcConfig] = useState<Partial<CurrentPCConfiguration>>({
    id: `pc-${Date.now()}`,
    name: '',
    currentParts: {
      cpu: null,
      motherboard: null,
      memory: [],
      gpu: null,
      storage: [],
      psu: null,
      case: null,
      cooler: null,
      other: []
    },
    pcInfo: {
      condition: 'good',
      usage: 'gaming',
      dailyUsageHours: 8,
      location: 'home'
    },
    constraints: {
      budget: 100000,
      timeframe: '3-6months',
      priority: 'performance',
      keepParts: [],
      replaceParts: [],
      maxComplexity: 'moderate'
    },
    createdAt: new Date(),
    lastUpdated: new Date(),
    version: '1.0'
  });

  // 診断実行
  const handleDiagnosis = async () => {
    if (!pcConfig.name || Object.values(pcConfig.currentParts || {}).every(part => 
      part === null || (Array.isArray(part) && part.length === 0)
    )) {
      setError('PC名と最低1つのパーツ情報を入力してください');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const config = pcConfig as CurrentPCConfiguration;
      const result = await upgradeAnalyzer.analyzeCurrentPC(config);
      setAnalysis(result);
      setActiveTab('results');
      
      // 🚧 Phase 3: 診断完了時のコールバック実行
      if (onDiagnosisComplete) {
        onDiagnosisComplete(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '診断処理に失敗しました');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 新しい診断を開始
  const handleNewDiagnosis = () => {
    setAnalysis(null);
    setError(null);
    setActiveTab('input');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                🔄 アップグレード診断
              </h1>
              <p className="text-gray-600">
                既存PCの詳細分析とボトルネック診断で最適なアップグレードプランを提案
              </p>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                ← 戻る
              </button>
            )}
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="bg-white rounded-2xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('input')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'input'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📝 PC情報入力
              </button>
              <button
                onClick={() => setActiveTab('results')}
                disabled={!analysis}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'results' && analysis
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-400 cursor-not-allowed'
                }`}
              >
                📊 診断結果
              </button>
            </nav>
          </div>

          {/* タブコンテンツ */}
          <div className="p-6">
            {activeTab === 'input' && (
              <PCConfigurationInput
                config={pcConfig}
                onChange={setPcConfig}
                onDiagnose={handleDiagnosis}
                isAnalyzing={isAnalyzing}
                error={error}
              />
            )}

            {activeTab === 'results' && analysis && (
              <DiagnosisResults
                analysis={analysis}
                onNewDiagnosis={handleNewDiagnosis}
                onGoToPlanner={onDiagnosisComplete}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===========================================
// 📝 PC構成入力コンポーネント
// ===========================================

interface PCConfigurationInputProps {
  config: Partial<CurrentPCConfiguration>;
  onChange: (config: Partial<CurrentPCConfiguration>) => void;
  onDiagnose: () => void;
  isAnalyzing: boolean;
  error: string | null;
}

const PCConfigurationInput: React.FC<PCConfigurationInputProps> = ({
  config,
  onChange,
  onDiagnose,
  isAnalyzing,
  error
}) => {
  const updateConfig = (updates: Partial<CurrentPCConfiguration>) => {
    onChange({ ...config, ...updates });
  };

  const updatePCInfo = (updates: Partial<CurrentPCConfiguration['pcInfo']>) => {
    updateConfig({
      pcInfo: { 
        // デフォルト値で必須フィールドを保証
        condition: 'good',
        usage: 'gaming',
        dailyUsageHours: 8,
        location: 'home',
        ...config.pcInfo, 
        ...updates 
      }
    });
  };

  const updateConstraints = (updates: Partial<CurrentPCConfiguration['constraints']>) => {
    updateConfig({
      constraints: { 
        // デフォルト値で必須フィールドを保証
        budget: 100000,
        timeframe: '3-6months',
        priority: 'performance',
        keepParts: [],
        replaceParts: [],
        maxComplexity: 'moderate',
        ...config.constraints, 
        ...updates 
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-600 text-2xl mr-3">⚠️</span>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* PC基本情報 */}
      <section className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          💻 PC基本情報
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PC名 *
            </label>
            <input
              type="text"
              value={config.name || ''}
              onChange={(e) => updateConfig({ name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例: メインゲーミングPC"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              主な用途
            </label>
            <select
              value={config.pcInfo?.usage || 'gaming'}
              onChange={(e) => updatePCInfo({ usage: e.target.value as CurrentPCConfiguration['pcInfo']['usage'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="gaming">🎮 ゲーミング</option>
              <option value="office">💼 オフィス作業</option>
              <option value="creative">🎨 クリエイティブ</option>
              <option value="development">💻 開発作業</option>
              <option value="server">🖥️ サーバー</option>
              <option value="mixed">🔄 複合用途</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PC状態
            </label>
            <select
              value={config.pcInfo?.condition || 'good'}
              onChange={(e) => updatePCInfo({ condition: e.target.value as CurrentPCConfiguration['pcInfo']['condition'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="excellent">✨ 優秀（ほぼ新品）</option>
              <option value="good">👍 良好（正常動作）</option>
              <option value="fair">⚠️ 普通（軽微な問題）</option>
              <option value="poor">🔧 不良（要修理）</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              1日の使用時間
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={config.pcInfo?.dailyUsageHours || 8}
              onChange={(e) => updatePCInfo({ dailyUsageHours: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* パーツ情報入力（簡略版） */}
      <section className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          🔧 主要パーツ情報
        </h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-700 text-sm">
            💡 現在はサンプルデータで診断を実行します。詳細なパーツ選択機能は次回アップデートで追加予定です。
          </p>
        </div>

        {/* サンプルパーツ表示 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'CPU', icon: '💾', sample: 'Intel Core i5-12400F' },
            { name: 'GPU', icon: '🎮', sample: 'NVIDIA RTX 3060' },
            { name: 'メモリ', icon: '💿', sample: 'DDR4-3200 16GB' },
            { name: 'ストレージ', icon: '💽', sample: 'SSD 500GB' },
            { name: '電源', icon: '⚡', sample: '650W 80PLUS Bronze' },
            { name: 'マザーボード', icon: '🔌', sample: 'B550 Chipset' }
          ].map((part) => (
            <div key={part.name} className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-2">
                <span className="text-xl mr-2">{part.icon}</span>
                <span className="font-medium text-gray-800">{part.name}</span>
              </div>
              <p className="text-sm text-gray-600">{part.sample}</p>
            </div>
          ))}
        </div>
      </section>

      {/* アップグレード制約 */}
      <section className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          ⚙️ アップグレード制約
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              予算
            </label>
            <input
              type="number"
              min="10000"
              step="10000"
              value={config.constraints?.budget || 100000}
              onChange={(e) => updateConstraints({ budget: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">円</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              実施時期
            </label>
            <select
              value={config.constraints?.timeframe || '3-6months'}
              onChange={(e) => updateConstraints({ timeframe: e.target.value as CurrentPCConfiguration['constraints']['timeframe'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="immediate">🚀 すぐに</option>
              <option value="1-3months">📅 1-3ヶ月以内</option>
              <option value="3-6months">🗓️ 3-6ヶ月以内</option>
              <option value="6-12months">📆 6-12ヶ月以内</option>
              <option value="flexible">🔄 柔軟</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              優先度
            </label>
            <select
              value={config.constraints?.priority || 'performance'}
              onChange={(e) => updateConstraints({ priority: e.target.value as CurrentPCConfiguration['constraints']['priority'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="performance">🚀 性能重視</option>
              <option value="budget">💰 コスト重視</option>
              <option value="efficiency">⚡ 効率重視</option>
              <option value="aesthetics">✨ 見た目重視</option>
              <option value="longevity">🛡️ 長寿命重視</option>
            </select>
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              作業複雑度制限
            </label>
            <select
              value={config.constraints?.maxComplexity || 'moderate'}
              onChange={(e) => updateConstraints({ maxComplexity: e.target.value as CurrentPCConfiguration['constraints']['maxComplexity'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="simple">🟢 簡単（パーツ交換のみ）</option>
              <option value="moderate">🟡 普通（基本的な組み立て）</option>
              <option value="advanced">🔴 高度（複雑な作業OK）</option>
            </select>
          </div>
        </div>
      </section>

      {/* 診断実行ボタン */}
      <div className="text-center">
        <button
          onClick={onDiagnose}
          disabled={isAnalyzing || !config.name}
          className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all ${
            isAnalyzing || !config.name
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
          }`}
        >
          {isAnalyzing ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              診断実行中...
            </span>
          ) : (
            '🔍 アップグレード診断開始'
          )}
        </button>
      </div>
    </div>
  );
};

// ===========================================
// 📊 診断結果表示コンポーネント
// ===========================================

interface DiagnosisResultsProps {
  analysis: BottleneckAnalysis;
  onNewDiagnosis: () => void;
  onGoToPlanner?: (analysis: BottleneckAnalysis) => void;
}

const DiagnosisResults: React.FC<DiagnosisResultsProps> = ({
  analysis,
  onNewDiagnosis,
  onGoToPlanner
}) => {
  return (
    <div className="space-y-8">
      {/* 診断結果ヘッダー */}
      <div className="text-center bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🎯 診断結果
        </h2>
        <p className="text-gray-600">
          診断日時: {analysis.diagnosisDate.toLocaleDateString('ja-JP')} {analysis.diagnosisDate.toLocaleTimeString('ja-JP')}
        </p>
        <p className="text-sm text-gray-500">
          信頼度: {(analysis.confidence * 100).toFixed(0)}%
        </p>
      </div>

      {/* 総合スコア */}
      <OverallScores
        overallScore={analysis.overallScore}
        balanceScore={analysis.balanceScore}
      />

      {/* ボトルネック分析 */}
      {analysis.bottlenecks.length > 0 && (
        <BottleneckAnalysisDisplay bottlenecks={analysis.bottlenecks} />
      )}

      {/* パフォーマンス予測 */}
      <PerformanceMetricsDisplay metrics={analysis.performanceMetrics} />

      {/* 互換性問題 */}
      {analysis.compatibilityIssues.length > 0 && (
        <CompatibilityIssuesDisplay issues={analysis.compatibilityIssues} />
      )}

      {/* アクションボタン */}
      <div className="text-center space-x-4">
        <button
          onClick={onNewDiagnosis}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          🔄 新しい診断を開始
        </button>
        {onGoToPlanner && (
          <button
            onClick={() => onGoToPlanner(analysis)}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            📋 プランナーでアップグレード計画
          </button>
        )}
      </div>
    </div>
  );
};

// ===========================================
// 📈 総合スコア表示
// ===========================================

const OverallScores: React.FC<{
  overallScore: number;
  balanceScore: number;
}> = ({ overallScore, balanceScore }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className={`rounded-xl p-6 border ${getScoreBackground(overallScore)}`}>
        <div className="text-center">
          <div className="text-4xl font-bold mb-2">
            <span className={getScoreColor(overallScore)}>{overallScore}</span>
            <span className="text-gray-400 text-2xl">/100</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            📊 総合パフォーマンス
          </h3>
          <p className="text-sm text-gray-600">
            {overallScore >= 80 && '優秀な性能です'}
            {overallScore >= 60 && overallScore < 80 && '標準的な性能です'}
            {overallScore < 60 && 'アップグレードを推奨します'}
          </p>
        </div>
      </div>

      <div className={`rounded-xl p-6 border ${getScoreBackground(balanceScore)}`}>
        <div className="text-center">
          <div className="text-4xl font-bold mb-2">
            <span className={getScoreColor(balanceScore)}>{balanceScore}</span>
            <span className="text-gray-400 text-2xl">/100</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            ⚖️ バランススコア
          </h3>
          <p className="text-sm text-gray-600">
            {balanceScore >= 80 && 'パーツ構成が最適です'}
            {balanceScore >= 60 && balanceScore < 80 && 'バランスは良好です'}
            {balanceScore < 60 && 'パーツ間の不均衡があります'}
          </p>
        </div>
      </div>
    </div>
  );
};

// ===========================================
// 🚨 ボトルネック分析表示
// ===========================================

const BottleneckAnalysisDisplay: React.FC<{
  bottlenecks: BottleneckResult[];
}> = ({ bottlenecks }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-300 text-red-800';
      case 'major': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'moderate': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'minor': return 'bg-blue-100 border-blue-300 text-blue-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'major': return '⚠️';
      case 'moderate': return '🟡';
      case 'minor': return 'ℹ️';
      default: return '📋';
    }
  };

  return (
    <section className="bg-white rounded-xl p-6 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        🚨 ボトルネック分析
      </h3>

      <div className="space-y-4">
        {bottlenecks.map((bottleneck, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${getSeverityColor(bottleneck.severity)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{getSeverityIcon(bottleneck.severity)}</span>
                <div>
                  <h4 className="font-semibold capitalize">
                    {bottleneck.type} ボトルネック
                  </h4>
                  <span className="text-sm opacity-75 capitalize">
                    {bottleneck.severity} レベル
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  改善効果: {bottleneck.improvementPotential}%
                </div>
                <div className="text-xs opacity-75">
                  概算費用: ¥{bottleneck.costEstimate.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm">
                <strong>問題:</strong> {bottleneck.description}
              </p>
              <p className="text-sm">
                <strong>影響:</strong> {bottleneck.impact}
              </p>
              <p className="text-sm">
                <strong>推奨解決策:</strong> {bottleneck.recommendedSolution}
              </p>
              
              {bottleneck.dependentUpgrades.length > 0 && (
                <p className="text-sm">
                  <strong>関連アップグレード:</strong> {bottleneck.dependentUpgrades.join(', ')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ===========================================
// 📈 パフォーマンス予測表示
// ===========================================

const PerformanceMetricsDisplay: React.FC<{
  metrics: {
    gaming: PerformanceMetrics;
    productivity: PerformanceMetrics;
    general: PerformanceMetrics;
  };
}> = ({ metrics }) => {
  return (
    <section className="bg-white rounded-xl p-6 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        📈 用途別パフォーマンス予測
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PerformanceCard
          title="🎮 ゲーミング"
          metrics={metrics.gaming}
        />
        <PerformanceCard
          title="💼 生産性"
          metrics={metrics.productivity}
        />
        <PerformanceCard
          title="🏠 一般用途"
          metrics={metrics.general}
        />
      </div>
    </section>
  );
};

const PerformanceCard: React.FC<{
  title: string;
  metrics: PerformanceMetrics;
}> = ({ title, metrics }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-semibold text-gray-800 mb-3">{title}</h4>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>FPS:</span>
          <span className="font-medium">{metrics.fps.current}</span>
        </div>
        <div className="flex justify-between">
          <span>ロード時間:</span>
          <span className="font-medium">{metrics.loadTimes.current}秒</span>
        </div>
        <div className="flex justify-between">
          <span>マルチタスク:</span>
          <span className="font-medium">{metrics.multitasking.current}/100</span>
        </div>
        <div className="flex justify-between border-t pt-2">
          <span className="font-medium">総合:</span>
          <span className="font-bold">{metrics.overall.current}/100</span>
        </div>
      </div>
    </div>
  );
};

// ===========================================
// 🔗 互換性問題表示
// ===========================================

const CompatibilityIssuesDisplay: React.FC<{
  issues: CompatibilityIssue[];
}> = ({ issues }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-300 text-red-800';
      case 'error': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'warning': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  return (
    <section className="bg-white rounded-xl p-6 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        🔗 互換性チェック
      </h3>

      <div className="space-y-4">
        {issues.map((issue, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${getSeverityColor(issue.severity)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold capitalize">
                {issue.type} 互換性問題
              </h4>
              <span className="text-sm font-medium capitalize">
                {issue.severity}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <p>
                <strong>問題:</strong> {issue.description}
              </p>
              <p>
                <strong>解決策:</strong> {issue.solution}
              </p>
              <p>
                <strong>影響パーツ:</strong> {issue.affectedParts.join(', ')}
              </p>
              {issue.mustResolve && (
                <p className="text-red-600 font-medium">
                  ⚠️ この問題は必ず解決する必要があります
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PCDiagnostic;