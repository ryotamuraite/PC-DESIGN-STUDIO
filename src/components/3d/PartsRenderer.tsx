// src/components/3d/PartsRenderer.tsx
// PCパーツ3Dレンダリングコンポーネント - Phase3革新機能 + 現実的配置システム

import React, { useState } from 'react';
import { Box, Cylinder } from '@react-three/drei';
import type { PCConfiguration, Part } from '@/types';
import SmartPartLabel from './SmartPartLabel';
import CompatibilityVisualization from './CompatibilityVisualization';

// 🎯 ケース内座標系統一（現実的配置）
const CASE_COORDINATES = {
  // ケースサイズ（PCCase3Dと統一）
  width: 2.0,    // X軸（左右）
  height: 1.8,   // Y軸（上下）
  depth: 1.5,    // Z軸（前後）
  
  // 主要マウント位置（既存PCCase3D定義を活用）
  motherboardMount: [-0.3, -0.18, -0.3] as [number, number, number],
  psuMount: [0.3, -0.8, -0.4] as [number, number, number],
  driveMount: [0.5, 0.1, 0.4] as [number, number, number],
  
  // 新規定義：現実的パーツ配置エリア
  cpuArea: [-0.35, -0.16, -0.35] as [number, number, number],    // マザーボード上CPU位置
  memoryArea: [-0.15, -0.16, -0.5] as [number, number, number],  // マザーボード右側
  gpuArea: [-0.2, -0.28, -0.1] as [number, number, number],      // PCIeスロット位置
  coolerArea: [-0.35, 0.0, -0.35] as [number, number, number],   // CPU上空
  storageArea: [-0.1, -0.16, -0.6] as [number, number, number],  // マザーボード上M.2位置
};

interface PartsRendererProps {
  configuration: PCConfiguration;
  caseData: Part | null;
  showCompatibilityWarnings?: boolean;
}

export const PartsRenderer: React.FC<PartsRendererProps> = ({
  configuration,
  showCompatibilityWarnings = true
}) => {
  const { parts } = configuration;
  const [labelPositions, setLabelPositions] = useState<Array<[number, number, number]>>([]);

  // ラベル位置の更新コールバック
  const handleLabelPositionUpdate = (index: number, position: [number, number, number]) => {
    setLabelPositions(prev => {
      const newPositions = [...prev];
      newPositions[index] = position;
      return newPositions;
    });
  };

  // 🎯 アクティブパーツの情報を収集（ケース内現実的配置）
  const activeParts = [
    { part: parts.cpu, position: CASE_COORDINATES.cpuArea, name: 'CPU', color: '#3b82f6' },
    { part: parts.gpu, position: calculateGPUPosition(parts.gpu), name: 'GPU', color: '#10b981' },
    { part: parts.memory, position: CASE_COORDINATES.memoryArea, name: 'Memory', color: '#8b5cf6' },
    { part: parts.storage, position: calculateStoragePosition(parts.storage), name: 'Storage', color: '#f59e0b' },
    { part: parts.psu, position: CASE_COORDINATES.psuMount, name: 'PSU', color: '#ef4444' },
    { part: parts.cooler, position: calculateCoolerPosition(parts.cooler), name: 'Cooler', color: '#6b7280' },
  ].filter(item => item.part !== null && item.part !== undefined);

  // 🎯 パーツサイズ対応：GPU位置計算
  function calculateGPUPosition(gpu: Part | null | undefined): [number, number, number] {
    if (!gpu) return CASE_COORDINATES.gpuArea;
    
    const basePos = CASE_COORDINATES.gpuArea;
    const gpuLength = (gpu.specifications?.length as number || 250) / 1000; // mm → m変換
    
    // GPU長に応じた位置調整（ケース前面からの配置）
    return [
      basePos[0],
      basePos[1],
      basePos[2] - (gpuLength * 0.8) // 3D座標系でのスケール調整
    ];
  }

  // 🎯 パーツサイズ対応：ストレージ位置計算
  function calculateStoragePosition(storage: Part | null | undefined): [number, number, number] {
    if (!storage) return CASE_COORDINATES.storageArea;
    
    const interfaceSpec = storage.specifications?.interface as string || '';
    const formFactor = storage.specifications?.formFactor as string || '';
    const isNVMe = interfaceSpec.includes('NVMe') || formFactor.includes('M.2');
    
    if (isNVMe) {
      // M.2 NVMe：マザーボード上配置
      return CASE_COORDINATES.storageArea;
    } else {
      // 2.5" SSD/HDD：ドライブベイ配置
      return CASE_COORDINATES.driveMount;
    }
  }

  // 🎯 パーツサイズ対応：CPUクーラー位置計算
  function calculateCoolerPosition(cooler: Part | null | undefined): [number, number, number] {
    if (!cooler) return CASE_COORDINATES.coolerArea;
    
    const basePos = CASE_COORDINATES.coolerArea;
    const coolerHeight = (cooler.specifications?.height as number || 150) / 1000; // mm → m変換
    
    // クーラー高さに応じた位置調整
    return [
      basePos[0],
      basePos[1] + (coolerHeight * 0.5), // 高さ反映
      basePos[2]
    ];
  }

  return (
    <group>
      {/* 🎯 現実的ケース内配置システム */}
      
      {/* CPU */}
      {parts.cpu && (
        <group>
          <CPUComponent 
            position={CASE_COORDINATES.cpuArea} 
            cpuData={parts.cpu}
          />
        </group>
      )}

      {/* GPU */}
      {parts.gpu && (
        <group>
          <GPUComponent 
            position={calculateGPUPosition(parts.gpu)} 
            gpuData={parts.gpu}
          />
        </group>
      )}

      {/* メモリ */}
      {parts.memory && (
        <group>
          <MemoryComponent 
            memoryData={parts.memory} 
            position={CASE_COORDINATES.memoryArea} 
          />
        </group>
      )}

      {/* ストレージ */}
      {parts.storage && (
        <group>
          <StorageComponent 
            storageData={parts.storage} 
            position={calculateStoragePosition(parts.storage)} 
          />
        </group>
      )}

      {/* PSU */}
      {parts.psu && (
        <group>
          <PSUComponent 
            position={CASE_COORDINATES.psuMount} 
            psuData={parts.psu}
          />
        </group>
      )}

      {/* CPUクーラー */}
      {parts.cooler && (
        <group>
          <CoolerComponent 
            position={calculateCoolerPosition(parts.cooler)} 
            coolerData={parts.cooler}
          />
        </group>
      )}

      {/* スマートラベルシステム */}
      {activeParts.map((item, index) => {
        const partInfo = getPartInfo(item.part!, item.name);
        return (
          <SmartPartLabel
            key={`${item.name}-${item.part!.id}`}
            partPosition={item.position}
            partName={item.name}
            partInfo={partInfo}
            color={item.color}
            avoidPositions={labelPositions.filter((_, i) => i !== index)}
            onPositionUpdate={(pos) => handleLabelPositionUpdate(index, pos)}
          />
        );
      })}

      {/* 🎯 Step2: 互換性視覚化システム */}
      <CompatibilityVisualization 
        configuration={configuration}
        visible={showCompatibilityWarnings}
      />
    </group>
  );
};

// パーツ情報を取得するヘルパー関数
function getPartInfo(part: Part, category: string): string {
  switch (category) {
    case 'CPU':
      return String(part.specifications?.socket || '');
    case 'GPU':
      return String(part.specifications?.memory || '');
    case 'Memory':
      return `${String(part.specifications?.type || '')} ${String(part.specifications?.speed || '')}`;
    case 'Storage':
      return String(part.specifications?.capacity || '');
    case 'PSU':
      return `${String(part.specifications?.wattage || '')}W`;
    case 'Cooler':
      return String(part.specifications?.type || '');
    default:
      return '';
  }
}

// 🎯 CPU 3Dコンポーネント（現実的サイズ・配置）
const CPUComponent: React.FC<{
  position: [number, number, number];
  cpuData: Part;
}> = ({ position, cpuData }) => {
  // CPUソケットサイズの動的計算
  const socket = cpuData.specifications?.socket as string || 'LGA1700';
  const isLGA = socket.includes('LGA');
  const size = isLGA ? 0.037 : 0.040; // LGA vs AM4/AM5 実寸差
  return (
    <group position={position}>
      {/* マザーボードCPUソケット（現実的サイズ） */}
      <Box args={[size * 1.2, 0.005, size * 1.2]}>
        <meshStandardMaterial color="#1a202c" metalness={0.8} roughness={0.2} />
      </Box>
      
      {/* CPU本体（実寸反映） */}
      <Box args={[size, 0.003, size]} position={[0, 0.004, 0]}>
        <meshStandardMaterial color="#2d3748" metalness={0.9} roughness={0.1} />
      </Box>
      
      {/* CPUマーキング */}
      <Box args={[size * 0.8, 0.001, size * 0.1]} position={[0, 0.0045, size * 0.3]}>
        <meshBasicMaterial color="#ffffff" />
      </Box>
    </group>
  );
};

// 🎯 GPU 3Dコンポーネント（現実的サイズ・配置）
const GPUComponent: React.FC<{
  position: [number, number, number];
  gpuData: Part;
}> = ({ position, gpuData }) => {
  // GPU仕様からサイズ計算
  const gpuLength = (gpuData.specifications?.length as number || 250) / 1000;
  const gpuMemory = gpuData.specifications?.memory as number || 8;
  const isHighEnd = gpuMemory >= 16; // ハイエンドGPU判定
  return (
    <group position={position}>
      {/* GPU基板（実寸反映） */}
      <Box args={[gpuLength * 0.8, 0.016, 0.1]}>
        <meshStandardMaterial color="#22543d" metalness={0.3} roughness={0.7} />
      </Box>
      
      {/* GPUクーラー（性能に応じたサイズ） */}
      <Box args={[gpuLength * 0.7, isHighEnd ? 0.055 : 0.045, 0.08]} position={[0, isHighEnd ? 0.035 : 0.03, 0]}>
        <meshStandardMaterial color={isHighEnd ? "#2d3748" : "#4a5568"} metalness={0.5} roughness={0.5} />
      </Box>
      
      {/* ファン（GPU長に応じた配置）*/}
      {gpuLength > 0.2 && (
        <>
          <Cylinder args={[0.03, 0.03, 0.01]} position={[-gpuLength * 0.2, 0.05, 0]} rotation={[Math.PI/2, 0, 0]}>
            <meshStandardMaterial color="#2d3748" metalness={0.6} roughness={0.4} />
          </Cylinder>
          <Cylinder args={[0.03, 0.03, 0.01]} position={[gpuLength * 0.2, 0.05, 0]} rotation={[Math.PI/2, 0, 0]}>
            <meshStandardMaterial color="#2d3748" metalness={0.6} roughness={0.4} />
          </Cylinder>
        </>
      )}
      
      {/* GPU長が長い場合の追加ファン */}
      {gpuLength > 0.3 && (
        <Cylinder args={[0.03, 0.03, 0.01]} position={[0, 0.05, 0]} rotation={[Math.PI/2, 0, 0]}>
          <meshStandardMaterial color="#2d3748" metalness={0.6} roughness={0.4} />
        </Cylinder>
      )}
    </group>
  );
};

// メモリ 3Dコンポーネント
const MemoryComponent: React.FC<{
  memoryData: Part;
  position: [number, number, number];
}> = ({ memoryData, position }) => {
  const modules = memoryData.specifications?.modules as number || 2;
  
  return (
    <group position={position}>
      {Array.from({ length: modules }).map((_, i) => (
        <Box 
          key={i}
          args={[0.03, 0.15, 0.008]} 
          position={[i * 0.04, 0.075, 0]}
        >
          <meshStandardMaterial color="#1a365d" metalness={0.4} roughness={0.6} />
        </Box>
      ))}
    </group>
  );
};

// ストレージ 3Dコンポーネント  
const StorageComponent: React.FC<{
  storageData: Part;
  position: [number, number, number];
}> = ({ storageData, position }) => {
  const interfaceSpec = storageData.specifications?.interface as string || '';
  const formFactorSpec = storageData.specifications?.formFactor as string || '';
  const isNVMe = interfaceSpec.includes('NVMe') || formFactorSpec.includes('M.2');
  
  return (
    <group position={position}>
      {isNVMe ? (
        // M.2 NVMe SSD
        <Box args={[0.22, 0.005, 0.022]}>
          <meshStandardMaterial color="#2d3748" metalness={0.8} roughness={0.2} />
        </Box>
      ) : (
        // 2.5" SSD/HDD
        <Box args={[0.25, 0.07, 0.18]}>
          <meshStandardMaterial color="#4a5568" metalness={0.4} roughness={0.6} />
        </Box>
      )}
    </group>
  );
};

// 🎯 PSU 3Dコンポーネント（現実的サイズ・配置）
const PSUComponent: React.FC<{
  position: [number, number, number];
  psuData: Part;
}> = ({ position, psuData }) => {
  // PSU仕様からサイズ計算
  const isModular = (psuData.specifications?.modular as string || '').includes('モジュラー');
  const efficiency = psuData.specifications?.efficiency as string || '80 PLUS';
  return (
    <group position={position}>
      {/* PSU本体（ATX標準サイズ：150×86×140mm） */}
      <Box args={[0.15, 0.086, 0.14]}>
        <meshStandardMaterial 
          color={efficiency.includes('Gold') ? "#1a202c" : "#2d3748"} 
          metalness={0.5} 
          roughness={0.7} 
        />
      </Box>
      
      {/* PSUファン（120mm標準） */}
      <Cylinder args={[0.06, 0.06, 0.01]} position={[0, 0.044, 0]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#2d3748" metalness={0.6} roughness={0.4} />
      </Cylinder>
      
      {/* 電力ラベル */}
      <Box args={[0.08, 0.03, 0.001]} position={[0.06, 0, 0.071]}>
        <meshBasicMaterial color="#ffffff" />
      </Box>
      
      {/* モジュラー表示 */}
      {isModular && (
        <Box args={[0.12, 0.02, 0.001]} position={[0, -0.03, 0.071]}>
          <meshBasicMaterial color="#22c55e" />
        </Box>
      )}
    </group>
  );
};

// 🎯 CPUクーラー 3Dコンポーネント（現実的サイズ・配置）
const CoolerComponent: React.FC<{
  position: [number, number, number];
  coolerData: Part;
}> = ({ position, coolerData }) => {
  // クーラー仕様からサイズ計算
  const coolerHeight = (coolerData.specifications?.height as number || 150) / 1000;
  const coolerType = coolerData.specifications?.type as string || 'Air';
  const isAIO = coolerType.includes('AIO') || coolerType.includes('水冷');
  const fanSize = (coolerData.specifications?.fanSize as number || 120) / 1000;
  if (isAIO) {
    // 簡易水冷の場合
    return (
      <group position={position}>
        {/* ウォーターブロック */}
        <Cylinder args={[0.025, 0.025, 0.02]}>
          <meshStandardMaterial color="#1a202c" metalness={0.9} roughness={0.1} />
        </Cylinder>
        {/* チューブ表現（簡略） */}
        <Box args={[0.008, 0.1, 0.008]} position={[0.03, 0.05, 0]}>
          <meshStandardMaterial color="#2d3748" />
        </Box>
      </group>
    );
  }
  
  // 空冷の場合
  return (
    <group position={position}>
      {/* ヒートシンク（実寸反映） */}
      <Box args={[0.1, coolerHeight * 0.8, 0.1]} position={[0, coolerHeight * 0.4, 0]}>
        <meshStandardMaterial color="#718096" metalness={0.8} roughness={0.3} />
      </Box>
      
      {/* ファン（サイズ反映） */}
      <Cylinder 
        args={[fanSize * 0.4, fanSize * 0.4, 0.025]} 
        position={[fanSize * 0.5, coolerHeight * 0.4, 0]} 
        rotation={[0, 0, Math.PI/2]}
      >
        <meshStandardMaterial color="#2d3748" metalness={0.6} roughness={0.4} />
      </Cylinder>
      
      {/* マウンティング機構 */}
      <Box args={[0.02, 0.02, 0.02]} position={[0, -0.01, 0]}>
        <meshStandardMaterial color="#4a5568" metalness={0.7} roughness={0.3} />
      </Box>
    </group>
  );
};

export default PartsRenderer;