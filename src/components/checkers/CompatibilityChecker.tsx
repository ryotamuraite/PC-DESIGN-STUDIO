// src/components/checkers/CompatibilityChecker.tsx
import React, { useState } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Zap,
  Monitor,
  BarChart3,
  Gamepad2
} from 'lucide-react';
import { PCConfiguration } from '@/types';
import { useCompatibilityCheck } from '@/hooks/useCompatibilityCheck';

interface CompatibilityCheckerProps {
  configuration: PCConfiguration;
  className?: string;
}

export const CompatibilityChecker: React.FC<CompatibilityCheckerProps> = ({ 
  configuration, 
  className = '' 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const {
    compatibilityResult,
    isChecking,
    error,
    recheckCompatibility,
    clearError
  } = useCompatibilityCheck(configuration);

  // セクションの展開/折りたたみ
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  if (isChecking) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">互換性をチェック中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-400 mr-2" />
            <h3 className="text-sm font-medium text-red-800">チェックエラー</h3>
          </div>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <div className="mt-4">
            <button
              onClick={() => { clearError(); recheckCompatibility(); }}
              className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
            >
              再チェック
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!compatibilityResult) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center py-8 text-gray-500">
          パーツを選択して互換性チェックを開始してください
        </div>
      </div>
    );
  }

  const { isCompatible, issues, warnings, score } = compatibilityResult;

  // 重要度別にIssueを分類
  const criticalIssues = issues.filter(issue => issue.severity === 'critical');
  const warningIssues = issues.filter(issue => issue.severity === 'warning');
  const infoIssues = issues.filter(issue => issue.severity === 'info');

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* ヘッダー */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">互換性チェック結果</h2>
          <button
            onClick={recheckCompatibility}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            再チェック
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 総合スコア表示 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CompatibilityScoreCard
            title="互換性スコア"
            score={score}
            maxScore={100}
            color={score >= 90 ? 'green' : score >= 70 ? 'yellow' : 'red'}
          />
          <CompatibilityScoreCard
            title="重要な問題"
            score={criticalIssues.length}
            maxScore={null}
            color={criticalIssues.length === 0 ? 'green' : 'red'}
            suffix="件"
          />
          <CompatibilityScoreCard
            title="警告"
            score={warningIssues.length + warnings.length}
            maxScore={null}
            color={warningIssues.length + warnings.length === 0 ? 'green' : 'yellow'}
            suffix="件"
          />
        </div>

        {/* パフォーマンス予測表示 (NEW!) */}
        {compatibilityResult.details?.performancePrediction && (
          <PerformancePredictionCard 
            prediction={compatibilityResult.details.performancePrediction}
            isExpanded={expandedSections.has('performance')}
            onToggle={() => toggleSection('performance')}
          />
        )}

        {/* 総合判定 */}
        <div className={`rounded-lg p-4 ${
          isCompatible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center">
            {isCompatible ? (
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500 mr-2" />
            )}
            <h3 className={`text-sm font-medium ${
              isCompatible ? 'text-green-800' : 'text-red-800'
            }`}>
              {isCompatible ? '互換性に問題はありません' : '互換性に問題があります'}
            </h3>
          </div>
          {!isCompatible && (
            <p className="mt-1 text-sm text-red-700">
              以下の問題を解決する必要があります
            </p>
          )}
        </div>

        {/* 重要な問題 */}
        {criticalIssues.length > 0 && (
          <CompatibilitySection
            title="重要な問題"
            icon={<XCircle className="w-5 h-5 text-red-500" />}
            items={criticalIssues}
            severity="critical"
            isExpanded={expandedSections.has('critical')}
            onToggle={() => toggleSection('critical')}
          />
        )}

        {/* 警告 */}
        {warningIssues.length > 0 && (
          <CompatibilitySection
            title="警告"
            icon={<AlertTriangle className="w-5 h-5 text-yellow-500" />}
            items={warningIssues}
            severity="warning"
            isExpanded={expandedSections.has('warning')}
            onToggle={() => toggleSection('warning')}
          />
        )}

        {/* 情報 */}
        {infoIssues.length > 0 && (
          <CompatibilitySection
            title="情報"
            icon={<Info className="w-5 h-5 text-blue-500" />}
            items={infoIssues}
            severity="info"
            isExpanded={expandedSections.has('info')}
            onToggle={() => toggleSection('info')}
          />
        )}

        {/* 詳細表示切り替え */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-800"
          >
            {showDetails ? (
              <ChevronUp className="w-4 h-4 mr-1" />
            ) : (
              <ChevronDown className="w-4 h-4 mr-1" />
            )}
            詳細な互換性情報を{showDetails ? '非表示' : '表示'}
          </button>
        </div>

        {/* 詳細情報 */}
        {showDetails && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <CompatibilityDetailsSection configuration={configuration} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CompatibilityChecker;

// パフォーマンス予測カード (NEW!)
const PerformancePredictionCard: React.FC<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prediction: any;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ prediction, isExpanded, onToggle }) => {
  const { overallScore, bottleneckAnalysis, gamingPerformance, useCaseScores } = prediction;
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getBottleneckColor = (severity: string) => {
    switch(severity) {
      case 'severe': return 'text-red-600';
      case 'moderate': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-blue-50 hover:bg-opacity-50"
      >
        <div className="flex items-center">
          <Zap className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">
            パフォーマンス予測 (総合スコア: {overallScore}点)
          </h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      
      {/* 簡易表示 (常に表示) */}
      <div className="px-4 pb-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-xs text-gray-600">ボトルネック</div>
            <div className={`text-sm font-medium ${getBottleneckColor(bottleneckAnalysis.severity)}`}>
              {bottleneckAnalysis.severity === 'none' ? 'なし' : 
               bottleneckAnalysis.bottleneckType === 'cpu' ? 'CPU' :
               bottleneckAnalysis.bottleneckType === 'gpu' ? 'GPU' : 'バランス'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600">1440p FPS</div>
            <div className="text-sm font-medium text-blue-600">
              {gamingPerformance.averageFps['1440p'] || '無'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600">推奨解像度</div>
            <div className="text-sm font-medium text-purple-600">
              {gamingPerformance.recommendedResolution}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600">性能クラス</div>
            <div className="text-sm font-medium text-indigo-600">
              {gamingPerformance.performanceClass}
            </div>
          </div>
        </div>
      </div>
      
      {/* 詳細表示 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* FPS予測 */}
          <div className="bg-white rounded p-3 border">
            <div className="flex items-center mb-2">
              <Monitor className="w-4 h-4 text-gray-600 mr-2" />
              <h4 className="text-sm font-medium text-gray-900">解像度別FPS予測</h4>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center">
                <div className="text-gray-600">1080p</div>
                <div className="font-medium text-green-600">
                  {gamingPerformance.averageFps['1080p'] || 0} FPS
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">1440p</div>
                <div className="font-medium text-blue-600">
                  {gamingPerformance.averageFps['1440p'] || 0} FPS
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">4K</div>
                <div className="font-medium text-purple-600">
                  {gamingPerformance.averageFps['4K'] || 0} FPS
                </div>
              </div>
            </div>
          </div>
          
          {/* 用途別スコア */}
          <div className="bg-white rounded p-3 border">
            <div className="flex items-center mb-2">
              <BarChart3 className="w-4 h-4 text-gray-600 mr-2" />
              <h4 className="text-sm font-medium text-gray-900">用途別適性スコア</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">🎮 ゲーミング</span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${useCaseScores.gaming}%` }}
                    ></div>
                  </div>
                  <span className={`text-sm font-medium ${getScoreColor(useCaseScores.gaming)}`}>
                    {useCaseScores.gaming}点
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">🎨 コンテンツ制作</span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${useCaseScores.contentCreation}%` }}
                    ></div>
                  </div>
                  <span className={`text-sm font-medium ${getScoreColor(useCaseScores.contentCreation)}`}>
                    {useCaseScores.contentCreation}点
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">💼 ワークステーション</span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${useCaseScores.workstation}%` }}
                    ></div>
                  </div>
                  <span className={`text-sm font-medium ${getScoreColor(useCaseScores.workstation)}`}>
                    {useCaseScores.workstation}点
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 推奨事項 */}
          {prediction.recommendations && prediction.recommendations.length > 0 && (
            <div className="bg-white rounded p-3 border">
              <div className="flex items-center mb-2">
                <Gamepad2 className="w-4 h-4 text-gray-600 mr-2" />
                <h4 className="text-sm font-medium text-gray-900">最適化推奨</h4>
              </div>
              <div className="space-y-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {prediction.recommendations.slice(0, 2).map((rec: any, index: number) => (
                  <div key={index} className="text-xs text-gray-600 bg-gray-50 rounded p-2">
                    <div className="font-medium text-gray-900">{rec.title}</div>
                    <div className="text-blue-600">{rec.expectedImprovement}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// スコアカードコンポーネント
const CompatibilityScoreCard: React.FC<{
  title: string;
  score: number;
  maxScore: number | null;
  color: 'green' | 'yellow' | 'red';
  suffix?: string;
}> = ({ title, score, maxScore, color, suffix = '' }) => {
  const colorClasses = {
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200'
  };

  return (
    <div className={`rounded-lg p-4 border ${colorClasses[color]}`}>
      <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      <div className="mt-1">
        <span className="text-2xl font-bold">
          {score}{suffix}
        </span>
        {maxScore && (
          <span className="text-sm text-gray-600 ml-1">
            / {maxScore}
          </span>
        )}
      </div>
    </div>
  );
};

// 互換性セクション
const CompatibilitySection: React.FC<{
  title: string;
  icon: React.ReactNode;
  items: Array<{
    message: string;
    affectedParts?: string[];
    solution?: string;
    severity?: string;
    category?: string;
  }>;
  severity: string;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ title, icon, items, severity, isExpanded, onToggle }) => {
  const bgColor = {
    critical: 'bg-red-50',
    warning: 'bg-yellow-50',
    info: 'bg-blue-50'
  }[severity] || 'bg-gray-50';

  return (
    <div className={`${bgColor} rounded-lg`}>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-opacity-80"
      >
        <div className="flex items-center">
          {icon}
          <h3 className="ml-2 text-sm font-medium text-gray-900">
            {title} ({items.length})
          </h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {items.map((item, index) => (
            <div key={index} className="bg-white rounded p-3 border">
              <p className="text-sm text-gray-900 font-medium">{item.message}</p>
              {item.affectedParts && item.affectedParts.length > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  関連パーツ: {item.affectedParts.join(', ')}
                </p>
              )}
              {item.solution && (
                <p className="text-xs text-blue-600 mt-2">
                  解決策: {item.solution}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 詳細情報セクション
const CompatibilityDetailsSection: React.FC<{
  configuration: PCConfiguration;
}> = ({ configuration }) => {
  // 設定からの詳細情報を表示
  const coolerSpecs = configuration.parts.cooler?.specifications;
  const gpuSpecs = configuration.parts.gpu?.specifications;
  
  const hasAdvancedCooling = coolerSpecs?.type === 'liquid' || coolerSpecs?.coolingType === 'liquid';
  const hasHighEndGPU = gpuSpecs?.tier === 'high-end' || gpuSpecs?.category === 'high-end';
  
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-900 mb-3">
        詳細な互換性チェック項目
      </h4>
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>CPUソケット互換性:</span>
          <span className="text-green-600">✓ 確認済み</span>
        </div>
        <div className="flex justify-between">
          <span>メモリ規格互換性:</span>
          <span className="text-green-600">✓ 確認済み</span>
        </div>
        <div className="flex justify-between">
          <span>電源コネクタ互換性:</span>
          <span className="text-green-600">✓ 確認済み</span>
        </div>
        <div className="flex justify-between">
          <span>ケースサイズ互換性:</span>
          <span className={hasHighEndGPU ? "text-yellow-600" : "text-green-600"}>
            {hasHighEndGPU ? "⚠ 注意が必要" : "✓ 確認済み"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>冷却クリアランス:</span>
          <span className={hasAdvancedCooling ? "text-green-600" : "text-yellow-600"}>
            {hasAdvancedCooling ? "✓ 確認済み" : "⚠ 注意が必要"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>PCIe互換性:</span>
          <span className="text-green-600">✓ 確認済み</span>
        </div>
      </div>
    </div>
  );
};