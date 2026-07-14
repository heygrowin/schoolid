import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  color?: 'pending' | 'approved' | 'rejected' | 'primary' | 'info';
  fullWidth?: boolean;
  onClick?: () => void;
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  color = 'primary',
  fullWidth = false,
  onClick,
}: MetricCardProps) {
  const getColors = () => {
    switch (color) {
      case 'pending':
        return { text: 'var(--pending)', bg: 'var(--pending-bg)' };
      case 'approved':
        return { text: 'var(--approved)', bg: 'var(--approved-bg)' };
      case 'rejected':
        return { text: 'var(--rejected)', bg: 'var(--rejected-bg)' };
      case 'info':
        return { text: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' };
      default:
        return { text: 'var(--primary)', bg: 'rgba(99, 102, 241, 0.15)' };
    }
  };

  const { text, bg } = getColors();

  return (
    <div 
      className={`metric-card ${fullWidth ? 'metric-card-full' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        {Icon && (
          <div 
            style={{ 
              padding: '6px', 
              borderRadius: '8px', 
              backgroundColor: bg,
              color: text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="metric-value" style={{ color: text }}>{value}</div>
    </div>
  );
}
