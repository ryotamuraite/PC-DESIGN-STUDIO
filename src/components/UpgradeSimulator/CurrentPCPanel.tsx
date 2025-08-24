import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PCConfiguration } from '@/types';
import type { CurrentPCConfiguration } from '@/types/upgrade';

interface CurrentPCPanelProps {
  currentConfig: PCConfiguration | CurrentPCConfiguration;
  className?: string;
}

export const CurrentPCPanel: React.FC<CurrentPCPanelProps> = ({ 
  currentConfig, 
  className = '' 
}) => {
  // CurrentPCConfigurationかPCConfigurationかを判定するヘルパー
  const isCurrentPCConfig = (config: PCConfiguration | CurrentPCConfiguration): config is CurrentPCConfiguration => {
    return 'currentParts' in config;
  };
  
  // 統一的なアクセス用ヘルパー
  const getParts = (config: PCConfiguration | CurrentPCConfiguration) => {
    if (isCurrentPCConfig(config)) {
      return {
        cpu: Array.isArray(config.currentParts.cpu) ? config.currentParts.cpu[0] : config.currentParts.cpu,
        gpu: Array.isArray(config.currentParts.gpu) ? config.currentParts.gpu[0] : config.currentParts.gpu,
        memory: Array.isArray(config.currentParts.memory) ? config.currentParts.memory[0] : null,
        storage: Array.isArray(config.currentParts.storage) ? config.currentParts.storage[0] : null
      };
    }
    return config.parts;
  };
  
  const parts = getParts(currentConfig);
  const totalPrice = isCurrentPCConfig(currentConfig) ? 0 : currentConfig.totalPrice;
  return (
    <Card className={`h-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>現在のPC構成</span>
          <Badge variant="outline">診断中</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CPU情報 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">CPU</h3>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium">
              {parts.cpu?.name || '未選択'}
            </div>
            {parts.cpu && (
              <div className="text-xs text-gray-500 mt-1">
                {String(parts.cpu.specifications?.cores || 'N/A')}コア / 
                {String(parts.cpu.specifications?.baseClock || 'N/A')}GHz
              </div>
            )}
          </div>
        </div>

        {/* GPU情報 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">GPU</h3>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium">
              {parts.gpu?.name || '未選択'}
            </div>
            {parts.gpu && (
              <div className="text-xs text-gray-500 mt-1">
                VRAM: {String(parts.gpu.specifications?.memorySize || 'N/A')}GB
              </div>
            )}
          </div>
        </div>

        {/* メモリ情報 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">メモリ</h3>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium">
              {parts.memory?.name || '未選択'}
            </div>
            {parts.memory && (
              <div className="text-xs text-gray-500 mt-1">
                {String(parts.memory.specifications?.capacity || 'N/A')}GB / 
                {String(parts.memory.specifications?.speed || 'N/A')}MHz
              </div>
            )}
          </div>
        </div>

        {/* ストレージ情報 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">ストレージ</h3>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium">
              {parts.storage?.name || '未選択'}
            </div>
            {parts.storage && (
              <div className="text-xs text-gray-500 mt-1">
                {String(parts.storage.specifications?.capacity || 'N/A')}GB / 
                {String(parts.storage.specifications?.type || 'N/A')}
              </div>
            )}
          </div>
        </div>

        {/* 総額表示 */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">現在の総額</span>
            <span className="text-lg font-bold text-blue-600">
              ¥{totalPrice?.toLocaleString() || '0'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentPCPanel;
