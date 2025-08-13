// src/components/3d/CompatibilityVisualization.tsx
// 互換性視覚化システム - Step2完成版

import React from 'react';
import { Box, Line, Text } from '@react-three/drei';
import type { PCConfiguration, Part } from '@/types';

interface CompatibilityVisualizationProps {
  configuration: PCConfiguration;
  visible?: boolean;
}

interface CompatibilityIssue {
  type: 'size' | 'clearance' | 'power' | 'socket';
  severity: 'warning' | 'error';
  position: [number, number, number];
  message: string;
  color: string;
}

const CompatibilityVisualization: React.FC<CompatibilityVisualizationProps> = ({
  configuration,
  visible = true
}) => {
  if (!visible) return null;

  const { parts } = configuration;
  const issues = detectCompatibilityIssues(configuration);

  return (
    <group>
      {/* 互換性警告表示 */}
      {issues.map((issue, index) => (
        <group key={index}>
          {/* 警告アイコン */}
          <Box
            args={[0.02, 0.02, 0.02]}
            position={issue.position}
          >
            <meshBasicMaterial color={issue.color} />
          </Box>

          {/* 警告テキスト */}
          <Text
            position={[issue.position[0], issue.position[1] + 0.05, issue.position[2]]}
            fontSize={0.03}
            color={issue.color}
            anchorX="center"
            anchorY="middle"
          >
            {issue.message}
          </Text>

          {/* GPU長さ制限表示 */}
          {issue.type === 'size' && parts.gpu && (
            <GPUSizeVisualization 
              gpu={parts.gpu}
              caseData={parts.case || null}
            />
          )}

          {/* CPUクーラー高さ制限表示 */}
          {issue.type === 'clearance' && parts.cooler && (
            <CoolerClearanceVisualization 
              cooler={parts.cooler}
              caseData={parts.case || null}
            />
          )}

          {/* 電源容量不足警告 */}
          {issue.type === 'power' && parts.psu && (
            <PowerWarningVisualization 
              configuration={configuration}
            />
          )}
        </group>
      ))}
    </group>
  );
};

// 互換性問題検出関数
function detectCompatibilityIssues(configuration: PCConfiguration): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  const { parts } = configuration;

  // GPU長さチェック
  if (parts.gpu && parts.case) {
    const gpuLength = (parts.gpu.specifications?.length as number) || 0;
    const maxGpuLength = (parts.case.specifications?.maxGpuLength as number) || 350;
    
    if (gpuLength > maxGpuLength) {
      issues.push({
        type: 'size',
        severity: 'error',
        position: [-0.2, -0.28, -0.1],
        message: `GPU長${gpuLength}mm > 制限${maxGpuLength}mm`,
        color: '#ef4444'
      });
    } else if (gpuLength > maxGpuLength * 0.9) {
      issues.push({
        type: 'size',
        severity: 'warning',
        position: [-0.2, -0.28, -0.1],
        message: `GPU長ギリギリ`,
        color: '#f59e0b'
      });
    }
  }

  // CPUクーラー高さチェック
  if (parts.cooler && parts.case) {
    const coolerHeight = (parts.cooler.specifications?.height as number) || 0;
    const maxCoolerHeight = (parts.case.specifications?.maxCoolerHeight as number) || 165;
    
    if (coolerHeight > maxCoolerHeight) {
      issues.push({
        type: 'clearance',
        severity: 'error',
        position: [-0.35, 0.0, -0.35],
        message: `クーラー高${coolerHeight}mm > 制限${maxCoolerHeight}mm`,
        color: '#ef4444'
      });
    } else if (coolerHeight > maxCoolerHeight * 0.9) {
      issues.push({
        type: 'clearance',
        severity: 'warning',
        position: [-0.35, 0.0, -0.35],
        message: `クーラー高ギリギリ`,
        color: '#f59e0b'
      });
    }
  }

  // 電源容量チェック
  if (parts.psu) {
    const psuWattage = (parts.psu.specifications?.wattage as number) || 0;
    const totalPower = calculateTotalPower(configuration);
    
    if (psuWattage < totalPower) {
      issues.push({
        type: 'power',
        severity: 'error',
        position: [0.3, -0.8, -0.4],
        message: `電源容量不足: ${psuWattage}W < ${totalPower}W`,
        color: '#ef4444'
      });
    } else if (psuWattage < totalPower * 1.2) {
      issues.push({
        type: 'power',
        severity: 'warning',
        position: [0.3, -0.8, -0.4],
        message: `電源余裕少なめ`,
        color: '#f59e0b'
      });
    }
  }

  // CPUソケット互換性チェック
  if (parts.cpu && parts.motherboard) {
    const cpuSocket = parts.cpu.specifications?.socket as string;
    const mbSocket = parts.motherboard.specifications?.socket as string;
    
    if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
      issues.push({
        type: 'socket',
        severity: 'error',
        position: [-0.35, -0.16, -0.35],
        message: `ソケット不適合: ${cpuSocket} ≠ ${mbSocket}`,
        color: '#ef4444'
      });
    }
  }

  return issues;
}

// 総消費電力計算（簡易版）
function calculateTotalPower(configuration: PCConfiguration): number {
  const { parts } = configuration;
  let totalPower = 0;

  // CPU
  if (parts.cpu) {
    const cpuTdp = (parts.cpu.specifications?.tdp as number) || 65;
    totalPower += cpuTdp;
  }

  // GPU
  if (parts.gpu) {
    const gpuPower = (parts.gpu.specifications?.power as number) || 150;
    totalPower += gpuPower;
  }

  // その他パーツ（概算）
  totalPower += 50; // マザーボード、メモリ、ストレージ等

  return Math.round(totalPower);
}

// GPU長さ視覚化コンポーネント
const GPUSizeVisualization: React.FC<{
  gpu: Part;
  caseData: Part | null;
}> = ({ gpu, caseData }) => {
  const gpuLength = (gpu.specifications?.length as number) || 250;
  const maxLength = (caseData?.specifications?.maxGpuLength as number) || 350;
  const lengthInM = gpuLength / 1000;
  const maxLengthInM = maxLength / 1000;

  return (
    <group>
      {/* GPU実際の長さ線 */}
      <Line
        points={[
          [-0.2, -0.35, -0.1],
          [-0.2, -0.35, -0.1 - lengthInM]
        ]}
        color="#10b981"
        lineWidth={3}
      />
      
      {/* ケース制限線 */}
      <Line
        points={[
          [-0.2, -0.4, -0.1],
          [-0.2, -0.4, -0.1 - maxLengthInM]
        ]}
        color="#ef4444"
        lineWidth={2}
        dashed
      />

      {/* 寸法表示 */}
      <Text
        position={[-0.2, -0.32, -0.1 - lengthInM / 2]}
        fontSize={0.02}
        color="#10b981"
        anchorX="center"
      >
        {`${gpuLength}mm`}
      </Text>
    </group>
  );
};

// CPUクーラークリアランス視覚化コンポーネント
const CoolerClearanceVisualization: React.FC<{
  cooler: Part;
  caseData: Part | null;
}> = ({ cooler, caseData }) => {
  const coolerHeight = (cooler.specifications?.height as number) || 150;
  const maxHeight = (caseData?.specifications?.maxCoolerHeight as number) || 165;
  const heightInM = coolerHeight / 1000;
  const maxHeightInM = maxHeight / 1000;

  return (
    <group>
      {/* クーラー実際の高さ線 */}
      <Line
        points={[
          [-0.45, -0.16, -0.35],
          [-0.45, -0.16 + heightInM, -0.35]
        ]}
        color="#6b7280"
        lineWidth={3}
      />
      
      {/* ケース制限線 */}
      <Line
        points={[
          [-0.5, -0.16, -0.35],
          [-0.5, -0.16 + maxHeightInM, -0.35]
        ]}
        color="#ef4444"
        lineWidth={2}
        dashed
      />

      {/* 寸法表示 */}
      <Text
        position={[-0.47, -0.16 + heightInM / 2, -0.35]}
        fontSize={0.02}
        color="#6b7280"
        anchorX="center"
      >
        {`${coolerHeight}mm`}
      </Text>
    </group>
  );
};

// 電源警告視覚化コンポーネント
const PowerWarningVisualization: React.FC<{
  configuration: PCConfiguration;
}> = ({ configuration }) => {
  const totalPower = calculateTotalPower(configuration);
  const psuWattage = (configuration.parts.psu?.specifications?.wattage as number) || 0;
  const efficiency = Math.round((totalPower / psuWattage) * 100);

  return (
    <group>
      {/* 電力使用率表示 */}
      <Box
        args={[0.1, 0.02, 0.001]}
        position={[0.3, -0.7, -0.3]}
      >
        <meshBasicMaterial color={efficiency > 80 ? '#ef4444' : '#f59e0b'} />
      </Box>

      <Text
        position={[0.3, -0.65, -0.3]}
        fontSize={0.02}
        color="#ffffff"
        anchorX="center"
      >
        {`使用率: ${efficiency}%`}
      </Text>
    </group>
  );
};

export default CompatibilityVisualization;