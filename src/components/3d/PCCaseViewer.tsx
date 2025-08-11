// src/components/3d/PCCaseViewer.tsx
// PC構成3D可視化メインコンポーネント - Phase3革新機能

import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
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
  showUIOverlay?: boolean; // UIオーバーレイの表示制御
  showCaseLabel?: boolean; // 3Dモデル内ケースラベルの表示制御
}

export type { PCCaseViewerProps };

export const PCCaseViewer: React.FC<PCCaseViewerProps> = ({
  configuration,
  className = '',
  showGrid = true,
  enableControls = true,
  cameraPosition = [5, 5, 5],
  showUIOverlay = true,
  showCaseLabel = true
}) => {
  const [webglError, setWebglError] = useState<string | null>(null);
  const [webglSupported, setWebglSupported] = useState(true);
  const [contextLostCount, setContextLostCount] = useState(0);

  // WebGLサポートチェック
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setWebglSupported(false);
      setWebglError('WebGLがサポートされていません');
    }
  }, []);
  // WebGLエラー時のフォールバック表示
  if (!webglSupported || webglError) {
    return (
      <div 
        className={`relative w-full h-96 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden flex items-center justify-center ${className}`}
      >
        <div className="text-center text-white p-6">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-lg font-semibold mb-2">
            {webglError || '3D表示が利用できません'}
          </div>
          <div className="text-sm text-gray-300 mb-4">
            選択中パーツ: {Object.values(configuration.parts).filter(Boolean).length}/9
          </div>
          {contextLostCount > 0 && (
            <div className="text-xs text-yellow-300 mb-4">
              コンテキストロスト回数: {contextLostCount}
            </div>
          )}
          <div className="text-xs text-gray-400">
            ブラウザを更新するか、GPUドライバーを更新してください
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
    <div 
      className={`relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden ${className}`}
      onContextMenu={(e) => e.preventDefault()} // 右クリックメニューを禁止
    >
      {/* 3Dキャンバス */}
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
          failIfMajorPerformanceCaveat: false,
          powerPreference: "default",
          alpha: false,
          depth: true,
          stencil: false,
          premultipliedAlpha: false
        }}
        onCreated={({ gl, scene, camera }) => {
          // WebGLコンテキストロストイベントハンドラ
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            console.warn('WebGL context lost, preventing default');
            event.preventDefault();
            setContextLostCount(prev => prev + 1);
            setWebglError('「WebGLコンテキストが失われました。復旧を試みています...」');
          });
          
          gl.domElement.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored - reinitializing scene');
            setWebglError(null);
            // シーンの再初期化
            try {
              gl.setSize(gl.domElement.width, gl.domElement.height);
              gl.render(scene, camera);
            } catch (error) {
              console.error('Failed to restore WebGL context:', error);
              setWebglError('「WebGLコンテキストの復旧に失敗しました」');
            }
          });
          
          // WebGL機能チェック
          const hasWebGL2 = gl.capabilities.isWebGL2;
          const maxTextureSize = gl.capabilities.maxTextureSize;
          console.log('WebGL Info:', { hasWebGL2, maxTextureSize });
        }}
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

        {/* 環境設定 */}
        <Environment preset="studio" />
        
        {/* カスタムグリッド（安定版） */}
        {showGrid && (
          <gridHelper 
            args={[20, 20, '#4f46e5', '#ffffff']}
            position={[0, 0, 0]}
          />
        )}

        {/* 3Dシーン本体 */}
        <Suspense fallback={<LoadingSpinner />}>
          {/* PCケース */}
          <PCCase3D 
            caseData={configuration.parts.case || null}
            position={[0, 0, 0]}
            showLabel={showCaseLabel}
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

      {/* UI オーバーレイ（表示制御対応） */}
      {showUIOverlay && (
        <>
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded text-sm">
            <div className="font-medium">3D PC構成ビュー</div>
            <div className="text-xs opacity-75">
              ドラッグ: 回転 | ホイール: ズーム | 右クリック: パン
            </div>
          </div>

          <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded text-sm">
            <div className="text-xs">
              パーツ数: {Object.values(configuration.parts).filter(Boolean).length}/9
            </div>
            <div className="text-xs">
              合計: ¥{configuration.totalPrice.toLocaleString()}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PCCaseViewer;