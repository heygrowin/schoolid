'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reason: string) => void;
}

const PRESET_REASONS = [
  'Already has vendor',
  'Principal unavailable',
  'Not interested',
  'Low budget',
];

export default function RejectionModal({
  isOpen,
  onClose,
  onSave,
}: RejectionModalProps) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) {
      onSave(reason.trim());
      setReason('');
    }
  };

  const handleQuickSelect = (preset: string) => {
    onSave(preset);
    setReason('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="form-title" style={{ margin: 0 }}>Reason for Rejection</h3>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="reason-quick-list">
          {PRESET_REASONS.map((preset) => (
            <button
              key={preset}
              type="button"
              className="reason-option"
              onClick={() => handleQuickSelect(preset)}
            >
              {preset}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="custom-reason">Custom Reason</label>
            <input
              id="custom-reason"
              type="text"
              className="form-input"
              placeholder="Type another reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-row" style={{ marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-danger" 
              disabled={!reason.trim()}
              style={{ opacity: reason.trim() ? 1 : 0.6 }}
            >
              Save Rejection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
