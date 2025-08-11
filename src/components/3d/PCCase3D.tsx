// src/components/3d/PCCase3D.tsx
// PCケース3Dモデルコンポーネント - Phase3革新機能

import React, { useRef } from 'react';
import { Box, Html } from '@react-three/drei';
import type { Part } from '@/types';
import * as THREE from 'three';

interface PCCase3DProps {
  caseData: Part | null;
  position?: [number, number, number];
  showInternals?: boolean;
  showLabel?: boolean; // ラベル表示制御を追加
}

export const PCCase3D: React.FC<PCCase3DProps> = ({
  caseData,
  position = [0, 0, 0],
  showInternals = true,
  showLabel = true // デフォルトはtrue
}) => {
  const caseRef = useRef<THREE.Group>(null);

  // デフォルトケースサイズ（mATXケースベース）
  const caseWidth = 2.0;   // 奥行き
  const caseHeight = 1.8;  // 高さ
  const caseDepth = 1.5;   // 幅
  const wallThickness = 0.05;

  // ケース底部を地面に接地させるためのY位置調整
  const adjustedPosition: [number, number, number] = [
    position[0], 
    position[1] + caseHeight/2, // 底部を地面（Y=0）に接地
    position[2]
  ];

  // 軽微なアニメーション（削除：安定性向上）
  // useFrame((state) => {
  //   if (caseRef.current) {
  //     // 非常に軽微な浮遊アニメーション
  //     caseRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
  //   }
  // });

  return (
    <group ref={caseRef} position={adjustedPosition}>
      {/* ケース外装 */}
      <group>
        {/* 背面パネル */}
        <Box
          args={[caseWidth, caseHeight, wallThickness]}
          position={[0, 0, -caseDepth/2]}
        >
          <meshStandardMaterial 
            color="#2d3748" 
            metalness={0.3} 
            roughness={0.7}
          />
        </Box>

        {/* 左側面パネル */}
        <Box
          args={[wallThickness, caseHeight, caseDepth]}
          position={[-caseWidth/2, 0, 0]}
        >
          <meshStandardMaterial 
            color="#2d3748" 
            metalness={0.3} 
            roughness={0.7}
          />
        </Box>

        {/* 右側面パネル（透明 - 内部が見える）*/}
        <Box
          args={[wallThickness, caseHeight, caseDepth]}
          position={[caseWidth/2, 0, 0]}
        >
          <meshStandardMaterial 
            color="#4a5568" 
            transparent 
            opacity={0.3}
            metalness={0.5} 
            roughness={0.3}
          />
        </Box>

        {/* 上面パネル */}
        <Box
          args={[caseWidth, wallThickness, caseDepth]}
          position={[0, caseHeight/2, 0]}
        >
          <meshStandardMaterial 
            color="#2d3748" 
            metalness={0.3} 
            roughness={0.7}
          />
        </Box>

        {/* 底面パネル */}
        <Box
          args={[caseWidth, wallThickness, caseDepth]}
          position={[0, -caseHeight/2, 0]}
        >
          <meshStandardMaterial 
            color="#1a202c" 
            metalness={0.4} 
            roughness={0.8}
          />
        </Box>

        {/* 前面パネル（部分的 - フロントI/O用）*/}
        <Box
          args={[caseWidth * 0.8, caseHeight * 0.3, wallThickness]}
          position={[0, caseHeight * 0.3, caseDepth/2]}
        >
          <meshStandardMaterial 
            color="#2d3748" 
            metalness={0.3} 
            roughness={0.7}
          />
        </Box>
      </group>

      {/* 内部構造（パーツマウント位置） */}
      {showInternals && (
        <group>
          {/* マザーボードマウント位置 */}
          <Box
            args={[0.6, 0.02, 0.6]}
            position={[-0.3, -0.18, -0.3]}
          >
            <meshStandardMaterial 
              color="#22543d" 
              metalness={0.1} 
              roughness={0.9}
            />
          </Box>

          {/* PSUマウント位置 */}
          <Box
            args={[0.4, 0.2, 0.4]}
            position={[0.3, -0.8, -0.4]}
          >
            <meshStandardMaterial 
              color="#1a202c" 
              metalness={0.2} 
              roughness={0.8}
            />
          </Box>

          {/* ドライブベイ */}
          <group position={[0.5, 0.1, 0.4]}>
            {[0, 1, 2].map(i => (
              <Box
                key={i}
                args={[0.3, 0.06, 0.4]}
                position={[0, -i * 0.08, 0]}
              >
                <meshStandardMaterial 
                  color="#4a5568" 
                  metalness={0.3} 
                  roughness={0.7}
                />
              </Box>
            ))}
          </group>
        </group>
      )}

      {/* ケース情報ラベル（表示制御対応） */}
      {showLabel && (
        <Html
          position={[0, caseHeight/2 + 0.4, 0]}
          center
          distanceFactor={8}
        >
          <div className="bg-black bg-opacity-80 text-white px-3 py-1.5 rounded-lg text-center shadow-lg border border-gray-600" style={{ minWidth: '100px', whiteSpace: 'nowrap' }}>
            <div className="font-medium text-xs">
              {caseData?.name || 'PCケース'}
            </div>
            {caseData && (
              <div className="text-xs opacity-80 mt-0.5">
                {caseData.manufacturer}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

export default PCCase3D;