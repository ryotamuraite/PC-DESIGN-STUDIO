// src/components/3d/advanced/CaseInternalViewer.tsx
// Phase 3: ケース内部ビュー - 透視・断面表示機能

import React, { useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Plane, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Part } from '@/types';

interface CaseInternalViewerProps {
  caseData: Part | null;
  viewMode: 'normal' | 'transparent' | 'xray' | 'wireframe' | 'cross-section';
  crossSectionAxis?: 'x' | 'y' | 'z';
  crossSectionPosition?: number;
  transparencyLevel?: number;
  showInternalLighting?: boolean;
  showAirflow?: boolean;
  onViewModeChange?: (mode: CaseInternalViewerProps['viewMode']) => void;
}

export const CaseInternalViewer: React.FC<CaseInternalViewerProps> = ({
  viewMode = 'normal',
  crossSectionAxis = 'x',
  crossSectionPosition = 0,
  transparencyLevel = 0.3,
  showInternalLighting = true,
  showAirflow = false,
  onViewModeChange
}) => {
  const caseRef = useRef<THREE.Group>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  // ケースサイズ設定
  const caseSize = useMemo(() => ({
    width: 2.0,   // 奥行き
    height: 1.8,  // 高さ
    depth: 1.5,   // 幅
    wallThickness: 0.05
  }), []);

  // 材質設定
  const caseMaterial = useMemo(() => {
    switch (viewMode) {
      case 'transparent':
        return new THREE.MeshStandardMaterial({
          color: '#4a5568',
          transparent: true,
          opacity: transparencyLevel,
          metalness: 0.5,
          roughness: 0.3
        });
      
      case 'xray':
        return new THREE.MeshBasicMaterial({
          color: '#00ffff',
          transparent: true,
          opacity: 0.2,
          wireframe: false
        });
      
      case 'wireframe':
        return new THREE.MeshBasicMaterial({
          color: '#ffffff',
          wireframe: true,
          transparent: true,
          opacity: 0.8
        });
      
      default:
        return new THREE.MeshStandardMaterial({
          color: '#2d3748',
          metalness: 0.3,
          roughness: 0.7
        });
    }
  }, [viewMode, transparencyLevel]);

  // アニメーション更新
  useFrame((state) => {
    if (viewMode === 'cross-section') {
      const time = state.clock.getElapsedTime();
      setAnimationProgress(Math.sin(time * 0.5) * 0.1);
    }
  });

  // 断面表示用のクリッピングプレーン
  const clippingPlanes = useMemo(() => {
    if (viewMode !== 'cross-section') return [];

    const plane = new THREE.Plane();
    switch (crossSectionAxis) {
      case 'x':
        plane.setFromNormalAndCoplanarPoint(
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(crossSectionPosition + animationProgress, 0, 0)
        );
        break;
      case 'y':
        plane.setFromNormalAndCoplanarPoint(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(0, crossSectionPosition + animationProgress, 0)
        );
        break;
      case 'z':
        plane.setFromNormalAndCoplanarPoint(
          new THREE.Vector3(0, 0, 1),
          new THREE.Vector3(0, 0, crossSectionPosition + animationProgress)
        );
        break;
    }
    return [plane];
  }, [viewMode, crossSectionAxis, crossSectionPosition, animationProgress]);

  // 断面表示時の材質更新
  React.useEffect(() => {
    if (caseRef.current) {
      caseRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
          child.material.clippingPlanes = clippingPlanes;
          child.material.needsUpdate = true;
        }
      });
    }
  }, [clippingPlanes]);

  return (
    <group ref={caseRef}>
      {/* ケース本体 */}
      <CaseStructure 
        size={caseSize}
        material={caseMaterial}
        viewMode={viewMode}
        showInternalStructure={viewMode !== 'normal'}
      />

      {/* 内部照明 */}
      {showInternalLighting && viewMode !== 'normal' && (
        <InternalLighting />
      )}

      {/* エアフロー可視化 */}
      {showAirflow && (
        <AirflowVisualization caseSize={caseSize} />
      )}

      {/* 断面表示インジケータ */}
      {viewMode === 'cross-section' && (
        <CrossSectionIndicator 
          axis={crossSectionAxis}
          position={crossSectionPosition + animationProgress}
          caseSize={caseSize}
        />
      )}

      {/* ビューモード切替UI */}
      <ViewModeControls 
        currentMode={viewMode}
        onModeChange={onViewModeChange}
        transparencyLevel={transparencyLevel}
      />

      {/* 内部構造ラベル */}
      {viewMode !== 'normal' && (
        <InternalStructureLabels caseSize={caseSize} />
      )}
    </group>
  );
};

// ケース構造コンポーネント
const CaseStructure: React.FC<{
  size: { width: number; height: number; depth: number; wallThickness: number };
  material: THREE.Material;
  viewMode: string;
  showInternalStructure: boolean;
}> = ({ size, material, viewMode, showInternalStructure }) => {
  const { width, height, depth, wallThickness } = size;

  return (
    <group>
      {/* 背面パネル */}
      {(viewMode !== 'cross-section' || showInternalStructure) && (
        <Box
          args={[width, height, wallThickness]}
          position={[0, height/2, -depth/2]}
          material={material}
        />
      )}

      {/* 左側面パネル */}
      <Box
        args={[wallThickness, height, depth]}
        position={[-width/2, height/2, 0]}
        material={material}
      />

      {/* 右側面パネル（透視時は透明度調整）*/}
      <Box
        args={[wallThickness, height, depth]}
        position={[width/2, height/2, 0]}
        material={viewMode === 'transparent' ? 
          new THREE.MeshStandardMaterial({
            ...material,
            opacity: (material as THREE.MeshStandardMaterial).opacity! * 0.3
          }) : material
        }
      />

      {/* 上面パネル */}
      <Box
        args={[width, wallThickness, depth]}
        position={[0, height, 0]}
        material={material}
      />

      {/* 底面パネル */}
      <Box
        args={[width, wallThickness, depth]}
        position={[0, 0, 0]}
        material={new THREE.MeshStandardMaterial({
          color: '#1a202c',
          metalness: 0.4,
          roughness: 0.8
        })}
      />

      {/* 内部構造 */}
      {showInternalStructure && (
        <InternalComponents size={size} />
      )}
    </group>
  );
};

// 内部コンポーネント
const InternalComponents: React.FC<{
  size: { width: number; height: number; depth: number; wallThickness: number };
}> = () => {
  return (
    <group>
      {/* マザーボードスタンドオフ */}
      {Array.from({ length: 9 }).map((_, i) => (
        <Box
          key={`standoff-${i}`}
          args={[0.02, 0.05, 0.02]}
          position={[
            -0.4 + (i % 3) * 0.3,
            0.05,
            -0.4 + Math.floor(i / 3) * 0.3
          ]}
        >
          <meshStandardMaterial color="#718096" metalness={0.8} roughness={0.2} />
        </Box>
      ))}

      {/* PSUマウント */}
      <Box
        args={[0.36, 0.02, 0.32]}
        position={[0.3, 0.16, -0.4]}
      >
        <meshStandardMaterial color="#4a5568" metalness={0.3} roughness={0.7} />
      </Box>

      {/* ケーブル配線ガイド */}
      {Array.from({ length: 4 }).map((_, i) => (
        <Box
          key={`cable-guide-${i}`}
          args={[0.02, 0.15, 0.02]}
          position={[
            -0.8 + i * 0.5,
            0.4,
            0.6
          ]}
        >
          <meshStandardMaterial color="#2d3748" metalness={0.2} roughness={0.8} />
        </Box>
      ))}
    </group>
  );
};

// 内部照明
const InternalLighting: React.FC = () => {
  return (
    <group>
      {/* LEDストリップシミュレーション */}
      <pointLight
        position={[0.8, 1.5, 0]}
        intensity={0.5}
        color="#4299e1"
        distance={3}
      />
      <pointLight
        position={[-0.8, 1.5, 0]}
        intensity={0.5}
        color="#4299e1"
        distance={3}
      />
      <pointLight
        position={[0, 0.5, 0.7]}
        intensity={0.3}
        color="#ffffff"
        distance={2}
      />
    </group>
  );
};

// エアフロー可視化
const AirflowVisualization: React.FC<{
  caseSize: { width: number; height: number; depth: number; wallThickness: number };
}> = ({ caseSize }) => {
  const particlesRef = useRef<THREE.Points>(null);

  // エアフローパーティクル
  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    for (let i = 0; i < 1000; i++) {
      // フロントファンからの吸気
      positions.push(
        (Math.random() - 0.5) * caseSize.width,
        Math.random() * caseSize.height,
        caseSize.depth/2 - 0.1
      );
      velocities.push(0, 0, -0.02); // Z軸負方向への流れ
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
    
    return geometry;
  }, [caseSize]);

  useFrame(() => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const velocities = particlesRef.current.geometry.attributes.velocity.array as Float32Array;

      for (let i = 0; i < positions.length; i += 3) {
        // パーティクル移動
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];

        // 境界でリセット
        if (positions[i + 2] < -caseSize.depth/2) {
          positions[i] = (Math.random() - 0.5) * caseSize.width;
          positions[i + 1] = Math.random() * caseSize.height;
          positions[i + 2] = caseSize.depth/2 - 0.1;
        }
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef} geometry={particleGeometry}>
      <pointsMaterial
        color="#00bcd4"
        size={0.02}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
};

// 断面表示インジケータ
const CrossSectionIndicator: React.FC<{
  axis: 'x' | 'y' | 'z';
  position: number;
  caseSize: { width: number; height: number; depth: number; wallThickness: number };
}> = ({ axis, position, caseSize }) => {
  const planeArgs: [number, number] = axis === 'x' 
    ? [caseSize.height, caseSize.depth]
    : axis === 'y'
    ? [caseSize.width, caseSize.depth]
    : [caseSize.width, caseSize.height];

  const planePosition: [number, number, number] = axis === 'x'
    ? [position, caseSize.height/2, 0]
    : axis === 'y'
    ? [0, position, 0]
    : [0, caseSize.height/2, position];

  const planeRotation: [number, number, number] = axis === 'x'
    ? [0, Math.PI/2, 0]
    : axis === 'y'
    ? [Math.PI/2, 0, 0]
    : [0, 0, 0];

  return (
    <Plane
      args={planeArgs}
      position={planePosition}
      rotation={planeRotation}
    >
      <meshBasicMaterial
        color="#ff6b6b"
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
      />
    </Plane>
  );
};

// ビューモード切替コントロール
const ViewModeControls: React.FC<{
  currentMode: string;
  onModeChange?: (mode: CaseInternalViewerProps['viewMode']) => void;
  transparencyLevel: number;
}> = ({ currentMode, onModeChange, transparencyLevel }) => {
  return (
    <Html
      position={[1.2, 1.5, 0]}
      center
      distanceFactor={8}
    >
      <div className="bg-black bg-opacity-80 text-white p-3 rounded-lg shadow-lg">
        <div className="text-xs font-medium mb-2">ビューモード</div>
        <div className="space-y-1">
          {[
            { key: 'normal' as const, label: '通常' },
            { key: 'transparent' as const, label: '透明' },
            { key: 'xray' as const, label: 'X線' },
            { key: 'wireframe' as const, label: 'ワイヤー' },
            { key: 'cross-section' as const, label: '断面' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onModeChange?.(key)}
              className={`block w-full text-left px-2 py-1 rounded text-xs ${
                currentMode === key 
                  ? 'bg-blue-500 text-white' 
                  : 'hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {currentMode === 'transparent' && (
          <div className="mt-2 text-xs">
            透明度: {Math.round(transparencyLevel * 100)}%
          </div>
        )}
      </div>
    </Html>
  );
};

// 内部構造ラベル
const InternalStructureLabels: React.FC<{
  caseSize: { width: number; height: number; depth: number; wallThickness: number };
}> = () => {
  const labels = [
    { position: [-0.3, 0.3, -0.3], text: 'マザーボードエリア', color: '#10b981' },
    { position: [0.3, 0.2, -0.4], text: 'PSUマウント', color: '#ef4444' },
    { position: [0.5, 0.8, 0.4], text: 'ドライブベイ', color: '#f59e0b' },
    { position: [0, 1.6, 0], text: 'ケーブル配線エリア', color: '#8b5cf6' }
  ];

  return (
    <>
      {labels.map((label, index) => (
        <Html
          key={index}
          position={label.position as [number, number, number]}
          center
          distanceFactor={10}
        >
          <div 
            className="px-2 py-1 rounded text-xs font-medium shadow-lg"
            style={{ 
              backgroundColor: label.color,
              color: 'white'
            }}
          >
            {label.text}
          </div>
        </Html>
      ))}
    </>
  );
};

export default CaseInternalViewer;