import React from 'react';
import {
  BarChart3,
  Image,
  Video,
  AlertTriangle,
  CheckCircle2,
  FileQuestion,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DashboardStats({ scans, loading, onOpenAuth }) {
  const { currentUser, isFirebaseConfigured } = useAuth();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0' }}>
        <div className="spinner"></div>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loading your statistics...</p>
      </div>
    );
  }

  const totalScans = scans ? scans.length : 0;

  if (totalScans === 0) {
    return (
      <div className="empty-state">
        <FileQuestion size={40} className="empty-state-icon" />
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No scans yet.</h3>
        <p style={{ color: '#94a3b8', maxWidth: '480px', margin: '0 auto 1.25rem auto' }}>
          Upload an image or video in the <strong>Scan Media</strong> tab to analyze files and see your metrics appear here!
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Security Overview
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Real-time metrics calculated from your analyzed media records.
          </p>
        </div>

        <div>
          <span
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: isFirebaseConfigured && currentUser ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              color: isFirebaseConfigured && currentUser ? '#34d399' : '#93c5fd',
              border: isFirebaseConfigured && currentUser ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <ShieldCheck size={14} />
            <span>{isFirebaseConfigured && currentUser ? 'Cloud Synced' : 'Local Storage Active'}</span>
          </span>
        </div>
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
