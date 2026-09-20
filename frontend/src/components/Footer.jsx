import React from 'react';
import { Shield, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={16} color="#2563eb" />
          <span style={{ fontWeight: 600, color: '#e2e8f0' }}>DeepFake Guardian</span>
          <span>— Detect. Verify. Stay Safe.</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
          <Lock size={13} color="#10b981" />
          <span>Uploaded media is processed securely in server memory and deleted immediately after inference.</span>
        </div>
      </div>
    </footer>
  );
}
