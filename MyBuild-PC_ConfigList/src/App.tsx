// src/App.tsx
// import React from 'react';
import Header from './components/layout/Header';
import BudgetSetter from './components/budget/BudgetSetter';
import PartSelector from './components/parts/PartSelector';
import ConfigSummary from './components/summary/ConfigSummary';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 左カラム: 予算設定とパーツ選択 */}
          <div className="lg:col-span-2 space-y-6">
            <BudgetSetter />
            <PartSelector />
          </div>
          
          {/* 右カラム: 構成サマリー */}
          <div className="lg:col-span-1">
            <ConfigSummary />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;