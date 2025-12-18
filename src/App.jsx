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

            // Logout if token doesn't match OR if activeToken has been cleared (Revoked)
            if (currentLocalToken && (!data.activeToken || data.activeToken !== currentLocalToken)) {
                alert("Your session has ended. Either you logged in elsewhere or the device was removed.");
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
    localStorage.removeItem("skylark_admin_backup");
    setUser(null);
    setActiveGroupId(null);
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleReturnToAdmin = () => {
    const backup = localStorage.getItem("skylark_admin_backup");
    if (backup) {
        const { user: adminUser, token: adminToken } = JSON.parse(backup);
        localStorage.setItem("skylark_user", JSON.stringify(adminUser));
        localStorage.setItem("skylark_token", adminToken);
        localStorage.removeItem("skylark_admin_backup");
        window.location.reload();
    }
  };

  if (loading) return <div className="text-white">Loading...</div>;

  const isImpersonating = !!localStorage.getItem("skylark_admin_backup");

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <Layout>
      <div className="flex h-full w-full flex-col overflow-hidden">
        {isImpersonating && (
          <motion.div 
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            className="z-[100] flex w-full shrink-0 items-center justify-between bg-gradient-to-r from-red-600 to-orange-600 px-4 py-2 text-white shadow-lg border-b border-white/10"
          >
               <div className="flex items-center text-xs md:text-sm font-bold">
                  <span className="mr-2 h-2 w-2 rounded-full bg-white animate-pulse"></span>
                  ADMIN ACCESS: {user.username}
               </div>
               <button 
                  onClick={handleReturnToAdmin}
                  className="rounded-lg bg-white/20 px-3 py-1.5 text-[10px] md:text-xs font-black uppercase hover:bg-white hover:text-red-600 transition-all border border-white/20 shadow-inner"
               >
                  Exit Session
               </button>
          </motion.div>
        )}
        
        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar 
            user={user} 
            onLogout={handleLogout} 
            activeGroup={activeGroupId}
            setActiveGroup={setActiveGroupId}
            onSettingsClick={() => setShowSettings(true)}
            onAdminClick={() => setShowAdmin(true)}
          />
          <ChatArea user={user} activeGroupId={activeGroupId} onBack={() => setActiveGroupId(null)} />
        </div>
      </div>
      
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
