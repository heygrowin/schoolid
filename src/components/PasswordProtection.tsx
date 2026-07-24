"use client";

import React, { useState, useEffect } from "react";
import { dbService, Vendor } from "@/lib/db";

export default function PasswordProtection({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState("");

  // Load vendors list for authentication
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const data = await dbService.getVendors();
        setVendors(data);
      } catch (e) {
        console.error("Failed to load vendors for login:", e);
      }
    };
    fetchVendors();

    const auth = localStorage.getItem("site_authenticated");
    if (auth === "true") {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim().toLowerCase();
    const p = password.trim();
    
    // Get Admin/Owner password from local storage or default to admin123
    const adminPass = localStorage.getItem("admin_password") || "admin123";

    if (u === "admin" && p === adminPass) {
      localStorage.setItem("site_authenticated", "true");
      localStorage.removeItem("currentVendor"); // owner mode has no vendor assigned
      setIsAuthenticated(true);
      setError("");
      return;
    }

    // Check vendor salesman accounts
    const matchedVendor = vendors.find(v => v.user === u && v.pass === p);
    if (matchedVendor) {
      localStorage.setItem("site_authenticated", "true");
      localStorage.setItem("currentVendor", JSON.stringify(matchedVendor));
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Incorrect username or password");
    }
  };

  if (isAuthenticated === null) {
    return null; 
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#0b0f19',
      fontFamily: 'sans-serif',
      padding: '20px'
    }}>
      <div style={{
        padding: '2.5rem 2rem',
        backgroundColor: '#111827',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        width: '100%',
        maxWidth: '400px',
        border: '1px solid #1f2937'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#f9fafb', margin: '0 0 8px 0' }}>Market Manager</h2>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>Sign in to continue to your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#9ca3af' }}>Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin or sales1"
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #374151',
                backgroundColor: '#1f2937',
                color: '#f9fafb',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#9ca3af' }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #374151',
                backgroundColor: '#1f2937',
                color: '#f9fafb',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>

          {error && (
            <div style={{ color: '#ef4444', fontSize: '13px', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: '6px' }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              padding: '0.75rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#38bdf8',
              color: '#0f172a',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '8px',
              transition: 'background-color 0.2s'
            }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
