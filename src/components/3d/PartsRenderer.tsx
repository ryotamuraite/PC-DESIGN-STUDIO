// src/components/3d/PartsRenderer.tsx
// PCパーツ3Dレンダリングコンポーネント - Phase3革新機能 + スマートラベル

import React, { useState } from 'react';
import { Box, Cylinder } from '@react-three/drei';
import type { PCConfiguration, Part } from '@/types';
import SmartPartLabel from './SmartPartLabel';

interface PartsRendererProps {
  configuration: PCConfiguration;
  caseData: Part | null;
}

export const PartsRenderer: React.FC<PartsRendererProps> = ({
  configuration
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

  // アクティブパーツの情報を収集
  const activeParts = [
    { part: parts.cpu, position: [-0.3, -0.17, -0.3] as [number, number, number], name: 'CPU', color: '#3b82f6' },
    { part: parts.gpu, position: [0.1, -0.25, -0.1] as [number, number, number], name: 'GPU', color: '#10b981' },
    { part: parts.memory, position: [-0.1, -0.12, -0.5] as [number, number, number], name: 'Memory', color: '#8b5cf6' },
    { part: parts.storage, position: [0.5, 0.15, 0.2] as [number, number, number], name: 'Storage', color: '#f59e0b' },
    { part: parts.psu, position: [0.3, -0.78, -0.4] as [number, number, number], name: 'PSU', color: '#ef4444' },
    { part: parts.cooler, position: [-0.3, 0.05, -0.3] as [number, number, number], name: 'Cooler', color: '#6b7280' },
  ].filter(item => item.part !== null && item.part !== undefined);

  return (
    <group>
      {/* CPU */}
      {parts.cpu && (
        <group>
          <CPUComponent 
            cpuData={parts.cpu} 
            position={[-0.3, -0.17, -0.3]} 
          />
        </group>
      )}

      {/* GPU */}
      {parts.gpu && (
        <group>
          <GPUComponent 
            gpuData={parts.gpu} 
            position={[0.1, -0.25, -0.1]} 
          />
        </group>
      )}

      {/* メモリ */}
      {parts.memory && (
        <group>
          <MemoryComponent 
            memoryData={parts.memory} 
            position={[-0.1, -0.12, -0.5]} 
          />
        </group>
      )}

      {/* ストレージ */}
      {parts.storage && (
        <group>
          <StorageComponent 
            storageData={parts.storage} 
            position={[0.5, 0.15, 0.2]} 
          />
        </group>
      )}

      {/* PSU */}
      {parts.psu && (
        <group>
          <PSUComponent 
            psuData={parts.psu} 
            position={[0.3, -0.78, -0.4]} 
          />
        </group>
      )}

      {/* CPUクーラー */}
      {parts.cooler && (
        <group>
          <CoolerComponent 
            coolerData={parts.cooler} 
            position={[-0.3, 0.05, -0.3]} 
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

// CPU 3Dコンポーネント
const CPUComponent: React.FC<{
  cpuData: Part;
  position: [number, number, number];
}> = ({ cpuData: _cpuData, position }) => {
  return (
    <group position={position}>
      {/* CPUソケット */}
      <Box args={[0.12, 0.02, 0.12]}>
        <meshStandardMaterial color="#1a202c" metalness={0.8} roughness={0.2} />
      </Box>
      
      {/* CPU本体 */}
      <Box args={[0.08, 0.01, 0.08]} position={[0, 0.015, 0]}>
        <meshStandardMaterial color="#2d3748" metalness={0.9} roughness={0.1} />
      </Box>
    </group>
  );
};

// GPU 3Dコンポーネント
const GPUComponent: React.FC<{
  gpuData: Part;
  position: [number, number, number];
}> = ({ gpuData: _gpuData, position }) => {
  return (
    <group position={position}>
      {/* GPU基板 */}
      <Box args={[0.6, 0.05, 0.25]}>
        <meshStandardMaterial color="#22543d" metalness={0.3} roughness={0.7} />
      </Box>
      
      {/* GPUクーラー */}
      <Box args={[0.5, 0.12, 0.2]} position={[0, 0.08, 0]}>
        <meshStandardMaterial color="#4a5568" metalness={0.5} roughness={0.5} />
      </Box>
      
      {/* ファン（2個）*/}
      <Cylinder args={[0.06, 0.06, 0.02]} position={[-0.15, 0.13, 0]} rotation={[Math.PI/2, 0, 0]}>
        <meshStandardMaterial color="#2d3748" metalness={0.6} roughness={0.4} />
      </Cylinder>
      <Cylinder args={[0.06, 0.06, 0.02]} position={[0.15, 0.13, 0]} rotation={[Math.PI/2, 0, 0]}>
        <meshStandardMaterial color="#2d3748" metalness={0.6} roughness={0.4} />
      </Cylinder>
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

// PSU 3Dコンポーネント
const PSUComponent: React.FC<{
  psuData: Part;
  position: [number, number, number];
}> = ({ psuData: _psuData, position }) => {
  return (
    <group position={position}>
      {/* PSU本体 */}
      <Box args={[0.36, 0.16, 0.32]}>
        <meshStandardMaterial color="#1a202c" metalness={0.5} roughness={0.7} />
      </Box>
      
      {/* PSUファン */}
      <Cylinder args={[0.12, 0.12, 0.02]} position={[0, 0.09, 0]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#2d3748" metalness={0.6} roughness={0.4} />
      </Cylinder>
    </group>
  );
};

// CPUクーラー 3Dコンポーネント
const CoolerComponent: React.FC<{
  coolerData: Part;
  position: [number, number, number];
}> = ({ coolerData: _coolerData, position }) => {
  return (
    <group position={position}>
      {/* ヒートシンク */}
      <Box args={[0.12, 0.2, 0.12]}>
        <meshStandardMaterial color="#718096" metalness={0.8} roughness={0.3} />
      </Box>
      
      {/* ファン */}
      <Cylinder args={[0.08, 0.08, 0.02]} position={[0.15, 0, 0]} rotation={[0, 0, Math.PI/2]}>
        <meshStandardMaterial color="#2d3748" metalness={0.6} roughness={0.4} />
      </Cylinder>
    </group>
  );
};

export default PartsRenderer;