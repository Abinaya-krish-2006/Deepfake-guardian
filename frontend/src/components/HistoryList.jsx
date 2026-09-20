import React, { useState } from 'react';
import {
  History,
  Trash2,
  FileImage,
  FileVideo,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { deleteUserScan } from '../firebase/firestore';

export default function HistoryList({ scans, loading, onScanDeleted, onOpenAuth }) {
  const { currentUser, isFirebaseConfigured } = useAuth();
  const [deletingId, setDeletingId] = useState(null);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0' }}>
        <div className="spinner"></div>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Fetching your scan history...</p>
      </div>
    );
  }

  if (!scans || scans.length === 0) {
    return (
      <div className="empty-state">
        <History size={40} className="empty-state-icon" />
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Scans Yet</h3>
        <p style={{ color: '#94a3b8', maxWidth: '480px', margin: '0 auto' }}>
          Any photos or videos you analyze in the <strong>Scan Media</strong> tab will automatically appear in this history ledger.
        </p>
      </div>
    );
  }

  const handleDelete = async (scanId) => {
    if (!currentUser?.uid || !scanId) return;
    setDeletingId(scanId);
    try {
      const success = await deleteUserScan(currentUser.uid, scanId);
      if (success && onScanDeleted) {
        onScanDeleted(scanId);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const renderBadge = (status) => {
    if (status === 'AUTHENTIC') {
      return (
        <span className="result-status-badge badge-authentic" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
          <CheckCircle2 size={13} />
          <span>Likely Authentic</span>
        </span>
      );
    }
    if (status === 'POTENTIALLY_MANIPULATED') {
      return (
        <span className="result-status-badge badge-manipulated" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
          <AlertTriangle size={13} />
          <span>Potentially Manipulated</span>
        </span>
      );
    }
    return (
      <span className="result-status-badge badge-uncertain" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
        <HelpCircle size={13} />
        <span>Unable to Determine</span>
      </span>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          Scan History
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          Your private ledger of analyzed images and videos stored in Cloud Firestore.
        </p>
      </div>

      <div className="history-table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th>Media</th>
              <th>File Name</th>
              <th>Result</th>
              <th>Confidence</th>
              <th>Date / Time</th>
              <th>Mode</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {scans.map((scan) => (
              <tr key={scan.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {scan.mediaType === 'video' ? (
                      <FileVideo size={18} color="#818cf8" />
                    ) : (
                      <FileImage size={18} color="#38bdf8" />
                    )}
                    <span style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>
                      {scan.mediaType}
                    </span>
                  </div>
                </td>
                <td style={{ fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={scan.fileName}>
                  {scan.fileName}
                </td>
                <td>{renderBadge(scan.status)}</td>
                <td style={{ fontWeight: 700 }}>{scan.confidence}%</td>
                <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  {scan.displayDate}
                </td>
                <td>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      background: scan.isDemo || scan.detectionMode === 'demo' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(37, 99, 235, 0.15)',
                      color: scan.isDemo || scan.detectionMode === 'demo' ? '#fde047' : '#93c5fd',
                    }}
                  >
                    {scan.isDemo || scan.detectionMode === 'demo' ? 'Demo' : 'AI'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(scan.id)}
                    disabled={deletingId === scan.id}
                    title="Delete record"
                  >
                    <Trash2 size={14} />
                    <span>{deletingId === scan.id ? 'Deleting...' : 'Delete'}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
