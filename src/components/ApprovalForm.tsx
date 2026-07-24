import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { SchoolVisit } from '@/lib/db';
import { Language, translations } from '@/lib/translations';

interface ApprovalFormProps {
  visit: SchoolVisit;
  onSave: (updatedData: Partial<SchoolVisit>) => void;
  onCancel: () => void;
  lang: Language;
  customCities?: string[];
  onSaveCustomCity?: (city: string) => void;
}

const CLASS_OPTIONS = ['Nursery', 'LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export default function ApprovalForm({
  visit,
  onSave,
  onCancel,
  lang = 'en',
  customCities = [],
  onSaveCustomCity
}: ApprovalFormProps) {
  const t = translations[lang];

  // Pre-populate values from visit
  const [schoolName, setSchoolName] = useState(visit.schoolName || '');
  const [address, setAddress] = useState(visit.schoolDetails?.address || '');
  const [city, setCity] = useState(visit.city || '');
  const [visitDate, setVisitDate] = useState(visit.visitDate || new Date().toISOString().split('T')[0]);
  const [range, setRange] = useState(visit.range || '');

  // One contact person details
  const [contactName, setContactName] = useState(
    visit.schoolDetails?.principalName || visit.idIncharge?.name || ''
  );
  const [contactMobile, setContactMobile] = useState(
    visit.schoolDetails?.principalMobile || visit.idIncharge?.mobile || ''
  );
  const [contactEmail, setContactEmail] = useState(
    visit.schoolDetails?.principalEmail || visit.idIncharge?.email || ''
  );

  const [classFrom, setClassFrom] = useState(visit.classes?.from || 'I');
  const [classTo, setClassTo] = useState(visit.classes?.to || 'XII');

  const [additionalNotes, setAdditionalNotes] = useState(visit.additionalNotes || '');

  // City selector modal state
  const [isCityPickerOpen, setIsCityPickerOpen] = useState(false);
  const [newCityNameInput, setNewCityNameInput] = useState('');
  const [localCities, setLocalCities] = useState<string[]>(customCities);

  const handleSaveVisit = (targetStatus?: 'Pending' | 'Approved' | 'Rejected' | 'FollowUp') => {
    onSave({
      schoolName: schoolName.trim(),
      city: city.trim() || undefined,
      visitDate: visitDate,
      range: range.trim() || undefined,
      status: targetStatus || visit.status,
      schoolDetails: {
        address: address.trim(),
        principalName: contactName.trim(),
        principalMobile: contactMobile.trim(),
        principalEmail: contactEmail.trim(),
      },
      idIncharge: {
        name: contactName.trim(),
        mobile: contactMobile.trim(),
        email: contactEmail.trim(),
      },
      classes: {
        from: classFrom,
        to: classTo,
      },
      sections: [],
      houses: [],
      additionalNotes: additionalNotes.trim(),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveVisit(visit.status);
  };

  return (
    <>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Single Compact Container Box */}
        <div className="section-card" style={{ marginBottom: 0 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="school-name">
              {visit.category 
                ? `${t[visit.category.toLowerCase() as keyof typeof t] || visit.category} ${lang === 'en' ? 'Name' : 'का नाम'}`
                : t.clientSchoolName}
            </label>
            <input
              id="school-name"
              type="text"
              className="form-input"
              placeholder="e.g. ABC School"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="address">{t.address}</label>
            <input
              id="address"
              type="text"
              className="form-input"
              placeholder="e.g. Main Street Road"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* City on its own line */}
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label" htmlFor="edit-city">{t.city}</label>
            <input
              id="edit-city"
              type="text"
              className="form-input"
              placeholder={lang === 'en' ? 'Select City' : 'शहर चुनें'}
              readOnly
              value={city}
              onClick={() => setIsCityPickerOpen(true)}
              style={{ cursor: 'pointer' }}
            />
          </div>

          {/* Visit Date on its own line */}
          <div className="form-group">
            <label className="form-label" htmlFor="edit-visit-date">{t.visitDate}</label>
            <input
              id="edit-visit-date"
              type="date"
              className="form-input"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-range">{t.range}</label>
            <input
              id="edit-range"
              type="text"
              className="form-input"
              placeholder={t.rangePlaceholder}
              value={range}
              onChange={(e) => setRange(e.target.value)}
            />
          </div>

          {/* Contact Person Section - Separate Lines */}
          <div style={{ margin: '16px 0 12px 0', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="contact-name">{t.contactPersonName || 'Contact Person'}</label>
              <input
                id="contact-name"
                type="text"
                className="form-input"
                placeholder="e.g. Ramesh Kumar"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="contact-mobile">{t.contactPhone || 'Contact'}</label>
              <input
                id="contact-mobile"
                type="tel"
                className="form-input"
                placeholder="Contact mobile"
                value={contactMobile}
                onChange={(e) => setContactMobile(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="contact-email">{t.contactEmail || 'Contact Email'}</label>
              <input
                id="contact-email"
                type="email"
                className="form-input"
                placeholder="Contact email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Classes Section - Only for School category */}
          {(!visit.category || visit.category === 'School') && (
            <div style={{ margin: '16px 0 12px 0', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="class-from">{t.fromClass}</label>
                  <select
                    id="class-from"
                    className="form-input"
                    value={classFrom}
                    onChange={(e) => setClassFrom(e.target.value)}
                  >
                    {CLASS_OPTIONS.map((c) => (
                      <option key={c} value={c} style={{ backgroundColor: 'var(--bg-card)' }}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="class-to">{t.toClass}</label>
                  <select
                    id="class-to"
                    className="form-input"
                    value={classTo}
                    onChange={(e) => setClassTo(e.target.value)}
                  >
                    {CLASS_OPTIONS.map((c) => (
                      <option key={c} value={c} style={{ backgroundColor: 'var(--bg-card)' }}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Remarks */}
          <div style={{ margin: '16px 0 0 0', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{lang === 'en' ? 'Remarks / Specific Requests' : 'विशेष अनुरोध या टिप्पणी'}</label>
              <textarea
                className="form-input"
                style={{ minHeight: '80px', resize: 'vertical' }}
                placeholder={t.additionalNotesPlaceholder}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button
            type="button"
            className="btn btn-danger"
            style={{
              flex: 1,
              backgroundColor: '#ef4444',
              color: 'white',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer'
            }}
            onClick={onCancel}
          >
            ← {t.back}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Save size={18} style={{ marginRight: '6px' }} />
            {t.addClientVisit}
          </button>
        </div>
      </form>

      {/* City Picker Popup Modal */}
      {isCityPickerOpen && (
        <div 
          className="modal-overlay" 
          onClick={() => setIsCityPickerOpen(false)}
          style={{ zIndex: 11000 }}
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '400px', width: '90%', padding: '24px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {lang === 'en' ? 'Select City' : 'शहर चुनें'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCityPickerOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {/* List of default + custom cities */}
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Array.from(new Set(['Barabanki', 'Lucknow', 'Kanpur', 'Ayodhya', 'Rae Bareli', ...localCities])).map((cName) => (
                <button
                  key={cName}
                  type="button"
                  onClick={() => {
                    setCity(cName);
                    setIsCityPickerOpen(false);
                  }}
                  style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    borderRadius: '8px',
                    border: city === cName ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: city === cName ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: 'var(--text-primary)',
                    fontWeight: city === cName ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  📍 {cName}
                </button>
              ))}
            </div>

            {/* Add custom city row */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder={lang === 'en' ? 'Add new city...' : 'नया शहर जोड़ें...'}
                value={newCityNameInput}
                onChange={(e) => setNewCityNameInput(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: 'auto', padding: '0 16px', whiteSpace: 'nowrap' }}
                onClick={() => {
                  const trimmed = newCityNameInput.trim();
                  if (trimmed) {
                    if (!localCities.includes(trimmed)) {
                      setLocalCities([...localCities, trimmed]);
                      if (onSaveCustomCity) onSaveCustomCity(trimmed);
                    }
                    setCity(trimmed);
                    setNewCityNameInput('');
                    setIsCityPickerOpen(false);
                  }
                }}
              >
                {lang === 'en' ? 'Add & Select' : 'जोड़ें'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
