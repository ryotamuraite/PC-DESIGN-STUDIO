// src/components/3d/PCCaseViewer.tsx
// PC構成3D可視化メインコンポーネント - Phase3革新機能

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import type { PCConfiguration } from '@/types';
import PCCase3D from './PCCase3D';
import PartsRenderer from './PartsRenderer';
import LoadingSpinner from './LoadingSpinner';

interface PCCaseViewerProps {
  configuration: PCConfiguration;
  className?: string;
  showGrid?: boolean;
  enableControls?: boolean;
  cameraPosition?: [number, number, number];
}

export type { PCCaseViewerProps };

export const PCCaseViewer: React.FC<PCCaseViewerProps> = ({
  configuration,
  className = '',
  showGrid = true,
  enableControls = true,
  cameraPosition = [5, 5, 5]
}) => {
  return (
    <div className={`relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* 3Dキャンバス */}
      <Canvas
        camera={{ 
          position: cameraPosition,
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        shadows
        gl={{ antialias: true }}
      >
        {/* ライティング設定 */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        {/* 環境とグリッド */}
        <Environment preset="studio" />
        {showGrid && (
          <Grid
            args={[20, 20]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#ffffff"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#4f46e5"
            fadeDistance={25}
            fadeStrength={1}
          />
        )}

        {/* 3Dシーン本体 */}
        <Suspense fallback={<LoadingSpinner />}>
          {/* PCケース */}
          <PCCase3D 
            caseData={configuration.parts.case || null}
            position={[0, 0, 0]}
          />
          
          {/* パーツレンダリング */}
          <PartsRenderer 
            configuration={configuration}
            caseData={configuration.parts.case || null}
          />
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
          />
        )}
      </Canvas>

      {/* UI オーバーレイ */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded text-sm">
        <div className="font-medium">3D PC構成ビュー</div>
        <div className="text-xs opacity-75">
          ドラッグ: 回転 | ホイール: ズーム | 右クリック: パン
        </div>
      </div>

      {/* 構成情報 */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded text-sm">
        <div className="text-xs">
          パーツ数: {Object.values(configuration.parts).filter(Boolean).length}/9
        </div>
        <div className="text-xs">
          合計: ¥{configuration.totalPrice.toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default PCCaseViewer;