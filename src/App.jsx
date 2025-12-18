import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Auth from './components/Auth';
import SettingsModal from './components/SettingsModal'; 
import AdminPanel from './components/AdminPanel';
import { db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // Initial LocalStorage Check
  useEffect(() => {
    const savedUser = localStorage.getItem("skylark_user");
    const savedToken = localStorage.getItem("skylark_token");

    if (savedUser && savedToken) {
      setUser({ ...JSON.parse(savedUser), activeToken: savedToken });
    }
    setLoading(false);
  }, []);

  // Session Monitor (Single Device Check)
  useEffect(() => {
    if (!user || !user.uid) return;

    // Listen to real-time changes on the user document
    const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            const currentLocalToken = localStorage.getItem("skylark_token");

            // If the active token in DB is different from local token, LOGOUT
            if (data.activeToken && data.activeToken !== currentLocalToken) {
                alert("You have been logged out because this account was accessed from another device.");
                handleLogout();
            }
            
            // Update user state with latest data (e.g. devices list changes)
            setUser(prev => ({ ...prev, ...data }));
        }
    });

    return () => unsub();
  }, [user?.uid]); // Only re-subscribe if UID changes

  const handleLogout = () => {
    localStorage.removeItem("skylark_user");
    localStorage.removeItem("skylark_token");
    setUser(null);
    setActiveGroupId(null);
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  if (loading) return <div className="text-white">Loading...</div>;

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <Layout>
      {/* Pass user and logout handler to children */}
      <Sidebar 
        user={user} 
        onLogout={handleLogout} 
        activeGroup={activeGroupId}
        setActiveGroup={setActiveGroupId}
        onSettingsClick={() => setShowSettings(true)}
        onAdminClick={() => setShowAdmin(true)}
      />
      <ChatArea user={user} activeGroupId={activeGroupId} onBack={() => setActiveGroupId(null)} />
      
      {showSettings && (
        <SettingsModal user={user} onClose={() => setShowSettings(false)} />
      )}

      {showAdmin && user.isAdmin && (
        <AdminPanel onClose={() => setShowAdmin(false)} />
      )}
    </Layout>
  );
}

export default App;
