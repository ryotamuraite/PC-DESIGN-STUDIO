// src/components/3d/PartsRenderer.tsx
// PCパーツ3Dレンダリングコンポーネント - Phase3革新機能 + 現実的配置システム

import React, { useState } from 'react';
import { Box, Cylinder } from '@react-three/drei';
import type { PCConfiguration, Part } from '@/types';
import SmartPartLabel from './SmartPartLabel';
import CompatibilityVisualization from './CompatibilityVisualization';

// 🎯 統一パーツサイズ正規化（v67.0対応）
const PART_SCALES = {
  case: { width: 200, height: 450, depth: 400 },      // ATXケース標準 (mm)
  motherboard: { width: 305, height: 244, depth: 5 }, // ATX標準 (mm)
  gpu: { width: 300, height: 120, depth: 40 },        // ハイエンドGPU標準 (mm)
  cpu_cooler: { width: 120, height: 160, depth: 120 }, // タワークーラー標準 (mm)
  psu: { width: 150, height: 86, depth: 140 },         // ATX電源標準 (mm)
  cpu: { width: 37, height: 3, depth: 37 },           // LGA1700標準 (mm)
  memory: { width: 133, height: 30, depth: 8 },       // DDR4/5標準 (mm)
  storage_nvme: { width: 80, height: 22, depth: 3 },  // M.2 2280標準 (mm)
  storage_ssd: { width: 100, height: 70, depth: 7 }   // 2.5" SSD標準 (mm)
};

// 🎯 スケール変換係数（mm → Three.js単位）
const SCALE_FACTOR = 0.001; // 1mm = 0.001 Three.js単位

// 🎯 ケース内座標系統一（現実的配置）
const CASE_COORDINATES = {
  // ケースサイズ（正規化サイズ適用）
  width: PART_SCALES.case.width * SCALE_FACTOR,    // X軸（左右）
  height: PART_SCALES.case.height * SCALE_FACTOR,  // Y軸（上下）
  depth: PART_SCALES.case.depth * SCALE_FACTOR,    // Z軸（前後）
  
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

// 🎯 CPU 3Dコンポーネント（正規化サイズ適用）
const CPUComponent: React.FC<{
  position: [number, number, number];
  cpuData: Part;
}> = ({ position, cpuData }) => {
  // CPU正規化サイズ適用
  const socket = cpuData.specifications?.socket as string || 'LGA1700';
  const isLGA = socket.includes('LGA');
  
  // 正規化サイズ（PART_SCALES適用）
  const cpuWidth = PART_SCALES.cpu.width * SCALE_FACTOR;
  const cpuHeight = PART_SCALES.cpu.height * SCALE_FACTOR;
  const cpuDepth = PART_SCALES.cpu.depth * SCALE_FACTOR;
  
  // AM4/AM5は若干大きめに調整
  const socketMultiplier = isLGA ? 1.0 : 1.08;
  const adjustedWidth = cpuWidth * socketMultiplier;
  const adjustedDepth = cpuDepth * socketMultiplier;
  
  return (
    <group position={position}>
      {/* マザーボードCPUソケット（正規化サイズ） */}
      <Box args={[adjustedWidth * 1.2, 0.005, adjustedDepth * 1.2]}>
        <meshStandardMaterial color="#1a202c" metalness={0.8} roughness={0.2} />
      </Box>
      
      {/* CPU本体（正規化サイズ） */}
      <Box args={[adjustedWidth, cpuHeight, adjustedDepth]} position={[0, cpuHeight * 0.5, 0]}>
        <meshStandardMaterial color="#2d3748" metalness={0.9} roughness={0.1} />
      </Box>
      
      {/* CPUマーキング */}
      <Box args={[adjustedWidth * 0.8, 0.001, adjustedDepth * 0.1]} position={[0, cpuHeight + 0.001, adjustedDepth * 0.3]}>
        <meshBasicMaterial color="#ffffff" />
      </Box>
    </group>
  );
};

// 🎯 GPU 3Dコンポーネント（正規化サイズ適用）
const GPUComponent: React.FC<{
  position: [number, number, number];
  gpuData: Part;
}> = ({ position, gpuData }) => {
  // GPU正規化サイズ適用
  const gpuMemory = gpuData.specifications?.memory as number || 8;
  const gpuLength = gpuData.specifications?.length as number || 300;
  const isHighEnd = gpuMemory >= 16; // ハイエンドGPU判定
  
  // 正規化サイズ（PART_SCALES適用）
  const baseWidth = PART_SCALES.gpu.width * SCALE_FACTOR;
  const baseHeight = PART_SCALES.gpu.height * SCALE_FACTOR;
  const baseDepth = PART_SCALES.gpu.depth * SCALE_FACTOR;
  
  // GPU長に応じたスケール調整
  const lengthScale = Math.max(0.7, Math.min(1.3, gpuLength / 300)); // 210mm～390mm範囲
  const adjustedWidth = baseWidth * lengthScale;
  const adjustedHeight = isHighEnd ? baseHeight * 1.2 : baseHeight;
  
  return (
    <group position={position}>
      {/* GPU基板（正規化サイズ） */}
      <Box args={[adjustedWidth, 0.016, baseDepth]}>
        <meshStandardMaterial color="#22543d" metalness={0.3} roughness={0.7} />
      </Box>
      
      {/* GPUクーラー（性能に応じたサイズ） */}
      <Box 
        args={[adjustedWidth * 0.9, adjustedHeight, baseDepth * 0.8]} 
        position={[0, adjustedHeight * 0.5 + 0.008, 0]}
      >
        <meshStandardMaterial color={isHighEnd ? "#2d3748" : "#4a5568"} metalness={0.5} roughness={0.5} />
      </Box>
      
      {/* ファン（GPU長に応じた配置）*/}
      {lengthScale > 0.8 && (
        <>
          <Cylinder 
            args={[0.035, 0.035, 0.015]} 
            position={[-adjustedWidth * 0.25, adjustedHeight * 0.6 + 0.008, 0]} 
            rotation={[Math.PI/2, 0, 0]}
          >
            <meshStandardMaterial color="#2d3748" metalness={0.6} roughness={0.4} />
          </Cylinder>
          <Cylinder 
            args={[0.035, 0.035, 0.015]} 
            position={[adjustedWidth * 0.25, adjustedHeight * 0.6 + 0.008, 0]} 
            rotation={[Math.PI/2, 0, 0]}
          >
            <meshStandardMaterial color="#2d3748" metalness={0.6} roughness={0.4} />
          </Cylinder>
        </>
      )}
      
      {/* ハイエンドGPUの追加ファン */}
      {isHighEnd && lengthScale > 1.0 && (
        <Cylinder 
          args={[0.035, 0.035, 0.015]} 
          position={[0, adjustedHeight * 0.6 + 0.008, 0]} 
          rotation={[Math.PI/2, 0, 0]}
        >
          <meshStandardMaterial color="#2d3748" metalness={0.6} roughness={0.4} />
        </Cylinder>
      )}
    </group>
  );
};

// 🎯 メモリ 3Dコンポーネント（正規化サイズ適用）
const MemoryComponent: React.FC<{
  memoryData: Part;
  position: [number, number, number];
}> = ({ memoryData, position }) => {
  const modules = memoryData.specifications?.modules as number || 2;
  
  // 正規化サイズ（PART_SCALES適用）
  const memWidth = PART_SCALES.memory.width * SCALE_FACTOR;
  const memHeight = PART_SCALES.memory.height * SCALE_FACTOR;
  const memDepth = PART_SCALES.memory.depth * SCALE_FACTOR;
  
  return (
    <group position={position}>
      {Array.from({ length: modules }).map((_, i) => (
        <Box 
          key={i}
          args={[memWidth, memHeight, memDepth]} 
          position={[i * memWidth * 1.1, memHeight * 0.5, 0]}
        >
          <meshStandardMaterial color="#1a365d" metalness={0.4} roughness={0.6} />
        </Box>
      ))}
    </group>
  );
};

// 🎯 ストレージ 3Dコンポーネント（正規化サイズ適用）  
const StorageComponent: React.FC<{
  storageData: Part;
  position: [number, number, number];
}> = ({ storageData, position }) => {
  const interfaceSpec = storageData.specifications?.interface as string || '';
  const formFactorSpec = storageData.specifications?.formFactor as string || '';
  const isNVMe = interfaceSpec.includes('NVMe') || formFactorSpec.includes('M.2');
  
  // 正規化サイズ（PART_SCALES適用）
  if (isNVMe) {
    const nvmeWidth = PART_SCALES.storage_nvme.width * SCALE_FACTOR;
    const nvmeHeight = PART_SCALES.storage_nvme.height * SCALE_FACTOR;
    const nvmeDepth = PART_SCALES.storage_nvme.depth * SCALE_FACTOR;
    
    return (
      <group position={position}>
        {/* M.2 NVMe SSD */}
        <Box args={[nvmeWidth, nvmeDepth, nvmeHeight]} position={[0, nvmeDepth * 0.5, 0]}>
          <meshStandardMaterial color="#2d3748" metalness={0.8} roughness={0.2} />
        </Box>
      </group>
    );
  } else {
    const ssdWidth = PART_SCALES.storage_ssd.width * SCALE_FACTOR;
    const ssdHeight = PART_SCALES.storage_ssd.height * SCALE_FACTOR;
    const ssdDepth = PART_SCALES.storage_ssd.depth * SCALE_FACTOR;
    
    return (
      <group position={position}>
        {/* 2.5" SSD/HDD */}
        <Box args={[ssdWidth, ssdDepth, ssdHeight]} position={[0, ssdDepth * 0.5, 0]}>
          <meshStandardMaterial color="#4a5568" metalness={0.4} roughness={0.6} />
        </Box>
      </group>
    );
  }
};

// 🎯 PSU 3Dコンポーネント（正規化サイズ適用）
const PSUComponent: React.FC<{
  position: [number, number, number];
  psuData: Part;
}> = ({ position, psuData }) => {
  // PSU仕様情報取得
  const isModular = (psuData.specifications?.modular as string || '').includes('モジュラー');
  const efficiency = psuData.specifications?.efficiency as string || '80 PLUS';
  
  // 正規化サイズ（PART_SCALES適用）
  const psuWidth = PART_SCALES.psu.width * SCALE_FACTOR;
  const psuHeight = PART_SCALES.psu.height * SCALE_FACTOR;
  const psuDepth = PART_SCALES.psu.depth * SCALE_FACTOR;
  
  return (
    <group position={position}>
      {/* PSU本体（正規化ATXサイズ） */}
      <Box args={[psuWidth, psuHeight, psuDepth]} position={[0, psuHeight * 0.5, 0]}>
        <meshStandardMaterial 
          color={efficiency.includes('Gold') ? "#1a202c" : "#2d3748"} 
          metalness={0.5} 
          roughness={0.7} 
        />
      </Box>
      
      {/* PSUファン（120mm標準、正規化サイズ） */}
      <Cylinder 
        args={[0.06, 0.06, 0.015]} 
        position={[0, psuHeight + 0.008, 0]} 
        rotation={[0, 0, 0]}
      >
        <meshStandardMaterial color="#2d3748" metalness={0.6} roughness={0.4} />
      </Cylinder>
      
      {/* 電力ラベル */}
      <Box 
        args={[psuWidth * 0.5, psuHeight * 0.35, 0.002]} 
        position={[psuWidth * 0.3, psuHeight * 0.5, psuDepth * 0.51]}
      >
        <meshBasicMaterial color="#ffffff" />
      </Box>
      
      {/* モジュラー表示 */}
      {isModular && (
        <Box 
          args={[psuWidth * 0.8, psuHeight * 0.25, 0.002]} 
          position={[0, psuHeight * 0.2, psuDepth * 0.51]}
        >
          <meshBasicMaterial color="#22c55e" />
        </Box>
      )}
    </group>
  );
};

// 🎯 CPUクーラー 3Dコンポーネント（正規化サイズ適用）
const CoolerComponent: React.FC<{
  position: [number, number, number];
  coolerData: Part;
}> = ({ position, coolerData }) => {
  // クーラー仕様情報取得
  const coolerHeight = coolerData.specifications?.height as number || 160;
  const coolerType = coolerData.specifications?.type as string || 'Air';
  const isAIO = coolerType.includes('AIO') || coolerType.includes('水冷');
  const fanSize = coolerData.specifications?.fanSize as number || 120;
  
  // 正規化サイズ（PART_SCALES適用）
  const baseCoolerWidth = PART_SCALES.cpu_cooler.width * SCALE_FACTOR;
  const baseCoolerHeight = PART_SCALES.cpu_cooler.height * SCALE_FACTOR;
  const baseCoolerDepth = PART_SCALES.cpu_cooler.depth * SCALE_FACTOR;
  
  // 実際の高さに応じたスケール調整
  const heightScale = Math.max(0.6, Math.min(1.4, coolerHeight / 160)); // 96mm～224mm範囲
  const adjustedHeight = baseCoolerHeight * heightScale;
  const fanRadius = (fanSize * 0.5) * SCALE_FACTOR;
  
  if (isAIO) {
    // 簡易水冷の場合
    return (
      <group position={position}>
        {/* ウォーターブロック（正規化サイズ） */}
        <Cylinder args={[0.025, 0.025, 0.02]} position={[0, 0.01, 0]}>
          <meshStandardMaterial color="#1a202c" metalness={0.9} roughness={0.1} />
        </Cylinder>
        {/* チューブ表現（簡略） */}
        <Box args={[0.008, adjustedHeight * 0.6, 0.008]} position={[0.03, adjustedHeight * 0.3, 0]}>
          <meshStandardMaterial color="#2d3748" />
        </Box>
      </group>
    );
  }
  
  // 空冷の場合
  return (
    <group position={position}>
      {/* ヒートシンク（正規化サイズ） */}
      <Box 
        args={[baseCoolerWidth * 0.8, adjustedHeight * 0.7, baseCoolerDepth * 0.8]} 
        position={[0, adjustedHeight * 0.35, 0]}
      >
        <meshStandardMaterial color="#718096" metalness={0.8} roughness={0.3} />
      </Box>
      
      {/* ファン（正規化サイズ） */}
      <Cylinder 
        args={[fanRadius * 0.8, fanRadius * 0.8, 0.025]} 
        position={[baseCoolerWidth * 0.5, adjustedHeight * 0.4, 0]} 
        rotation={[0, 0, Math.PI/2]}
      >
        <meshStandardMaterial color="#2d3748" metalness={0.6} roughness={0.4} />
      </Cylinder>
      
      {/* マウンティング機構（正規化サイズ） */}
      <Box 
        args={[baseCoolerWidth * 0.2, 0.02, baseCoolerDepth * 0.2]} 
        position={[0, -0.01, 0]}
      >
        <meshStandardMaterial color="#4a5568" metalness={0.7} roughness={0.3} />
      </Box>
    </group>
  );
};

export default PartsRenderer;