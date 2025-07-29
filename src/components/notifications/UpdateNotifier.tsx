// src/components/notifications/UpdateNotifier.tsx
import React, { useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, X, RefreshCw } from 'lucide-react';

export interface UpdateNotification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  category?: string;
  autoHide?: boolean;
}

interface UpdateNotifierProps {
  notifications: UpdateNotification[];
  onDismiss: (id: string) => void;
  onRefresh?: () => void;
  className?: string;
}

export const UpdateNotifier: React.FC<UpdateNotifierProps> = ({
  notifications,
  onDismiss,
  onRefresh,
  className = ""
}) => {
  const [showAll, setShowAll] = useState(false);
  const recentNotifications = notifications.slice(0, 3);
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          更新通知 ({notifications.length})
        </h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="手動更新"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 通知リスト */}
      {notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>新しい通知はありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(showAll ? notifications : recentNotifications).map((notification) => (
            <div
              key={notification.id}
              className={`rounded-lg border p-4 ${getColors(notification.type)}`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {getIcon(notification.type)}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <h4 className="text-sm font-medium">{notification.title}</h4>
                  <p className="text-sm mt-1">{notification.message}</p>
                  <div className="flex items-center mt-2 text-xs">
                    <span>{notification.timestamp.toLocaleString()}</span>
                    {notification.category && (
                      <span className="ml-2 px-2 py-1 bg-white bg-opacity-50 rounded">
                        {notification.category}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onDismiss(notification.id)}
                  className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          
          {notifications.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 border-t border-gray-200 pt-3"
            >
              {showAll ? '表示を減らす' : `他 ${notifications.length - 3} 件を表示`}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default UpdateNotifier;
