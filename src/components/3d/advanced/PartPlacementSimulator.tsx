// src/components/3d/advanced/PartPlacementSimulator.tsx
// Phase 3: パーツ配置シミュレーション - 革新的3D機能

import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { PCConfiguration, Part } from '@/types';

interface PartPlacementSimulatorProps {
  configuration: PCConfiguration;
  onPartPlace?: (partId: string, position: [number, number, number]) => void;
  enablePlacementMode?: boolean;
  showClearanceInfo?: boolean;
}

interface PartPlacement {
  id: string;
  part: Part;
  position: [number, number, number];
  rotation: [number, number, number];
  isPlaced: boolean;
  clearanceOk: boolean;
  animationProgress: number;
}

export const PartPlacementSimulator: React.FC<PartPlacementSimulatorProps> = ({
  configuration,
  showClearanceInfo = true
}) => {
  const [partPlacements, setPartPlacements] = useState<PartPlacement[]>([]);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  // 既存パーツから配置情報を初期化
  React.useEffect(() => {
    const placements: PartPlacement[] = [];
    
    if (configuration.parts.cpu) {
      placements.push({
        id: 'cpu',
        part: configuration.parts.cpu,
        position: [-0.3, -0.15, -0.3], // マザーボード上のCPUソケット位置
        rotation: [0, 0, 0],
        isPlaced: true,
        clearanceOk: true,
        animationProgress: 1
      });
    }

    if (configuration.parts.memory) {
      placements.push({
        id: 'memory',
        part: configuration.parts.memory,
        position: [-0.1, -0.12, -0.3], // メモリスロット位置
        rotation: [0, 0, 0],
        isPlaced: true,
        clearanceOk: true,
        animationProgress: 1
      });
    }

    if (configuration.parts.gpu) {
      placements.push({
        id: 'gpu',
        part: configuration.parts.gpu,
        position: [0.0, -0.05, 0.0], // PCIeスロット位置
        rotation: [0, 0, 0],
        isPlaced: true,
        clearanceOk: checkGPUClearance(configuration.parts.gpu, configuration.parts.case || null),
        animationProgress: 1
      });
    }

    if (configuration.parts.storage) {
      const storageInterface = configuration.parts.storage.specifications?.interface as string || '';
      const isNVMe = storageInterface.includes('NVMe');
      placements.push({
        id: 'storage',
        part: configuration.parts.storage,
        position: isNVMe ? [0.1, -0.13, -0.1] : [0.5, -0.6, 0.4], // M.2 または ドライブベイ
        rotation: [0, 0, 0],
        isPlaced: true,
        clearanceOk: true,
        animationProgress: 1
      });
    }

    if (configuration.parts.psu) {
      placements.push({
        id: 'psu',
        part: configuration.parts.psu,
        position: [0.3, -0.8, -0.4], // PSU マウント位置
        rotation: [0, 0, 0],
        isPlaced: true,
        clearanceOk: true,
        animationProgress: 1
      });
    }

    if (configuration.parts.cooler) {
      placements.push({
        id: 'cooler',
        part: configuration.parts.cooler,
        position: [-0.3, -0.05, -0.3], // CPU上部
        rotation: [0, 0, 0],
        isPlaced: true,
        clearanceOk: checkCoolerClearance(configuration.parts.cooler, configuration.parts.case || null),
        animationProgress: 1
      });
    }

    setPartPlacements(placements);
  }, [configuration]);

  // GPU クリアランスチェック
  const checkGPUClearance = (gpu: Part, caseData: Part | null): boolean => {
    if (!gpu || !caseData) return true;
    
    const gpuLength = gpu.specifications?.length as number || 300; // mm
    const caseMaxGPULength = caseData.specifications?.maxGPULength as number || 350; // mm
    
    return gpuLength <= caseMaxGPULength;
  };

  // CPUクーラー クリアランスチェック
  const checkCoolerClearance = (cooler: Part, caseData: Part | null): boolean => {
    if (!cooler || !caseData) return true;
    
    const coolerHeight = cooler.specifications?.height as number || 150; // mm
    const caseMaxCoolerHeight = caseData.specifications?.maxCoolerHeight as number || 170; // mm
    
    return coolerHeight <= caseMaxCoolerHeight;
  };



  // ホバー効果用のアニメーション
  useFrame((state) => {
    if (groupRef.current && hoveredPart) {
      // 軽微な浮遊効果
      const time = state.clock.getElapsedTime();
      groupRef.current.position.y = Math.sin(time * 2) * 0.005;
    }
  });

  return (
    <group ref={groupRef}>
      {/* マザーボード */}
      <Box
        args={[0.6, 0.02, 0.6]}
        position={[-0.3, -0.18, -0.3]}
        onPointerOver={() => setHoveredPart('motherboard')}
        onPointerOut={() => setHoveredPart(null)}
      >
        <meshStandardMaterial 
          color={hoveredPart === 'motherboard' ? '#2563eb' : '#22543d'} 
          metalness={0.1} 
          roughness={0.9}
        />
      </Box>

      {/* 配置されたパーツのレンダリング */}
      {partPlacements.map((placement) => (
        <group key={placement.id} position={placement.position}>
          {/* パーツ3Dモデル */}
          {renderPartModel(placement)}
          
          {/* クリアランス警告表示 */}
          {showClearanceInfo && !placement.clearanceOk && (
            <Html
              position={[0, 0.2, 0]}
              center
              distanceFactor={8}
            >
              <div className="bg-red-500 bg-opacity-90 text-white px-2 py-1 rounded text-xs font-medium shadow-lg">
                ⚠️ クリアランス不足
              </div>
            </Html>
          )}
          
          {/* 配置成功インジケータ */}
          {placement.isPlaced && placement.clearanceOk && (
            <Html
              position={[0, 0.15, 0]}
              center
              distanceFactor={10}
            >
              <div className="bg-green-500 bg-opacity-90 text-white px-2 py-1 rounded text-xs font-medium shadow-lg">
                ✓ 配置完了
              </div>
            </Html>
          )}
        </group>
      ))}

      {/* PCIeスロット表示 */}
      <PCIeSlots />
      
      {/* メモリスロット表示 */}
      <MemorySlots />
      
      {/* ドライブベイ表示 */}
      <DriveBays />
    </group>
  );
};

// パーツモデルのレンダリング
function renderPartModel(placement: PartPlacement) {
  const { part, clearanceOk, animationProgress } = placement;
  
  // アニメーション用のスケール
  const scale = 0.8 + (animationProgress * 0.2);
  const opacity = clearanceOk ? 1.0 : 0.7;
  
  switch (part.category) {
    case 'cpu':
      return (
        <Box args={[0.08, 0.01, 0.08]} scale={[scale, scale, scale]}>
          <meshStandardMaterial 
            color="#2d3748" 
            metalness={0.9} 
            roughness={0.1}
            transparent
            opacity={opacity}
          />
        </Box>
      );
      
    case 'gpu':
      {
        return (
          <group scale={[scale, scale, scale]}>
            <Box args={[0.6, 0.05, 0.25]}>
              <meshStandardMaterial 
                color="#22543d" 
                metalness={0.3} 
                roughness={0.7}
                transparent
                opacity={opacity}
              />
            </Box>
            <Box args={[0.5, 0.12, 0.2]} position={[0, 0.08, 0]}>
              <meshStandardMaterial 
                color="#4a5568" 
                metalness={0.5} 
                roughness={0.5}
                transparent
                opacity={opacity}
              />
            </Box>
          </group>
        );
      }
      
    case 'memory':
      {
        const modules = part.specifications?.modules as number || 2;
        return (
          <group scale={[scale, scale, scale]}>
            {Array.from({ length: modules }).map((_, i) => (
              <Box 
                key={i}
                args={[0.03, 0.15, 0.008]} 
                position={[i * 0.04, 0.075, 0]}
              >
                <meshStandardMaterial 
                  color="#1a365d" 
                  metalness={0.4} 
                  roughness={0.6}
                  transparent
                  opacity={opacity}
                />
              </Box>
            ))}
          </group>
        );
      }
      
    default:
      return (
        <Box args={[0.1, 0.05, 0.1]} scale={[scale, scale, scale]}>
          <meshStandardMaterial 
            color="#4a5568"
            transparent
            opacity={opacity}
          />
        </Box>
      );
  }
}

// PCIeスロット表示
const PCIeSlots: React.FC = () => {
  return (
    <group>
      {Array.from({ length: 4 }).map((_, i) => (
        <Box 
          key={i}
          args={[0.5, 0.005, 0.02]} 
          position={[0.0, -0.16, -0.1 + (i * 0.08)]}
        >
          <meshStandardMaterial color="#8b5cf6" metalness={0.3} roughness={0.7} />
        </Box>
      ))}
    </group>
  );
};

// メモリスロット表示
const MemorySlots: React.FC = () => {
  return (
    <group>
      {Array.from({ length: 4 }).map((_, i) => (
        <Box 
          key={i}
          args={[0.03, 0.005, 0.2]} 
          position={[-0.1 + (i * 0.04), -0.16, -0.3]}
        >
          <meshStandardMaterial color="#3b82f6" metalness={0.3} roughness={0.7} />
        </Box>
      ))}
    </group>
  );
};

// ドライブベイ表示
const DriveBays: React.FC = () => {
  return (
    <group position={[0.5, -0.6, 0.4]}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Box 
          key={i}
          args={[0.3, 0.06, 0.4]} 
          position={[0, i * 0.08, 0]}
        >
          <meshStandardMaterial 
            color="#6b7280" 
            metalness={0.3} 
            roughness={0.7}
            transparent
            opacity={0.3}
          />
        </Box>
      ))}
    </group>
  );
};

export default PartPlacementSimulator;