'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Language, translations } from '@/lib/translations';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (date: string, action: string, notes: string) => void;
  initialDate?: string;
  initialAction?: string;
  initialNotes?: string;
  lang: Language;
}

export default function FollowUpModal({
  isOpen,
  onClose,
  onSave,
  initialDate,
  initialAction,
  initialNotes,
  lang = 'en',
}: FollowUpModalProps) {
  const t = translations[lang];
  const presetActions: readonly string[] = t.presetActionsList;

  const [date, setDate] = useState('');
  const [action, setAction] = useState<string>(presetActions[0]);
  const [customAction, setCustomAction] = useState('');
  const [isCustomAction, setIsCustomAction] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        setDate(initialDate);
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDate(tomorrow.toISOString().split('T')[0]);
      }

      if (initialAction) {
        if (presetActions.includes(initialAction)) {
          setAction(initialAction);
          setIsCustomAction(false);
        } else {
          setAction('');
          setCustomAction(initialAction);
          setIsCustomAction(true);
        }
      } else {
        setAction(presetActions[0]);
        setIsCustomAction(false);
      }

      setNotes(initialNotes || '');
    }
  }, [isOpen, initialDate, initialAction, initialNotes, presetActions]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedAction = isCustomAction ? customAction.trim() : action;
    if (date && selectedAction) {
      onSave(date, selectedAction, notes.trim());
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="form-title" style={{ margin: 0 }}>
            {initialDate ? t.rescheduleFollowUp : t.scheduleFollowUp}
          </h3>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="followup-date">{t.followUpDate}</label>
            <input
              id="followup-date"
              type="date"
              className="form-input"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t.nextActionCategory}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              {presetActions.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="btn"
                  style={{
                    padding: '10px 8px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    backgroundColor: !isCustomAction && action === preset ? 'var(--primary)' : 'rgba(255, 255, 255, 0.03)',
                    color: !isCustomAction && action === preset ? 'white' : 'var(--text-secondary)',
                    border: '1px solid var(--border-color)'
                  }}
                  onClick={() => {
                    setAction(preset);
                    setIsCustomAction(false);
                  }}
                >
                  {preset}
                </button>
              ))}
              <button
                type="button"
                className="btn"
                style={{
                  padding: '10px 8px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  gridColumn: 'span 2',
                  backgroundColor: isCustomAction ? 'var(--primary)' : 'rgba(255, 255, 255, 0.03)',
                  color: isCustomAction ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)'
                }}
                onClick={() => {
                  setAction('');
                  setIsCustomAction(true);
                }}
              >
                {t.customAction}
              </button>
            </div>

            {isCustomAction && (
              <input
                type="text"
                className="form-input"
                placeholder={t.customActionPlaceholder}
                required
                value={customAction}
                onChange={(e) => setCustomAction(e.target.value)}
                autoFocus
              />
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="followup-notes">{t.followUpNotes}</label>
            <textarea
              id="followup-notes"
              className="form-input"
              style={{ minHeight: '80px', resize: 'vertical' }}
              placeholder={t.followUpNotesPlaceholder}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="form-row" style={{ marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t.cancel}
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!date || (isCustomAction && !customAction.trim())}
              style={{ opacity: date && (!isCustomAction || customAction.trim()) ? 1 : 0.6 }}
            >
              {initialDate ? t.updateFollowUp : t.scheduleAction}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
