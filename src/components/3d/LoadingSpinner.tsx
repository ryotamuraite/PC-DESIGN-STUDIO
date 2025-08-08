// src/components/3d/LoadingSpinner.tsx
// 3Dシーン用ローディングスピナー

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export const LoadingSpinner: React.FC = () => {
  const spinnerRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (spinnerRef.current) {
      spinnerRef.current.rotation.y += 0.05;
    }
  });

  return (
    <group ref={spinnerRef}>
      <Html center>
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <div className="mt-2 text-white text-sm">3Dモデル読み込み中...</div>
        </div>
      </Html>
    </group>
  );
};

export default LoadingSpinner;