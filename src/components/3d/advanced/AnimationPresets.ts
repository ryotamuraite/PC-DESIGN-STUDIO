// src/components/3d/advanced/AnimationPresets.ts
// Phase 3: アニメーションプリセット定義

import type { AnimationSequence } from './AnimationController';

// プリセットアニメーション定義
export const AnimationPresets = {
  // パーツ挿入アニメーション
  partInsertion: (duration = 1000): AnimationSequence => ({
    id: 'part-insertion',
    keyframes: [
      {
        position: [0, 2, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        duration: 0,
        easing: 'linear'
      },
      {
        position: [0, 0.5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        duration: duration * 0.7,
        easing: 'ease-out'
      },
      {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        duration: duration * 0.3,
        easing: 'bounce'
      }
    ]
  }),

  // パーツ選択時のハイライト
  partHighlight: (duration = 500): AnimationSequence => ({
    id: 'part-highlight',
    keyframes: [
      {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        duration: 0
      },
      {
        position: [0, 0.05, 0],
        rotation: [0, 0, 0],
        scale: [1.05, 1.05, 1.05],
        duration: duration * 0.5,
        easing: 'ease-out'
      },
      {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        duration: duration * 0.5,
        easing: 'ease-in'
      }
    ],
    loop: true
  }),

  // ケース開閉アニメーション
  caseOpening: (duration = 2000): AnimationSequence => ({
    id: 'case-opening',
    keyframes: [
      {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        duration: 0
      },
      {
        position: [0.5, 0, 0],
        rotation: [0, -Math.PI * 0.3, 0],
        scale: [1, 1, 1],
        duration: duration,
        easing: 'ease-in-out'
      }
    ]
  }),

  // エラー時の警告アニメーション
  errorShake: (duration = 300): AnimationSequence => ({
    id: 'error-shake',
    keyframes: [
      {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        duration: 0
      },
      {
        position: [0.05, 0, 0],
        rotation: [0, 0, 0.05],
        scale: [1, 1, 1],
        duration: duration * 0.25,
        easing: 'ease-out'
      },
      {
        position: [-0.05, 0, 0],
        rotation: [0, 0, -0.05],
        scale: [1, 1, 1],
        duration: duration * 0.25,
        easing: 'ease-in-out'
      },
      {
        position: [0.03, 0, 0],
        rotation: [0, 0, 0.03],
        scale: [1, 1, 1],
        duration: duration * 0.25,
        easing: 'ease-in-out'
      },
      {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        duration: duration * 0.25,
        easing: 'ease-in'
      }
    ]
  })
};
