// src/components/assembly/AssemblyGuide.tsx
// Phase 3: 組み立て手順ガイド - 3D連動ステップバイステップ

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, AlertTriangle, CheckCircle2, 
  Clock, Users, Zap, Eye, HelpCircle 
} from 'lucide-react';
import type { PCConfiguration, PartCategory } from '@/types';

export interface AssemblyStep {
  id: string;
  title: string;
  description: string;
  detailedInstructions: string[];
  estimatedTime: number; // 分
  difficulty: 'easy' | 'medium' | 'hard';
  requiredTools: string[];
  requiredParts: PartCategory[];
  warnings?: string[];
  tips?: string[];
  commonMistakes?: string[];
  threeD_highlights?: {
    focusPosition: [number, number, number];
    highlightParts: string[];
    cameraAngle: [number, number, number];
    viewMode?: 'normal' | 'transparent' | 'cross-section';
  };
  images?: string[];
  videoUrl?: string;
  checkpoints: {
    description: string;
    isCompleted: boolean;
  }[];
}

interface AssemblyGuideProps {
  configuration: PCConfiguration;
  currentStep?: number;
  showTimer?: boolean;
  show3DIntegration?: boolean;
  autoAdvance?: boolean;
  onStepChange?: (step: number, stepData: AssemblyStep) => void;
  onStepComplete?: (step: number) => void;
  on3DHighlight?: (highlights: AssemblyStep['threeD_highlights']) => void;
}

export const AssemblyGuide: React.FC<AssemblyGuideProps> = ({
  configuration,
  currentStep = 0,
  showTimer = true,
  show3DIntegration = true,
  autoAdvance = false,
  onStepChange,
  onStepComplete,
  on3DHighlight
}) => {
  const [activeStep, setActiveStep] = useState(currentStep);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['instructions']));

  // 構成に基づいた組み立て手順の生成
  const assemblySteps = useMemo((): AssemblyStep[] => {
    const steps: AssemblyStep[] = [];
    const { parts } = configuration;

    // 基本ステップ：準備
    steps.push({
      id: 'preparation',
      title: '組み立て準備',
      description: '作業環境の準備と工具の確認を行います',
      detailedInstructions: [
        '清潔で十分な広さの作業台を用意',
        '静電気防止マットまたはリストストラップを装着',
        '必要な工具を手の届く場所に配置',
        'パーツの外箱と保証書を整理',
        '組み立て説明書とマニュアルを準備'
      ],
      estimatedTime: 10,
      difficulty: 'easy',
      requiredTools: ['phillips-screwdriver', 'anti-static-wrist-strap'],
      requiredParts: [],
      warnings: [
        '静電気は精密部品を破損させる可能性があります',
        '強い磁石や電子機器を作業台から離してください'
      ],
      tips: [
        '十分な照明を確保しましょう',
        'ネジなどの小物用に小皿を用意すると便利です'
      ],
      checkpoints: [
        { description: '作業台の準備完了', isCompleted: false },
        { description: '静電気対策の実施', isCompleted: false },
        { description: '工具の動作確認', isCompleted: false }
      ],
      threeD_highlights: {
        focusPosition: [0, 0, 0],
        highlightParts: [],
        cameraAngle: [45, 45, 45],
        viewMode: 'normal'
      }
    });

    // PCケース準備
    if (parts.case) {
      steps.push({
        id: 'case-preparation',
        title: 'PCケース準備',
        description: 'ケースの開梱と準備作業を行います',
        detailedInstructions: [
          'ケースを慎重に開梱し、付属品を確認',
          '両サイドパネルを取り外し',
          'I/Oシールドを取り外し（マザーボード付属品と交換）',
          'スタンドオフの位置と数量を確認',
          '余分なスタンドオフがあれば取り外し'
        ],
        estimatedTime: 15,
        difficulty: 'easy',
        requiredTools: ['phillips-screwdriver'],
        requiredParts: ['case'],
        warnings: [
          'サイドパネルは重いので落下に注意',
          '金属エッジで手を切らないよう注意'
        ],
        tips: [
          'パネルの取り外し方向を確認してから作業',
          '付属ネジは種類別に分けて保管'
        ],
        checkpoints: [
          { description: 'サイドパネル取り外し完了', isCompleted: false },
          { description: 'I/Oシールド確認', isCompleted: false },
          { description: 'スタンドオフ確認', isCompleted: false }
        ],
        threeD_highlights: {
          focusPosition: [0, 1, 0],
          highlightParts: ['case'],
          cameraAngle: [30, 20, 30],
          viewMode: 'transparent'
        }
      });
    }

    // マザーボード準備（ケース外）
    if (parts.motherboard) {
      steps.push({
        id: 'motherboard-preparation',
        title: 'マザーボード準備',
        description: 'ケース外でマザーボードにパーツを取り付けます',
        detailedInstructions: [
          'マザーボードを静電気防止袋から取り出し',
          'マザーボードを外箱の上に平置き',
          'I/Oシールドをケースに取り付け',
          'CPUソケットのカバーを確認（まだ外さない）'
        ],
        estimatedTime: 10,
        difficulty: 'easy',
        requiredTools: ['anti-static-wrist-strap'],
        requiredParts: ['motherboard'],
        warnings: [
          'マザーボードの裏面の突起に注意',
          'コンデンサやコネクタを強く押さないように'
        ],
        tips: [
          '外箱は静電気防止になり作業台として最適',
          'ソケットピンの確認をこの段階で行う'
        ],
        checkpoints: [
          { description: 'マザーボード設置完了', isCompleted: false },
          { description: 'I/Oシールド取り付け', isCompleted: false }
        ],
        threeD_highlights: {
          focusPosition: [-0.3, 0, -0.3],
          highlightParts: ['motherboard'],
          cameraAngle: [0, 90, 0],
          viewMode: 'normal'
        }
      });
    }

    // CPU取り付け
    if (parts.cpu) {
      steps.push({
        id: 'cpu-installation',
        title: 'CPU取り付け',
        description: 'CPUをマザーボードに慎重に取り付けます',
        detailedInstructions: [
          'CPUソケットレバーを上げてカバーを開く',
          'CPUを箱から取り出し（ピン面を触らない）',
          'CPU の向きを確認（切り欠きや▲マークで合わせる）',
          'CPUを軽く載せる（押し込まない）',
          'ソケットレバーを下げて固定',
          'プラスチックカバーが飛び出すので保管'
        ],
        estimatedTime: 15,
        difficulty: 'hard',
        requiredTools: [],
        requiredParts: ['cpu', 'motherboard'],
        warnings: [
          'CPUピンは非常に繊細です。曲がると修復不能',
          '向きを間違えると取り返しがつきません',
          '無理に押し込まないでください'
        ],
        tips: [
          'CPU の▲マークとソケットの▲マークを合わせる',
          '正しく置けていれば軽く載るだけで収まります',
          'レバーを下げるときは多少力が必要です'
        ],
        commonMistakes: [
          '向きを間違えて強引に押し込む',
          'ピン面を直接触ってしまう',
          'レバーを下げ忘れる'
        ],
        checkpoints: [
          { description: 'CPU の向き確認', isCompleted: false },
          { description: 'CPU 設置完了', isCompleted: false },
          { description: 'ソケットレバー固定', isCompleted: false }
        ],
        threeD_highlights: {
          focusPosition: [-0.3, -0.1, -0.3],
          highlightParts: ['cpu', 'motherboard'],
          cameraAngle: [0, 90, 0],
          viewMode: 'normal'
        }
      });
    }

    // CPUクーラー取り付け
    if (parts.cooler) {
      steps.push({
        id: 'cooler-installation',
        title: 'CPUクーラー取り付け',
        description: 'CPUクーラーにサーマルペーストを塗布して取り付けます',
        detailedInstructions: [
          'CPUクーラーの取り付け方法を確認',
          'マザーボード裏面にバックプレートを取り付け',
          'CPU 表面にサーマルペーストを米粒大で塗布',
          'クーラーを慎重に CPU の上に置く',
          '固定ネジを対角線上に少しずつ締める',
          'ファンケーブルをマザーボードに接続'
        ],
        estimatedTime: 20,
        difficulty: 'medium',
        requiredTools: ['phillips-screwdriver', 'thermal-paste'],
        requiredParts: ['cooler', 'cpu'],
        warnings: [
          'サーマルペーストの量は米粒大で十分',
          'ネジは均等に締めないと CPU が破損する可能性',
          'ファンケーブルの接続を忘れずに'
        ],
        tips: [
          'バックプレートの向きに注意',
          'ネジは対角線上に少しずつ締める',
          'ペーストは塗り過ぎると逆効果'
        ],
        checkpoints: [
          { description: 'バックプレート取り付け', isCompleted: false },
          { description: 'サーマルペースト塗布', isCompleted: false },
          { description: 'クーラー固定完了', isCompleted: false },
          { description: 'ファンケーブル接続', isCompleted: false }
        ],
        threeD_highlights: {
          focusPosition: [-0.3, 0.1, -0.3],
          highlightParts: ['cooler', 'cpu'],
          cameraAngle: [45, 45, 0],
          viewMode: 'transparent'
        }
      });
    }

    // メモリ取り付け
    if (parts.memory) {
      steps.push({
        id: 'memory-installation',
        title: 'メモリ取り付け',
        description: 'メモリモジュールをスロットに取り付けます',
        detailedInstructions: [
          'メモリスロットの位置を確認',
          'デュアルチャンネル用に適切なスロットを選択',
          'スロット両端のクリップを開く',
          'メモリの切り欠き位置を確認',
          'メモリを垂直に押し込んでクリップで固定',
          '複数枚ある場合は同じ手順で取り付け'
        ],
        estimatedTime: 10,
        difficulty: 'easy',
        requiredTools: [],
        requiredParts: ['memory', 'motherboard'],
        warnings: [
          '向きを間違えると挿入できません',
          'メモリ端子部分を直接触らないように'
        ],
        tips: [
          'デュアルチャンネルは色違いのスロットに挿入',
          '「カチッ」という音がするまで押し込む',
          'マザーボードマニュアルでスロット順序を確認'
        ],
        checkpoints: [
          { description: 'スロット選択確認', isCompleted: false },
          { description: 'メモリ挿入完了', isCompleted: false },
          { description: 'クリップ固定確認', isCompleted: false }
        ],
        threeD_highlights: {
          focusPosition: [-0.1, 0, -0.3],
          highlightParts: ['memory', 'motherboard'],
          cameraAngle: [0, 90, 0],
          viewMode: 'normal'
        }
      });
    }

    // マザーボードのケース取り付け
    if (parts.motherboard && parts.case) {
      steps.push({
        id: 'motherboard-installation',
        title: 'マザーボードのケース取り付け',
        description: 'パーツ取り付け済みマザーボードをケースに設置します',
        detailedInstructions: [
          'ケースのスタンドオフ位置を再確認',
          'マザーボードを慎重にケース内に配置',
          'I/O ポートがシールドに正しく合うか確認',
          'マザーボードネジで各スタンドオフに固定',
          '全ネジを軽く仮止めしてから本締め'
        ],
        estimatedTime: 15,
        difficulty: 'medium',
        requiredTools: ['phillips-screwdriver'],
        requiredParts: ['motherboard', 'case'],
        warnings: [
          'マザーボードを無理に押し込まない',
          'ネジの締めすぎに注意'
        ],
        tips: [
          'I/O シールドとの位置合わせが重要',
          'ネジは対角線上に少しずつ締める'
        ],
        checkpoints: [
          { description: 'マザーボード位置決め', isCompleted: false },
          { description: 'ネジ固定完了', isCompleted: false }
        ],
        threeD_highlights: {
          focusPosition: [-0.3, 0, -0.3],
          highlightParts: ['motherboard', 'case'],
          cameraAngle: [30, 45, 30],
          viewMode: 'cross-section'
        }
      });
    }

    // ストレージ取り付け
    if (parts.storage) {
      const storageInterface = parts.storage.specifications?.interface as string || '';
      const isNVMe = storageInterface.includes('NVMe');
      steps.push({
        id: 'storage-installation',
        title: `${isNVMe ? 'M.2 SSD' : 'ストレージ'}取り付け`,
        description: `${isNVMe ? 'M.2 スロットにSSDを取り付け' : 'ドライブベイにストレージを設置'}します`,
        detailedInstructions: isNVMe ? [
          'マザーボードの M.2 スロット位置を確認',
          'スロットのネジを外す',
          'SSD を 30度角度で挿入',
          'SSD を平らに倒してネジで固定',
          'ヒートシンクがある場合は取り付け'
        ] : [
          'ドライブベイにストレージを設置',
          'ドライブベイネジで固定',
          'SATA データケーブルを接続',
          'SATA 電源ケーブルを接続',
          'ケーブルの取り回しを整理'
        ],
        estimatedTime: isNVMe ? 10 : 15,
        difficulty: isNVMe ? 'easy' : 'medium',
        requiredTools: isNVMe ? ['phillips-screwdriver'] : ['phillips-screwdriver', 'sata-cables'],
        requiredParts: ['storage'],
        warnings: isNVMe ? [
          'M.2 SSD の向きに注意',
          '無理に押し込まない'
        ] : [
          'ケーブルの抜き差しは慎重に',
          '電源ケーブルの向きを確認'
        ],
        checkpoints: isNVMe ? [
          { description: 'M.2 SSD 挿入', isCompleted: false },
          { description: 'ネジ固定完了', isCompleted: false }
        ] : [
          { description: 'ストレージ固定', isCompleted: false },
          { description: 'ケーブル接続完了', isCompleted: false }
        ],
        threeD_highlights: isNVMe ? {
          focusPosition: [0.1, -0.1, -0.1],
          highlightParts: ['storage', 'motherboard'],
          cameraAngle: [0, 90, 0],
          viewMode: 'normal'
        } : {
          focusPosition: [0.5, -0.3, 0.4],
          highlightParts: ['storage', 'case'],
          cameraAngle: [45, 45, 45],
          viewMode: 'transparent'
        }
      });
    }

    // 電源ユニット取り付け
    if (parts.psu) {
      steps.push({
        id: 'psu-installation',
        title: '電源ユニット取り付け',
        description: '電源ユニットをケース下部に設置します',
        detailedInstructions: [
          'PSU のファン向きを確認（下向きまたは上向き）',
          'PSU をケース下部にスライドイン',
          'ケース背面から PSU ネジで固定',
          '電源スイッチがアクセスしやすいか確認'
        ],
        estimatedTime: 10,
        difficulty: 'easy',
        requiredTools: ['phillips-screwdriver'],
        requiredParts: ['psu', 'case'],
        warnings: [
          'PSU は重いので落下に注意',
          'ファン向きを間違えると冷却効果が下がる'
        ],
        tips: [
          'ケース底面にダストフィルターがある場合はファン下向き',
          'ケーブルの取り回しを考慮してから固定'
        ],
        checkpoints: [
          { description: 'PSU 設置完了', isCompleted: false },
          { description: 'ネジ固定完了', isCompleted: false }
        ],
        threeD_highlights: {
          focusPosition: [0.3, -0.6, -0.4],
          highlightParts: ['psu', 'case'],
          cameraAngle: [45, 0, 45],
          viewMode: 'transparent'
        }
      });
    }

    // GPU取り付け
    if (parts.gpu) {
      steps.push({
        id: 'gpu-installation',
        title: 'グラフィックカード取り付け',
        description: 'グラフィックカードを PCIe スロットに取り付けます',
        detailedInstructions: [
          'PCIe x16 スロットを確認',
          'スロット後方のブラケットを取り外し',
          'スロットのレバーを開く',
          'GPU を垂直に挿入してしっかり押し込む',
          'GPU ブラケットをケースにネジ止め',
          '補助電源ケーブルを接続（必要に応じて）'
        ],
        estimatedTime: 15,
        difficulty: 'medium',
        requiredTools: ['phillips-screwdriver'],
        requiredParts: ['gpu', 'motherboard'],
        warnings: [
          'GPU は高価なので慎重に扱う',
          '補助電源の接続を忘れずに'
        ],
        tips: [
          'GPU の重量でマザーボードが歪まないよう支える',
          'クリック音がするまでしっかり挿入'
        ],
        checkpoints: [
          { description: 'PCIe スロット挿入', isCompleted: false },
          { description: 'ブラケット固定', isCompleted: false },
          { description: '補助電源接続', isCompleted: false }
        ],
        threeD_highlights: {
          focusPosition: [0, 0, 0],
          highlightParts: ['gpu', 'motherboard'],
          cameraAngle: [45, 0, 45],
          viewMode: 'transparent'
        }
      });
    }

    // ケーブル配線
    steps.push({
      id: 'cable-management',
      title: 'ケーブル配線',
      description: '電源ケーブルとデータケーブルを接続します',
      detailedInstructions: [
        'マザーボード 24pin 電源ケーブル接続',
        'CPU 8pin 電源ケーブル接続',
        'GPU 補助電源ケーブル接続（必要に応じて）',
        'ケースファン電源ケーブル接続',
        'フロントパネルコネクタ接続',
        'SATA データケーブル接続',
        'ケーブルを整理してタイで固定'
      ],
      estimatedTime: 30,
      difficulty: 'medium',
      requiredTools: ['cable-ties'],
      requiredParts: ['psu', 'motherboard'],
      warnings: [
        'ケーブルの向きを確認してから挿入',
        'フロントパネルコネクタは極性に注意'
      ],
      tips: [
        'ケーブルは裏面配線を活用',
        'エアフローを妨げないよう配線',
        'マザーボードマニュアルでピン配置確認'
      ],
      checkpoints: [
        { description: 'メイン電源接続', isCompleted: false },
        { description: 'CPU 電源接続', isCompleted: false },
        { description: 'フロントパネル接続', isCompleted: false },
        { description: 'ケーブル整理完了', isCompleted: false }
      ],
      threeD_highlights: {
        focusPosition: [0, 0, 0],
        highlightParts: ['psu', 'motherboard', 'case'],
        cameraAngle: [30, 45, 30],
        viewMode: 'cross-section'
      }
    });

    // 最終確認と起動テスト
    steps.push({
      id: 'final-check',
      title: '最終確認と起動テスト',
      description: '組み立て完了前の最終チェックを行います',
      detailedInstructions: [
        '全ケーブルの接続を再確認',
        '余ったネジがないか確認',
        'ケース内に工具を忘れていないか確認',
        'サイドパネルを仮付けして起動テスト',
        'BIOS/UEFI 画面が表示されるか確認',
        '問題がなければサイドパネルを本固定'
      ],
      estimatedTime: 15,
      difficulty: 'easy',
      requiredTools: ['phillips-screwdriver'],
      requiredParts: [],
      warnings: [
        '初回起動で表示されない場合は慌てずに接続確認',
        'サイドパネルは慎重に取り付け'
      ],
      tips: [
        'モニターケーブルはマザーボードではなく GPU に接続',
        'BIOS で CPU 温度とファン回転数を確認'
      ],
      checkpoints: [
        { description: '全接続の確認', isCompleted: false },
        { description: '工具の確認', isCompleted: false },
        { description: '起動テスト成功', isCompleted: false },
        { description: 'パネル取り付け', isCompleted: false }
      ],
      threeD_highlights: {
        focusPosition: [0, 1, 0],
        highlightParts: ['case'],
        cameraAngle: [45, 45, 45],
        viewMode: 'normal'
      }
    });

    return steps;
  }, [configuration]);

  // タイマー機能
  React.useEffect(() => {
    if (!isPlaying || !showTimer) return;

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - stepStartTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, stepStartTime, showTimer]);

  // ステップ変更処理
  const handleStepChange = useCallback((newStep: number) => {
    if (newStep < 0 || newStep >= assemblySteps.length) return;

    setActiveStep(newStep);
    setStepStartTime(Date.now());
    setElapsedTime(0);
    
    const stepData = assemblySteps[newStep];
    onStepChange?.(newStep, stepData);

    // 3D強調表示
    if (show3DIntegration && stepData['threeD_highlights']) {
      on3DHighlight?.(stepData['threeD_highlights']);
    }
  }, [assemblySteps, onStepChange, show3DIntegration, on3DHighlight]);

  // ステップ完了処理
  const handleStepComplete = useCallback(() => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(activeStep);
    setCompletedSteps(newCompleted);
    
    onStepComplete?.(activeStep);

    // 自動進行
    if (autoAdvance && activeStep < assemblySteps.length - 1) {
      setTimeout(() => {
        handleStepChange(activeStep + 1);
      }, 2000);
    }
  }, [activeStep, completedSteps, onStepComplete, autoAdvance, assemblySteps.length, handleStepChange]);

  // チェックポイント更新
  const updateCheckpoint = useCallback((checkpointIndex: number, completed: boolean) => {
    const updatedSteps = [...assemblySteps];
    updatedSteps[activeStep].checkpoints[checkpointIndex].isCompleted = completed;
    // 実際の実装では状態管理ライブラリを使用
  }, [assemblySteps, activeStep]);

  // セクション展開/折りたたみ
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  const currentStepData = assemblySteps[activeStep];
  const progress = ((activeStep + 1) / assemblySteps.length) * 100;
  const totalEstimatedTime = assemblySteps.reduce((sum, step) => sum + step.estimatedTime, 0);

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* ヘッダー */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Play className="h-5 w-5 mr-2 text-green-500" />
            PC組み立てガイド
          </h2>
          <div className="flex items-center space-x-4">
            {showTimer && (
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-1" />
                {Math.floor(elapsedTime / 60000)}:{String(Math.floor((elapsedTime % 60000) / 1000)).padStart(2, '0')}
              </div>
            )}
            <div className="text-sm text-gray-600">
              ステップ {activeStep + 1} / {assemblySteps.length}
            </div>
          </div>
        </div>

        {/* プログレスバー */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* ステップ情報 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-blue-500" />
            <span className={`px-2 py-1 rounded ${
              currentStepData.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
              currentStepData.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {currentStepData.difficulty === 'easy' ? '初級' :
               currentStepData.difficulty === 'medium' ? '中級' : '上級'}
            </span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-500" />
            約{currentStepData.estimatedTime}分
          </div>
          <div className="flex items-center">
            <Zap className="h-4 w-4 mr-2 text-orange-500" />
            工具: {currentStepData.requiredTools.length}点
          </div>
          <div className="flex items-center">
            <Eye className="h-4 w-4 mr-2 text-purple-500" />
            推定総時間: {totalEstimatedTime}分
          </div>
        </div>
      </div>

      {/* ステップ内容 */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {currentStepData.title}
        </h3>
        <p className="text-gray-600 mb-6">
          {currentStepData.description}
        </p>

        {/* メイン手順 */}
        <div className="space-y-6">
          {/* 詳細手順 */}
          <div>
            <button
              onClick={() => toggleSection('instructions')}
              className="flex items-center justify-between w-full text-left p-3 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              <span className="font-medium text-blue-900">📋 詳細手順</span>
              <span className="text-blue-600">
                {expandedSections.has('instructions') ? '▼' : '▶'}
              </span>
            </button>
            
            {expandedSections.has('instructions') && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <ol className="space-y-2">
                  {currentStepData.detailedInstructions.map((instruction, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* 警告事項 */}
          {currentStepData.warnings && currentStepData.warnings.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('warnings')}
                className="flex items-center justify-between w-full text-left p-3 bg-red-50 rounded-lg hover:bg-red-100"
              >
                <span className="font-medium text-red-900 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  ⚠️ 注意事項
                </span>
                <span className="text-red-600">
                  {expandedSections.has('warnings') ? '▼' : '▶'}
                </span>
              </button>
              
              {expandedSections.has('warnings') && (
                <div className="mt-3 p-4 bg-red-50 rounded-lg">
                  <ul className="space-y-2">
                    {currentStepData.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start text-red-700">
                        <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ヒント */}
          {currentStepData.tips && currentStepData.tips.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('tips')}
                className="flex items-center justify-between w-full text-left p-3 bg-green-50 rounded-lg hover:bg-green-100"
              >
                <span className="font-medium text-green-900">💡 ヒント</span>
                <span className="text-green-600">
                  {expandedSections.has('tips') ? '▼' : '▶'}
                </span>
              </button>
              
              {expandedSections.has('tips') && (
                <div className="mt-3 p-4 bg-green-50 rounded-lg">
                  <ul className="space-y-2">
                    {currentStepData.tips.map((tip, index) => (
                      <li key={index} className="flex items-start text-green-700">
                        <span className="mr-2">💡</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* よくある間違い */}
          {currentStepData.commonMistakes && currentStepData.commonMistakes.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('mistakes')}
                className="flex items-center justify-between w-full text-left p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100"
              >
                <span className="font-medium text-yellow-900 flex items-center">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  🚫 よくある間違い
                </span>
                <span className="text-yellow-600">
                  {expandedSections.has('mistakes') ? '▼' : '▶'}
                </span>
              </button>
              
              {expandedSections.has('mistakes') && (
                <div className="mt-3 p-4 bg-yellow-50 rounded-lg">
                  <ul className="space-y-2">
                    {currentStepData.commonMistakes.map((mistake, index) => (
                      <li key={index} className="flex items-start text-yellow-700">
                        <span className="mr-2">🚫</span>
                        {mistake}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* チェックポイント */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
              ✅ チェックポイント
            </h4>
            <div className="space-y-2">
              {currentStepData.checkpoints.map((checkpoint, index) => (
                <label key={index} className="flex items-center p-2 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={checkpoint.isCompleted}
                    onChange={(e) => updateCheckpoint(index, e.target.checked)}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className={checkpoint.isCompleted ? 'line-through text-gray-500' : 'text-gray-700'}>
                    {checkpoint.description}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* フッター：ナビゲーション */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => handleStepChange(activeStep - 1)}
              disabled={activeStep === 0}
              className="flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SkipBack className="h-4 w-4 mr-2" />
              前のステップ
            </button>
            
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center px-4 py-2 rounded-lg ${
                isPlaying 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isPlaying ? '一時停止' : 'タイマー開始'}
            </button>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleStepComplete}
              disabled={completedSteps.has(activeStep)}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              ステップ完了
            </button>

            <button
              onClick={() => handleStepChange(activeStep + 1)}
              disabled={activeStep === assemblySteps.length - 1}
              className="flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              次のステップ
              <SkipForward className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>

        {/* ステップリスト */}
        <div className="mt-4 flex flex-wrap gap-2">
          {assemblySteps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => handleStepChange(index)}
              className={`px-3 py-1 text-xs rounded-full border ${
                index === activeStep
                  ? 'bg-blue-500 text-white border-blue-500'
                  : completedSteps.has(index)
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
            >
              {index + 1}. {step.title}
              {completedSteps.has(index) && <span className="ml-1">✓</span>}
            </button>
          ))}
        </div>

        {/* 完了率表示 */}
        <div className="mt-4 text-center text-sm text-gray-600">
          完了率: {Math.round((completedSteps.size / assemblySteps.length) * 100)}%
          ({completedSteps.size}/{assemblySteps.length} ステップ完了)
        </div>
      </div>
    </div>
  );
};

export default AssemblyGuide;