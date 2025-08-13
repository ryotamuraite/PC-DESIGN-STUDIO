// src/components/3d/advanced/AnimationController.tsx
// Phase 3: アニメーション効果システム - 3D体験の革新

import React, { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface AnimationKeyframe {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  duration: number;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';
}

export interface AnimationSequence {
  id: string;
  keyframes: AnimationKeyframe[];
  loop?: boolean;
  onComplete?: () => void;
}

interface AnimationControllerProps {
  children: React.ReactNode;
  sequences: AnimationSequence[];
  autoPlay?: boolean;
  speed?: number;
}

export const AnimationController: React.FC<AnimationControllerProps> = ({
  children,
  sequences,
  autoPlay = false,
  speed = 1.0
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [activeSequences, setActiveSequences] = useState<Map<string, {
    sequence: AnimationSequence;
    startTime: number;
    currentKeyframe: number;
    isPlaying: boolean;
  }>>(new Map());

  // イージング関数
  const easeFunction = useCallback((type: string, t: number): number => {
    switch (type) {
      case 'ease-in':
        return t * t;
      case 'ease-out':
        return t * (2 - t);
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      case 'bounce':
        {
          const n1 = 7.5625;
          const d1 = 2.75;
          if (t < 1 / d1) {
            return n1 * t * t;
          } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
          } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
          } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
          }
        }
      default:
        return t; // linear
    }
  }, []);

  // アニメーション開始
  const startAnimation = useCallback((sequenceId: string) => {
    const sequence = sequences.find(s => s.id === sequenceId);
    if (!sequence) return;

    setActiveSequences(prev => new Map([
      ...prev,
      [sequenceId, {
        sequence,
        startTime: Date.now(),
        currentKeyframe: 0,
        isPlaying: true
      }]
    ]));
  }, [sequences]);



  // アニメーション更新
  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const currentTime = Date.now();
    
    activeSequences.forEach((activeSeq, sequenceId) => {
      if (!activeSeq.isPlaying) return;

      const { sequence, startTime, currentKeyframe } = activeSeq;
      const elapsed = (currentTime - startTime) * speed;
      
      if (currentKeyframe >= sequence.keyframes.length) {
        // アニメーション完了
        if (sequence.loop) {
          // ループ再生
          setActiveSequences(prev => new Map([
            ...prev,
            [sequenceId, {
              ...activeSeq,
              startTime: currentTime,
              currentKeyframe: 0
            }]
          ]));
        } else {
          // 完了処理
          sequence.onComplete?.();
          setActiveSequences(prev => {
            const newMap = new Map(prev);
            newMap.delete(sequenceId);
            return newMap;
          });
        }
        return;
      }

      const keyframe = sequence.keyframes[currentKeyframe];
      const keyframeDuration = keyframe.duration;
      
      if (elapsed >= keyframeDuration) {
        // 次のキーフレームへ
        setActiveSequences(prev => new Map([
          ...prev,
          [sequenceId, {
            ...activeSeq,
            currentKeyframe: currentKeyframe + 1,
            startTime: currentTime
          }]
        ]));
        return;
      }

      // 現在のキーフレーム内での補間
      const progress = elapsed / keyframeDuration;
      const easedProgress = easeFunction(keyframe.easing || 'linear', progress);
      
      // 前のキーフレームと現在のキーフレーム間の補間
      const prevKeyframe = currentKeyframe > 0 
        ? sequence.keyframes[currentKeyframe - 1] 
        : { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } as AnimationKeyframe;

      // 位置の補間
      const interpolatedPosition = [
        prevKeyframe.position[0] + (keyframe.position[0] - prevKeyframe.position[0]) * easedProgress,
        prevKeyframe.position[1] + (keyframe.position[1] - prevKeyframe.position[1]) * easedProgress,
        prevKeyframe.position[2] + (keyframe.position[2] - prevKeyframe.position[2]) * easedProgress
      ] as [number, number, number];

      // 回転の補間
      const interpolatedRotation = [
        prevKeyframe.rotation[0] + (keyframe.rotation[0] - prevKeyframe.rotation[0]) * easedProgress,
        prevKeyframe.rotation[1] + (keyframe.rotation[1] - prevKeyframe.rotation[1]) * easedProgress,
        prevKeyframe.rotation[2] + (keyframe.rotation[2] - prevKeyframe.rotation[2]) * easedProgress
      ] as [number, number, number];

      // スケールの補間
      const interpolatedScale = [
        prevKeyframe.scale[0] + (keyframe.scale[0] - prevKeyframe.scale[0]) * easedProgress,
        prevKeyframe.scale[1] + (keyframe.scale[1] - prevKeyframe.scale[1]) * easedProgress,
        prevKeyframe.scale[2] + (keyframe.scale[2] - prevKeyframe.scale[2]) * easedProgress
      ] as [number, number, number];

      // 実際の変形適用
      group.position.set(...interpolatedPosition);
      group.rotation.set(...interpolatedRotation);
      group.scale.set(...interpolatedScale);
    });
  });

  // 自動再生
  React.useEffect(() => {
    if (autoPlay && sequences.length > 0) {
      sequences.forEach(sequence => {
        startAnimation(sequence.id);
      });
    }
  }, [autoPlay, sequences, startAnimation]);

  return (
    <group ref={groupRef}>
      {children}
    </group>
  );
};


export default AnimationController;