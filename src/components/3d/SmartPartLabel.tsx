// src/components/3d/SmartPartLabel.tsx
// 高度なパーツラベルシステム - 線接続・重複回避・自動配置

import React, { useRef, useMemo, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface SmartPartLabelProps {
  partPosition: [number, number, number];
  partName: string;
  partInfo: string;
  color: string;
  avoidPositions?: Array<[number, number, number]>;
  onPositionUpdate?: (position: [number, number, number]) => void;
}

export const SmartPartLabel: React.FC<SmartPartLabelProps> = ({
  partPosition,
  partName,
  partInfo,
  color,
  avoidPositions = [],
  onPositionUpdate
}) => {
  const { camera } = useThree();
  const labelRef = useRef<THREE.Group>(null);
  const lineRef = useRef<THREE.Line | null>(null);
  const [labelPosition, setLabelPosition] = useState<[number, number, number]>([
    partPosition[0] + 0.5,
    partPosition[1] + 0.3,
    partPosition[2]
  ]);

  // ラベル位置の最適化計算
  const calculateOptimalPosition = useMemo(() => {
    const [px, py, pz] = partPosition;
    
    // カメラとの角度を考慮した基本配置候補
    const candidates: Array<[number, number, number]> = [
      [px + 0.6, py + 0.4, pz],      // 右上
      [px - 0.6, py + 0.4, pz],      // 左上
      [px, py + 0.6, pz + 0.3],      // 上奥
      [px, py + 0.6, pz - 0.3],      // 上前
      [px + 0.4, py - 0.2, pz + 0.4], // 右下奥
      [px - 0.4, py - 0.2, pz + 0.4], // 左下奥
    ];

    // 重複を避ける最良位置を選択
    let bestPosition = candidates[0];
    let bestScore = -Infinity;

    candidates.forEach(candidate => {
      let score = 0;
      
      // 他のラベルとの距離を計算
      avoidPositions.forEach(avoidPos => {
        const distance = Math.sqrt(
          Math.pow(candidate[0] - avoidPos[0], 2) +
          Math.pow(candidate[1] - avoidPos[1], 2) +
          Math.pow(candidate[2] - avoidPos[2], 2)
        );
        score += Math.min(distance * 10, 50); // 距離が離れているほど高得点
      });

      // カメラからの見やすさを考慮
      const cameraPos = camera.position;
      const toCameraDir = new THREE.Vector3(
        cameraPos.x - candidate[0],
        cameraPos.y - candidate[1], 
        cameraPos.z - candidate[2]
      ).normalize();
      
      // カメラ方向に向いているほど高得点
      score += toCameraDir.y * 20; // 上方向を優遇
      score += Math.abs(toCameraDir.x) * 10; // 左右分散を優遇

      if (score > bestScore) {
        bestScore = score;
        bestPosition = candidate;
      }
    });

    return bestPosition;
  }, [partPosition, avoidPositions, camera.position]);

  // カメラが動いた時の位置更新
  useFrame(() => {
    const newPosition = calculateOptimalPosition;
    const [nx, ny, nz] = newPosition;
    const [cx, cy, cz] = labelPosition;
    
    // 位置が大きく変わった場合のみ更新（jitter防止）
    const threshold = 0.1;
    if (
      Math.abs(nx - cx) > threshold ||
      Math.abs(ny - cy) > threshold ||
      Math.abs(nz - cz) > threshold
    ) {
      setLabelPosition(newPosition);
      onPositionUpdate?.(newPosition);
    }

    // 線の更新
    if (lineRef.current) {
      const geometry = lineRef.current.geometry as THREE.BufferGeometry;
      const positions = new Float32Array([
        partPosition[0], partPosition[1], partPosition[2],
        labelPosition[0], labelPosition[1], labelPosition[2]
      ]);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.attributes.position.needsUpdate = true;
    }
  });

  // 線のジオメトリを作成
  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([
      partPosition[0], partPosition[1], partPosition[2],
      labelPosition[0], labelPosition[1], labelPosition[2]
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [partPosition, labelPosition]);

  return (
    <group ref={labelRef}>
      {/* 接続線 */}
      <line ref={lineRef as any} geometry={lineGeometry}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.8}
          linewidth={2}
        />
      </line>
      
      {/* 接続点（パーツ側） */}
      <mesh position={partPosition}>
        <sphereGeometry args={[0.02]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* 接続点（ラベル側） */}
      <mesh position={labelPosition}>
        <sphereGeometry args={[0.015]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* ラベル */}
      <Html
        position={labelPosition}
        center
        distanceFactor={4}
        sprite
      >
        <div 
          className="relative"
          style={{ 
            animation: 'fadeIn 0.3s ease-out',
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* 背景 */}
          <div 
            className="absolute inset-0 rounded-lg shadow-lg"
            style={{
              backgroundColor: color,
              opacity: 0.15,
              filter: 'blur(8px)',
              transform: 'scale(1.1)',
            }}
          />
          
          {/* メインラベル */}
          <div 
            className="relative text-white px-3 py-2 rounded-lg text-xs text-center shadow-lg border backdrop-blur-sm"
            style={{
              backgroundColor: `${color}dd`,
              borderColor: color,
              minWidth: '80px',
              maxWidth: '120px'
            }}
          >
            <div className="font-bold text-xs leading-tight">
              {partName}
            </div>
            <div className="text-xs opacity-90 leading-tight mt-1">
              {partInfo}
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
};

export default SmartPartLabel;