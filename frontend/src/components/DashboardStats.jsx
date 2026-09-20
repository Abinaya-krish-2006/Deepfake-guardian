import React from 'react';
import {
  BarChart3,
  Image,
  Video,
  AlertTriangle,
  CheckCircle2,
  FileQuestion,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DashboardStats({ scans, loading, onOpenAuth }) {
  const { currentUser, isFirebaseConfigured } = useAuth();

  if (!isFirebaseConfigured) {
    return (
      <div className="empty-state">
        <Info size={40} className="empty-state-icon" style={{ opacity: 0.8, color: '#60a5fa' }} />
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Cloud Dashboard</h3>
        <p style={{ maxWidth: '480px', margin: '0 auto 1.25rem auto', color: '#94a3b8' }}>
          Connect your Firebase configuration in <code>frontend/.env</code> to unlock persistent user scan statistics and cloud analytics.
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="empty-state">
        <BarChart3 size={40} className="empty-state-icon" style={{ opacity: 0.8, color: '#60a5fa' }} />
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Personal Detection Dashboard</h3>
        <p style={{ maxWidth: '480px', margin: '0 auto 1.25rem auto', color: '#94a3b8' }}>
          Sign in to track your cumulative scan statistics, detect trends, and maintain a safety ledger.
        </p>
        <button className="btn-primary" onClick={onOpenAuth}>
          Sign In / Register
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0' }}>
        <div className="spinner"></div>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loading your statistics...</p>
      </div>
    );
  }

  const totalScans = scans.length;
  if (totalScans === 0) {
    return (
      <div className="empty-state">
        <FileQuestion size={40} className="empty-state-icon" />
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No scans yet.</h3>
        <p style={{ color: '#94a3b8' }}>
          Upload an image or video in the Scan tab to start building your analysis metrics.
        </p>
      </div>
    );
  }

  const imageScans = scans.filter((s) => s.mediaType === 'image').length;
  const videoScans = scans.filter((s) => s.mediaType === 'video').length;
  const manipulatedScans = scans.filter((s) => s.status === 'POTENTIALLY_MANIPULATED').length;
  const authenticScans = scans.filter((s) => s.status === 'AUTHENTIC').length;

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          Security Overview
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          Real-time metrics calculated from your authenticated scan records.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#60a5fa' }}>
            <BarChart3 size={24} />
          </div>
          <div>
            <div className="stat-val">{totalScans}</div>
            <div className="stat-title">Total Scans</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#38bdf8' }}>
            <Image size={24} />
          </div>
          <div>
            <div className="stat-val">{imageScans}</div>
            <div className="stat-title">Image Scans</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#818cf8' }}>
            <Video size={24} />
          </div>
          <div>
            <div className="stat-val">{videoScans}</div>
            <div className="stat-title">Video Scans</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#f43f5e' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="stat-val" style={{ color: '#f43f5e' }}>{manipulatedScans}</div>
            <div className="stat-title">Potentially Manipulated</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#10b981' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-val" style={{ color: '#10b981' }}>{authenticScans}</div>
            <div className="stat-title">Likely Authentic</div>
          </div>
        </div>
      </div>
    </div>
  );
}
