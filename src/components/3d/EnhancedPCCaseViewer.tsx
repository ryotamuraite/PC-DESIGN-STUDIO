// src/components/3d/EnhancedPCCaseViewer.tsx
// Phase 3: 拡張3Dビューア - 全Phase 3機能統合版

import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import type { PCConfiguration } from '@/types';
import PCCase3D from './PCCase3D';
import LoadingSpinner from './LoadingSpinner';
import { 
  PartPlacementSimulator, 
  AnimationController, 
  CaseInternalViewer, 
  ClearanceChecker
} from './advanced';

// ClearanceResults型定義
interface ClearanceResults {
  gpu: {
    length: number;
    maxLength: number;
    clearance: number;
    status: 'ok' | 'warning' | 'error';
  };
  cooler: {
    height: number;
    maxHeight: number;
    clearance: number;
    status: 'ok' | 'warning' | 'error';
  };
  memory: {
    height: number;
    clearanceFromCooler: number;
    status: 'ok' | 'warning' | 'error';
  };
  cables: {
    powerClearance: number;
    sataConnectors: number;
    status: 'ok' | 'warning' | 'error';
  };
  overall: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
}

interface EnhancedPCCaseViewerProps {
  configuration: PCConfiguration;
  className?: string;
  
  // 基本設定
  showGrid?: boolean;
  enableControls?: boolean;
  cameraPosition?: [number, number, number];
  
  // Phase 3 機能制御
  enableAdvancedFeatures?: boolean;
  showPartPlacement?: boolean;
  caseViewMode?: 'normal' | 'transparent' | 'xray' | 'wireframe' | 'cross-section';
  showClearanceCheck?: boolean;
  showMeasurements?: boolean;
  measurementUnit?: 'mm' | 'cm' | 'inch';
  
  // コールバック
  onClearanceUpdate?: (results: ClearanceResults) => void;
  onViewModeChange?: (mode: string) => void;
}

export const EnhancedPCCaseViewer: React.FC<EnhancedPCCaseViewerProps> = ({
  configuration,
  className = '',
  showGrid = true,
  enableControls = true,
  cameraPosition = [5, 5, 5],
  
  // Phase 3 デフォルト設定
  enableAdvancedFeatures = true,
  showPartPlacement = true,
  caseViewMode = 'normal',
  showClearanceCheck = true,
  showMeasurements = true,
  measurementUnit = 'mm',
  
  onClearanceUpdate,
  onViewModeChange
}) => {
  const [webglError, setWebglError] = useState<string | null>(null);
  const [webglSupported, setWebglSupported] = useState(true);
  const [currentViewMode, setCurrentViewMode] = useState(caseViewMode);

  // WebGLサポートチェック
  React.useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setWebglSupported(false);
      setWebglError('WebGLがサポートされていません');
    }
  }, []);

  // ビューモード変更ハンドラ
  const handleViewModeChange = (mode: string) => {
    setCurrentViewMode(mode as 'normal' | 'transparent' | 'xray' | 'wireframe' | 'cross-section');
    onViewModeChange?.(mode);
  };



  // WebGLエラー時のフォールバック
  if (!webglSupported || webglError) {
    return (
      <div className={`relative w-full h-96 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden flex items-center justify-center ${className}`}>
        <div className="text-center text-white p-6">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-lg font-semibold mb-2">
            {webglError || '3D表示が利用できません'}
          </div>
          <div className="text-sm text-gray-300 mb-4">
            Phase 3高度機能には WebGL が必要です
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
          >
            ページを再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Phase 3 拡張3Dキャンバス */}
      <Canvas
        camera={{ 
          position: cameraPosition,
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        shadows
        gl={{ 
          antialias: true,
          preserveDrawingBuffer: false,
          alpha: false,
          depth: true,
          stencil: false
        }}
      >
        {/* 高品質ライティング */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <spotLight
          position={[0, 15, 0]}
          angle={0.3}
          penumbra={1}
          intensity={0.3}
          castShadow
        />

        {/* 環境設定 */}
        <Environment preset="studio" />
        
        {/* グリッド */}
        {showGrid && (
          <gridHelper 
            args={[20, 20, '#4f46e5', '#ffffff']}
            position={[0, 0, 0]}
          />
        )}

        {/* メイン3Dシーン */}
        <Suspense fallback={<LoadingSpinner />}>
          {enableAdvancedFeatures ? (
            <AnimationController 
              sequences={[]}
              autoPlay={false}
              speed={1.0}
            >
              {/* 拡張ケースビューア */}
              <CaseInternalViewer
                caseData={configuration.parts.case || null}
                viewMode={currentViewMode}
                transparencyLevel={0.3}
                showInternalLighting={true}
                showAirflow={currentViewMode === 'transparent' || currentViewMode === 'xray'}
                onViewModeChange={handleViewModeChange}
              />
              
              {/* パーツ配置シミュレーション */}
              {showPartPlacement && (
                <PartPlacementSimulator
                  configuration={configuration}
                  showClearanceInfo={true}
                />
              )}
              
              {/* クリアランスチェック */}
              {showClearanceCheck && (
                <ClearanceChecker
                  configuration={configuration}
                  showMeasurements={showMeasurements}
                  showWarnings={true}
                  highlightConflicts={true}
                  measurementUnit={measurementUnit}
                  onClearanceUpdate={onClearanceUpdate}
                />
              )}
            </AnimationController>
          ) : (
            /* 従来の3D表示（後方互換性） */
            <>
              <PCCase3D 
                caseData={configuration.parts.case || null}
                position={[0, 0, 0]}
                showLabel={true}
              />
            </>
          )}
        </Suspense>

        {/* カメラコントロール */}
        {enableControls && (
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={3}
            maxDistance={20}
            maxPolarAngle={Math.PI / 2}
            enableDamping={true}
            dampingFactor={0.05}
          />
        )}
      </Canvas>

      {/* Phase 3 強化UIオーバーレイ */}
      <EnhancedUIOverlay
        configuration={configuration}
        currentViewMode={currentViewMode}
        enableAdvancedFeatures={enableAdvancedFeatures}
        onToggleAdvanced={() => {}}
      />
    </div>
  );
};

// 強化UIオーバーレイ
const EnhancedUIOverlay: React.FC<{
  configuration: PCConfiguration;
  currentViewMode: string;
  enableAdvancedFeatures: boolean;
  onToggleAdvanced: () => void;
}> = ({ configuration, currentViewMode, enableAdvancedFeatures }) => {
  return (
    <>
      {/* 左上：Phase 3 情報 */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded text-sm">
        <div className="font-medium flex items-center">
          🚀 Phase 3 3Dビューア
          {enableAdvancedFeatures && (
            <span className="ml-2 px-2 py-0.5 bg-blue-500 rounded text-xs">拡張機能ON</span>
          )}
        </div>
        <div className="text-xs opacity-75 mt-1">
          ビューモード: {getViewModeLabel(currentViewMode)}
        </div>
        <div className="text-xs opacity-75">
          ドラッグ: 回転 | ホイール: ズーム | 右クリック: パン
        </div>
      </div>

      {/* 右下：構成情報 */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded text-sm">
        <div className="text-xs space-y-1">
          <div>パーツ数: {Object.values(configuration.parts).filter(Boolean).length}/9</div>
          <div>合計: ¥{configuration.totalPrice.toLocaleString()}</div>
          {configuration.totalPowerConsumption && (
            <div>消費電力: {configuration.totalPowerConsumption}W</div>
          )}
        </div>
      </div>

      {/* 左下：Phase 3 機能ステータス */}
      {enableAdvancedFeatures && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded text-sm">
          <div className="text-xs font-medium mb-1">🎯 Phase 3 機能</div>
          <div className="text-xs space-y-1">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              パーツ配置シミュレーション
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              クリアランスチェック
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
              アニメーション効果
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
              ケース内部ビュー
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ビューモードラベル取得
function getViewModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    'normal': '通常',
    'transparent': '透明',
    'xray': 'X線',
    'wireframe': 'ワイヤー',
    'cross-section': '断面'
  };
  return labels[mode] || mode;
}

export default EnhancedPCCaseViewer;