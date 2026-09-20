import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import ScanUpload from './components/ScanUpload';
import DashboardStats from './components/DashboardStats';
import HistoryList from './components/HistoryList';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';
import { useAuth } from './context/AuthContext';
import { getUserScans } from './firebase/firestore';

export default function App() {
  const [activeTab, setActiveTab] = useState('scan');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [scans, setScans] = useState([]);
  const [loadingScans, setLoadingScans] = useState(false);

  const { currentUser, isFirebaseConfigured } = useAuth();

  const loadUserScans = useCallback(async () => {
    if (!currentUser?.uid || !isFirebaseConfigured) {
      setScans([]);
      return;
    }

    setLoadingScans(true);
    try {
      const records = await getUserScans(currentUser.uid);
      setScans(records);
    } catch (err) {
      console.error('Failed to load user scans:', err);
    } finally {
      setLoadingScans(false);
    }
  }, [currentUser, isFirebaseConfigured]);

  useEffect(() => {
    loadUserScans();
  }, [loadUserScans]);

  const handleScanSaved = () => {
    loadUserScans();
  };

  const handleScanDeleted = (deletedId) => {
    setScans((prev) => prev.filter((s) => s.id !== deletedId));
  };

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      <main className="main-content">
        {activeTab === 'scan' && (
          <ScanUpload onScanSaved={handleScanSaved} />
        )}

        {activeTab === 'dashboard' && (
          <DashboardStats
            scans={scans}
            loading={loadingScans}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {activeTab === 'history' && (
          <HistoryList
            scans={scans}
            loading={loadingScans}
            onScanDeleted={handleScanDeleted}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}
      </main>

      <Footer />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
