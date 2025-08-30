// src/components/checkers/CompatibilityChecker.tsx
// 互換性チェッカー - 基本版（1-2時間実装用）

import React, { useState } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Minus
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
    result,
    isLoading,
    error,
    refresh,
    checkSpecificCompatibility
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

  if (isLoading) {
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
              onClick={refresh}
              className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
            >
              再チェック
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center py-8 text-gray-500">
          パーツを選択して互換性チェックを開始してください
        </div>
      </div>
    );
  }

  const { isCompatible, issues, warnings, score } = result;

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
            onClick={refresh}
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
        {(warningIssues.length > 0 || warnings.length > 0) && (
          <CompatibilitySection
            title="警告"
            icon={<AlertTriangle className="w-5 h-5 text-yellow-500" />}
            items={[...warningIssues, ...warnings.map(w => ({ 
              message: w.message, 
              solution: w.recommendation,
              severity: 'warning',
              category: '一般的な警告'
            }))]}
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
            <CompatibilityDetailsSection 
              result={result}
              checkSpecificCompatibility={checkSpecificCompatibility}
            />
          </div>
        )}
      </div>
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
              {item.category && (
                <p className="text-xs text-gray-500 mt-1">
                  カテゴリ: {item.category}
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
  result: {
    details?: {
      cpuSocket?: { message?: string };
      memoryType?: { message?: string };
      powerConnectors?: { message?: string };
      physicalFit?: { message?: string };
      performanceMatch?: { message?: string };
      cooling?: { message?: string };
    };
  };
  checkSpecificCompatibility: (category: string) => boolean;
}> = ({ result, checkSpecificCompatibility }) => {
  const details = result.details;
  
  const checkItems = [
    {
      label: 'CPUソケット',
      category: 'socket',
      details: details?.cpuSocket,
      description: 'CPUとマザーボードのソケット互換性'
    },
    {
      label: 'メモリ規格',
      category: 'memory',
      details: details?.memoryType,
      description: 'メモリとマザーボードの規格互換性'
    },
    {
      label: '電源コネクタ',
      category: 'power',
      details: details?.powerConnectors,
      description: '電源ユニットのコネクタ互換性'
    },
    {
      label: '物理サイズ',
      category: 'physical',
      details: details?.physicalFit,
      description: 'ケース内での物理的な配置可能性'
    },
    {
      label: '冷却互換性',
      category: 'cooling',
      details: details?.cooling,
      description: 'CPUとクーラーの冷却性能互換性'
    },
    {
      label: 'パフォーマンスバランス',
      category: 'performance',
      details: details?.performanceMatch,
      description: 'CPUとGPUのパフォーマンスバランス'
    }
  ];
  
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-900 mb-3">
        詳細な互換性チェック項目
      </h4>
      <div className="space-y-3">
        {checkItems.map((item) => {
          const isCompatible = checkSpecificCompatibility(item.category);
          const hasDetails = item.details && !item.details.message?.includes('待っています');
          
          return (
            <div key={item.category} className="bg-white rounded p-3 border">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    {hasDetails ? (
                      isCompatible ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 mr-2" />
                      )
                    ) : (
                      <Minus className="w-4 h-4 text-gray-400 mr-2" />
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {item.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {item.description}
                  </p>
                  {item.details?.message && (
                    <p className="text-xs text-gray-700 mt-1 font-medium">
                      {item.details.message}
                    </p>
                  )}
                </div>
                <div className="ml-4">
                  {hasDetails ? (
                    <span className={`text-xs px-2 py-1 rounded ${
                      isCompatible 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {isCompatible ? '互換' : '非互換'}
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                      未選択
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompatibilityChecker;
