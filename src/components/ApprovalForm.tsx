'use client';

import React, { useState } from 'react';
import { Plus, Save } from 'lucide-react';
import { SchoolVisit } from '@/lib/db';

interface ApprovalFormProps {
  visit: SchoolVisit;
  onSave: (updatedData: Partial<SchoolVisit>) => void;
  onCancel: () => void;
}

const CLASS_OPTIONS = ['Nursery', 'LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export default function ApprovalForm({ visit, onSave, onCancel }: ApprovalFormProps) {
  const [schoolName, setSchoolName] = useState(visit.schoolName);
  const [address, setAddress] = useState(visit.schoolDetails?.address || '');
  const [principalName, setPrincipalName] = useState(visit.schoolDetails?.principalName || '');
  const [principalMobile, setPrincipalMobile] = useState(visit.schoolDetails?.principalMobile || '');
  const [principalEmail, setPrincipalEmail] = useState(visit.schoolDetails?.principalEmail || '');

  const [inchargeName, setInchargeName] = useState(visit.idIncharge?.name || '');
  const [inchargeMobile, setInchargeMobile] = useState(visit.idIncharge?.mobile || '');
  const [inchargeEmail, setInchargeEmail] = useState(visit.idIncharge?.email || '');

  const [receptionName, setReceptionName] = useState(visit.reception?.name || '');
  const [receptionMobile, setReceptionMobile] = useState(visit.reception?.mobile || '');
  const [receptionEmail, setReceptionEmail] = useState(visit.reception?.email || '');

  const [classFrom, setClassFrom] = useState(visit.classes?.from || 'I');
  const [classTo, setClassTo] = useState(visit.classes?.to || 'XII');

  const [cardTypes, setCardTypes] = useState<string[]>(
    visit.cardTypes || ['Student']
  );

  const [sections, setSections] = useState<string[]>(
    visit.sections && visit.sections.length > 0 ? visit.sections : ['A', 'B', 'C', 'D']
  );
  const [houses, setHouses] = useState<string[]>(
    visit.houses && visit.houses.length > 0 ? visit.houses : ['Red', 'Blue', 'Green', 'Yellow']
  );

  const [newSection, setNewSection] = useState('');
  const [newHouse, setNewHouse] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState(visit.additionalNotes || '');

  const handleCardTypeChange = (type: string) => {
    if (cardTypes.includes(type)) {
      setCardTypes(cardTypes.filter((t) => t !== type));
    } else {
      setCardTypes([...cardTypes, type]);
    }
  };

  const handleAddSection = () => {
    const trimmed = newSection.trim();
    if (trimmed && !sections.includes(trimmed)) {
      setSections([...sections, trimmed]);
      setNewSection('');
    }
  };

  const handleRemoveSection = (section: string) => {
    setSections(sections.filter((s) => s !== section));
  };

  const handleAddHouse = () => {
    const trimmed = newHouse.trim();
    if (trimmed && !houses.includes(trimmed)) {
      setHouses([...houses, trimmed]);
      setNewHouse('');
    }
  };

  const handleRemoveHouse = (house: string) => {
    setHouses(houses.filter((h) => h !== house));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      schoolName,
      status: 'Approved',
      schoolDetails: {
        address,
        principalName,
        principalMobile,
        principalEmail,
      },
      idIncharge: {
        name: inchargeName,
        mobile: inchargeMobile,
        email: inchargeEmail,
      },
      reception: {
        name: receptionName,
        mobile: receptionMobile,
        email: receptionEmail,
      },
      classes: {
        from: classFrom,
        to: classTo,
      },
      cardTypes,
      sections,
      houses,
      additionalNotes,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="section-card">
        <div className="section-card-title">School Details</div>
        <div className="form-group">
          <label className="form-label" htmlFor="school-name">School Name</label>
          <input
            id="school-name"
            type="text"
            className="form-input"
            required
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="address">Address</label>
          <input
            id="address"
            type="text"
            className="form-input"
            required
            placeholder="Complete address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="principal-name">Principal/HM Name</label>
          <input
            id="principal-name"
            type="text"
            className="form-input"
            required
            placeholder="e.g. Rajesh Sharma"
            value={principalName}
            onChange={(e) => setPrincipalName(e.target.value)}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="principal-mobile">Principal Mobile</label>
            <input
              id="principal-mobile"
              type="tel"
              className="form-input"
              required
              placeholder="10-digit number"
              value={principalMobile}
              onChange={(e) => setPrincipalMobile(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="principal-email">Principal Email</label>
            <input
              id="principal-email"
              type="email"
              className="form-input"
              placeholder="email@school.com"
              value={principalEmail}
              onChange={(e) => setPrincipalEmail(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-title">ID Incharge Details</div>
        <div className="form-group">
          <label className="form-label" htmlFor="incharge-name">Incharge Name</label>
          <input
            id="incharge-name"
            type="text"
            className="form-input"
            placeholder="e.g. Amit Verma"
            value={inchargeName}
            onChange={(e) => setInchargeName(e.target.value)}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="incharge-mobile">Incharge Mobile</label>
            <input
              id="incharge-mobile"
              type="tel"
              className="form-input"
              placeholder="Mobile number"
              value={inchargeMobile}
              onChange={(e) => setInchargeMobile(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="incharge-email">Incharge Email</label>
            <input
              id="incharge-email"
              type="email"
              className="form-input"
              placeholder="incharge@email.com"
              value={inchargeEmail}
              onChange={(e) => setInchargeEmail(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-title">Reception Details (Optional)</div>
        <div className="form-group">
          <label className="form-label" htmlFor="reception-name">Reception Name</label>
          <input
            id="reception-name"
            type="text"
            className="form-input"
            placeholder="e.g. Priya Sharma"
            value={receptionName}
            onChange={(e) => setReceptionName(e.target.value)}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="reception-mobile">Reception Mobile</label>
            <input
              id="reception-mobile"
              type="tel"
              className="form-input"
              placeholder="Mobile number"
              value={receptionMobile}
              onChange={(e) => setReceptionMobile(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reception-email">Reception Email</label>
            <input
              id="reception-email"
              type="email"
              className="form-input"
              placeholder="reception@email.com"
              value={receptionEmail}
              onChange={(e) => setReceptionEmail(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-title">Classes & Card Types</div>
        <div className="form-row" style={{ marginBottom: '16px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="class-from">From Class</label>
            <select
              id="class-from"
              className="form-input"
              style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%2394a3b8\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 10px center', backgroundRepeat: 'no-repeat', backgroundSize: '20px' }}
              value={classFrom}
              onChange={(e) => setClassFrom(e.target.value)}
            >
              {CLASS_OPTIONS.map((c) => (
                <option key={c} value={c} style={{ backgroundColor: 'var(--bg-card)' }}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="class-to">To Class</label>
            <select
              id="class-to"
              className="form-input"
              style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%2394a3b8\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 10px center', backgroundRepeat: 'no-repeat', backgroundSize: '20px' }}
              value={classTo}
              onChange={(e) => setClassTo(e.target.value)}
            >
              {CLASS_OPTIONS.map((c) => (
                <option key={c} value={c} style={{ backgroundColor: 'var(--bg-card)' }}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <label className="form-label" style={{ marginBottom: '8px' }}>Card Type Required</label>
        <div className="checkbox-grid">
          {['Student', 'Staff', 'Bus', 'Other'].map((type) => (
            <label key={type} className="checkbox-label">
              <input
                type="checkbox"
                checked={cardTypes.includes(type)}
                onChange={() => handleCardTypeChange(type)}
              />
              <span>{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-title">Sections</div>
        <div className="dynamic-list-builder">
          <div className="dynamic-tag-input-row">
            <input
              type="text"
              className="form-input"
              placeholder="e.g. E or V-A"
              value={newSection}
              onChange={(e) => setNewSection(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSection())}
            />
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: 'auto', padding: '12px 16px' }}
              onClick={handleAddSection}
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="dynamic-tag-list">
            {sections.map((sec) => (
              <span key={sec} className="dynamic-tag">
                {sec}
                <button
                  type="button"
                  className="dynamic-tag-remove"
                  onClick={() => handleRemoveSection(sec)}
                >
                  &times;
                </button>
              </span>
            ))}
            {sections.length === 0 && (
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No sections added yet.</span>
            )}
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-title">Houses</div>
        <div className="dynamic-list-builder">
          <div className="dynamic-tag-input-row">
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Orange"
              value={newHouse}
              onChange={(e) => setNewHouse(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHouse())}
            />
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: 'auto', padding: '12px 16px' }}
              onClick={handleAddHouse}
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="dynamic-tag-list">
            {houses.map((house) => (
              <span key={house} className="dynamic-tag">
                {house}
                <button
                  type="button"
                  className="dynamic-tag-remove"
                  onClick={() => handleRemoveHouse(house)}
                >
                  &times;
                </button>
              </span>
            ))}
            {houses.length === 0 && (
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No houses added yet.</span>
            )}
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-title">Additional Notes</div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <textarea
            className="form-input"
            style={{ minHeight: '120px', resize: 'vertical' }}
            placeholder="Type any specific requests or remarks here (e.g. Need cards before August)..."
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="form-row" style={{ marginTop: '8px', marginBottom: '24px' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-success">
          <Save size={18} /> Save & Approve
        </button>
      </div>
    </form>
  );
}
