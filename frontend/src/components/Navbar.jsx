import React from 'react';
import { Shield, User, LogOut, LayoutDashboard, History, ScanLine, Code2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab, onOpenAuth }) {
  const { currentUser, logout, isFirebaseConfigured } = useAuth();

  return (
    <header className="navbar">
      <div className="nav-inner">
        <div className="nav-brand" onClick={() => setActiveTab('scan')}>
          <div className="nav-brand-logo">
            <Shield size={22} color="#ffffff" />
          </div>
          <div className="nav-brand-text">
            <h1>DeepFake Guardian</h1>
            <div className="nav-brand-tagline">Detect. Verify. Stay Safe.</div>
          </div>
        </div>

        <nav className="nav-links">
          <button
            className={`nav-btn ${activeTab === 'scan' ? 'active' : ''}`}
            onClick={() => setActiveTab('scan')}
          >
            <ScanLine size={18} />
            <span>Scan Media</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} />
            <span>History</span>
          </button>

          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-btn"
            style={{ textDecoration: 'none' }}
            title="Interactive Swagger API Documentation"
          >
            <Code2 size={18} />
            <span>API Docs</span>
          </a>

          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.email}
              </span>
              <button
                className="btn-secondary"
                onClick={logout}
                title="Log out"
                style={{ padding: '0.45rem 0.75rem' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              className="btn-primary"
              onClick={onOpenAuth}
              style={{ marginLeft: '0.5rem' }}
            >
              <User size={16} />
              <span>Sign In</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
