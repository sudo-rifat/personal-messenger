import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Auth from './components/Auth';
import SettingsModal from './components/SettingsModal'; 
import AdminPanel from './components/AdminPanel';
import { db } from './firebase';
import { doc, onSnapshot, collection, query, where, getDocs, getDoc, Timestamp } from 'firebase/firestore';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('account');

  // Initial LocalStorage Check
  useEffect(() => {
    const savedUser = localStorage.getItem("skylark_user");
    const savedToken = localStorage.getItem("skylark_token");

    if (savedUser && savedToken) {
      setUser({ ...JSON.parse(savedUser), activeToken: savedToken });
    }
    setLoading(false);
  }, []);

  // Request Notification Permission
  useEffect(() => {
    if (user && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [user]);

  // Session Monitor (Single Device Check)
  useEffect(() => {
    if (!user || !user.uid) return;

    // Listen to real-time changes on the user document
    const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            const currentLocalToken = localStorage.getItem("skylark_token");

            // BYPASS: Skip session check during impersonation mode
            const isImpersonating = !!localStorage.getItem("skylark_admin_backup");
            if (isImpersonating) {
                // Admin is impersonating - don't trigger logout based on token mismatch
                setUser(prev => ({ ...prev, ...data }));
                return;
            }
            
            // Logout if token doesn't match OR if activeToken has been cleared (Revoked)
            if (currentLocalToken && (!data.activeToken || data.activeToken !== currentLocalToken)) {
                handleLogout(); // Clear state immediately to show login screen
                // Use setTimeout to allow UI to update before blocking with alert
                setTimeout(() => {
                    alert("Your session has ended. Either you logged in elsewhere or the device was removed.");
                }, 100);
            }
            
            // Update user state with latest data (e.g. devices list changes)
            setUser(prev => ({ ...prev, ...data }));
        }
    });

    return () => unsub();
  }, [user?.uid]);

  // Helper: Show notification
  const showNotification = async (message, groupName) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(
          `${message.sender} in ${groupName}`,
          {
            body: message.text,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: `msg-${message.id}`,
            requireInteraction: false,
            timestamp: message.createdAt?.toMillis?.() || Date.now()
          }
        );
        
        notification.onclick = () => {
          window.focus();
        };
      } catch (err) {
        console.error('Notification error:', err);
      }
    }
  };

  // Helper: Get last seen timestamp for a group
  const getLastSeen = (groupId) => {
    try {
      const lastSeen = JSON.parse(localStorage.getItem('skylark_last_seen_messages') || '{}');
      return lastSeen[groupId] || 0;
    } catch {
      return 0;
    }
  };

  // Helper: Update last seen timestamp
  const updateLastSeen = (groupId, timestamp) => {
    try {
      const lastSeen = JSON.parse(localStorage.getItem('skylark_last_seen_messages') || '{}');
      lastSeen[groupId] = timestamp;
      localStorage.setItem('skylark_last_seen_messages', JSON.stringify(lastSeen));
    } catch (err) {
      console.error('Failed to update last seen:', err);
    }
  };

  // Check for missed messages on reconnect
  const checkMissedMessages = async () => {
    if (!user?.uid) return;

    const lastOnline = parseInt(localStorage.getItem('skylark_last_online') || '0');
    if (!lastOnline) return;

    try {
      // Query messages created after last online time
      const lastOnlineDate = new Date(lastOnline);
      const q = query(
        collection(db, "messages"),
        where("createdAt", ">", Timestamp.fromDate(lastOnlineDate))
      );
      
      const snapshot = await getDocs(q);
      const missedMessages = [];
      
      snapshot.docs.forEach(doc => {
        const msg = { id: doc.id, ...doc.data() };
        // Only include messages not from current user
        if (msg.uid !== user.uid) {
          missedMessages.push(msg);
        }
      });

      // Group by groupId
      const groupedMessages = {};
      missedMessages.forEach(msg => {
        if (!groupedMessages[msg.groupId]) {
          groupedMessages[msg.groupId] = [];
        }
        groupedMessages[msg.groupId].push(msg);
      });

      // Show notifications for each group
      for (const [groupId, messages] of Object.entries(groupedMessages)) {
        try {
          const groupDoc = await getDoc(doc(db, "groups", groupId));
          const groupName = groupDoc.exists() ? groupDoc.data().name : 'Group';
          
          // Show summary if more than 3 messages
          if (messages.length > 3) {
            showNotification({
              sender: 'Updates',
              text: `${messages.length} new messages while you were away`,
              id: `group-${groupId}-summary`
            }, groupName);
          } else {
            // Show individual notifications
            messages.forEach(msg => showNotification(msg, groupName));
          }
        } catch (err) {
          console.error('Error fetching group for notification:', err);
        }
      }

      // Clear last_online flag
      localStorage.removeItem('skylark_last_online');
    } catch (err) {
      console.error('Error checking missed messages:', err);
    }
  };

  // Global message listener for real-time notifications
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, "messages"));
    const unsubMessages = onSnapshot(q, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === "added") {
          const msg = { id: change.doc.id, ...change.doc.data() };
          
          // Skip if from current user or currently viewing this chat
          if (msg.uid === user.uid || msg.groupId === activeGroupId) {
            continue;
          }

          // Check last seen to avoid duplicate notifications
          const lastSeen = getLastSeen(msg.groupId);
          const msgTime = msg.createdAt?.toMillis?.() || 0;
          
          if (msgTime > lastSeen) {
            // Fetch group name and show notification
            try {
              const groupDoc = await getDoc(doc(db, "groups", msg.groupId));
              if (groupDoc.exists()) {
                const groupName = groupDoc.data().name;
                showNotification(msg, groupName);
              }
            } catch (err) {
              console.error('Error showing notification:', err);
            }
          }
        }
      }
    });

    return () => unsubMessages();
  }, [user?.uid, activeGroupId]);

  // Online/Offline detection
  useEffect(() => {
    if (!user?.uid) return;

    const handleOnline = () => {
      checkMissedMessages();
    };
    
    const handleOffline = () => {
      localStorage.setItem('skylark_last_online', Date.now().toString());
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check on mount in case we just came back online
    checkMissedMessages();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user?.uid]);

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
            onSettingsClick={() => { setSettingsTab('account'); setShowSettings(true); }}
            onAdminClick={() => { setSettingsTab('admin'); setShowSettings(true); }}
          />
          <ChatArea user={user} activeGroupId={activeGroupId} onBack={() => setActiveGroupId(null)} />
        </div>
      </div>
      
      {showSettings && (
        <SettingsModal 
            user={user} 
            onClose={() => setShowSettings(false)} 
            onLogout={handleLogout} 
            initialTab={settingsTab}
        />
      )}
    </Layout>
  );
}



export default App;
