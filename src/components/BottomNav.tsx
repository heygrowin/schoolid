'use client';

import React from 'react';
import { Home, Calendar, School, Settings } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'dashboard' | 'visits' | 'schools' | 'admin' | 'analysis';
  setTab: (tab: 'dashboard' | 'visits' | 'schools' | 'admin' | 'analysis') => void;
  isAdminMode?: boolean;
}

export default function BottomNav({ currentTab, setTab, isAdminMode = true }: BottomNavProps) {
  const tabs: Array<{ id: 'dashboard' | 'visits' | 'schools' | 'admin' | 'analysis'; label: string; icon: any }> = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'visits', label: 'Visits', icon: Calendar },
    { id: 'schools', label: 'Schools', icon: School },
    ...(isAdminMode ? [{ id: 'admin' as const, label: 'Admin', icon: Settings }] : [])
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setTab(tab.id)}
            aria-label={tab.label}
          >
            <div className="nav-icon-wrapper">
              <Icon size={24} />
              {isActive && <div className="nav-dot" />}
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
