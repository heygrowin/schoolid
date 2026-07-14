'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Calendar, MapPin, Phone, Mail, BookOpen, 
  Layers, Palette, Clipboard, CheckCircle2, AlertCircle, 
  ChevronLeft, Edit, Wifi, WifiOff, School, AlertTriangle
} from 'lucide-react';
import { dbService, SchoolVisit } from '@/lib/db';
import BottomNav from '@/components/BottomNav';
import MetricCard from '@/components/MetricCard';
import RejectionModal from '@/components/RejectionModal';
import ApprovalForm from '@/components/ApprovalForm';
import FollowUpModal from '@/components/FollowUpModal';

export default function Home() {
  const [currentTab, setTab] = useState<'dashboard' | 'visits' | 'schools'>('dashboard');
  const [visits, setVisits] = useState<SchoolVisit[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection & workflow states
  const [selectedVisit, setSelectedVisit] = useState<SchoolVisit | null>(null);
  const [isAddingVisit, setIsAddingVisit] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isSchedulingFollowUp, setIsSchedulingFollowUp] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing'>('synced');

  // New Visit Form state
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newVisitDate, setNewVisitDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [newNotes, setNewNotes] = useState('');

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'FollowUp' | 'Approved' | 'Rejected'>('All');

  // Save follow-up details
  const handleFollowUpSave = async (date: string, action: string, notes: string) => {
    if (!selectedVisit) return;
    setSyncStatus('syncing');
    try {
      const updates = {
        status: 'FollowUp' as const,
        followUpDate: date,
        followUpAction: action,
        followUpNotes: notes || undefined,
        rejectionReason: undefined // Clear any old rejection reason when moving states
      };
      await dbService.updateVisit(selectedVisit.id, updates);

      setVisits((prev) =>
        prev.map((v) =>
          v.id === selectedVisit.id
            ? { ...v, ...updates, updatedAt: new Date().toISOString() }
            : v
        )
      );

      setSelectedVisit((prev) =>
        prev ? { ...prev, ...updates } : null
      );
      
      setIsSchedulingFollowUp(false);
      setTimeout(() => setSyncStatus('synced'), 800);
    } catch (e) {
      console.error('Error saving follow-up:', e);
      setSyncStatus('synced');
    }
  };

  // Load visits
  const loadVisits = async () => {
    try {
      const data = await dbService.getVisits();
      setVisits(data);
      setIsCloudConnected(dbService.isCloudConnected());
    } catch (e) {
      console.error('Failed to load visits:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisits();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Format date helper: "2026-07-16" -> "16 July"
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate();
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June', 
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const month = months[d.getMonth()];
      return `${day} ${month}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Check if date is today
  const isDateToday = (dateStr: string) => {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      const today = new Date();
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    } catch (e) {
      return false;
    }
  };

  // Add visit handler
  const handleAddVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim()) return;
    setSyncStatus('syncing');

    const visitData = {
      schoolName: newSchoolName.trim(),
      city: newCity.trim() || undefined,
      visitDate: newVisitDate,
      notes: newNotes.trim() || undefined,
      status: 'Pending' as const,
    };

    try {
      const added = await dbService.saveVisit(visitData);
      setVisits((prev) => [added, ...prev]);
      
      // Reset form
      setNewSchoolName('');
      setNewCity('');
      const today = new Date();
      setNewVisitDate(today.toISOString().split('T')[0]);
      setNewNotes('');
      setIsAddingVisit(false);
      
      // Go to visits tab to see it
      setTab('visits');
      setTimeout(() => setSyncStatus('synced'), 800);
    } catch (e) {
      console.error('Error saving visit:', e);
      setSyncStatus('synced');
    }
  };

  // Reject handler
  const handleRejectSave = async (reason: string) => {
    if (!selectedVisit) return;
    setSyncStatus('syncing');
    try {
      await dbService.updateVisit(selectedVisit.id, {
        status: 'Rejected',
        rejectionReason: reason,
      });
      
      // Update local state
      setVisits((prev) =>
        prev.map((v) =>
          v.id === selectedVisit.id
            ? { ...v, status: 'Rejected', rejectionReason: reason, updatedAt: new Date().toISOString() }
            : v
        )
      );
      
      // Update selected visit view
      setSelectedVisit((prev) =>
        prev ? { ...prev, status: 'Rejected', rejectionReason: reason } : null
      );
      
      setIsRejecting(false);
      setTimeout(() => setSyncStatus('synced'), 800);
    } catch (e) {
      console.error('Error updating visit (rejection):', e);
      setSyncStatus('synced');
    }
  };

  // Approve and form fill save handler
  const handleApproveSave = async (updatedData: Partial<SchoolVisit>) => {
    if (!selectedVisit) return;
    setSyncStatus('syncing');
    try {
      await dbService.updateVisit(selectedVisit.id, updatedData);
      
      // Update local state
      setVisits((prev) =>
        prev.map((v) =>
          v.id === selectedVisit.id
            ? { ...v, ...updatedData, updatedAt: new Date().toISOString() }
            : v
        )
      );

      // Update selected visit view
      setSelectedVisit((prev) =>
        prev ? { ...prev, ...updatedData } : null
      );

      setIsApproving(false);
      setTimeout(() => setSyncStatus('synced'), 800);
    } catch (e) {
      console.error('Error updating visit (approval):', e);
      setSyncStatus('synced');
    }
  };

  const handleDeleteVisit = async (id: string) => {
    if (confirm('Are you sure you want to delete this visit record?')) {
      setSyncStatus('syncing');
      try {
        await dbService.deleteVisit(id);
        setVisits((prev) => prev.filter((v) => v.id !== id));
        setSelectedVisit(null);
        setTimeout(() => setSyncStatus('synced'), 800);
      } catch (e) {
        console.error('Error deleting visit:', e);
        setSyncStatus('synced');
      }
    }
  };

  // Stats calculation
  const totalVisits = visits.length;
  const pendingVisits = visits.filter((v) => v.status === 'Pending').length;
  const followUpVisits = visits.filter((v) => v.status === 'FollowUp').length;
  const approvedSchools = visits.filter((v) => v.status === 'Approved').length;
  const rejectedSchools = visits.filter((v) => v.status === 'Rejected').length;
  const todayVisits = visits.filter((v) => isDateToday(v.visitDate)).length;

  // Filtering lists
  const filteredVisits = visits.filter((v) => {
    // 1. Search Query filter (matches School Name, Principal, or Status)
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      v.schoolName.toLowerCase().includes(query) ||
      (v.schoolDetails?.principalName && v.schoolDetails.principalName.toLowerCase().includes(query)) ||
      v.status.toLowerCase().includes(query) ||
      (v.city && v.city.toLowerCase().includes(query));

    // 2. Status Tab Filter
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && v.status === statusFilter;
  });

  const approvedList = visits.filter((v) => {
    if (v.status !== 'Approved') return false;
    const query = searchQuery.toLowerCase().trim();
    return (
      v.schoolName.toLowerCase().includes(query) ||
      (v.schoolDetails?.principalName && v.schoolDetails.principalName.toLowerCase().includes(query)) ||
      (v.city && v.city.toLowerCase().includes(query))
    );
  });

  return (
    <div className="app-shell">
      {/* App Header */}
      <header className="app-header">
        <div>
          <span className="app-title">Antigravity Visitz</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {!isCloudConnected ? (
            <div className="conn-indicator conn-offline" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24' }}>
              <WifiOff size={12} />
              <span>Local Storage Database</span>
            </div>
          ) : !isOnline ? (
            <div className="conn-indicator conn-offline" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24' }}>
              <WifiOff size={12} />
              <span>Offline (Saving to Cache)</span>
            </div>
          ) : syncStatus === 'syncing' ? (
            <div className="conn-indicator" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ 
                display: 'inline-block', 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                border: '2px solid #60a5fa', 
                borderTopColor: 'transparent',
                animation: 'spin 1s linear infinite'
              }}></span>
              <span>Syncing to Cloud...</span>
            </div>
          ) : (
            <div className="conn-indicator conn-online" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
              <Wifi size={12} />
              <span>Online (Cloud Synced)</span>
            </div>
          )}
        </div>
      </header>

      {/* Screen Routing */}
      {selectedVisit ? (
        /* DETAIL PAGE / WORKFLOW VIEW */
        <div className="details-container">
          <button 
            className="btn btn-secondary" 
            style={{ width: 'auto', padding: '8px 12px', fontSize: '13px', marginBottom: '20px' }}
            onClick={() => {
              setSelectedVisit(null);
              setIsApproving(false);
              setIsRejecting(false);
            }}
          >
            <ChevronLeft size={16} /> Back to List
          </button>

          {/* School Name & Current Status Banner */}
          <div className="details-header">
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {selectedVisit.schoolName}
            </h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className={`badge ${
                selectedVisit.status === 'Approved' 
                  ? 'badge-approved' 
                  : selectedVisit.status === 'Rejected' 
                    ? 'badge-rejected' 
                    : selectedVisit.status === 'FollowUp'
                      ? 'badge-followup'
                      : 'badge-pending'
              }`}>
                {selectedVisit.status === 'Approved' 
                  ? 'Approved ✅' 
                  : selectedVisit.status === 'Rejected' 
                    ? 'Rejected ❌' 
                    : selectedVisit.status === 'FollowUp'
                      ? 'Follow-Up 🔵'
                      : 'Pending 🟡'}
              </span>
              {selectedVisit.city && (
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} /> {selectedVisit.city}
                </span>
              )}
            </div>
          </div>

          {/* Workflow Branching based on Status */}
          {selectedVisit.status === 'Pending' && !isApproving && (
            /* Pending visit actions */
            <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Visit scheduled for <strong>{formatDate(selectedVisit.visitDate)}</strong>.
                </span>
                {selectedVisit.notes && (
                  <p style={{ fontStyle: 'italic', margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    "{selectedVisit.notes}"
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                <div className="form-row">
                  <button 
                    className="btn btn-danger" 
                    onClick={() => setIsRejecting(true)}
                    style={{ height: '56px', fontSize: '16px' }}
                  >
                    ❌ Reject
                  </button>
                  <button 
                    className="btn btn-success" 
                    onClick={() => setIsApproving(true)}
                    style={{ height: '56px', fontSize: '16px' }}
                  >
                    ✅ Approve
                  </button>
                </div>
                <button 
                  type="button"
                  className="btn" 
                  onClick={() => setIsSchedulingFollowUp(true)}
                  style={{ height: '56px', fontSize: '16px', backgroundColor: 'var(--followup-bg)', color: 'var(--followup)', border: '1px solid var(--border-color)' }}
                >
                  ⏰ Schedule Follow-Up
                </button>
              </div>
            </div>
          )}

          {isApproving && (
            /* Detailed Approval Form */
            <div className="section-card" style={{ padding: '16px 12px' }}>
              <h3 className="form-title" style={{ marginTop: 0 }}>School Registration Form</h3>
              <ApprovalForm
                visit={selectedVisit}
                onSave={handleApproveSave}
                onCancel={() => setIsApproving(false)}
              />
            </div>
          )}

          {selectedVisit.status === 'FollowUp' && !isApproving && (
            /* Follow-Up details view */
            <div className="detail-section" style={{ borderLeft: '4px solid var(--followup)' }}>
              <div className="detail-section-title" style={{ color: 'var(--followup)' }}>Follow-Up Details</div>
              <div className="detail-row">
                <span className="detail-label">Scheduled Date</span>
                <span className="detail-value" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formatDate(selectedVisit.followUpDate || '')}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Next Action</span>
                <span className="detail-value" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {selectedVisit.followUpAction || 'No action specified'}
                </span>
              </div>
              {selectedVisit.followUpNotes && (
                <div className="detail-row">
                  <span className="detail-label">Notes & Reminders</span>
                  <span className="detail-value" style={{ fontStyle: 'italic' }}>
                    "{selectedVisit.followUpNotes}"
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
                <div className="form-row">
                  <button 
                    className="btn btn-danger" 
                    onClick={() => setIsRejecting(true)}
                    style={{ height: '48px', fontSize: '14px' }}
                  >
                    ❌ Reject
                  </button>
                  <button 
                    className="btn btn-success" 
                    onClick={() => setIsApproving(true)}
                    style={{ height: '48px', fontSize: '14px' }}
                  >
                    ✅ Approve School
                  </button>
                </div>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setIsSchedulingFollowUp(true)}
                  style={{ height: '48px', fontSize: '14px' }}
                >
                  Reschedule Follow-Up
                </button>
              </div>
            </div>
          )}

          {selectedVisit.status === 'Rejected' && (
            /* Rejected summary details */
            <div className="detail-section" style={{ borderLeft: '4px solid var(--rejected)' }}>
              <div className="detail-section-title" style={{ color: 'var(--rejected)' }}>Rejection Audit</div>
              <div className="detail-row">
                <span className="detail-label">Rejection Reason</span>
                <span className="detail-value" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedVisit.rejectionReason || 'No reason specified'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Visited Date</span>
                <span className="detail-value">{formatDate(selectedVisit.visitDate)}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '10px 14px' }}
                  onClick={() => {
                    setIsRejecting(true);
                  }}
                >
                  Edit Reason
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '10px 14px' }}
                  onClick={() => {
                    setIsApproving(true);
                  }}
                >
                  Approve Instead
                </button>
              </div>
            </div>
          )}

          {selectedVisit.status === 'Approved' && !isApproving && (
            /* Approved detailed specifications display */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="detail-section">
                <div className="detail-section-title">Principal Details</div>
                <div className="detail-row">
                  <span className="detail-label">Name</span>
                  <span className="detail-value">{selectedVisit.schoolDetails?.principalName || 'Not entered'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Mobile</span>
                  {selectedVisit.schoolDetails?.principalMobile ? (
                    <a 
                      href={`tel:${selectedVisit.schoolDetails.principalMobile}`}
                      className="detail-value" 
                      style={{ color: 'var(--primary)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Phone size={14} /> {selectedVisit.schoolDetails.principalMobile}
                    </a>
                  ) : (
                    <span className="detail-value">Not entered</span>
                  )}
                </div>
                {selectedVisit.schoolDetails?.principalEmail && (
                  <div className="detail-row">
                    <span className="detail-label">Email</span>
                    <a 
                      href={`mailto:${selectedVisit.schoolDetails.principalEmail}`}
                      className="detail-value"
                      style={{ color: 'var(--primary)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Mail size={14} /> {selectedVisit.schoolDetails.principalEmail}
                    </a>
                  </div>
                )}
                {selectedVisit.schoolDetails?.address && (
                  <div className="detail-row">
                    <span className="detail-label">Address</span>
                    <span className="detail-value">{selectedVisit.schoolDetails.address}</span>
                  </div>
                )}
              </div>

              {selectedVisit.idIncharge && (selectedVisit.idIncharge.name || selectedVisit.idIncharge.mobile) && (
                <div className="detail-section">
                  <div className="detail-section-title">ID Incharge</div>
                  <div className="detail-row">
                    <span className="detail-label">Name</span>
                    <span className="detail-value">{selectedVisit.idIncharge.name || 'Not entered'}</span>
                  </div>
                  {selectedVisit.idIncharge.mobile && (
                    <div className="detail-row">
                      <span className="detail-label">Mobile</span>
                      <a 
                        href={`tel:${selectedVisit.idIncharge.mobile}`}
                        className="detail-value"
                        style={{ color: 'var(--primary)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Phone size={14} /> {selectedVisit.idIncharge.mobile}
                      </a>
                    </div>
                  )}
                  {selectedVisit.idIncharge.email && (
                    <div className="detail-row">
                      <span className="detail-label">Email</span>
                      <a 
                        href={`mailto:${selectedVisit.idIncharge.email}`}
                        className="detail-value"
                        style={{ color: 'var(--primary)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Mail size={14} /> {selectedVisit.idIncharge.email}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {selectedVisit.reception && (selectedVisit.reception.name || selectedVisit.reception.mobile) && (
                <div className="detail-section">
                  <div className="detail-section-title">Reception</div>
                  <div className="detail-row">
                    <span className="detail-label">Name</span>
                    <span className="detail-value">{selectedVisit.reception.name || 'Not entered'}</span>
                  </div>
                  {selectedVisit.reception.mobile && (
                    <div className="detail-row">
                      <span className="detail-label">Mobile</span>
                      <a 
                        href={`tel:${selectedVisit.reception.mobile}`}
                        className="detail-value"
                        style={{ color: 'var(--primary)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Phone size={14} /> {selectedVisit.reception.mobile}
                      </a>
                    </div>
                  )}
                  {selectedVisit.reception.email && (
                    <div className="detail-row">
                      <span className="detail-label">Email</span>
                      <a 
                        href={`mailto:${selectedVisit.reception.email}`}
                        className="detail-value"
                        style={{ color: 'var(--primary)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Mail size={14} /> {selectedVisit.reception.email}
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="detail-section">
                <div className="detail-section-title">Configurations</div>
                {selectedVisit.classes && (
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label">Classes Span</span>
                    <span className="detail-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <BookOpen size={16} style={{ color: 'var(--primary)' }} /> {selectedVisit.classes.from} - {selectedVisit.classes.to}
                    </span>
                  </div>
                )}

                {selectedVisit.cardTypes && selectedVisit.cardTypes.length > 0 && (
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label">Card Type Required</span>
                    <span className="detail-value">{selectedVisit.cardTypes.join(', ')}</span>
                  </div>
                )}

                {selectedVisit.sections && selectedVisit.sections.length > 0 && (
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label">Sections</span>
                    <div className="tag-list" style={{ marginTop: '4px' }}>
                      {selectedVisit.sections.map((sec) => (
                        <span key={sec} className="tag">{sec}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedVisit.houses && selectedVisit.houses.length > 0 && (
                  <div className="detail-row">
                    <span className="detail-label">Houses</span>
                    <div className="tag-list" style={{ marginTop: '4px' }}>
                      {selectedVisit.houses.map((house) => (
                        <span key={house} className="tag">{house}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedVisit.additionalNotes && (
                <div className="detail-section">
                  <div className="detail-section-title">Notes</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {selectedVisit.additionalNotes}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', marginBottom: '24px' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={() => setIsApproving(true)}
                  style={{ flex: 1 }}
                >
                  <Edit size={16} /> Edit Details
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={() => handleDeleteVisit(selectedVisit.id)}
                  style={{ width: 'auto', backgroundColor: 'transparent', border: '1px solid var(--rejected)', color: 'var(--rejected)' }}
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Rejection capturing overlay */}
          <RejectionModal
            isOpen={isRejecting}
            onClose={() => setIsRejecting(false)}
            onSave={handleRejectSave}
          />
        </div>
      ) : (
        /* STANDARD NAVIGATION VIEWS */
        <>
          {currentTab === 'dashboard' && (
            <div style={{ padding: '20px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)' }}>Dashboard</h2>
              
              {/* Stat Grid */}
              <div className="metrics-grid">
                <MetricCard 
                  title="Total Schools" 
                  value={totalVisits} 
                  icon={School} 
                  color="primary"
                  fullWidth
                />
                <MetricCard 
                  title="Pending Visits" 
                  value={pendingVisits} 
                  icon={AlertTriangle} 
                  color="pending"
                  onClick={() => {
                    setTab('visits');
                    setStatusFilter('Pending');
                  }}
                />
                <MetricCard 
                  title="Follow-Ups" 
                  value={followUpVisits} 
                  icon={Calendar} 
                  color="info"
                  onClick={() => {
                    setTab('visits');
                    setStatusFilter('FollowUp');
                  }}
                />
                <MetricCard 
                  title="Approved Schools" 
                  value={approvedSchools} 
                  icon={CheckCircle2} 
                  color="approved"
                  onClick={() => {
                    setTab('schools');
                  }}
                />
                <MetricCard 
                  title="Rejected Schools" 
                  value={rejectedSchools} 
                  icon={AlertCircle} 
                  color="rejected"
                  onClick={() => {
                    setTab('visits');
                    setStatusFilter('Rejected');
                  }}
                />
                <MetricCard 
                  title="Today's Visits" 
                  value={todayVisits} 
                  icon={Calendar} 
                  color="info"
                  fullWidth
                  onClick={() => {
                    setTab('visits');
                    setStatusFilter('All');
                    // Find today's visits
                    const todayStr = new Date().toISOString().split('T')[0];
                    setSearchQuery(todayStr); 
                  }}
                />
              </div>

              {/* Today's Schedule Quick view */}
              <div className="section-card">
                <h3 className="section-card-title">Today's Visits List</h3>
                {visits.filter((v) => isDateToday(v.visitDate)).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {visits
                      .filter((v) => isDateToday(v.visitDate))
                      .map((visit) => (
                        <div 
                          key={visit.id} 
                          className="visit-card"
                          style={{ padding: '12px' }}
                          onClick={() => setSelectedVisit(visit)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: '14px' }}>{visit.schoolName}</span>
                            <span className={`badge ${
                              visit.status === 'Approved' 
                                ? 'badge-approved' 
                                : visit.status === 'Rejected' 
                                  ? 'badge-rejected' 
                                  : visit.status === 'FollowUp'
                                    ? 'badge-followup'
                                    : 'badge-pending'
                            }`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                              {visit.status === 'FollowUp' ? 'Follow-Up' : visit.status}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    No school visits scheduled for today.
                  </div>
                )}
              </div>
            </div>
          )}

          {currentTab === 'visits' && (
            <>
              {/* Sticky Search bar */}
              <div className="search-container">
                <div className="search-input-wrapper">
                  <Search className="search-icon" size={18} />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search name, status, or date..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {(['All', 'Pending', 'FollowUp', 'Approved', 'Rejected'] as const).map((status) => {
                    let label = status as string;
                    if (status === 'FollowUp') label = 'Follow-Up';
                    return (
                      <button
                        key={status}
                        className={`btn`}
                        style={{ 
                          width: 'auto', 
                          padding: '6px 12px', 
                          fontSize: '12px', 
                          borderRadius: '20px',
                          backgroundColor: statusFilter === status ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                          color: statusFilter === status ? 'white' : 'var(--text-secondary)',
                          border: '1px solid var(--border-color)'
                        }}
                        onClick={() => setStatusFilter(status)}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visits card list */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  Loading school visits...
                </div>
              ) : filteredVisits.length > 0 ? (
                <div className="visit-card-list">
                  {filteredVisits.map((visit) => (
                    <div 
                      key={visit.id} 
                      className="visit-card"
                      onClick={() => setSelectedVisit(visit)}
                    >
                      <div className="visit-card-header">
                        <span className="visit-card-name">{visit.schoolName}</span>
                        <span className={`badge ${
                          visit.status === 'Approved' 
                            ? 'badge-approved' 
                            : visit.status === 'Rejected' 
                              ? 'badge-rejected' 
                              : visit.status === 'FollowUp'
                                ? 'badge-followup'
                                : 'badge-pending'
                        }`}>
                          {visit.status === 'Approved' 
                            ? 'Approved ✅' 
                            : visit.status === 'Rejected' 
                              ? 'Rejected ❌' 
                              : visit.status === 'FollowUp'
                                ? 'Follow-Up 🔵'
                                : 'Pending 🟡'}
                        </span>
                      </div>
                      
                      <div className="visit-card-details">
                        {visit.city && (
                          <div className="visit-card-row">
                            <MapPin size={13} style={{ color: 'var(--primary)' }} />
                            <span>{visit.city}</span>
                          </div>
                        )}
                        <div className="visit-card-row">
                          <Calendar size={13} style={{ color: 'var(--primary)' }} />
                          <span>Visit: {formatDate(visit.visitDate)}</span>
                        </div>
                        {visit.notes && (
                          <div className="visit-card-row" style={{ marginTop: '4px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                            <span>"{visit.notes}"</span>
                          </div>
                        )}
                        {visit.status === 'Rejected' && visit.rejectionReason && (
                          <div className="visit-card-row" style={{ color: 'var(--rejected)', fontWeight: 500 }}>
                            <span>Reason: {visit.rejectionReason}</span>
                          </div>
                        )}
                        {visit.status === 'FollowUp' && visit.followUpDate && (
                          <div className="visit-card-row" style={{ color: 'var(--followup)', fontWeight: 500 }}>
                            <span>Action: {visit.followUpAction} ({formatDate(visit.followUpDate)})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--text-secondary)' }}>
                  No visit matches your filter or search.
                </div>
              )}

              {/* FAB to Add Visit */}
              <div className="fab-container">
                <button 
                  className="fab" 
                  onClick={() => setIsAddingVisit(true)}
                  aria-label="Add new school visit"
                >
                  <Plus size={28} />
                </button>
              </div>
            </>
          )}

          {currentTab === 'schools' && (
            <>
              {/* Sticky Search bar */}
              <div className="search-container">
                <div className="search-input-wrapper">
                  <Search className="search-icon" size={18} />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search approved school name or principal..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Schools List (Approved only) */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  Loading school list...
                </div>
              ) : approvedList.length > 0 ? (
                <div className="visit-card-list">
                  {approvedList.map((visit) => (
                    <div 
                      key={visit.id} 
                      className="visit-card"
                      onClick={() => setSelectedVisit(visit)}
                    >
                      <div className="visit-card-header">
                        <span className="visit-card-name">{visit.schoolName}</span>
                        <span className="badge badge-approved">Approved ✅</span>
                      </div>
                      
                      <div className="visit-card-details" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                        {visit.schoolDetails?.principalName && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                            <div>
                              <span style={{ color: 'var(--text-secondary)' }}>Principal: </span>
                              <strong style={{ color: 'var(--text-primary)' }}>{visit.schoolDetails.principalName}</strong>
                            </div>
                            {visit.schoolDetails?.principalMobile && (
                              <a 
                                href={`tel:${visit.schoolDetails.principalMobile}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                  color: 'var(--approved)',
                                  padding: '5px 10px',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  textDecoration: 'none'
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Phone size={12} /> Call
                              </a>
                            )}
                          </div>
                        )}

                        {visit.idIncharge?.name && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px' }}>
                            <div>
                              <span style={{ color: 'var(--text-secondary)' }}>Incharge: </span>
                              <strong style={{ color: 'var(--text-primary)' }}>{visit.idIncharge.name}</strong>
                            </div>
                            {visit.idIncharge?.mobile && (
                              <a 
                                href={`tel:${visit.idIncharge.mobile}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                                  color: 'var(--primary)',
                                  padding: '5px 10px',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  textDecoration: 'none'
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Phone size={12} /> Call
                              </a>
                            )}
                          </div>
                        )}

                        {visit.reception?.name && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px' }}>
                            <div>
                              <span style={{ color: 'var(--text-secondary)' }}>Reception: </span>
                              <strong style={{ color: 'var(--text-primary)' }}>{visit.reception.name}</strong>
                            </div>
                            {visit.reception?.mobile && (
                              <a 
                                href={`tel:${visit.reception.mobile}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                  color: '#60a5fa',
                                  padding: '5px 10px',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  textDecoration: 'none'
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Phone size={12} /> Call
                              </a>
                            )}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px' }}>
                          {visit.classes && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <BookOpen size={12} style={{ color: 'var(--primary)' }} />
                              Classes: {visit.classes.from}-{visit.classes.to}
                            </span>
                          )}
                          {visit.sections && visit.sections.length > 0 && (
                            <span>
                              Sections: {visit.sections.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--text-secondary)' }}>
                  No approved schools saved yet. Approve visits to add schools here.
                </div>
              )}
            </>
          )}

          {/* Add Visit Bottom-Drawer Modal */}
          {isAddingVisit && (
            <div className="modal-overlay" onClick={() => setIsAddingVisit(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3 className="form-title">Plan New Visit</h3>
                <form onSubmit={handleAddVisitSubmit}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="new-school-name">School Name</label>
                    <input
                      id="new-school-name"
                      type="text"
                      className="form-input"
                      placeholder="e.g. ABC Public School"
                      required
                      value={newSchoolName}
                      onChange={(e) => setNewSchoolName(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="new-city">City (Optional)</label>
                      <input
                        id="new-city"
                        type="text"
                        className="form-input"
                        placeholder="e.g. New Delhi"
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="new-date">Visit Date</label>
                      <input
                        id="new-date"
                        type="date"
                        className="form-input"
                        required
                        value={newVisitDate}
                        onChange={(e) => setNewVisitDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="new-notes">Notes (Optional)</label>
                    <textarea
                      id="new-notes"
                      className="form-input"
                      style={{ minHeight: '80px', resize: 'vertical' }}
                      placeholder="Any initial reminders..."
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                    />
                  </div>

                  <div className="form-row" style={{ marginTop: '24px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setIsAddingVisit(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Add to Visit List
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Fixed Bottom Nav Bar */}
          <BottomNav currentTab={currentTab} setTab={(tab) => { setTab(tab); setSearchQuery(''); }} />
        </>
      )}

      {/* Follow-Up Scheduler drawer (outside condition so selectedVisit is not type-narrowed to null) */}
      <FollowUpModal
        isOpen={isSchedulingFollowUp}
        onClose={() => setIsSchedulingFollowUp(false)}
        onSave={handleFollowUpSave}
        initialDate={selectedVisit?.followUpDate}
        initialAction={selectedVisit?.followUpAction}
        initialNotes={selectedVisit?.followUpNotes}
      />
    </div>
  );
}
