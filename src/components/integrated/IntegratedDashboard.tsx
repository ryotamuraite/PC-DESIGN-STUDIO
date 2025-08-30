// src/components/integrated/IntegratedDashboard.tsx
// 🚀 革命的統合ダッシュボード - 3Dビュー内サマリーオーバーレイ版

import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2, Monitor, Tablet, Smartphone, Settings, Info } from 'lucide-react';
import type { PCConfiguration } from '@/types';
import { PCCaseViewer } from '@/components/3d/PCCaseViewer';
import { ConfigSummary } from '@/components/summary/ConfigSummary';

export interface IntegratedDashboardProps {
  configuration: PCConfiguration;
  className?: string;
}

type LayoutMode = 'desktop' | 'tablet' | 'mobile';
type SummaryPosition = 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';

export const IntegratedDashboard: React.FC<IntegratedDashboardProps> = ({
  configuration,
  className = ''
}) => {
  // レスポンシブレイアウト検出
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('desktop');
  const [summaryPosition, setSummaryPosition] = useState<SummaryPosition>('top-right');
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);
  const [summaryMinimized, setSummaryMinimized] = useState(false);

  // 画面サイズ検出
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1200) {
        setLayoutMode('desktop');
        setSummaryCollapsed(false);
      } else if (width >= 768) {
        setLayoutMode('tablet');
        setSummaryCollapsed(false);
      } else {
        setLayoutMode('mobile');
        setSummaryCollapsed(true); // モバイルではデフォルトで折りたたみ
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // サマリー表示クラス生成
  const getSummaryClasses = () => {
    const baseClasses = "absolute bg-white rounded-lg shadow-xl border transition-all duration-300 z-10 overflow-hidden";
    
    // レイアウトモード別サイズ（大幅縮小）
    let sizeClasses = "";
    let positionClasses = "";
    
    if (layoutMode === 'desktop') {
      sizeClasses = summaryCollapsed ? "w-72 max-h-96" : "w-80 max-h-screen";
    } else if (layoutMode === 'tablet') {
      sizeClasses = summaryCollapsed ? "w-52 max-h-64" : "w-56 max-h-72"; // Tablet大幅縮小
    } else {
      sizeClasses = summaryCollapsed ? "w-48 max-h-40" : "w-52 max-h-48"; // Mobile更に縮小
    }

    // 位置設定（メインエリア内相対位置）
    switch (summaryPosition) {
      case 'top-right':
        positionClasses = "top-4 right-4";
        break;
      case 'bottom-right':
        positionClasses = "bottom-4 right-4";
        break;
      case 'bottom-left':
        positionClasses = "bottom-4 left-4";
        break;
      case 'top-left':
        positionClasses = "top-4 left-4";
        break;
    }

    return `${baseClasses} ${sizeClasses} ${positionClasses}`;
  };

  // 最小化時の簡易サマリー
  const renderMinimizedSummary = () => (
    <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-sm">
            <span className="font-medium text-gray-700">¥</span>
            <span className="text-lg font-bold text-blue-600">
              {(configuration.totalPrice || 0).toLocaleString()}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            パーツ: {Object.values(configuration.parts).filter(Boolean).length}/9
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <button
            onClick={() => setSummaryMinimized(false)}
            className="text-blue-500 hover:text-blue-700 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`w-full h-full flex flex-col bg-gray-50 ${className}`}>
      
      {/* 統合ダッシュボード専用コントロール（App.tsxヘッダーと統合） */}
      <div className="flex-shrink-0 bg-blue-50 border-b border-blue-200 z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2">
            
            {/* 左側: レイアウトモード表示 */}
            <div className="flex items-center gap-2 text-sm text-blue-700">
              {layoutMode === 'desktop' && <Monitor className="w-4 h-4" />}
              {layoutMode === 'tablet' && <Tablet className="w-4 h-4" />}
              {layoutMode === 'mobile' && <Smartphone className="w-4 h-4" />}
              <span className="capitalize font-medium">{layoutMode} Mode</span>
            </div>

            {/* 右側: サマリーコントロール */}
            <div className="flex items-center gap-2">
            
            {/* サマリー位置選択（デスクトップのみ） */}
            {layoutMode === 'desktop' && (
              <div className="flex bg-blue-100 rounded p-1">
                {(['top-right', 'bottom-right', 'bottom-left', 'top-left'] as SummaryPosition[]).map((position) => (
                  <button
                    key={position}
                    onClick={() => setSummaryPosition(position)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      summaryPosition === position
                        ? 'bg-blue-500 text-white'
                        : 'text-blue-600 hover:bg-blue-200'
                    }`}
                  >
                    {position === 'top-right' ? '右上' :
                     position === 'bottom-right' ? '右下' :
                     position === 'bottom-left' ? '左下' : '左上'}
                  </button>
                ))}
              </div>
            )}

            {/* サマリー表示制御 */}
            <button
              onClick={() => setSummaryCollapsed(!summaryCollapsed)}
              className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
            >
              {summaryCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{summaryCollapsed ? 'サマリー表示' : 'サマリー最小化'}</span>
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* メイン3D表示エリア（シンプル・最適化） */}
      <div className="flex-1 relative overflow-hidden bg-gray-900">
        {/* 3Dビューコンテナ */}
        <div className="w-full h-full">
        <PCCaseViewer
          configuration={configuration}
          className="w-full h-full"
          showGrid={true}
          enableControls={true}
          cameraPosition={
            layoutMode === 'mobile' ? [4, 4, 4] : 
            layoutMode === 'tablet' ? [4.5, 4.5, 4.5] : [5, 5, 5]
          }
        />

        {/* 3D表示オーバーレイ情報 */}
        <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg z-10">
          🎆 3D PC構成ビュー
        </div>

        {/* 3D操作ヒント */}
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 text-gray-900 border border-gray-300 px-3 py-2 rounded-lg text-sm shadow-lg z-10">
          🖱️ ドラッグ回転 | 🎯 ホイールズーム | 📱 右クリックパン
        </div>
        </div>

        {/* オーバーレイサマリー（メインエリア直下） */}
      {!summaryCollapsed && (
        <div className={getSummaryClasses()}>
          {/* サマリーヘッダー */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-t-lg border-b">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800 text-sm">構成サマリー</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* 位置移動ボタン（デスクトップ・タブレットのみ） */}
              {layoutMode !== 'mobile' && (
                <button
                  onClick={() => {
                    const positions: SummaryPosition[] = ['top-right', 'bottom-right', 'bottom-left', 'top-left'];
                    const currentIndex = positions.indexOf(summaryPosition);
                    const nextPosition = positions[(currentIndex + 1) % positions.length];
                    setSummaryPosition(nextPosition);
                  }}
                  className="text-green-600 hover:text-green-800 transition-colors"
                  title="位置移動"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
              
              {/* 最小化ボタン */}
              <button
                onClick={() => setSummaryMinimized(true)}
                className="text-green-600 hover:text-green-800 transition-colors"
                title="最小化"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              
              {/* 閉じるボタン */}
              <button
                onClick={() => setSummaryCollapsed(true)}
                className="text-green-600 hover:text-green-800 transition-colors text-lg leading-none"
                title="閉じる"
              >
                ×
              </button>
            </div>
          </div>

          {/* サマリー本体 */}
          <div className="flex-1 overflow-y-auto overscroll-contain" style={{
            minHeight: layoutMode === 'mobile' ? '120px' : layoutMode === 'tablet' ? '160px' : '200px',
            maxHeight: layoutMode === 'mobile' ? 
              (summaryCollapsed ? '120px' : '160px') :
              layoutMode === 'tablet' ? '240px' : '400px'
          }}>
            {summaryMinimized ? renderMinimizedSummary() : (
              <ConfigSummary
                configuration={configuration}
                className="border-0 shadow-none m-0 rounded-none"
              />
            )}
          </div>
        </div>
      )}

        {/* 最小化状態のクイックサマリー（メインエリア内） */}
        {summaryCollapsed && (
          <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-xl border p-3 z-10">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  ¥{(configuration.totalPrice || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">合計価格</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {Object.values(configuration.parts).filter(Boolean).length}
                </div>
                <div className="text-xs text-gray-600">パーツ数</div>
              </div>
              <button
                onClick={() => setSummaryCollapsed(false)}
                className="text-blue-500 hover:text-blue-700 transition-colors"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ステータスバー（シンプル） */}
      <div className="flex-shrink-0 bg-gray-800 text-white z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 text-xs">
          <div className="flex items-center gap-4">
            <span>💾 自動保存済み</span>
            <span className="hidden sm:inline">⚡ 互換性チェック完了</span>
            <span className="hidden md:inline">🎯 3D レンダリング中</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-green-400">✅ 正常動作</span>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegratedDashboard;