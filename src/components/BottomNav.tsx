'use client';

import React from 'react';
import { Home, Calendar, School } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'dashboard' | 'visits' | 'schools';
  setTab: (tab: 'dashboard' | 'visits' | 'schools') => void;
}

export default function BottomNav({ currentTab, setTab }: BottomNavProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'visits', label: 'Visits', icon: Calendar },
    { id: 'schools', label: 'Schools', icon: School },
  ] as const;

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
