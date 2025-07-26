// src/components/layout/Header.tsx
import React from 'react';
import { Monitor, Settings } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-900 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Monitor className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold">MyBuild PC</h1>
              <p className="text-sm text-gray-300">自作PC構成見積もりツール</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <button className="hover:text-blue-400 transition-colors">
              構成一覧
            </button>
            <button className="hover:text-blue-400 transition-colors">
              保存済み
            </button>
            <button className="flex items-center space-x-1 hover:text-blue-400 transition-colors">
              <Settings className="w-4 h-4" />
              <span>設定</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;