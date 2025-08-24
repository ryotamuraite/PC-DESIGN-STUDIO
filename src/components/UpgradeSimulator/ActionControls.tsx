import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ActionControlsProps {
  onRunSimulation?: () => void;
  onSaveConfiguration?: () => void;
  onCompareConfigurations?: () => void;
  onReset?: () => void;
  // UpgradeSimulator.tsx互換性プロパティ
  onSimulate?: () => void;
  onOptimize?: () => void;
  onSave?: () => void;
  onExecute?: () => void;
  // v30.0 UpgradeSimulator.tsx対応
  onRunBasicSimulation?: () => void;
  onRunFullSimulation?: () => void;
  onAnalyzeROI?: () => void;
  simulationProgress?: number;
  isSimulating?: boolean;
  hasUpgrades?: boolean;
  canAfford?: boolean;
  isCalculating?: boolean;
  hasChanges?: boolean;
  className?: string;
}

export const ActionControls: React.FC<ActionControlsProps> = ({
  onRunSimulation,
  onSaveConfiguration,
  onCompareConfigurations,
  onReset,
  // UpgradeSimulator.tsx互換性プロパティ
  onSimulate,
  onOptimize,
  onSave,
  onExecute,
  // v30.0 UpgradeSimulator.tsx対応
  onRunBasicSimulation,
  onRunFullSimulation,
  onAnalyzeROI,
  simulationProgress = 0,
  isSimulating = false,
  hasUpgrades = false,
  canAfford = true,
  isCalculating = false,
  hasChanges = false,
  className = ''
}) => {
  // 互換性のためのプロパティマッピング
  const handleSimulate = onSimulate || onRunSimulation || onRunBasicSimulation;
  const handleSave = onSave || onSaveConfiguration;
  const isProcessing = isSimulating || isCalculating;
  
  // v30.0 アップグレードシミュレーター用ハンドラー
  const showUpgradeSimulatorButtons = !!(onRunBasicSimulation || onRunFullSimulation || onAnalyzeROI);
  return (
    <div className={`bg-white border-t border-gray-200 p-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* 左側: 主要アクション */}
        <div className="flex items-center gap-3">
          {/* v30.0 UpgradeSimulator.tsx用ボタン */}
          {showUpgradeSimulatorButtons ? (
            <>
              <Button
                onClick={onRunBasicSimulation}
                disabled={isProcessing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <span>🏃</span>
                基本シミュレーション
              </Button>
              
              <Button
                onClick={onRunFullSimulation}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    実行中... {simulationProgress}%
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    フルシミュレーション
                  </>
                )}
              </Button>
              
              <Button
                onClick={onAnalyzeROI}
                disabled={isProcessing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <span>💰</span>
                ROI分析
              </Button>
            </>
          ) : (
            /* 既存シミュレーター用ボタン */
            <>
              <Button
                onClick={handleSimulate}
                disabled={isProcessing || !hasUpgrades}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    {isSimulating ? 'シミュレーション中...' : '計算中...'}
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    シミュレーション実行
                  </>
                )}
              </Button>
              
              {onOptimize && (
                <Button
                  variant="outline"
                  onClick={onOptimize}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <span>🎯</span>
                  予算最適化
                </Button>
              )}
            </>
          )}
          
          {!hasUpgrades && !isProcessing && (
            <Badge variant="outline" className="text-xs">
              パーツを選択してください
            </Badge>
          )}
          
          {hasUpgrades && !canAfford && (
            <Badge variant="destructive" className="text-xs">
              予算超過
            </Badge>
          )}
          
          {hasChanges && (
            <Badge variant="secondary" className="animate-pulse">
              未保存の変更
            </Badge>
          )}
        </div>

        {/* 右側: セカンダリアクション */}
        <div className="flex items-center gap-2">
          {onCompareConfigurations && (
            <Button
              variant="outline"
              onClick={onCompareConfigurations}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <span>📄</span>
              比較表示
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isProcessing || (!hasChanges && !hasUpgrades)}
            className="flex items-center gap-2"
          >
            <span>💾</span>
            構成保存
          </Button>
          
          {onExecute && hasUpgrades && canAfford && (
            <Button
              variant="default"
              onClick={onExecute}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <span>🚀</span>
              アップグレード実行
            </Button>
          )}
          
          {onReset && (
            <Button
              variant="ghost"
              onClick={onReset}
              disabled={isProcessing}
              className="flex items-center gap-2 text-gray-600 hover:text-red-600"
            >
              <span>🔄</span>
              リセット
            </Button>
          )}
        </div>
      </div>
      
      {/* ステータス表示 */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>💡 ヒント: パーツを選択してシミュレーションを実行してください</span>
            {hasUpgrades && canAfford && (
              <span className="text-green-600">🏁 アップグレード準備完了</span>
            )}
            {hasUpgrades && !canAfford && (
              <span className="text-red-600">⚠️ 予算を確認してください</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isProcessing && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                {isSimulating ? 'シミュレーション中' : '処理中'}
              </span>
            )}
            {(hasChanges || hasUpgrades) && !isProcessing && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                {hasUpgrades ? `${hasUpgrades ? '選択中' : '未保存'}` : '未保存'}
              </span>
            )}
            {!hasChanges && !hasUpgrades && !isProcessing && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                最新
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionControls;
