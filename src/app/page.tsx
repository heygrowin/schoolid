'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Calendar, MapPin, Phone, Mail, BookOpen, 
  Layers, Palette, Clipboard, CheckCircle2, AlertCircle, 
  ChevronLeft, Edit, Wifi, WifiOff, School, AlertTriangle, BarChart3
} from 'lucide-react';
import { dbService, SchoolVisit, Vendor } from '@/lib/db';
import BottomNav from '@/components/BottomNav';
import MetricCard from '@/components/MetricCard';
import RejectionModal from '@/components/RejectionModal';
import ApprovalForm from '@/components/ApprovalForm';
import FollowUpModal from '@/components/FollowUpModal';

import { Language, translations } from '@/lib/translations';

export default function Home() {
  const [currentTab, setTab] = useState<'dashboard' | 'visits' | 'schools' | 'admin' | 'analysis'>('dashboard');
  const [activeCategory, setActiveCategory] = useState<'School' | 'Collage' | 'Office' | 'Hospital' | 'Studio' | 'Other' | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [visits, setVisits] = useState<SchoolVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedLang = localStorage.getItem('acl_lang') as Language;
    if (savedLang === 'en' || savedLang === 'hi') {
      setLanguage(savedLang);
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('acl_lang', lang);
  };

  const t = translations[language];
  
  const recentVisits = [...visits]
    .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
    .slice(0, 3);
  
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
  const [newRange, setNewRange] = useState('');

  // Detailed fields on Creation Form state
  const [newAddress, setNewAddress] = useState('');
  const [newPrincipalName, setNewPrincipalName] = useState('');
  const [newPrincipalMobile, setNewPrincipalMobile] = useState('');
  const [newPrincipalEmail, setNewPrincipalEmail] = useState('');
  
  const [newInchargeName, setNewInchargeName] = useState('');
  const [newInchargeMobile, setNewInchargeMobile] = useState('');
  const [newInchargeEmail, setNewInchargeEmail] = useState('');

  const [newReceptionName, setNewReceptionName] = useState('');
  const [newReceptionMobile, setNewReceptionMobile] = useState('');
  const [newReceptionEmail, setNewReceptionEmail] = useState('');

  const [newClassFrom, setNewClassFrom] = useState('I');
  const [newClassTo, setNewClassTo] = useState('XII');
  const [newCardTypes, setNewCardTypes] = useState<string[]>(['Student']);
  const [newSections, setNewSections] = useState<string[]>(['A', 'B', 'C', 'D']);
  const [newHouses, setNewHouses] = useState<string[]>([]);

  const [hasSections, setHasSections] = useState<boolean>(true);
  const [hasHouses, setHasHouses] = useState<boolean>(true);

  const [newSectionInput, setNewSectionInput] = useState('');
  const [newHouseInput, setNewHouseInput] = useState('');
  const [newAdditionalNotes, setNewAdditionalNotes] = useState('');

  // City picker states
  const [customCities, setCustomCities] = useState<string[]>([]);
  const [isCityPickerOpen, setIsCityPickerOpen] = useState(false);
  const [newCityNameInput, setNewCityNameInput] = useState('');

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'FollowUp' | 'Approved' | 'Rejected'>('All');

  // Vendor / Salesman Management States
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(null);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(true); // default true for owner
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Vendor Creation Form Inputs
  const [isAddingVendor, setIsAddingVendor] = useState(false);
  const [selectedVendorForEdit, setSelectedVendorForEdit] = useState<Vendor | null>(null);
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorFirm, setNewVendorFirm] = useState('');
  const [newVendorAddress, setNewVendorAddress] = useState('');
  const [newVendorMobile, setNewVendorMobile] = useState('');
  const [newVendorEmail, setNewVendorEmail] = useState('');
  const [newVendorUser, setNewVendorUser] = useState('');
  const [newVendorPass, setNewVendorPass] = useState('');
  const [newVendorCities, setNewVendorCities] = useState<string[]>([]);

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

  // Load vendors list
  const loadVendors = async () => {
    try {
      const data = await dbService.getVendors();
      setVendors(data);
    } catch(e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadVisits();
    loadVendors();
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('customCities');
      if (stored) {
        try {
          setCustomCities(JSON.parse(stored));
        } catch(e) {
          console.error(e);
        }
      }
      
      const cachedVendor = localStorage.getItem('currentVendor');
      if (cachedVendor) {
        try {
          const parsed = JSON.parse(cachedVendor);
          setCurrentVendor(parsed);
          setIsAdminMode(false);
        } catch(e) {
          console.error(e);
        }
      }
    }
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
      range: newRange.trim() || undefined,
      status: 'Pending' as const,
      category: activeCategory || undefined,
      schoolDetails: {
        address: newAddress,
        principalName: newPrincipalName,
        principalMobile: newPrincipalMobile,
        principalEmail: newPrincipalEmail,
      },
      idIncharge: {
        name: newInchargeName,
        mobile: newInchargeMobile,
        email: newInchargeEmail,
      },
      reception: {
        name: newReceptionName,
        mobile: newReceptionMobile,
        email: newReceptionEmail,
      },
      classes: {
        from: newClassFrom,
        to: newClassTo,
      },
      cardTypes: newCardTypes,
      sections: hasSections ? newSections : [],
      houses: hasHouses ? newHouses : [],
      additionalNotes: newAdditionalNotes,
      createdByVendorId: !isAdminMode && currentVendor ? currentVendor.id : undefined,
      createdByVendorName: !isAdminMode && currentVendor ? currentVendor.name : undefined,
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
      setNewRange('');
      
      setNewAddress('');
      setNewPrincipalName('');
      setNewPrincipalMobile('');
      setNewPrincipalEmail('');
      setNewInchargeName('');
      setNewInchargeMobile('');
      setNewInchargeEmail('');
      setNewReceptionName('');
      setNewReceptionMobile('');
      setNewReceptionEmail('');
      setNewClassFrom('I');
      setNewClassTo('XII');
      setNewCardTypes(['Student']);
      setNewSections(['A', 'B', 'C', 'D']);
      setNewHouses([]);
      setHasSections(true);
      setHasHouses(true);
      setNewSectionInput('');
      setNewHouseInput('');
      setNewAdditionalNotes('');

      setIsAddingVisit(false);
      
      // Go to visits tab to see it
      setTab('visits');
      setTimeout(() => setSyncStatus('synced'), 800);
    } catch (e) {
      console.error('Error saving visit:', e);
      setSyncStatus('synced');
    }
  };

  // Vendor / Salesman actions
  const handleAddVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName.trim() || !newVendorFirm.trim() || !newVendorUser.trim() || !newVendorPass.trim()) {
      alert('Please fill name, firm, username, and password.');
      return;
    }

    setSyncStatus('syncing');
    try {
      const vendorData = {
        name: newVendorName.trim(),
        firmName: newVendorFirm.trim(),
        address: newVendorAddress.trim(),
        mobile: newVendorMobile.trim(),
        email: newVendorEmail.trim(),
        user: newVendorUser.trim().toLowerCase(),
        pass: newVendorPass.trim(),
        allowedCities: newVendorCities
      };

      if (selectedVendorForEdit) {
        // Edit flow
        await dbService.updateVendor(selectedVendorForEdit.id, vendorData);
        setVendors((prev) => 
          prev.map(v => v.id === selectedVendorForEdit.id ? { ...v, ...vendorData } : v)
        );
        alert('Vendor details updated successfully!');
      } else {
        // Create flow
        const added = await dbService.saveVendor(vendorData);
        setVendors((prev) => [added, ...prev]);
      }

      // Reset form
      setNewVendorName('');
      setNewVendorFirm('');
      setNewVendorAddress('');
      setNewVendorMobile('');
      setNewVendorEmail('');
      setNewVendorUser('');
      setNewVendorPass('');
      setNewVendorCities([]);
      setIsAddingVendor(false);
      setSelectedVendorForEdit(null);
      
      setTimeout(() => setSyncStatus('synced'), 800);
    } catch(e) {
      console.error(e);
      setSyncStatus('synced');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = loginUser.trim().toLowerCase();
    const p = loginPass.trim();

    if (u === 'admin' && p === 'admin123') {
      // Owner Mode
      setCurrentVendor(null);
      setIsAdminMode(true);
      localStorage.removeItem('currentVendor');
      setIsLoginModalOpen(false);
      setLoginUser('');
      setLoginPass('');
      alert('Welcome Owner (Admin)');
      return;
    }

    const matched = vendors.find(v => v.user === u && v.pass === p);
    if (matched) {
      setCurrentVendor(matched);
      setIsAdminMode(false);
      localStorage.setItem('currentVendor', JSON.stringify(matched));
      setIsLoginModalOpen(false);
      setLoginUser('');
      setLoginPass('');
      alert(`Welcome ${matched.name}!`);
    } else {
      alert('Invalid username or password.');
    }
  };

  const handleLogout = () => {
    setCurrentVendor(null);
    setIsAdminMode(true); // default back to Owner view (which requires login/logout to toggle)
    localStorage.removeItem('currentVendor');
    alert('Logged out from vendor session.');
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

  // Filter visits by vendor assigned cities if a vendor is logged in
  const visibleVisits = visits.filter((v) => {
    if (!isAdminMode && currentVendor) {
      if (!v.city) return false;
      return currentVendor.allowedCities.includes(v.city);
    }
    return true;
  });

  // Stats calculation based on vendor visibility
  const totalVisits = visibleVisits.length;
  const pendingVisits = visibleVisits.filter((v) => v.status === 'Pending').length;
  const followUpVisits = visibleVisits.filter((v) => v.status === 'FollowUp').length;
  const approvedSchools = visibleVisits.filter((v) => v.status === 'Approved').length;
  const rejectedSchools = visibleVisits.filter((v) => v.status === 'Rejected').length;
  const todayVisits = visibleVisits.filter((v) => isDateToday(v.visitDate)).length;

  // City calculations for analysis based on vendor visibility
  const cityCounts: { [key: string]: number } = {};
  visibleVisits.forEach(v => {
    if (v.city) {
      const city = v.city.trim();
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    }
  });
  const sortedCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);

  // Filtering lists
  const filteredVisits = visibleVisits.filter((v) => {
    // 0. Filter by active category if set
    if (activeCategory && v.category !== activeCategory) return false;

    // 1. Search Query filter (matches School Name, Principal, Status, City, or Range)
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      v.schoolName.toLowerCase().includes(query) ||
      (v.schoolDetails?.principalName && v.schoolDetails.principalName.toLowerCase().includes(query)) ||
      v.status.toLowerCase().includes(query) ||
      (v.range && v.range.toLowerCase().includes(query)) ||
      (v.city && v.city.toLowerCase().includes(query));

    // 2. Status Tab Filter
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && v.status === statusFilter;
  });

  const approvedList = visibleVisits.filter((v) => {
    if (v.status !== 'Approved') return false;
    if (activeCategory && v.category !== activeCategory) return false;
    const query = searchQuery.toLowerCase().trim();
    return (
      v.schoolName.toLowerCase().includes(query) ||
      (v.schoolDetails?.principalName && v.schoolDetails.principalName.toLowerCase().includes(query)) ||
      (v.range && v.range.toLowerCase().includes(query)) ||
      (v.city && v.city.toLowerCase().includes(query))
    );
  });

  return (
    <div className="app-shell">
      {/* App Header */}
      <header className="app-header">
        <div>
          <span 
            className="app-title" 
            style={{ cursor: 'pointer' }}
            onClick={() => { setTab('dashboard'); setSearchQuery(''); setSelectedVisit(null); }}
          >
            ACL ID Manage
          </span>
          {!isAdminMode && currentVendor && (
            <span style={{ marginLeft: '8px', fontSize: '12px', padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', color: 'var(--primary)' }}>
              👤 {currentVendor.name}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Vendor login/logout switcher */}
          {!isAdminMode && currentVendor ? (
            <button
              onClick={() => {
                handleLogout();
                window.location.reload(); // Hard reload will boot user back to PasswordProtection login screen
              }}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => {
                localStorage.removeItem('site_authenticated');
                window.location.reload();
              }}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Logout
            </button>
          )}

          {!isCloudConnected ? (
            <div className="conn-indicator conn-offline" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', padding: '4px 8px', fontSize: '11px' }}>
              <WifiOff size={11} />
              <span>Local</span>
            </div>
          ) : !isOnline ? (
            <div className="conn-indicator conn-offline" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', padding: '4px 8px', fontSize: '11px' }}>
              <WifiOff size={11} />
              <span>Offline</span>
            </div>
          ) : syncStatus === 'syncing' ? (
            <div className="conn-indicator" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '11px' }}>
              <span style={{ 
                display: 'inline-block', 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                border: '2px solid #60a5fa', 
                borderTopColor: 'transparent',
                animation: 'spin 1s linear infinite'
              }}></span>
              <span>Sync...</span>
            </div>
          ) : (
            <div className="conn-indicator conn-online" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', padding: '4px 8px', fontSize: '11px' }}>
              <Wifi size={11} />
              <span>Online</span>
            </div>
          )}
        </div>
      </header>

      {/* Screen Routing */}
      {selectedVisit ? (
        /* DETAIL PAGE / WORKFLOW VIEW */
        <div className="details-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button 
              className="btn btn-secondary" 
              style={{ width: 'auto', padding: '8px 12px', fontSize: '13px' }}
              onClick={() => {
                setSelectedVisit(null);
                setIsApproving(false);
                setIsRejecting(false);
              }}
            >
              <ChevronLeft size={16} /> {t.backToList}
            </button>

            <button 
              className="btn btn-danger" 
              style={{ width: 'auto', padding: '8px 12px', fontSize: '13px', backgroundColor: 'transparent', border: '1px solid var(--rejected)', color: 'var(--rejected)' }}
              onClick={() => handleDeleteVisit(selectedVisit.id)}
            >
              {t.deleteEntry}
            </button>
          </div>

          {/* School Name & Current Status Banner */}
          <div className="details-header">
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {selectedVisit.schoolName}
            </h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                  ? (language === 'en' ? 'Confirmed ✅' : 'पुष्टि की गई ✅')
                  : selectedVisit.status === 'Rejected' 
                    ? (language === 'en' ? 'Declined ❌' : 'अस्वीकार किया गया ❌') 
                    : selectedVisit.status === 'FollowUp'
                      ? (language === 'en' ? 'Follow-Up 🔵' : 'फॉलो-अप 🔵')
                      : (language === 'en' ? 'Pending 🟡' : 'लंबित 🟡')}
              </span>
              {selectedVisit.city && (
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} /> {selectedVisit.city}
                </span>
              )}
              {selectedVisit.range && (
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px', borderLeft: '1px solid var(--border-color)', paddingLeft: '8px' }}>
                  {language === 'en' ? 'Range' : 'रेंज'}: {selectedVisit.range}
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
                  {language === 'en' ? (
                    <>Visit scheduled for <strong>{formatDate(selectedVisit.visitDate)}</strong>.</>
                  ) : (
                    <><strong>{formatDate(selectedVisit.visitDate)}</strong> के लिए मुलाकात निर्धारित है।</>
                  )}
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
                    ❌ {t.decline}
                  </button>
                  <button 
                    className="btn btn-success" 
                    onClick={() => handleApproveSave({ status: 'Approved' })}
                    style={{ height: '56px', fontSize: '16px' }}
                  >
                    ✅ {t.confirm}
                  </button>
                </div>
                <button 
                  type="button"
                  className="btn" 
                  onClick={() => setIsSchedulingFollowUp(true)}
                  style={{ height: '56px', fontSize: '16px', backgroundColor: 'var(--followup-bg)', color: 'var(--followup)', border: '1px solid var(--border-color)' }}
                >
                  ⏰ {t.scheduleFollowUp}
                </button>
              </div>
            </div>
          )}

          {isApproving && (
            /* Detailed Approval Form */
            <div className="section-card" style={{ padding: '16px 12px' }}>
              <h3 className="form-title" style={{ marginTop: 0 }}>{t.clientRegistrationForm}</h3>
              <ApprovalForm
                visit={selectedVisit}
                onSave={handleApproveSave}
                onCancel={() => setIsApproving(false)}
                lang={language}
              />
            </div>
          )}

          {selectedVisit.status === 'FollowUp' && !isApproving && (
            /* Follow-Up details view */
            <div className="detail-section" style={{ borderLeft: '4px solid var(--followup)' }}>
              <div className="detail-section-title" style={{ color: 'var(--followup)' }}>{language === 'en' ? 'Follow-Up Details' : 'फॉलो-अप विवरण'}</div>
              <div className="detail-row">
                <span className="detail-label">{t.scheduledDate}</span>
                <span className="detail-value" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formatDate(selectedVisit.followUpDate || '')}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t.nextAction}</span>
                <span className="detail-value" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {selectedVisit.followUpAction || (language === 'en' ? 'No action specified' : 'कोई कार्रवाई निर्दिष्ट नहीं')}
                </span>
              </div>
              {selectedVisit.followUpNotes && (
                <div className="detail-row">
                  <span className="detail-label">{t.notesReminders}</span>
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
                    ❌ {t.decline}
                  </button>
                  <button 
                    className="btn btn-success" 
                    onClick={() => handleApproveSave({ status: 'Approved' })}
                    style={{ height: '48px', fontSize: '14px' }}
                  >
                    ✅ {t.confirmClient}
                  </button>
                </div>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setIsSchedulingFollowUp(true)}
                  style={{ height: '48px', fontSize: '14px' }}
                >
                  {t.rescheduleFollowUp}
                </button>
              </div>
            </div>
          )}

          {selectedVisit.status === 'Rejected' && (
            /* Rejected summary details */
            <div className="detail-section" style={{ borderLeft: '4px solid var(--rejected)' }}>
              <div className="detail-section-title" style={{ color: 'var(--rejected)' }}>{t.declineSummary}</div>
              <div className="detail-row">
                <span className="detail-label">{t.declineReason}</span>
                <span className="detail-value" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedVisit.rejectionReason || (language === 'en' ? 'No reason specified' : 'कोई कारण निर्दिष्ट नहीं')}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{language === 'en' ? 'Visited Date' : 'मुलाकात की तिथि'}</span>
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
                  {t.editReason}
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '10px 14px' }}
                  onClick={() => {
                    setIsApproving(true);
                  }}
                >
                  {t.confirmInstead}
                </button>
              </div>
            </div>
          )}

          {selectedVisit.status === 'Approved' && !isApproving && (
            /* Approved detailed specifications display */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="detail-section">
                <div className="detail-section-title">{language === 'en' ? 'Principal Details' : 'प्रिंसिपल का विवरण'}</div>
                <div className="detail-row">
                  <span className="detail-label">{language === 'en' ? 'Name' : 'नाम'}</span>
                  <span className="detail-value">{selectedVisit.schoolDetails?.principalName || (language === 'en' ? 'Not entered' : 'दर्ज नहीं किया')}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{language === 'en' ? 'Mobile' : 'मोबाइल'}</span>
                  {selectedVisit.schoolDetails?.principalMobile ? (
                    <a 
                      href={`tel:${selectedVisit.schoolDetails.principalMobile}`}
                      className="detail-value" 
                      style={{ color: 'var(--primary)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Phone size={14} /> {selectedVisit.schoolDetails.principalMobile}
                    </a>
                  ) : (
                    <span className="detail-value">{language === 'en' ? 'Not entered' : 'दर्ज नहीं किया'}</span>
                  )}
                </div>
                {selectedVisit.schoolDetails?.principalEmail && (
                  <div className="detail-row">
                    <span className="detail-label">{language === 'en' ? 'Email' : 'ईमेल'}</span>
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
                    <span className="detail-label">{t.address}</span>
                    <span className="detail-value">{selectedVisit.schoolDetails.address}</span>
                  </div>
                )}
              </div>

              {selectedVisit.idIncharge && (selectedVisit.idIncharge.name || selectedVisit.idIncharge.mobile) && (
                <div className="detail-section">
                  <div className="detail-section-title">{t.incharge}</div>
                  <div className="detail-row">
                    <span className="detail-label">{language === 'en' ? 'Name' : 'नाम'}</span>
                    <span className="detail-value">{selectedVisit.idIncharge.name || (language === 'en' ? 'Not entered' : 'दर्ज नहीं किया')}</span>
                  </div>
                  {selectedVisit.idIncharge.mobile && (
                    <div className="detail-row">
                      <span className="detail-label">{language === 'en' ? 'Mobile' : 'मोबाइल'}</span>
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
                      <span className="detail-label">{language === 'en' ? 'Email' : 'ईमेल'}</span>
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
                  <div className="detail-section-title">{t.reception}</div>
                  <div className="detail-row">
                    <span className="detail-label">{language === 'en' ? 'Name' : 'नाम'}</span>
                    <span className="detail-value">{selectedVisit.reception.name || (language === 'en' ? 'Not entered' : 'दर्ज नहीं किया')}</span>
                  </div>
                  {selectedVisit.reception.mobile && (
                    <div className="detail-row">
                      <span className="detail-label">{language === 'en' ? 'Mobile' : 'मोबाइल'}</span>
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
                      <span className="detail-label">{language === 'en' ? 'Email' : 'ईमेल'}</span>
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
                <div className="detail-section-title">{language === 'en' ? 'Configurations' : 'कॉन्फ़िगरेशन'}</div>
                {selectedVisit.classes && (
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label">{language === 'en' ? 'Classes Span' : 'कक्षा विस्तार'}</span>
                    <span className="detail-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <BookOpen size={16} style={{ color: 'var(--primary)' }} /> {selectedVisit.classes.from} - {selectedVisit.classes.to}
                    </span>
                  </div>
                )}

                {selectedVisit.cardTypes && selectedVisit.cardTypes.length > 0 && (
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label">{t.cardTypeRequired}</span>
                    <span className="detail-value">
                      {selectedVisit.cardTypes.map(type => 
                        type === 'Student' ? t.student : type === 'Staff' ? t.staff : type === 'Bus' ? t.bus : type === 'Other' ? t.cardOther : type
                      ).join(', ')}
                    </span>
                  </div>
                )}

                {selectedVisit.sections && selectedVisit.sections.length > 0 && (
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label">{t.sections}</span>
                    <div className="tag-list" style={{ marginTop: '4px' }}>
                      {selectedVisit.sections.map((sec) => (
                        <span key={sec} className="tag">{sec}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedVisit.houses && selectedVisit.houses.length > 0 && (
                  <div className="detail-row">
                    <span className="detail-label">{t.houses}</span>
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
                  <div className="detail-section-title">{t.notes}</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {selectedVisit.additionalNotes}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '8px', marginBottom: '24px' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={() => setIsApproving(true)}
                  style={{ width: '100%' }}
                >
                  <Edit size={16} /> {language === 'en' ? 'Edit Details' : 'विवरण संपादित करें'}
                </button>
              </div>
            </div>
          )}

          {/* Rejection capturing overlay */}
          <RejectionModal
            isOpen={isRejecting}
            onClose={() => setIsRejecting(false)}
            onSave={handleRejectSave}
            lang={language}
          />
        </div>
      ) : (
        /* STANDARD NAVIGATION VIEWS */
        <>
          {currentTab === 'dashboard' && (
            <div style={{ padding: '0 0 20px 0' }}>
              {/* Custom Bubble metrics layout */}
              <div className="bubble-metric-container">
                <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', paddingLeft: '8px', marginBottom: '4px' }}>
                  <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#000000', margin: 0, fontFamily: 'serif' }}>
                    {!isAdminMode && currentVendor ? 'Dashboard' : 'Admin Dashbord'}
                  </h1>
                </div>

                <div className="bubble-top-row">
                  <div className="bubble-left-container">
                    <button 
                      className="bubble-total"
                      onClick={() => {
                        setActiveCategory(null);
                        setTab('visits');
                        setStatusFilter('All');
                        setSearchQuery('');
                      }}
                    >
                      <span className="bubble-total-title">{t.totalClient}</span>
                      <span className="bubble-total-value">{totalVisits}</span>
                    </button>
                  </div>
                  
                  <div className="bubble-right-grid">
                    <button 
                      className="bubble-small"
                      onClick={() => {
                        setActiveCategory(null);
                        setTab('visits');
                        setStatusFilter('Approved');
                      }}
                    >
                      <span className="bubble-small-title">{t.confirmed}</span>
                      <span className="bubble-small-value">{approvedSchools}</span>
                    </button>

                    <button 
                      className="bubble-small"
                      onClick={() => {
                        setActiveCategory(null);
                        setTab('visits');
                        setStatusFilter('FollowUp');
                      }}
                    >
                      <span className="bubble-small-title">{t.followUpsBubble}</span>
                      <span className="bubble-small-value">{followUpVisits}</span>
                    </button>

                    <button 
                      className="bubble-small"
                      onClick={() => {
                        setActiveCategory(null);
                        setTab('visits');
                        setStatusFilter('Pending');
                      }}
                    >
                      <span className="bubble-small-title">{t.pending}</span>
                      <span className="bubble-small-value">{pendingVisits}</span>
                    </button>

                    <button 
                      className="bubble-small" 
                      onClick={() => {
                        setActiveCategory(null);
                        setTab('visits');
                        setStatusFilter('Rejected');
                      }}
                    >
                      <span className="bubble-small-title">{t.declined}</span>
                      <span className="bubble-small-value">{rejectedSchools}</span>
                    </button>

                    <button 
                      className="bubble-small" 
                      onClick={() => {
                        setActiveCategory(null);
                        setTab('visits');
                        setStatusFilter('All');
                        const todayStr = new Date().toISOString().split('T')[0];
                        setSearchQuery(todayStr);
                      }}
                    >
                      <span className="bubble-small-title">{t.todays}</span>
                      <span className="bubble-small-value">{todayVisits}</span>
                    </button>
                  </div>
                </div>

                {/* Big Admin Button (hidden for logged-in salesman vendors) */}
                {(isAdminMode || !currentVendor) && (
                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <button className="admin-pill-button" onClick={() => { setActiveCategory(null); setTab('admin'); setStatusFilter('All'); setSearchQuery(''); }}>
                      {t.adminLabel}
                    </button>
                  </div>
                )}
              </div>
              
              {/* Redesigned 6-Category Grid Layout */}
              <div>
                <div className="category-grid">
                  {[
                    { key: 'School', title: 'SCHOOL', icon: '/school.png' },
                    { key: 'Collage', title: 'COLLAGE', icon: '/collage.png' },
                    { key: 'Office', title: 'OFFICE', icon: '/office.png' },
                    { key: 'Hospital', title: 'HOSPITAL', icon: '/hospital.png' },
                    { key: 'Studio', title: 'STUDIO', icon: '/studio.png' },
                    { key: 'Other', title: 'OTHER', icon: '/other.png' }
                  ].map((cat) => (
                    <div 
                      key={cat.key} 
                      className="category-card"
                      onClick={() => {
                        setActiveCategory(cat.key as any);
                        setTab('visits');
                        setStatusFilter('All');
                        setSearchQuery('');
                      }}
                    >
                      <span className="category-card-title">{cat.title}</span>
                      <div className="category-card-icon-container">
                        <img src={cat.icon} alt={cat.title} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentTab === 'visits' && (
            <>
              {/* Sticky Search bar */}
              <div className="search-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }} 
                    onClick={() => { setTab('dashboard'); setSearchQuery(''); setActiveCategory(null); }}
                  >
                    ← {t.back}
                  </button>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                    {activeCategory ? `${t[activeCategory.toLowerCase() as keyof typeof t] || activeCategory} - ${t.clientsList}` : t.clientsList}
                  </h3>
                </div>
                <div className="search-input-wrapper">
                  <Search className="search-icon" size={18} />
                  <input
                    type="text"
                    className="search-input"
                    placeholder={t.searchPlaceholderClients}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {(['All', 'Pending', 'FollowUp', 'Approved', 'Rejected'] as const).map((status) => {
                    let label = status as string;
                    if (status === 'All') label = language === 'en' ? 'All' : 'सभी';
                    else if (status === 'Pending') label = language === 'en' ? 'Pending' : 'लंबित';
                    else if (status === 'FollowUp') label = language === 'en' ? 'Follow-Up' : 'फॉलो-अप';
                    else if (status === 'Approved') label = language === 'en' ? 'Confirmed' : 'पुष्टि किए गए';
                    else if (status === 'Rejected') label = language === 'en' ? 'Declined' : 'अस्वीकृत';
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
                  {t.loadingClientList}
                </div>
              ) : filteredVisits.length > 0 ? (
                <div className="visit-card-list">
                  {filteredVisits.map((visit) => (
                    <div 
                      key={visit.id} 
                      className={`visit-card card-${visit.status.toLowerCase()}`}
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
                        {visit.range && (
                          <div className="visit-card-row" style={{ color: 'var(--primary)', fontSize: '13px', fontWeight: 500 }}>
                            <span>Range: {visit.range}</span>
                          </div>
                        )}
                        {visit.notes && (
                          <div className="visit-card-row" style={{ marginTop: '4px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                            <span>"{visit.notes}"</span>
                          </div>
                        )}
                        {visit.status === 'Rejected' && visit.rejectionReason && (
                          <div className="visit-card-row" style={{ color: 'var(--rejected)', fontWeight: 500 }}>
                            <span>{t.reason}: {visit.rejectionReason}</span>
                          </div>
                        )}
                        {visit.status === 'FollowUp' && visit.followUpDate && (
                          <div className="visit-card-row" style={{ color: 'var(--followup)', fontWeight: 500 }}>
                            <span>{t.action}: {visit.followUpAction} ({formatDate(visit.followUpDate)})</span>
                          </div>
                        )}
                        {visit.createdByVendorName && (
                          <div className="visit-card-row" style={{ marginTop: '6px' }}>
                            <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                              👤 {visit.createdByVendorName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--text-secondary)' }}>
                  {t.noClientMatch}
                </div>
              )}

              {/* FAB to Add Visit */}
              <div className="fab-container">
                <button 
                  className="fab" 
                  onClick={() => setIsAddingVisit(true)}
                  aria-label="Add new client visit"
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }} 
                    onClick={() => { setTab('dashboard'); setSearchQuery(''); setActiveCategory(null); }}
                  >
                    ← {t.back}
                  </button>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                    {activeCategory ? `${t[activeCategory.toLowerCase() as keyof typeof t] || activeCategory} - ${t.confirmedClients}` : t.confirmedClients}
                  </h3>
                </div>
                <div className="search-input-wrapper">
                  <Search className="search-icon" size={18} />
                  <input
                    type="text"
                    className="search-input"
                    placeholder={t.searchPlaceholderConfirmed}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Schools List (Approved only) */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  {t.loadingConfirmedList}
                </div>
              ) : approvedList.length > 0 ? (
                <div className="visit-card-list">
                  {approvedList.map((visit) => (
                    <div 
                      key={visit.id} 
                      className={`visit-card card-${visit.status.toLowerCase()}`}
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

                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px', flexWrap: 'wrap' }}>
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
                          {visit.range && (
                            <span>
                              Range: {visit.range}
                            </span>
                          )}
                          {visit.createdByVendorName && (
                            <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                              👤 {visit.createdByVendorName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--text-secondary)' }}>
                  {t.noConfirmedSaved}
                </div>
              )}
            </>
          )}

          {currentTab === 'analysis' && (
            <>
              {/* Sticky Header */}
              <div className="search-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }} 
                    onClick={() => { setTab('dashboard'); setActiveCategory(null); }}
                  >
                    ← {t.back}
                  </button>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{t.clientAnalysis}</h3>
                </div>
              </div>

              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Stats Overview */}
                <div className="section-card">
                  <h3 className="section-card-title">{t.metricsOverview}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.totalClients}</span>
                      <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px' }}>{totalVisits}</div>
                    </div>
                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--approved)' }}>{language === 'en' ? 'Confirmed' : 'पुष्टि किए गए'}</span>
                      <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px', color: 'var(--approved)' }}>{approvedSchools}</div>
                    </div>
                    <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--pending)' }}>{language === 'en' ? 'Pending' : 'लंबित'}</span>
                      <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px', color: 'var(--pending)' }}>{pendingVisits}</div>
                    </div>
                    <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--rejected)' }}>{language === 'en' ? 'Declined' : 'अस्वीकृत'}</span>
                      <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px', color: 'var(--rejected)' }}>{rejectedSchools}</div>
                    </div>
                  </div>
                </div>

                {/* Conversion Rate */}
                <div className="section-card">
                  <h3 className="section-card-title">{t.conversionRate}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t.conversionRatio}</span>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--approved)' }}>
                      {totalVisits > 0 ? Math.round((approvedSchools / totalVisits) * 100) : 0}%
                    </span>
                  </div>
                  {/* Custom Progress Bar */}
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginTop: '10px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${totalVisits > 0 ? (approvedSchools / totalVisits) * 100 : 0}%`, 
                      height: '100%', 
                      backgroundColor: 'var(--approved)', 
                      borderRadius: '4px',
                      transition: 'width 0.5s ease-out'
                    }} />
                  </div>
                </div>

                {/* Geographic / City Distribution */}
                <div className="section-card">
                  <h3 className="section-card-title">{t.geographicBreakdown}</h3>
                  {sortedCities.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                      {sortedCities.map(([city, count]) => {
                        const pct = Math.round((count / totalVisits) * 100);
                        return (
                          <div key={city} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                              <span style={{ fontWeight: 500 }}>{city}</span>
                              <span style={{ color: 'var(--text-secondary)' }}>
                                {language === 'en' 
                                  ? `${count} client${count > 1 ? 's' : ''} (${pct}%)` 
                                  : `${count} ग्राहक (${pct}%)`}
                              </span>
                            </div>
                            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '3px' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {t.noCityData}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {currentTab === 'admin' && isAdminMode && (
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }} 
                    onClick={() => setTab('dashboard')}
                  >
                    ← {t.back}
                  </button>
                  <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    {language === 'en' ? 'Vendor Management' : 'विक्रेता प्रबंधन'}
                  </h2>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: 'auto', padding: '10px 20px' }}
                  onClick={() => setIsAddingVendor(true)}
                >
                  ➕ {language === 'en' ? 'Add Vendor' : 'विक्रेता जोड़ें'}
                </button>
              </div>

              {/* Vendors List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '45px' }}>
                {vendors.length > 0 ? (
                  vendors.map((vendor) => (
                    <div key={vendor.id} className="section-card" style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                            {vendor.name} ({vendor.firmName})
                          </h4>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            👤 Username: <strong style={{ color: 'var(--primary)' }}>{vendor.user}</strong> | 🔑 Pass: <strong>{vendor.pass}</strong>
                          </span>
                        </div>
                        <button
                          className="btn"
                          style={{
                            width: 'auto',
                            padding: '6px 12px',
                            fontSize: '12px',
                            backgroundColor: 'rgba(99, 102, 241, 0.15)',
                            color: 'var(--primary)',
                            borderRadius: '8px',
                            border: '1px solid rgba(99, 102, 241, 0.2)'
                          }}
                          onClick={() => {
                            setSelectedVendorForEdit(vendor);
                            setNewVendorName(vendor.name);
                            setNewVendorFirm(vendor.firmName);
                            setNewVendorAddress(vendor.address || '');
                            setNewVendorMobile(vendor.mobile || '');
                            setNewVendorEmail(vendor.email || '');
                            setNewVendorUser(vendor.user);
                            setNewVendorPass(vendor.pass);
                            setNewVendorCities(vendor.allowedCities || []);
                            setIsAddingVendor(true);
                          }}
                        >
                          ✏️ {language === 'en' ? 'Edit' : 'संपादित करें'}
                        </button>
                      </div>
                      
                      <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div>📍 Address: {vendor.address || 'N/A'}</div>
                        <div>📞 Mobile: {vendor.mobile || 'N/A'} | ✉️ Email: {vendor.email || 'N/A'}</div>
                        <div style={{ marginTop: '8px' }}>
                          <span style={{ fontWeight: 600 }}>🌍 Allowed Cities:</span>{' '}
                          {vendor.allowedCities.length > 0 ? (
                            vendor.allowedCities.map(c => (
                              <span key={c} style={{ display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', marginRight: '6px', fontSize: '12px' }}>
                                {c}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: 'var(--rejected)', fontStyle: 'italic' }}>None (No access to client data)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>
                    {language === 'en' ? 'No vendors created yet. Click Add Vendor above.' : 'अभी तक कोई विक्रेता नहीं बनाया गया। ऊपर विक्रेता जोड़ें पर क्लिक करें।'}
                  </div>
                )}
              </div>

              {/* Admin Configuration Settings Panel */}
              <div className="section-card" style={{ padding: '20px', marginBottom: '40px' }}>
                <h3 className="section-card-title" style={{ marginBottom: '16px' }}>
                  ⚙️ {language === 'en' ? 'Admin Security Settings' : 'एडमिन सुरक्षा सेटिंग्स'}
                </h3>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const oldPass = fd.get('oldPassword') as string;
                    const newPass = fd.get('newPassword') as string;
                    const savedPass = localStorage.getItem('admin_password') || 'admin123';
                    if (oldPass !== savedPass) {
                      alert('Incorrect old password.');
                      return;
                    }
                    if (newPass.length < 4) {
                      alert('Password must be at least 4 characters long.');
                      return;
                    }
                    localStorage.setItem('admin_password', newPass);
                    alert('Admin Password updated successfully!');
                    e.currentTarget.reset();
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                >
                  <div className="form-group">
                    <label className="form-label">{language === 'en' ? 'Current Admin Password' : 'वर्तमान एडमिन पासवर्ड'}</label>
                    <input
                      type="password"
                      name="oldPassword"
                      required
                      className="form-input"
                      placeholder="e.g. admin123"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{language === 'en' ? 'New Admin Password' : 'नया एडमिन पासवर्ड'}</label>
                    <input
                      type="password"
                      name="newPassword"
                      required
                      className="form-input"
                      placeholder="Enter new password"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: 'auto', alignSelf: 'flex-start', padding: '10px 24px', marginTop: '6px' }}>
                    {language === 'en' ? 'Update Password' : 'पासवर्ड अपडेट करें'}
                  </button>
                </form>
              </div>

              {/* Vendor addition drawer */}
              {isAddingVendor && (
                <div className="modal-overlay" onClick={() => {
                  setIsAddingVendor(false);
                  setSelectedVendorForEdit(null);
                  setNewVendorName('');
                  setNewVendorFirm('');
                  setNewVendorAddress('');
                  setNewVendorMobile('');
                  setNewVendorEmail('');
                  setNewVendorUser('');
                  setNewVendorPass('');
                  setNewVendorCities([]);
                }} style={{ zIndex: 11100 }}>
                  <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                    <h3 className="form-title">
                      {selectedVendorForEdit 
                        ? (language === 'en' ? 'Edit Vendor Account' : 'विक्रेता खाता संपादित करें') 
                        : (language === 'en' ? 'Create New Vendor Account' : 'नया विक्रेता खाता बनाएं')}
                    </h3>
                    <form onSubmit={handleAddVendorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">{language === 'en' ? 'Salesman Name' : 'विक्रेता का नाम'}</label>
                        <input
                          type="text"
                          className="form-input"
                          required
                          value={newVendorName}
                          onChange={(e) => setNewVendorName(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{language === 'en' ? 'Firm Name' : 'फर्म का नाम'}</label>
                        <input
                          type="text"
                          className="form-input"
                          required
                          value={newVendorFirm}
                          onChange={(e) => setNewVendorFirm(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{language === 'en' ? 'Address' : 'पता'}</label>
                        <input
                          type="text"
                          className="form-input"
                          value={newVendorAddress}
                          onChange={(e) => setNewVendorAddress(e.target.value)}
                        />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">{language === 'en' ? 'Mobile' : 'मोबाइल'}</label>
                          <input
                            type="tel"
                            className="form-input"
                            value={newVendorMobile}
                            onChange={(e) => setNewVendorMobile(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">{language === 'en' ? 'Email' : 'ईमेल'}</label>
                          <input
                            type="email"
                            className="form-input"
                            value={newVendorEmail}
                            onChange={(e) => setNewVendorEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                        <span className="section-card-title" style={{ display: 'block', marginBottom: '12px' }}>
                          🔑 Login Credentials
                        </span>
                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">{language === 'en' ? 'Username' : 'उपयोगकर्ता नाम'}</label>
                            <input
                              type="text"
                              className="form-input"
                              required
                              placeholder="e.g. sales1"
                              value={newVendorUser}
                              onChange={(e) => setNewVendorUser(e.target.value.toLowerCase())}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">{language === 'en' ? 'Password' : 'पासवर्ड'}</label>
                            <input
                              type="text"
                              className="form-input"
                              required
                              value={newVendorPass}
                              onChange={(e) => setNewVendorPass(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                        <span className="section-card-title" style={{ display: 'block', marginBottom: '12px' }}>
                          🌍 Allowed Cities Assignment
                        </span>
                        
                        {/* Custom city input box */}
                        <div className="dynamic-tag-input-row" style={{ marginBottom: '12px' }}>
                          <input
                            type="text"
                            id="vendor-custom-city"
                            className="form-input"
                            placeholder="Add city name (e.g. Bilaspur)"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = (e.target as HTMLInputElement).value.trim();
                                if (val && !newVendorCities.includes(val)) {
                                  setNewVendorCities([...newVendorCities, val]);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ width: 'auto', padding: '12px 16px' }}
                            onClick={() => {
                              const el = document.getElementById('vendor-custom-city') as HTMLInputElement;
                              const val = el?.value.trim();
                              if (val && !newVendorCities.includes(val)) {
                                setNewVendorCities([...newVendorCities, val]);
                                el.value = '';
                              }
                            }}
                          >
                            <Plus size={20} />
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '12px' }}>
                          {customCities.map((city) => {
                            const isAssigned = newVendorCities.includes(city);
                            return (
                              <label key={city} className="checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={isAssigned}
                                  onChange={() => {
                                    if (isAssigned) {
                                      setNewVendorCities(newVendorCities.filter(c => c !== city));
                                    } else {
                                      setNewVendorCities([...newVendorCities, city]);
                                    }
                                  }}
                                />
                                <span>{city}</span>
                              </label>
                            );
                          })}
                        </div>

                        {/* List of currently assigned cities */}
                        {newVendorCities.length > 0 && (
                          <div style={{ marginTop: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Assigned:</span>
                            <div className="dynamic-tag-list">
                              {newVendorCities.map(city => (
                                <span key={city} className="dynamic-tag">
                                  {city}
                                  <button
                                    type="button"
                                    className="dynamic-tag-remove"
                                    onClick={() => setNewVendorCities(newVendorCities.filter(c => c !== city))}
                                  >
                                    &times;
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {customCities.length === 0 && newVendorCities.length === 0 && (
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            No cities assigned. Add one using the input box above.
                          </div>
                        )}
                      </div>

                      <div className="form-row" style={{ marginTop: '20px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => {
                          setIsAddingVendor(false);
                          setSelectedVendorForEdit(null);
                          setNewVendorName('');
                          setNewVendorFirm('');
                          setNewVendorAddress('');
                          setNewVendorMobile('');
                          setNewVendorEmail('');
                          setNewVendorUser('');
                          setNewVendorPass('');
                          setNewVendorCities([]);
                        }}>
                          {t.cancel}
                        </button>
                        <button type="submit" className="btn btn-primary">
                          {selectedVendorForEdit 
                            ? (language === 'en' ? 'Save Changes' : 'बदलाव सुरक्षित करें') 
                            : (language === 'en' ? 'Create Account' : 'खाता बनाएं')}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Login popup Modal Overlay */}
          {isLoginModalOpen && (
            <div className="modal-overlay" onClick={() => setIsLoginModalOpen(false)} style={{ zIndex: 12000 }}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                <h3 className="form-title">🔑 {language === 'en' ? 'Account Login' : 'खाता लॉगिन'}</h3>
                <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">{language === 'en' ? 'Username' : 'उपयोगकर्ता नाम'}</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="Enter username"
                      value={loginUser}
                      onChange={(e) => setLoginUser(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{language === 'en' ? 'Password' : 'पासवर्ड'}</label>
                    <input
                      type="password"
                      className="form-input"
                      required
                      placeholder="••••••••"
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                    />
                  </div>
                  <div className="form-row" style={{ marginTop: '12px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setIsLoginModalOpen(false)}>
                      {t.cancel}
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {language === 'en' ? 'Submit' : 'जमा करें'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Visit Bottom-Drawer Modal */}
          {isAddingVisit && (
            <div className="modal-overlay" onClick={() => setIsAddingVisit(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3 className="form-title">{t.addNewClientVisit} ({activeCategory ? (t[activeCategory.toLowerCase() as keyof typeof t] || activeCategory) : ''})</h3>
                <form onSubmit={handleAddVisitSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Basic Visit info */}
                  <div className="section-card">
                    <div className="section-card-title">{t.schoolDetails}</div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="new-school-name">{t.clientSchoolName}</label>
                      <input
                        id="new-school-name"
                        type="text"
                        className="form-input"
                        placeholder="e.g. ABC School"
                        required
                        value={newSchoolName}
                        onChange={(e) => setNewSchoolName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="new-address">{t.address}</label>
                      <input
                        id="new-address"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Main Street Road"
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                      />
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group" style={{ position: 'relative' }}>
                        <label className="form-label" htmlFor="new-city">{t.city}</label>
                        <input
                          id="new-city"
                          type="text"
                          className="form-input"
                          placeholder="Select City"
                          readOnly
                          value={newCity}
                          onClick={() => setIsCityPickerOpen(true)}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="new-date">{t.visitDate}</label>
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

                    <div className="form-row">
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label" htmlFor="new-range">{t.range}</label>
                        <input
                          id="new-range"
                          type="text"
                          className="form-input"
                          placeholder={t.rangePlaceholder}
                          value={newRange}
                          onChange={(e) => setNewRange(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="new-notes">{t.notes}</label>
                      <textarea
                        id="new-notes"
                        className="form-input"
                        style={{ minHeight: '60px', resize: 'vertical' }}
                        placeholder="Initial notes..."
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Principal Details */}
                  <div className="section-card">
                    <div className="section-card-title">{language === 'en' ? 'Principal Details' : 'प्रिंसिपल का विवरण'}</div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="new-principal-name">{t.principalName}</label>
                      <input
                        id="new-principal-name"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Ramesh Kumar"
                        value={newPrincipalName}
                        onChange={(e) => setNewPrincipalName(e.target.value)}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label" htmlFor="new-principal-mobile">{t.principalMobile}</label>
                        <input
                          id="new-principal-mobile"
                          type="tel"
                          className="form-input"
                          placeholder="Principal mobile"
                          value={newPrincipalMobile}
                          onChange={(e) => setNewPrincipalMobile(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="new-principal-email">{t.principalEmail}</label>
                        <input
                          id="new-principal-email"
                          type="email"
                          className="form-input"
                          placeholder="Principal email"
                          value={newPrincipalEmail}
                          onChange={(e) => setNewPrincipalEmail(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Incharge Details */}
                  <div className="section-card">
                    <div className="section-card-title">{t.idInchargeDetails}</div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="new-incharge-name">{t.inchargeName}</label>
                      <input
                        id="new-incharge-name"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Amit Sen"
                        value={newInchargeName}
                        onChange={(e) => setNewInchargeName(e.target.value)}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label" htmlFor="new-incharge-mobile">{t.inchargeMobile}</label>
                        <input
                          id="new-incharge-mobile"
                          type="tel"
                          className="form-input"
                          placeholder="Incharge mobile"
                          value={newInchargeMobile}
                          onChange={(e) => setNewInchargeMobile(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="new-incharge-email">{t.inchargeEmail}</label>
                        <input
                          id="new-incharge-email"
                          type="email"
                          className="form-input"
                          placeholder="Incharge email"
                          value={newInchargeEmail}
                          onChange={(e) => setNewInchargeEmail(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Reception Details */}
                  <div className="section-card">
                    <div className="section-card-title">{t.receptionDetails}</div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="new-reception-name">{t.receptionName}</label>
                      <input
                        id="new-reception-name"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Priya Sharma"
                        value={newReceptionName}
                        onChange={(e) => setNewReceptionName(e.target.value)}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label" htmlFor="new-reception-mobile">{t.receptionMobile}</label>
                        <input
                          id="new-reception-mobile"
                          type="tel"
                          className="form-input"
                          placeholder="Reception mobile"
                          value={newReceptionMobile}
                          onChange={(e) => setNewReceptionMobile(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="new-reception-email">{t.receptionEmail}</label>
                        <input
                          id="new-reception-email"
                          type="email"
                          className="form-input"
                          placeholder="Reception email"
                          value={newReceptionEmail}
                          onChange={(e) => setNewReceptionEmail(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Classes & Card Types */}
                  <div className="section-card">
                    <div className="section-card-title">{t.classesCardTypes}</div>
                    <div className="form-row" style={{ marginBottom: '16px' }}>
                      <div className="form-group">
                        <label className="form-label" htmlFor="new-class-from">{t.fromClass}</label>
                        <select
                          id="new-class-from"
                          className="form-input"
                          value={newClassFrom}
                          onChange={(e) => setNewClassFrom(e.target.value)}
                        >
                          {['Nursery', 'LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'].map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="new-class-to">{t.toClass}</label>
                        <select
                          id="new-class-to"
                          className="form-input"
                          value={newClassTo}
                          onChange={(e) => setNewClassTo(e.target.value)}
                        >
                          {['Nursery', 'LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'].map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <label className="form-label" style={{ marginBottom: '8px' }}>{t.cardTypeRequired}</label>
                    <div className="checkbox-grid">
                      {['Student', 'Staff', 'Bus', 'Other'].map((type) => {
                        const isChecked = newCardTypes.includes(type);
                        return (
                          <label key={type} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setNewCardTypes(newCardTypes.filter((t) => t !== type));
                                } else {
                                  setNewCardTypes([...newCardTypes, type]);
                                }
                              }}
                            />
                            <span>{type === 'Student' ? t.student : type === 'Staff' ? t.staff : type === 'Bus' ? t.bus : type === 'Other' ? t.cardOther : type}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic Sections builder */}
                  <div className="section-card">
                    <div className="section-card-title">{t.sections}</div>
                    
                    {/* Yes/No switch for sections */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {language === 'en' ? 'Section Required?' : 'सेक्शन आवश्यक है?'}
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            width: 'auto',
                            padding: '6px 16px',
                            fontSize: '13px',
                            borderRadius: '12px',
                            backgroundColor: hasSections ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                            color: hasSections ? 'white' : 'var(--text-secondary)',
                            border: '1px solid var(--border-color)'
                          }}
                          onClick={() => setHasSections(true)}
                        >
                          {language === 'en' ? 'Yes' : 'हाँ'}
                        </button>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            width: 'auto',
                            padding: '6px 16px',
                            fontSize: '13px',
                            borderRadius: '12px',
                            backgroundColor: !hasSections ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                            color: !hasSections ? 'white' : 'var(--text-secondary)',
                            border: '1px solid var(--border-color)'
                          }}
                          onClick={() => setHasSections(false)}
                        >
                          {language === 'en' ? 'No' : 'नहीं'}
                        </button>
                      </div>
                    </div>

                    {hasSections && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Alphabet checklist buttons */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                          {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((sec) => {
                            const isChecked = newSections.includes(sec);
                            return (
                              <label key={sec} className="checkbox-label" style={{ padding: '8px', justifyContent: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setNewSections(newSections.filter(s => s !== sec));
                                    } else {
                                      setNewSections([...newSections, sec]);
                                    }
                                  }}
                                />
                                <span>{sec}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dynamic Houses builder */}
                  <div className="section-card">
                    <div className="section-card-title">{t.houses}</div>
                    
                    {/* Yes/No switch for houses */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {language === 'en' ? 'House Required?' : 'हाउस आवश्यक है?'}
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            width: 'auto',
                            padding: '6px 16px',
                            fontSize: '13px',
                            borderRadius: '12px',
                            backgroundColor: hasHouses ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                            color: hasHouses ? 'white' : 'var(--text-secondary)',
                            border: '1px solid var(--border-color)'
                          }}
                          onClick={() => setHasHouses(true)}
                        >
                          {language === 'en' ? 'Yes' : 'हाँ'}
                        </button>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            width: 'auto',
                            padding: '6px 16px',
                            fontSize: '13px',
                            borderRadius: '12px',
                            backgroundColor: !hasHouses ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                            color: !hasHouses ? 'white' : 'var(--text-secondary)',
                            border: '1px solid var(--border-color)'
                          }}
                          onClick={() => setHasHouses(false)}
                        >
                          {language === 'en' ? 'No' : 'नहीं'}
                        </button>
                      </div>
                    </div>

                    {hasHouses && (
                      <div className="dynamic-list-builder">
                        <div className="dynamic-tag-input-row">
                          <input
                            type="text"
                            className="form-input"
                            placeholder={t.addHousePlaceholder}
                            value={newHouseInput}
                            onChange={(e) => setNewHouseInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const trimmed = newHouseInput.trim();
                                if (trimmed && !newHouses.includes(trimmed)) {
                                  setNewHouses([...newHouses, trimmed]);
                                  setNewHouseInput('');
                                }
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ width: 'auto', padding: '12px 16px' }}
                            onClick={() => {
                              const trimmed = newHouseInput.trim();
                              if (trimmed && !newHouses.includes(trimmed)) {
                                setNewHouses([...newHouses, trimmed]);
                                setNewHouseInput('');
                              }
                            }}
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                        <div className="dynamic-tag-list">
                          {newHouses.map((house) => (
                            <span key={house} className="dynamic-tag">
                              {house}
                              <button
                                type="button"
                                  className="dynamic-tag-remove"
                                  onClick={() => setNewHouses(newHouses.filter((h) => h !== house))}
                                >
                                  &times;
                                </button>
                              </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Additional notes */}
                  <div className="section-card">
                    <div className="section-card-title">{t.additionalNotes}</div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <textarea
                        className="form-input"
                        style={{ minHeight: '100px', resize: 'vertical' }}
                        placeholder={t.additionalNotesPlaceholder}
                        value={newAdditionalNotes}
                        onChange={(e) => setNewAdditionalNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row" style={{ marginTop: '24px', marginBottom: '24px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setIsAddingVisit(false)}>
                      {t.cancel}
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {t.addClientVisit}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

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
        lang={language}
      />

      {/* City Picker Popup Modal */}
      {isCityPickerOpen && (
        <div className="modal-overlay" onClick={() => setIsCityPickerOpen(false)} style={{ zIndex: 11000 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h3 className="form-title">{language === 'en' ? 'Select City' : 'शहर चुनें'}</h3>
            
            {/* Added cities list */}
            <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {customCities.length > 0 ? (
                customCities.map((city) => (
                  <div key={city} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="reason-option"
                      style={{
                        flexGrow: 1,
                        backgroundColor: newCity === city ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        borderColor: newCity === city ? 'var(--primary)' : 'var(--border-color)',
                        color: newCity === city ? 'var(--primary)' : 'var(--text-primary)'
                      }}
                      onClick={() => {
                        setNewCity(city);
                        setIsCityPickerOpen(false);
                      }}
                    >
                      📍 {city}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ width: 'auto', padding: '12px 14px', borderRadius: '10px', height: '46px' }}
                      onClick={() => {
                        const updated = customCities.filter(c => c !== city);
                        setCustomCities(updated);
                        localStorage.setItem('customCities', JSON.stringify(updated));
                        if (newCity === city) setNewCity('');
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0', fontSize: '14px' }}>
                  {language === 'en' ? 'No cities added yet. Add one below!' : 'अभी तक कोई शहर नहीं जोड़ा गया। नीचे जोड़ें!'}
                </div>
              )}
            </div>

            {/* Add new custom city input form */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <span className="form-label">{language === 'en' ? 'Add Custom City' : 'कस्टम शहर जोड़ें'}</span>
              <div className="dynamic-tag-input-row" style={{ marginTop: '6px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Bilaspur"
                  value={newCityNameInput}
                  onChange={(e) => setNewCityNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const trimmed = newCityNameInput.trim();
                      if (trimmed && !customCities.includes(trimmed)) {
                        const updated = [...customCities, trimmed];
                        setCustomCities(updated);
                        localStorage.setItem('customCities', JSON.stringify(updated));
                        setNewCity(trimmed);
                        setNewCityNameInput('');
                        setIsCityPickerOpen(false);
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: 'auto', padding: '12px 16px' }}
                  onClick={() => {
                    const trimmed = newCityNameInput.trim();
                    if (trimmed && !customCities.includes(trimmed)) {
                      const updated = [...customCities, trimmed];
                      setCustomCities(updated);
                      localStorage.setItem('customCities', JSON.stringify(updated));
                      setNewCity(trimmed);
                      setNewCityNameInput('');
                      setIsCityPickerOpen(false);
                    }
                  }}
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" style={{ width: 'auto', padding: '10px 24px' }} onClick={() => setIsCityPickerOpen(false)}>
                {language === 'en' ? 'Close' : 'बंद करें'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Language Switcher Toggle */}
      <button
        className="lang-switcher-btn"
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 800,
          cursor: 'pointer',
          zIndex: 9999,
          transition: 'all 0.2s ease'
        }}
        onClick={() => changeLanguage(language === 'en' ? 'hi' : 'en')}
        title={language === 'en' ? 'Change language to Hindi' : 'भाषा बदलकर अंग्रेजी करें'}
      >
        {language === 'en' ? 'हि' : 'EN'}
      </button>
    </div>
  );
}
