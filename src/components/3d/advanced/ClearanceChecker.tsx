// src/components/3d/advanced/ClearanceChecker.tsx
// Phase 3: サイズ確認機能強化 - 物理的制約の可視化

import React, { useState, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Line, Html, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import type { PCConfiguration, Part } from '@/types';

interface ClearanceCheckerProps {
  configuration: PCConfiguration;
  showMeasurements?: boolean;
  showWarnings?: boolean;
  highlightConflicts?: boolean;
  measurementUnit?: 'mm' | 'cm' | 'inch';
  onClearanceUpdate?: (results: ClearanceResults) => void;
}

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

export const ClearanceChecker: React.FC<ClearanceCheckerProps> = ({
  configuration,
  showMeasurements = true,
  showWarnings = true,
  highlightConflicts = true,
  measurementUnit = 'mm',
  onClearanceUpdate
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [animationTime, setAnimationTime] = useState(0);
  
  // クリアランス計算
  const clearanceResults = useMemo((): ClearanceResults => {
    const { parts } = configuration;
    const results: ClearanceResults = {
      gpu: { length: 0, maxLength: 0, clearance: 0, status: 'ok' },
      cooler: { height: 0, maxHeight: 0, clearance: 0, status: 'ok' },
      memory: { height: 0, clearanceFromCooler: 0, status: 'ok' },
      cables: { powerClearance: 0, sataConnectors: 0, status: 'ok' },
      overall: { score: 100, issues: [], recommendations: [] }
    };

    // GPU クリアランスチェック
    if (parts.gpu && parts.case) {
      const gpuLength = (parts.gpu.specifications?.length as number) || 300;
      const caseMaxGPU = (parts.case.specifications?.maxGPULength as number) || 350;
      results.gpu = {
        length: gpuLength,
        maxLength: caseMaxGPU,
        clearance: caseMaxGPU - gpuLength,
        status: gpuLength > caseMaxGPU ? 'error' : gpuLength > caseMaxGPU * 0.9 ? 'warning' : 'ok'
      };
    }

    // CPUクーラー クリアランスチェック
    if (parts.cooler && parts.case) {
      const coolerHeight = (parts.cooler.specifications?.height as number) || 150;
      const caseMaxCooler = (parts.case.specifications?.maxCoolerHeight as number) || 170;
      results.cooler = {
        height: coolerHeight,
        maxHeight: caseMaxCooler,
        clearance: caseMaxCooler - coolerHeight,
        status: coolerHeight > caseMaxCooler ? 'error' : coolerHeight > caseMaxCooler * 0.9 ? 'warning' : 'ok'
      };
    }

    // メモリとクーラーのクリアランス
    if (parts.memory && parts.cooler) {
      const memoryHeight = (parts.memory.specifications?.height as number) || 35;
      const coolerOverhang = (parts.cooler.specifications?.memoryOverhang as number) || 0;
      const clearance = memoryHeight - coolerOverhang;
      results.memory = {
        height: memoryHeight,
        clearanceFromCooler: clearance,
        status: clearance < 0 ? 'error' : clearance < 5 ? 'warning' : 'ok'
      };
    }

    // ケーブルクリアランス
    if (parts.psu && parts.case) {
      const psuLength = (parts.psu.specifications?.length as number) || 150;
      const caseDepth = (parts.case.specifications?.psuClearance as number) || 180;
      results.cables = {
        powerClearance: caseDepth - psuLength,
        sataConnectors: (parts.psu.specifications?.sataConnectors as number) || 4,
        status: psuLength > caseDepth ? 'error' : 'ok'
      };
    }

    // 総合スコア計算
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    if (results.gpu.status === 'error') {
      issues.push(`GPU長が${results.gpu.clearance * -1}mm超過`);
      score -= 30;
    } else if (results.gpu.status === 'warning') {
      recommendations.push('より短いGPUを検討');
      score -= 10;
    }

    if (results.cooler.status === 'error') {
      issues.push(`CPUクーラーが${results.cooler.clearance * -1}mm超過`);
      score -= 25;
    } else if (results.cooler.status === 'warning') {
      recommendations.push('より低いクーラーを検討');
      score -= 5;
    }

    if (results.memory.status === 'error') {
      issues.push('メモリとクーラーが干渉');
      score -= 20;
    }

    results.overall = { score, issues, recommendations };
    return results;
  }, [configuration]);

  // 結果の更新通知
  React.useEffect(() => {
    onClearanceUpdate?.(clearanceResults);
  }, [clearanceResults, onClearanceUpdate]);

  // アニメーション更新
  useFrame((state) => {
    setAnimationTime(state.clock.getElapsedTime());
  });

  // 単位変換
  const convertUnit = (mm: number): { value: number; unit: string } => {
    switch (measurementUnit) {
      case 'cm':
        return { value: Math.round(mm / 10 * 10) / 10, unit: 'cm' };
      case 'inch':
        return { value: Math.round(mm / 25.4 * 100) / 100, unit: '"' };
      default:
        return { value: Math.round(mm), unit: 'mm' };
    }
  };

  return (
    <group ref={groupRef}>
      {/* GPU クリアランス表示 */}
      {configuration.parts.gpu && showMeasurements && (
        <GPUClearanceVisualization
          gpu={configuration.parts.gpu}
          caseData={configuration.parts.case || null}
          results={clearanceResults.gpu}
          convertUnit={convertUnit}
          highlightConflict={highlightConflicts && clearanceResults.gpu.status === 'error'}
          animationTime={animationTime}
        />
      )}

      {/* CPUクーラー クリアランス表示 */}
      {configuration.parts.cooler && showMeasurements && (
        <CoolerClearanceVisualization
          cooler={configuration.parts.cooler}
          caseData={configuration.parts.case || null}
          results={clearanceResults.cooler}
          convertUnit={convertUnit}
          highlightConflict={highlightConflicts && clearanceResults.cooler.status === 'error'}
          animationTime={animationTime}
        />
      )}

      {/* メモリクリアランス表示 */}
      {configuration.parts.memory && configuration.parts.cooler && showMeasurements && (
        <MemoryClearanceVisualization
          memory={configuration.parts.memory}
          cooler={configuration.parts.cooler}
          results={clearanceResults.memory}
          convertUnit={convertUnit}
          highlightConflict={highlightConflicts && clearanceResults.memory.status === 'error'}
          animationTime={animationTime}
        />
      )}

      {/* ケーブル配線クリアランス */}
      {configuration.parts.psu && showMeasurements && (
        <CableClearanceVisualization
          psu={configuration.parts.psu}
          caseData={configuration.parts.case || null}
          results={clearanceResults.cables}
          convertUnit={convertUnit}
          animationTime={animationTime}
        />
      )}

      {/* 警告表示 */}
      {showWarnings && clearanceResults.overall.issues.length > 0 && (
        <ClearanceWarningDisplay
          results={clearanceResults}
          animationTime={animationTime}
        />
      )}

      {/* クリアランスサマリー */}
      <ClearanceSummaryDisplay
        results={clearanceResults}
        convertUnit={convertUnit}
      />
    </group>
  );
};

// GPU クリアランス可視化
const GPUClearanceVisualization: React.FC<{
  gpu: Part;
  caseData: Part | null;
  results: ClearanceResults['gpu'];
  convertUnit: (mm: number) => { value: number; unit: string };
  highlightConflict: boolean;
  animationTime: number;
}> = ({ results, convertUnit, highlightConflict, animationTime }) => {
  const gpuLength = results.length / 1000; // mmをm単位に変換
  const maxLength = results.maxLength / 1000;
  
  const conflictColor = highlightConflict ? 
    `hsl(${Math.sin(animationTime * 10) * 30 + 360}, 100%, 50%)` : '#ef4444';

  return (
    <group position={[0, 0, 0]}>
      {/* GPU長さ表示 */}
      <Box
        args={[gpuLength, 0.02, 0.05]}
        position={[gpuLength/2, -0.03, 0]}
      >
        <meshStandardMaterial 
          color={results.status === 'error' ? conflictColor : '#10b981'}
          transparent
          opacity={0.7}
        />
      </Box>

      {/* 最大長表示 */}
      <Box
        args={[maxLength, 0.01, 0.05]}
        position={[maxLength/2, -0.05, 0]}
      >
        <meshStandardMaterial 
          color="#6b7280"
          transparent
          opacity={0.5}
        />
      </Box>

      {/* 測定線 */}
      <Line
        points={[
          [0, 0.1, 0],
          [gpuLength, 0.1, 0],
          [gpuLength, 0.15, 0],
          [0, 0.15, 0]
        ]}
        color={results.status === 'error' ? '#ef4444' : '#10b981'}
        lineWidth={2}
      />

      {/* 寸法表示 */}
      <Html
        position={[gpuLength/2, 0.2, 0]}
        center
        distanceFactor={8}
      >
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          results.status === 'error' 
            ? 'bg-red-500 text-white' 
            : results.status === 'warning'
            ? 'bg-yellow-500 text-black'
            : 'bg-green-500 text-white'
        }`}>
          GPU: {convertUnit(results.length).value}{convertUnit(results.length).unit}
          <br />
          最大: {convertUnit(results.maxLength).value}{convertUnit(results.maxLength).unit}
          {results.clearance !== 0 && (
            <>
              <br />
              余裕: {convertUnit(Math.abs(results.clearance)).value}{convertUnit(Math.abs(results.clearance)).unit}
            </>
          )}
        </div>
      </Html>
    </group>
  );
};

// CPUクーラー クリアランス可視化
const CoolerClearanceVisualization: React.FC<{
  cooler: Part;
  caseData: Part | null;
  results: ClearanceResults['cooler'];
  convertUnit: (mm: number) => { value: number; unit: string };
  highlightConflict: boolean;
  animationTime: number;
}> = ({ results, convertUnit, highlightConflict, animationTime }) => {
  const coolerHeight = results.height / 1000;
  const maxHeight = results.maxHeight / 1000;
  
  const conflictColor = highlightConflict ? 
    `hsl(${Math.sin(animationTime * 10) * 30 + 360}, 100%, 50%)` : '#ef4444';

  return (
    <group position={[-0.3, 0, -0.3]}>
      {/* クーラー高さ表示 */}
      <Box
        args={[0.05, coolerHeight, 0.05]}
        position={[0, coolerHeight/2, 0]}
      >
        <meshStandardMaterial 
          color={results.status === 'error' ? conflictColor : '#8b5cf6'}
          transparent
          opacity={0.7}
        />
      </Box>

      {/* 最大高さ表示 */}
      <Box
        args={[0.07, maxHeight, 0.07]}
        position={[0, maxHeight/2, 0]}
      >
        <meshStandardMaterial 
          color="#6b7280"
          transparent
          opacity={0.3}
          wireframe
        />
      </Box>

      {/* 測定線 */}
      <Line
        points={[
          [0.1, 0, 0],
          [0.1, coolerHeight, 0],
          [0.15, coolerHeight, 0],
          [0.15, 0, 0]
        ]}
        color={results.status === 'error' ? '#ef4444' : '#8b5cf6'}
        lineWidth={2}
      />

      {/* 寸法表示 */}
      <Html
        position={[0.2, coolerHeight/2, 0]}
        center
        distanceFactor={8}
      >
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          results.status === 'error' 
            ? 'bg-red-500 text-white' 
            : results.status === 'warning'
            ? 'bg-yellow-500 text-black'
            : 'bg-purple-500 text-white'
        }`}>
          クーラー: {convertUnit(results.height).value}{convertUnit(results.height).unit}
          <br />
          最大: {convertUnit(results.maxHeight).value}{convertUnit(results.maxHeight).unit}
          {results.clearance !== 0 && (
            <>
              <br />
              余裕: {convertUnit(Math.abs(results.clearance)).value}{convertUnit(Math.abs(results.clearance)).unit}
            </>
          )}
        </div>
      </Html>
    </group>
  );
};

// メモリクリアランス可視化
const MemoryClearanceVisualization: React.FC<{
  memory: Part;
  cooler: Part;
  results: ClearanceResults['memory'];
  convertUnit: (mm: number) => { value: number; unit: string };
  highlightConflict: boolean;
  animationTime: number;
}> = ({ results, convertUnit, highlightConflict, animationTime }) => {
  const conflictColor = highlightConflict ? 
    `hsl(${Math.sin(animationTime * 10) * 30 + 360}, 100%, 50%)` : '#ef4444';

  return (
    <group position={[-0.1, 0, -0.3]}>
      {/* メモリとクーラーの干渉チェック表示 */}
      {results.status === 'error' && (
        <>
          <Cylinder
            args={[0.1, 0.1, 0.02]}
            position={[0, 0.1, 0]}
            rotation={[Math.PI/2, 0, 0]}
          >
            <meshStandardMaterial 
              color={conflictColor}
              transparent
              opacity={0.8}
            />
          </Cylinder>
          
          <Html
            position={[0, 0.2, 0]}
            center
            distanceFactor={8}
          >
            <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
              ⚠️ メモリ干渉
              <br />
              {convertUnit(Math.abs(results.clearanceFromCooler)).value}{convertUnit(Math.abs(results.clearanceFromCooler)).unit} 超過
            </div>
          </Html>
        </>
      )}
    </group>
  );
};

// ケーブル配線クリアランス可視化
const CableClearanceVisualization: React.FC<{
  psu: Part;
  caseData: Part | null;
  results: ClearanceResults['cables'];
  convertUnit: (mm: number) => { value: number; unit: string };
  animationTime: number;
}> = ({ results, convertUnit }) => {
  return (
    <group position={[0.3, -0.6, -0.4]}>
      {/* ケーブル配線経路表示 */}
      <Line
        points={[
          [0, 0.2, 0.2],      // PSUから
          [0, 0.4, 0.4],      // 上方向
          [-0.6, 0.6, 0.7],   // CPU電源へ
          [-0.3, 0.2, -0.3]   // マザーボード24pin
        ]}
        color={results.status === 'error' ? '#ef4444' : '#f59e0b'}
        lineWidth={3}
      />

      {/* ケーブルクリアランス情報 */}
      <Html
        position={[0, 0.3, 0]}
        center
        distanceFactor={10}
      >
        <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
          ケーブル配線
          <br />
          余裕: {convertUnit(results.powerClearance).value}{convertUnit(results.powerClearance).unit}
        </div>
      </Html>
    </group>
  );
};

// クリアランス警告表示
const ClearanceWarningDisplay: React.FC<{
  results: ClearanceResults;
  animationTime: number;
}> = ({ results, animationTime }) => {
  const pulseOpacity = 0.7 + Math.sin(animationTime * 3) * 0.3;

  return (
    <Html
      position={[0, 2, 0]}
      center
      distanceFactor={6}
    >
      <div 
        className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg border-2 border-red-300"
        style={{ opacity: pulseOpacity }}
      >
        <div className="font-bold text-sm mb-2">⚠️ クリアランス警告</div>
        <div className="space-y-1">
          {results.overall.issues.map((issue, index) => (
            <div key={index} className="text-xs">• {issue}</div>
          ))}
        </div>
        <div className="text-xs mt-2 opacity-80">
          適合性スコア: {results.overall.score}/100
        </div>
      </div>
    </Html>
  );
};

// クリアランスサマリー表示
const ClearanceSummaryDisplay: React.FC<{
  results: ClearanceResults;
  convertUnit: (mm: number) => { value: number; unit: string };
}> = ({ results, convertUnit }) => {
  return (
    <Html
      position={[1.5, 0.5, 0]}
      center
      distanceFactor={8}
    >
      <div className="bg-black bg-opacity-80 text-white p-3 rounded-lg shadow-lg">
        <div className="font-bold text-sm mb-2">💡 クリアランス情報</div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span>GPU長：</span>
            <span className={results.gpu.status === 'error' ? 'text-red-400' : 'text-green-400'}>
              {convertUnit(results.gpu.length).value}{convertUnit(results.gpu.length).unit}
            </span>
          </div>
          <div className="flex justify-between">
            <span>クーラー高：</span>
            <span className={results.cooler.status === 'error' ? 'text-red-400' : 'text-purple-400'}>
              {convertUnit(results.cooler.height).value}{convertUnit(results.cooler.height).unit}
            </span>
          </div>
          <div className="flex justify-between">
            <span>適合性：</span>
            <span className={`font-bold ${
              results.overall.score >= 90 ? 'text-green-400' :
              results.overall.score >= 70 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {results.overall.score}/100
            </span>
          </div>
        </div>
        
        {results.overall.recommendations.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-600">
            <div className="text-xs font-medium mb-1">推奨事項：</div>
            {results.overall.recommendations.map((rec, index) => (
              <div key={index} className="text-xs text-yellow-300">• {rec}</div>
            ))}
          </div>
        )}
      </div>
    </Html>
  );
};

export default ClearanceChecker;