import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock,
  FileText,
  Percent,
  Sparkles,
  Info,
  ShieldAlert,
} from 'lucide-react';

export default function ResultCard({ result }) {
  if (!result) return null;

  const {
    status,
    confidence,
    media_type,
    file_name,
    explanation,
    detection_mode,
    is_demo,
    demo_notice,
  } = result;

  // Status mapping
  let statusClass = 'uncertain';
  let statusText = 'Unable to Determine';
  let statusIcon = <HelpCircle size={22} />;

  if (status === 'AUTHENTIC') {
    statusClass = 'authentic';
    statusText = 'Likely Authentic';
    statusIcon = <CheckCircle2 size={22} />;
  } else if (status === 'POTENTIALLY_MANIPULATED') {
    statusClass = 'manipulated';
    statusText = 'Potentially Manipulated';
    statusIcon = <AlertTriangle size={22} />;
  }

  const isDemo = is_demo || detection_mode === 'demo';

  return (
    <div className={`result-card ${statusClass}`}>
      {/* Demo Warning Banner */}
      {isDemo && (
        <div className="demo-warning-banner">
          <ShieldAlert size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>DEMO DETECTION MODE:</strong> This result is generated using the development fallback and is <u>NOT</u> a real deepfake detection result. Configure <code>AIORNOT_API_KEY</code> in <code>backend/.env</code> for live detection.
          </div>
        </div>
      )}

      {/* Header */}
      <div className="result-header">
        <div>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 600 }}>
            AI Analysis Result
          </span>
          <div style={{ marginTop: '0.35rem' }}>
            <span className={`result-status-badge badge-${statusClass}`}>
              {statusIcon}
              <span>{statusText}</span>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: isDemo ? 'rgba(234, 179, 8, 0.2)' : 'rgba(37, 99, 235, 0.2)',
              color: isDemo ? '#fde047' : '#93c5fd',
              border: isDemo ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid rgba(37, 99, 235, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <Sparkles size={12} />
            {isDemo ? 'Demo Mode' : 'AI or Not Engine'}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="result-metrics-grid">
        <div className="metric-item">
          <div className="metric-label">Confidence Score</div>
          <div className="metric-value" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>{confidence}%</span>
            <Percent size={16} color="#94a3b8" />
          </div>
        </div>

        <div className="metric-item">
          <div className="metric-label">Media Type</div>
          <div className="metric-value" style={{ textTransform: 'capitalize' }}>
            {media_type || 'Image'}
          </div>
        </div>

        <div className="metric-item">
          <div className="metric-label">Target File</div>
          <div className="metric-value" style={{ fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file_name}>
            {file_name || 'Uploaded File'}
          </div>
        </div>

        <div className="metric-item">
          <div className="metric-label">Processed At</div>
          <div className="metric-value" style={{ fontSize: '0.95rem' }}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Explanation Box */}
      <div className="result-explanation-box">
        <h4>Analysis Overview</h4>
        <p>{explanation}</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          This analysis examines visual markers, facial artifacts, frequency domain anomalies, and generation patterns.
        </p>
      </div>

      {/* Cautious AI Disclaimer */}
      <div className="disclaimer-banner">
        <Info size={18} color="#94a3b8" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Important AI Disclaimer:</strong> AI detection results are probabilistic and should not be treated as definitive proof of authenticity or manipulation.
          {status === 'POTENTIALLY_MANIPULATED' && (
            <span style={{ display: 'block', marginTop: '0.25rem', color: '#fb7185' }}>
              Potential manipulation indicators were detected. Consider verifying the original source before making decisions.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
