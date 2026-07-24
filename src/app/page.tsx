'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Calendar, MapPin, Phone, Mail, BookOpen,
  Layers, Palette, Clipboard, CheckCircle2, AlertCircle,
  ChevronLeft, Edit, Wifi, WifiOff, School, AlertTriangle, BarChart3
} from 'lucide-react';
import { dbService, SchoolVisit, Vendor, getSessionForDate, getNextSession } from '@/lib/db';
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
  const [newSections, setNewSections] = useState<string[]>(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
  const [newHouses, setNewHouses] = useState<string[]>([]);

  const [hasSections, setHasSections] = useState<boolean>(false);
  const [hasHouses, setHasHouses] = useState<boolean>(false);

  const [newSectionInput, setNewSectionInput] = useState('');
  const [newHouseInput, setNewHouseInput] = useState('');
  const [newAdditionalNotes, setNewAdditionalNotes] = useState('');
  const [newStatus, setNewStatus] = useState<'Pending' | 'Approved' | 'Rejected' | 'FollowUp'>('Pending');
  const [newRejectionReason, setNewRejectionReason] = useState('');
  const [newFollowUpDate, setNewFollowUpDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [newFollowUpNotes, setNewFollowUpNotes] = useState('');

  // City picker states
  const [customCities, setCustomCities] = useState<string[]>([]);
  const [isCityPickerOpen, setIsCityPickerOpen] = useState(false);
  const [newCityNameInput, setNewCityNameInput] = useState('');

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'FollowUp' | 'Approved' | 'Rejected'>('All');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('All');
  const [isUserFilterOpen, setIsUserFilterOpen] = useState<boolean>(false);

  // Academic Session Management States
  const currentAutomaticSession = useMemo(() => getSessionForDate(), []);
    const [customSessions, setCustomSessions] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('acl_custom_sessions');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [];
  });

  const [selectedSession, setSelectedSession] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('acl_selected_session');
      if (saved && saved !== '2027-2028' && saved !== '2027-28') return saved;
    }
    return '2026-2027';
  });
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState<boolean>(false);
  const [transferModalVisit, setTransferModalVisit] = useState<SchoolVisit | null>(null);
  

  const handleSelectSession = (sessionStr: string) => {
    setSelectedSession(sessionStr);
    if (typeof window !== 'undefined') {
      localStorage.setItem('acl_selected_session', sessionStr);
    }
  };

  // Vendor / Salesman Management States
  const [vendors, setVendors] = useState<Vendor[]>([]);

  // Compute available sessions list
  const availableSessions = useMemo(() => {
    const sessionSet = new Set<string>();
    sessionSet.add('2026-2027');
    customSessions.forEach(s => sessionSet.add(s));
    visits.forEach(v => {
      const s = v.session || getSessionForDate(v.visitDate);
      if (s) sessionSet.add(s);
    });
    return Array.from(sessionSet).sort().reverse();
  }, [visits, customSessions]);

  // Compute available users/vendors list
  const availableUsers = useMemo(() => {
    const userSet = new Set<string>();
    userSet.add('Admin');
    userSet.add('All');
    vendors.forEach(v => {
      if (v.name) userSet.add(v.name);
    });
    visits.forEach(v => {
      if (v.createdByVendorName && v.createdByVendorName !== 'Admin' && v.createdByVendorName !== 'एडमिन') {
        userSet.add(v.createdByVendorName);
      }
    });
    return Array.from(userSet);
  }, [vendors, visits]);
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
  const [expandedCards, setExpandedCards] = useState<string[]>([]);

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

      setSelectedVisit(null);
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

  const handleAddNewSessionPrompt = async () => {
    const input = window.prompt(
      language === 'en'
        ? 'Enter new Academic Session (e.g. 2027-2028):'
        : 'नया शैक्षणिक सत्र दर्ज करें (उदा. 2027-2028):',
      '2027-2028'
    );
    if (!input || !input.trim()) return;
    const newSess = input.trim();

    if (!customSessions.includes(newSess)) {
      const updated = [...customSessions, newSess];
      setCustomSessions(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('acl_custom_sessions', JSON.stringify(updated));
      }
    }

    handleSelectSession(newSess);
    setIsSessionDropdownOpen(false);
  };

  // Load vendors list
  const loadVendors = async () => {
    try {
      const data = await dbService.getVendors();
      setVendors(data);
    } catch (e) {
      console.error(e);
    }
  };

  
  // Back button (Android / Chrome browser history) interceptor to prevent closing website
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isAnyOverlayActive =
      isAddingVisit ||
      !!selectedVisit ||
      isApproving ||
      isRejecting ||
      isSchedulingFollowUp ||
      !!transferModalVisit ||
      isAddingVendor ||
      isLoginModalOpen ||
      isCityPickerOpen ||
      isUserFilterOpen ||
      isSessionDropdownOpen ||
      !!activeCategory ||
      currentTab !== 'dashboard';

    if (isAnyOverlayActive) {
      window.history.pushState({ modalOpen: true }, '');
    }

    const handlePopState = () => {
      if (isCityPickerOpen) {
        setIsCityPickerOpen(false);
        return;
      }
      if (isUserFilterOpen) {
        setIsUserFilterOpen(false);
        return;
      }
      if (isSessionDropdownOpen) {
        setIsSessionDropdownOpen(false);
        return;
      }
      if (transferModalVisit) {
        setTransferModalVisit(null);
        return;
      }
      if (isAddingVisit) {
        setIsAddingVisit(false);
        return;
      }
      if (isApproving) {
        setIsApproving(false);
        return;
      }
      if (isRejecting) {
        setIsRejecting(false);
        return;
      }
      if (isSchedulingFollowUp) {
        setIsSchedulingFollowUp(false);
        return;
      }
      if (selectedVisit) {
        setSelectedVisit(null);
        return;
      }
      if (isAddingVendor) {
        setIsAddingVendor(false);
        return;
      }
      if (isLoginModalOpen) {
        setIsLoginModalOpen(false);
        return;
      }
      if (activeCategory) {
        setActiveCategory(null);
        return;
      }
      if (currentTab !== 'dashboard') {
        setTab('dashboard');
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [
    isAddingVisit,
    selectedVisit,
    isApproving,
    isRejecting,
    isSchedulingFollowUp,
    transferModalVisit,
    isAddingVendor,
    isLoginModalOpen,
    isCityPickerOpen,
    isUserFilterOpen,
    isSessionDropdownOpen,
    activeCategory,
    currentTab
  ]);

  useEffect(() => {
    loadVisits();
    loadVendors();
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('customCities');
      if (stored) {
        try {
          setCustomCities(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }

      const cachedVendor = localStorage.getItem('currentVendor');
      if (cachedVendor) {
        try {
          const parsed = JSON.parse(cachedVendor);
          setCurrentVendor(parsed);
          setIsAdminMode(false);
        } catch (e) {
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
      session: selectedSession,
      notes: newNotes.trim() || undefined,
      range: newRange.trim() || undefined,
      status: newStatus,
      rejectionReason: newStatus === 'Rejected' ? newRejectionReason : undefined,
      followUpDate: newStatus === 'FollowUp' ? newFollowUpDate : undefined,
      followUpNotes: newStatus === 'FollowUp' ? newFollowUpNotes : undefined,
      followUpAction: newStatus === 'FollowUp' ? newFollowUpNotes : undefined,
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
      setNewStatus('Pending');
      setNewRejectionReason('');
      setNewFollowUpDate(new Date().toISOString().split('T')[0]);
      setNewFollowUpNotes('');

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
    } catch (e) {
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
    localStorage.removeItem('site_authenticated');
    alert('Logged out from session.');
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
      setSelectedVisit(null);
      setIsRejecting(false);
      setTimeout(() => setSyncStatus('synced'), 800);
    } catch (e) {
      console.error('Error updating visit (rejection):', e);
      setSyncStatus('synced');
    }
  };

  // Approve and form fill save handler
    const handleDirectConfirm = async (visit: SchoolVisit) => {
    const confirmMsg = language === 'en'
      ? `Are you sure you want to confirm client "${visit.schoolName}"?`
      : `क्या आप वाकई ग्राहक "${visit.schoolName}" की पुष्टि करना चाहते हैं?`;
    if (window.confirm(confirmMsg)) {
      setSyncStatus('syncing');
      try {
        await dbService.updateVisit(visit.id, { status: 'Approved' });
        setVisits((prev) =>
          prev.map((v) => (v.id === visit.id ? { ...v, status: 'Approved', updatedAt: new Date().toISOString() } : v))
        );
        setTimeout(() => setSyncStatus('synced'), 800);
      } catch (e) {
        console.error('Error confirming visit:', e);
        setSyncStatus('synced');
      }
    }
  };

  const handleMoveToPending = async (visit: SchoolVisit) => {
    const confirmMsg = language === 'en'
      ? `Are you sure you want to move client "${visit.schoolName}" back to Pending?`
      : `क्या आप वाकई ग्राहक "${visit.schoolName}" को वापस लंबित (Pending) में बदलना चाहते हैं?`;
    if (window.confirm(confirmMsg)) {
      setSyncStatus('syncing');
      try {
        await dbService.updateVisit(visit.id, { status: 'Pending' });
        setVisits((prev) =>
          prev.map((v) => (v.id === visit.id ? { ...v, status: 'Pending', updatedAt: new Date().toISOString() } : v))
        );
        setTimeout(() => setSyncStatus('synced'), 800);
      } catch (e) {
        console.error('Error moving visit to pending:', e);
        setSyncStatus('synced');
      }
    }
  };

      const handleDeleteSession = async (sessionToDelete: string) => {
    const confirmMsg = language === 'en'
      ? `Are you sure you want to delete session "${sessionToDelete}" and ALL client records in this session?`
      : `क्या आप वाकई सत्र "${sessionToDelete}" और इस सत्र के सभी ग्राहक रिकॉर्ड हटाना चाहते हैं?`;

    if (window.confirm(confirmMsg)) {
      setSyncStatus('syncing');
      try {
        await dbService.deleteSessionVisits(sessionToDelete);
        const updatedCustom = customSessions.filter((s) => s !== sessionToDelete);
        setCustomSessions(updatedCustom);
        if (typeof window !== 'undefined') {
          localStorage.setItem('acl_custom_sessions', JSON.stringify(updatedCustom));
        }
        setVisits((prev) => prev.filter((v) => (v.session || getSessionForDate(v.visitDate)) !== sessionToDelete));

        if (selectedSession === sessionToDelete) {
          handleSelectSession('2026-2027');
        }

        setTimeout(() => setSyncStatus('synced'), 800);
        alert(
          language === 'en'
            ? `Session "${sessionToDelete}" deleted successfully!`
            : `सत्र "${sessionToDelete}" सफलतापूर्वक हटा दिया गया!`
        );
      } catch (e) {
        console.error('Failed to delete session:', e);
        setSyncStatus('synced');
      }
    }
  };

  const handleCopyToTargetSession = async (visit: SchoolVisit, targetSession: string) => {
    const confirmMsg = language === 'en'
      ? `Copy client "${visit.schoolName || 'N/A'}" (School Name, Contact & Strength) to Session (${targetSession})?`
      : `क्या आप ग्राहक "${visit.schoolName || 'N/A'}" (स्कूल नाम, संपर्क और स्ट्रेंथ) को सत्र (${targetSession}) में कॉपी करना चाहते हैं?`;

    if (window.confirm(confirmMsg)) {
      setSyncStatus('syncing');
      try {
        const todayDate = new Date().toISOString().split('T')[0];

        const newVisitData: Omit<SchoolVisit, 'id'> = {
          schoolName: visit.schoolName || '',
          city: visit.city || '',
          address: visit.address || '',
          range: visit.range || '',
          contactPersonName: visit.contactPersonName || visit.schoolDetails?.principalName || '',
          contactPhone: visit.contactPhone || visit.schoolDetails?.principalMobile || '',
          contactEmail: visit.contactEmail || '',
          schoolDetails: visit.schoolDetails,
          idIncharge: visit.idIncharge,
          reception: visit.reception,
          classes: visit.classes,
          cardTypes: visit.cardTypes,
          category: visit.category || 'School',
          visitDate: todayDate,
          session: targetSession,
          status: 'Pending',
          createdByVendorId: visit.createdByVendorId,
          createdByVendorName: visit.createdByVendorName,
          notes: visit.notes ? `Transferred from session ${visit.session || '2026-2027'}. ${visit.notes}` : `Transferred from session ${visit.session || '2026-2027'}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const createdVisit = await dbService.saveVisit(newVisitData);
        setVisits((prev) => [createdVisit, ...prev]);

        if (!customSessions.includes(targetSession)) {
          const updatedCustom = [...customSessions, targetSession];
          setCustomSessions(updatedCustom);
          if (typeof window !== 'undefined') {
            localStorage.setItem('acl_custom_sessions', JSON.stringify(updatedCustom));
          }
        }

        setTransferModalVisit(null);
        setTimeout(() => setSyncStatus('synced'), 800);

        const successMsg = language === 'en'
          ? `Client "${visit.schoolName || 'N/A'}" successfully copied to session ${targetSession}!`
          : `ग्राहक "${visit.schoolName || 'N/A'}" को सफलतापूर्वक सत्र ${targetSession} में कॉपी किया गया!`;
        alert(successMsg);
      } catch (e) {
        console.error('Error copying visit to target session:', e);
        setSyncStatus('synced');
        alert(language === 'en' ? 'Failed to copy client.' : 'कॉपी करने में विफल।');
      }
    }
  };

  const handleTransferToNextSession = async (visit: SchoolVisit) => {
    const currentCardSession = visit.session || getSessionForDate(visit.visitDate);
    const nextSession = getNextSession(currentCardSession);

    const confirmMsg = language === 'en'
      ? `Transfer client "${visit.schoolName || 'N/A'}" (School Name, Contact & Strength) to Next Session (${nextSession})?`
      : `क्या आप ग्राहक "${visit.schoolName || 'N/A'}" (स्कूल नाम, संपर्क और स्ट्रेंथ) को अगले सत्र (${nextSession}) में भेजना चाहते हैं?`;

    if (window.confirm(confirmMsg)) {
      setSyncStatus('syncing');
      try {
        const todayDate = new Date().toISOString().split('T')[0];

        const newVisitData: Omit<SchoolVisit, 'id'> = {
          schoolName: visit.schoolName || '',
          city: visit.city || '',
          address: visit.address || '',
          range: visit.range || '',
          contactPersonName: visit.contactPersonName || visit.schoolDetails?.principalName || '',
          contactPhone: visit.contactPhone || visit.schoolDetails?.principalMobile || '',
          contactEmail: visit.contactEmail || '',
          schoolDetails: visit.schoolDetails,
          idIncharge: visit.idIncharge,
          reception: visit.reception,
          classes: visit.classes,
          cardTypes: visit.cardTypes,
          category: visit.category || 'School',
          visitDate: todayDate,
          session: nextSession,
          status: 'Pending',
          createdByVendorId: visit.createdByVendorId,
          createdByVendorName: visit.createdByVendorName,
          notes: visit.notes ? `Transferred from session ${currentCardSession}. ${visit.notes}` : `Transferred from session ${currentCardSession}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const createdVisit = await dbService.saveVisit(newVisitData);
        setVisits((prev) => [createdVisit, ...prev]);
        setTimeout(() => setSyncStatus('synced'), 800);

        const successMsg = language === 'en'
          ? `Client "${visit.schoolName || 'N/A'}" successfully transferred to session ${nextSession}!`
          : `ग्राहक "${visit.schoolName || 'N/A'}" को सफलतापूर्वक सत्र ${nextSession} में भेजा गया!`;
        alert(successMsg);
      } catch (e) {
        console.error('Error transferring visit to next session:', e);
        setSyncStatus('synced');
        alert(language === 'en' ? 'Failed to transfer client.' : 'स्थानांतरित करने में विफल।');
      }
    }
  };

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
      setSelectedVisit(null);
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

  // Filter visits by session and vendor assigned cities
  const visibleVisits = visits.filter((v) => {
    // 0. Filter by selected Academic Session
    const visitSession = v.session || getSessionForDate(v.visitDate);
    if (visitSession !== selectedSession) return false;

    if (!isAdminMode && currentVendor) {
      // 1. If visit was created by this vendor, they can see it
      if (v.createdByVendorId === currentVendor.id) {
        return true;
      }

      // 2. If it was created by admin or someone else: they only see it if it belongs to their allowed assigned cities AND was NOT explicitly created by another vendor (unless city matches)
      if (!v.city) return false;
      const lowerCity = v.city.trim().toLowerCase();
      const allowedLowers = currentVendor.allowedCities.map(c => c.trim().toLowerCase());
      const isCityMatched = allowedLowers.includes(lowerCity);

      // If city matches, show it. Otherwise, hide it.
      return isCityMatched;
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

    // 0.5 Filter by selected User/Vendor
    if (selectedUserFilter !== 'All') {
      if (selectedUserFilter === 'Admin') {
        const isCreatedByAdmin = !v.createdByVendorName || v.createdByVendorName === 'Admin' || v.createdByVendorName === 'एडमिन';
        if (!isCreatedByAdmin) return false;
      } else {
        const isMatchedVendor = v.createdByVendorName === selectedUserFilter || v.createdByVendorId === selectedUserFilter;
        if (!isMatchedVendor) return false;
      }
    }

    // 1. Search Query filter (matches School Name, Principal, Status, City, Range, or Vendor)
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      v.schoolName.toLowerCase().includes(query) ||
      (v.schoolDetails?.principalName && v.schoolDetails.principalName.toLowerCase().includes(query)) ||
      v.status.toLowerCase().includes(query) ||
      (v.range && v.range.toLowerCase().includes(query)) ||
      (v.city && v.city.toLowerCase().includes(query)) ||
      (v.createdByVendorName && v.createdByVendorName.toLowerCase().includes(query)) ||
      (!v.createdByVendorName && ('admin'.includes(query) || 'एडमिन'.includes(query)));

    // 2. Status Tab Filter
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && v.status === statusFilter;
  });

  const approvedList = visibleVisits.filter((v) => {
    if (v.status !== 'Approved') return false;
    if (activeCategory && v.category !== activeCategory) return false;
    if (selectedUserFilter !== 'All') {
      if (selectedUserFilter === 'Admin') {
        const isCreatedByAdmin = !v.createdByVendorName || v.createdByVendorName === 'Admin' || v.createdByVendorName === 'एडमिन';
        if (!isCreatedByAdmin) return false;
      } else {
        const isMatchedVendor = v.createdByVendorName === selectedUserFilter || v.createdByVendorId === selectedUserFilter;
        if (!isMatchedVendor) return false;
      }
    }
    const query = searchQuery.toLowerCase().trim();
    return (
      v.schoolName.toLowerCase().includes(query) ||
      (v.schoolDetails?.principalName && v.schoolDetails.principalName.toLowerCase().includes(query)) ||
      (v.range && v.range.toLowerCase().includes(query)) ||
      (v.city && v.city.toLowerCase().includes(query)) ||
      (v.createdByVendorName && v.createdByVendorName.toLowerCase().includes(query)) ||
      (!v.createdByVendorName && ('admin'.includes(query) || 'एडमिन'.includes(query)))
    );
  });

  return (
    <div className="app-shell">
      {/* App Header */}
      <header className="app-header">
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="app-title"
              style={{ cursor: 'pointer' }}
              onClick={() => { setTab('dashboard'); setSearchQuery(''); setSelectedVisit(null); }}
            >
              Market Manager
            </span>

            {/* Session Button Right to ACL ID Manage */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  backgroundColor: 'rgba(79, 70, 229, 0.15)',
                  color: 'var(--primary)',
                  border: '1px solid rgba(79, 70, 229, 0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <span>📅 {selectedSession}</span>
                <span style={{ fontSize: '9px' }}>▼</span>
              </button>

              {isSessionDropdownOpen && (
                <>
                  <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
                    onClick={() => setIsSessionDropdownOpen(false)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '110%',
                      left: 0,
                      zIndex: 100,
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                      minWidth: '170px',
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}
                  >
                    <div style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Academic Session
                    </div>
                    {availableSessions.map((sess) => (
                      <div
                        key={sess}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          backgroundColor: selectedSession === sess ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                          color: selectedSession === sess ? 'var(--primary)' : 'var(--text-primary)',
                        }}
                      >
                        <button
                          onClick={() => {
                            handleSelectSession(sess);
                            setIsSessionDropdownOpen(false);
                          }}
                          style={{
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: selectedSession === sess ? 700 : 500,
                            backgroundColor: 'transparent',
                            color: 'inherit',
                            border: 'none',
                            cursor: 'pointer',
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>📅 {sess}</span>
                          {sess === currentAutomaticSession && (
                            <span style={{ fontSize: '9px', backgroundColor: '#d1fae5', color: '#047857', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                              Active
                            </span>
                          )}
                        </button>
                        {isAdminMode && sess !== '2026-2027' && (
                          <button
                            type="button"
                            title={language === 'en' ? 'Delete session' : 'सत्र हटाएं'}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(sess);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              fontSize: '13px',
                              cursor: 'pointer',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '4px', paddingTop: '4px' }}>
                      <button
                        onClick={() => {
                          handleAddNewSessionPrompt();
                          setIsSessionDropdownOpen(false);
                        }}
                        style={{
                          textAlign: 'left',
                          padding: '8px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--primary)',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        ➕ Add Future Session
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

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
      {selectedVisit && !isApproving && !isRejecting && !isSchedulingFollowUp ? (
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
              onClick={() => { handleDeleteVisit(selectedVisit.id); setSelectedVisit(null); }}
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
              <span className={`badge ${selectedVisit.status === 'Approved'
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
                  {language === 'en' ? 'Total Strength' : 'कुल संख्या'}: {selectedVisit.range}
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
                    onClick={() => { handleApproveSave({ status: 'Approved' }); setSelectedVisit(null); }}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsApproving(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.05)'
                  }}
                  aria-label="Back"
                >
                  <ChevronLeft size={20} />
                </button>
                <h3 className="form-title" style={{ margin: 0 }}>{t.clientRegistrationForm}</h3>
              </div>
              <ApprovalForm
                visit={selectedVisit}
                onSave={(data) => { handleApproveSave(data); setSelectedVisit(null); }}
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
                    onClick={() => { handleApproveSave({ status: 'Approved' }); setSelectedVisit(null); }}
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
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '4px', paddingRight: '4px', marginBottom: '2px' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#000000', margin: 0, fontFamily: 'serif' }}>
                    {!isAdminMode && currentVendor ? 'Dashboard' : 'Admin Dashbord'}
                  </h1>
                  {(isAdminMode || !currentVendor) && (
                    <button className="admin-header-button" onClick={() => { setActiveCategory(null); setTab('admin'); setStatusFilter('All'); setSearchQuery(''); }}>
                      {t.adminLabel}
                    </button>
                  )}
                </div>

                <div className="bubble-grid-3x2">
                  <button
                    className="bubble-small"
                    onClick={() => {
                      setActiveCategory(null);
                      setSelectedUserFilter('All');
                      setTab('visits');
                      setStatusFilter('All');
                      setSearchQuery('');
                    }}
                  >
                    <span className="bubble-small-title">{t.totalClient}</span>
                    <span className="bubble-small-value">{totalVisits}</span>
                  </button>

                  <button
                    className="bubble-small"
                    onClick={() => {
                      setActiveCategory(null);
                      setSelectedUserFilter('Admin');
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
                      setSelectedUserFilter('Admin');
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
                      setSelectedUserFilter('Admin');
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
                      setSelectedUserFilter('Admin');
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
                      setSelectedUserFilter('Admin');
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
                        setSelectedUserFilter('Admin');
                        setTab('visits');
                        setStatusFilter('All');
                        setSearchQuery('');
                      }}
                    >
                      <div className="category-card-icon-container">
                        <img src={cat.icon} alt={cat.title} />
                      </div>
                      <span className="category-card-title">
                        {t[cat.key.toLowerCase() as keyof typeof t] || cat.key}
                      </span>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-danger"
                    style={{
                      width: 'auto',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: 700,
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                      cursor: 'pointer'
                    }}
                    onClick={() => { setTab('dashboard'); setSearchQuery(''); setActiveCategory(null); }}
                  >
                    ← {t.back}
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* User/Vendor Filter Dropdown to the LEFT of School List */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setIsUserFilterOpen(!isUserFilterOpen)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 10px',
                          fontSize: '12px',
                          fontWeight: 700,
                          backgroundColor: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)'
                        }}
                      >
                        <span>👤 {selectedUserFilter === 'All' ? 'All Users' : selectedUserFilter}</span>
                        <span style={{ fontSize: '9px' }}>▼</span>
                      </button>

                      {isUserFilterOpen && (
                        <>
                          <div
                            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
                            onClick={() => setIsUserFilterOpen(false)}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              top: '110%',
                              left: 0,
                              zIndex: 100,
                              backgroundColor: 'var(--bg-card)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '12px',
                              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                              minWidth: '140px',
                              padding: '6px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px'
                            }}
                          >
                            {availableUsers.map((userName) => (
                              <button
                                key={userName}
                                onClick={() => {
                                  setSelectedUserFilter(userName);
                                  setIsUserFilterOpen(false);
                                }}
                                style={{
                                  textAlign: 'left',
                                  padding: '8px 12px',
                                  fontSize: '12px',
                                  fontWeight: selectedUserFilter === userName ? 700 : 500,
                                  backgroundColor: selectedUserFilter === userName ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                                  color: selectedUserFilter === userName ? 'var(--primary)' : 'var(--text-primary)',
                                  border: 'none',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  width: '100%'
                                }}
                              >
                                👤 {userName === 'All' ? 'All Users' : userName}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* School List / Category List Header */}
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                      {activeCategory ? `${t[activeCategory.toLowerCase() as keyof typeof t] || activeCategory} List` : 'School List'}
                    </h3>
                  </div>
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
                  {filteredVisits.map((visit) => {
                    const isExpanded = expandedCards.includes(visit.id);
                    const toggleExpandCard = (id: string) => {
                      setExpandedCards((prev) =>
                        prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
                      );
                    };

                    return (
                      <div
                        key={visit.id}
                        className={`visit-card card-${visit.status.toLowerCase()}`}
                      >
                        <div
                          className="visit-card-header"
                          style={{ display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' }}
                          onClick={() => toggleExpandCard(visit.id)}
                        >
                          {/* Top Row: Down Arrow, Title & Status Badge */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                fontSize: '14px',
                                color: '#38bdf8',
                                transition: 'transform 0.2s',
                                display: 'inline-block',
                                transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                                padding: '4px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(56, 189, 248, 0.1)'
                              }}>
                                ▼
                              </span>
                              <span className="visit-card-name" style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)' }}>
                                {visit.schoolName || 'N/A'}
                              </span>
                            </div>
                            <span className={`badge ${visit.status === 'Approved'
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

                          {/* Info Badges Row: City Name & Total Strength */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
                            {visit.city && (
                              <span style={{ fontWeight: 800, color: '#1e40af', backgroundColor: 'rgba(30, 64, 175, 0.15)', padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(30, 64, 175, 0.25)' }}>
                                📍 {visit.city}
                              </span>
                            )}
                            <span style={{ fontWeight: 700, color: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.12)', padding: '2px 8px', borderRadius: '6px' }}>
                              📏 Total Strength: {visit.range || 'N/A'}
                            </span>
                          </div>

                          {/* Contact Person & Call Button Row */}
                          {(() => {
                            const mobile = visit.schoolDetails?.principalMobile || visit.idIncharge?.mobile || visit.reception?.mobile;
                            const contactName = visit.schoolDetails?.principalName || visit.idIncharge?.name || visit.reception?.name;
                            return (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>
                                  👤 {contactName || (language === 'en' ? 'Contact Person' : 'संपर्क व्यक्ति')}: <span style={{ color: 'var(--text-secondary)' }}>{mobile || 'N/A'}</span>
                                </span>
                                {mobile ? (
                                  <a
                                    href={`tel:${mobile}`}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      backgroundColor: '#10b981',
                                      color: 'white',
                                      padding: '4px 12px',
                                      borderRadius: '8px',
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      textDecoration: 'none',
                                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                                    }}
                                  >
                                    📞 {language === 'en' ? 'Call' : 'कॉल करें'}
                                  </a>
                                ) : (
                                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No mobile</span>
                                )}
                              </div>
                            );
                          })()}

                          {/* Additional Message (with no "Message:" label, just the string) */}
                          {(() => {
                            const noteContent = [visit.additionalNotes, visit.notes, visit.followUpNotes].filter(Boolean).join(' • ');
                            return noteContent ? (
                              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '6px', borderLeft: '3px solid var(--primary)' }}>
                                📝 "{noteContent}"
                              </div>
                            ) : null;
                          })()}
                        </div>
                        {isExpanded && (
                          <div className="visit-card-details" style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }} onClick={(e) => e.stopPropagation()}>
                            {/* Contact Action call triggers */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {visit.schoolDetails?.principalName && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                  <span>
                                    Principal: <strong>{visit.schoolDetails.principalName}</strong>
                                    {visit.schoolDetails.principalMobile && (
                                      <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>({visit.schoolDetails.principalMobile})</span>
                                    )}
                                  </span>
                                  {visit.schoolDetails.principalMobile && (
                                    <a
                                      href={`tel:${visit.schoolDetails.principalMobile}`}
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--approved)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}
                                    >
                                      📞 Call
                                    </a>
                                  )}
                                </div>
                              )}

                              {visit.idIncharge?.name && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                  <span>
                                    Incharge: <strong>{visit.idIncharge.name}</strong>
                                    {visit.idIncharge.mobile && (
                                      <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>({visit.idIncharge.mobile})</span>
                                    )}
                                  </span>
                                  {visit.idIncharge.mobile && (
                                    <a
                                      href={`tel:${visit.idIncharge.mobile}`}
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}
                                    >
                                      📞 Call
                                    </a>
                                  )}
                                </div>
                              )}

                              {visit.reception?.name && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                  <span>
                                    Reception: <strong>{visit.reception.name}</strong>
                                    {visit.reception.mobile && (
                                      <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>({visit.reception.mobile})</span>
                                    )}
                                  </span>
                                  {visit.reception.mobile && (
                                    <a
                                      href={`tel:${visit.reception.mobile}`}
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}
                                    >
                                      📞 Call
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* City and date details */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                              {visit.city && <div style={{ fontSize: '15px', fontWeight: 800, color: '#1e40af' }}>📍 City: {visit.city}</div>}
                              <div>📅 Visit Date: {formatDate(visit.visitDate)}</div>
                              <div>📏 Total Strength: {visit.range || 'N/A'}</div>
                              
                              {visit.classes && (
                                <div>🏫 Classes: {visit.classes.from} to {visit.classes.to}</div>
                              )}
                              {visit.cardTypes && visit.cardTypes.length > 0 && (
                                <div>🪪 Card Types: {visit.cardTypes.join(', ')}</div>
                              )}
                              {visit.sections && visit.sections.length > 0 && (
                                <div>🗂️ Sections: {visit.sections.join(', ')}</div>
                              )}
                              {visit.houses && visit.houses.length > 0 && (
                                <div>🏠 Houses: {visit.houses.join(', ')}</div>
                              )}

                              {visit.status === 'Rejected' && visit.rejectionReason && (
                                <div style={{ color: 'var(--rejected)', fontWeight: 500 }}>Reason: {visit.rejectionReason}</div>
                              )}
                              {visit.status === 'FollowUp' && visit.followUpDate && (
                                <div style={{ color: 'var(--followup)', fontWeight: 500 }}>Action: {visit.followUpAction} ({formatDate(visit.followUpDate)})</div>
                              )}
                            </div>

                            {/* Action Buttons directly in card */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '10px', marginTop: '8px' }}>
                              
                              {/* Row 1: Decline vs Confirm/Pending button */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedVisit(visit);
                                    setIsRejecting(true);
                                  }}
                                  style={{ height: '36px', fontSize: '12px', fontWeight: 600, padding: '0 8px', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                  ❌ {t.decline}
                                </button>

                                {visit.status === 'Approved' ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveToPending(visit);
                                    }}
                                    style={{ height: '36px', fontSize: '12px', fontWeight: 600, padding: '0 8px', backgroundColor: '#eab308', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                  >
                                    🟡 {language === 'en' ? 'Move to Pending' : 'लंबित में बदलें'}
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDirectConfirm(visit);
                                    }}
                                    style={{ height: '36px', fontSize: '12px', fontWeight: 600, padding: '0 8px', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                  >
                                    ✅ {t.confirmClient}
                                  </button>
                                )}
                              </div>

                              {/* Row 2: Follow-Up vs Edit */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedVisit(visit);
                                    setIsSchedulingFollowUp(true);
                                  }}
                                  style={{ height: '36px', fontSize: '12px', fontWeight: 600, padding: '0 8px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                  ⏰ {visit.status === 'FollowUp' ? (language === 'en' ? 'Reschedule' : 'रीशेड्यूल') : (language === 'en' ? 'Follow-Up' : 'फॉलो-अप')}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedVisit(visit);
                                    setIsApproving(true);
                                  }}
                                  style={{ height: '36px', fontSize: '12px', fontWeight: 600, padding: '0 8px', backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                  ✏️ {language === 'en' ? 'Edit' : 'संपादित करें'}
                                </button>
                              </div>

                              {/* Row 3: Move to Next Session & Delete (Admin Mode) */}
                              {isAdminMode && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTransferModalVisit(visit);
                                    }}
                                    style={{ height: '36px', fontSize: '12px', fontWeight: 600, padding: '0 8px', width: '100%', backgroundColor: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818cf8', borderRadius: '8px', cursor: 'pointer' }}
                                  >
                                    🚀 {language === 'en' 
                                      ? `Move to Session...` 
                                      : `सत्र में भेजें...`}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm(language === 'en' ? 'Are you sure you want to delete this client?' : 'क्या आप वाकई इस ग्राहक को हटाना चाहते हैं?')) {
                                        handleDeleteVisit(visit.id);
                                      }
                                    }}
                                    style={{ height: '36px', fontSize: '12px', fontWeight: 600, padding: '0 8px', width: '100%', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '8px', cursor: 'pointer' }}
                                  >
                                    🗑️ {language === 'en' ? 'Delete' : 'हटाएं'}
                                  </button>
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px', marginTop: '8px' }}>
                              {visit.createdByVendorName ? (
                                <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                                  👤 Created by: {visit.createdByVendorName}
                                </span>
                              ) : (
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>👤 Created by: Admin</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span>Add</span>
                    <span>New</span>
                  </div>
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
                    className="btn btn-danger"
                    style={{
                      width: 'auto',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: 700,
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                      cursor: 'pointer'
                    }}
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
                  {approvedList.map((visit) => {
                    const isExpanded = expandedCards.includes(visit.id);
                    return (
                      <div
                        key={visit.id}
                        className={`visit-card card-${visit.status.toLowerCase()}`}
                        onClick={() => {
                          if (isExpanded) {
                            setExpandedCards(expandedCards.filter(id => id !== visit.id));
                          } else {
                            setExpandedCards([...expandedCards, visit.id]);
                          }
                        }}
                      >
                        <div className="visit-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="visit-card-name" style={{ fontWeight: 700, fontSize: '15px' }}>
                              {visit.schoolName.length > 30 ? visit.schoolName.substring(0, 30) + '...' : visit.schoolName}
                            </span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '2px' }}>
                              {visit.city && (
                                <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-secondary)' }}>
                                  📍 {visit.city}
                                </span>
                              )}
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                👤 {visit.createdByVendorName || (language === 'en' ? 'Admin' : 'एडमिन')}
                              </span>
                            </div>
                            {(() => {
                              const noteContent = [visit.notes, visit.additionalNotes, visit.followUpNotes].filter(Boolean).join(' • ');
                              return noteContent ? (
                                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                                  <span>📝</span>
                                  <span>"{noteContent}"</span>
                                </div>
                              ) : null;
                            })()}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span className="badge badge-approved">Approved ✅</span>
                            <span style={{ fontSize: '18px', transition: 'transform 0.2s', display: 'inline-block', transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                              ▼
                            </span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="visit-card-details" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }} onClick={(e) => e.stopPropagation()}>
                            {visit.schoolDetails?.principalName && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                <div>
                                  <span style={{ color: 'var(--text-secondary)' }}>Principal: </span>
                                  <strong style={{ color: 'var(--text-primary)' }}>{visit.schoolDetails.principalName}</strong>
                                  {visit.schoolDetails.principalMobile && (
                                    <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>({visit.schoolDetails.principalMobile})</span>
                                  )}
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
                                  {visit.idIncharge.mobile && (
                                    <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>({visit.idIncharge.mobile})</span>
                                  )}
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
                                  {visit.reception.mobile && (
                                    <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>({visit.reception.mobile})</span>
                                  )}
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
                              {visit.cardTypes && visit.cardTypes.length > 0 && (
                                <span>
                                  🪪 Card Types: {visit.cardTypes.join(', ')}
                                </span>
                              )}
                              {visit.sections && visit.sections.length > 0 && (
                                <span>
                                  Sections: {visit.sections.join(', ')}
                                </span>
                              )}
                              {visit.houses && visit.houses.length > 0 && (
                                <span>
                                  Houses: {visit.houses.join(', ')}
                                </span>
                              )}
                              <span style={{ fontWeight: 700, color: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.12)', padding: '2px 8px', borderRadius: '6px' }}>
                                📏 Total Strength: {visit.range || 'N/A'}
                              </span>
                              {visit.createdByVendorName && (
                                <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                                  👤 {visit.createdByVendorName}
                                </span>
                              )}
                            </div>

                            {/* Action Buttons directly in confirmed card */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '10px', marginTop: '8px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveToPending(visit);
                                  }}
                                  style={{ height: '36px', fontSize: '12px', fontWeight: 600, padding: '0 8px', backgroundColor: '#eab308', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                  🟡 {language === 'en' ? 'Move to Pending' : 'लंबित में बदलें'}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedVisit(visit);
                                    setIsRejecting(true);
                                  }}
                                  style={{ height: '36px', fontSize: '12px', fontWeight: 600, padding: '0 8px', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                  ❌ {t.decline}
                                </button>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedVisit(visit);
                                    setIsSchedulingFollowUp(true);
                                  }}
                                  style={{ height: '36px', fontSize: '12px', fontWeight: 600, padding: '0 8px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                  ⏰ {language === 'en' ? 'Follow-Up' : 'फॉलो-अप'}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedVisit(visit);
                                    setIsApproving(true);
                                  }}
                                  style={{ height: '36px', fontSize: '12px', fontWeight: 600, padding: '0 8px', backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                  ✏️ {language === 'en' ? 'Edit' : 'संपादित करें'}
                                </button>
                              </div>
                              {isAdminMode && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTransferModalVisit(visit);
                                    }}
                                    style={{ height: '36px', fontSize: '12px', fontWeight: 600, padding: '0 8px', width: '100%', backgroundColor: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818cf8', borderRadius: '8px', cursor: 'pointer' }}
                                  >
                                    🚀 {language === 'en' 
                                      ? `Move to Session...` 
                                      : `सत्र में भेजें...`}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm(language === 'en' ? 'Are you sure you want to delete this client?' : 'क्या आप वाकई इस ग्राहक को हटाना चाहते हैं?')) {
                                        handleDeleteVisit(visit.id);
                                      }
                                    }}
                                    style={{ height: '36px', fontSize: '12px', fontWeight: 600, padding: '0 8px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '8px', cursor: 'pointer' }}
                                  >
                                    🗑️ {language === 'en' ? 'Delete' : 'हटाएं'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--text-secondary)' }}>
                  {t.noConfirmedSaved}
                </div>
              )}

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
                    className="btn btn-danger"
                    style={{
                      width: 'auto',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: 700,
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                      cursor: 'pointer'
                    }}
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

          
          {/* Target Session Selection Modal Overlay */}
          {transferModalVisit && (
            <div className="modal-overlay" onClick={() => setTransferModalVisit(null)} style={{ zIndex: 12000 }}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 className="form-title" style={{ margin: 0, fontSize: '16px' }}>
                    🚀 {language === 'en' ? 'Copy to Target Session' : 'लक्ष्य सत्र में कॉपी करें'}
                  </h3>
                  <button
                    onClick={() => setTransferModalVisit(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}
                  >
                    ✖
                  </button>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  {language === 'en'
                    ? `Select which session to copy "${transferModalVisit.schoolName || 'N/A'}" (School Name, Contact & Strength) into:`
                    : `किस सत्र में "${transferModalVisit.schoolName || 'N/A'}" (नाम, संपर्क और स्ट्रेंथ) कॉपी करना चाहते हैं चुनें:`}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
                  {availableSessions.map((sess) => (
                    <button
                      key={sess}
                      onClick={() => handleCopyToTargetSession(transferModalVisit, sess)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <span>📅 {sess}</span>
                      <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700 }}>Select ➔</span>
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      const input = window.prompt(
                        language === 'en' ? 'Enter target Academic Session (e.g. 2028-2029):' : 'लक्ष्य सत्र दर्ज करें (उदा. 2028-2029):',
                        '2028-2029'
                      );
                      if (input && input.trim()) {
                        handleCopyToTargetSession(transferModalVisit, input.trim());
                      }
                    }}
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(79, 70, 229, 0.15)', border: '1px solid rgba(79, 70, 229, 0.3)', color: 'var(--primary)', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                  >
                    ➕ {language === 'en' ? 'Create & Select New Session' : 'नया सत्र बनाएं और चुनें'}
                  </button>
                  <button
                    onClick={() => setTransferModalVisit(null)}
                    className="btn btn-secondary"
                    style={{ padding: '10px 16px' }}
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Visit Bottom-Drawer Modal */}
          {isAddingVisit && (
            <div className="modal-overlay" onClick={() => setIsAddingVisit(false)} style={{ zIndex: 10000 }}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 className="form-title" style={{ margin: 0 }}>
                    {t.addNewClientVisit} ({activeCategory ? (t[activeCategory.toLowerCase() as keyof typeof t] || activeCategory) : ''})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddingVisit(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px 16px',
                      borderRadius: '12px',
                      backgroundColor: '#ef4444',
                      fontSize: '14px',
                      fontWeight: 700,
                      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                    }}
                    aria-label="Back"
                  >
                    ← {t.back}
                  </button>
                </div>
                <ApprovalForm
                  visit={{
                    id: '',
                    schoolName: '',
                    category: activeCategory || undefined,
                    city: '',
                    visitDate: new Date().toISOString().split('T')[0],
                    status: 'Pending',
                    range: '',
                    classes: { from: 'I', to: 'XII' },
                    sections: ['A', 'B', 'C', 'D'],
                    houses: ['Red', 'Blue', 'Green', 'Yellow'],
                    schoolDetails: { address: '', principalName: '', principalMobile: '', principalEmail: '' },
                    idIncharge: { name: '', mobile: '', email: '' },
                    additionalNotes: '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  }}
                  onSave={async (formData) => {
                    setSyncStatus('syncing');
                    const visitData: Omit<SchoolVisit, 'id'> = {
                      schoolName: formData.schoolName || '',
                      category: activeCategory || undefined,
                      city: formData.city || undefined,
                      visitDate: formData.visitDate || new Date().toISOString().split('T')[0],
                      session: getSessionForDate(formData.visitDate || new Date().toISOString().split('T')[0]),
                      status: 'Pending',
                      range: formData.range || undefined,
                      schoolDetails: formData.schoolDetails || { address: '', principalName: '', principalMobile: '', principalEmail: '' },
                      idIncharge: formData.idIncharge || { name: '', mobile: '', email: '' },
                      classes: formData.classes || { from: 'I', to: 'XII' },
                      sections: formData.sections || [],
                      houses: formData.houses || [],
                      additionalNotes: formData.additionalNotes || '',
                      createdByVendorId: !isAdminMode && currentVendor ? currentVendor.id : undefined,
                      createdByVendorName: !isAdminMode && currentVendor ? currentVendor.name : undefined,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    };

                    try {
                      const added = await dbService.saveVisit(visitData);
                      setVisits((prev) => [added, ...prev]);
                      setIsAddingVisit(false);
                      setTab('visits');
                      setTimeout(() => setSyncStatus('synced'), 800);
                    } catch (e) {
                      console.error('Error saving new visit:', e);
                      setSyncStatus('synced');
                    }
                  }}
                  onCancel={() => setIsAddingVisit(false)}
                  lang={language}
                />
              </div>
            </div>
          )}

        </>
      )}

      {/* Edit/Approval Bottom-Drawer Modal */}
      {isApproving && selectedVisit && (
        <div className="modal-overlay" onClick={() => { setIsApproving(false); setSelectedVisit(null); }} style={{ zIndex: 10000 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="form-title" style={{ margin: 0 }}>
                {language === 'en' ? 'Edit / Confirm Client' : 'ग्राहक पुष्टि / संपादन'}
              </h3>
              <button 
                type="button" 
                onClick={() => { setIsApproving(false); setSelectedVisit(null); }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'white', 
                  cursor: 'pointer', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '8px 16px',
                  borderRadius: '12px',
                  backgroundColor: '#ef4444',
                  fontSize: '14px',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                }}
                aria-label="Back"
              >
                ← {t.back}
              </button>
            </div>
            <ApprovalForm
              visit={selectedVisit}
              onSave={handleApproveSave}
              onCancel={() => { setIsApproving(false); setSelectedVisit(null); }}
              lang={language}
            />
          </div>
        </div>
      )}

      {/* Rejection / Decline capturing modal */}
      <RejectionModal
        isOpen={isRejecting}
        onClose={() => { setIsRejecting(false); setSelectedVisit(null); }}
        onSave={handleRejectSave}
        lang={language}
      />

      {/* Follow-Up Scheduler drawer */}
      <FollowUpModal
        isOpen={isSchedulingFollowUp}
        onClose={() => { setIsSchedulingFollowUp(false); setSelectedVisit(null); }}
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
