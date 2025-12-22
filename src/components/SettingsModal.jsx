import React, { useState, useEffect } from 'react';
import { X, Smartphone, Monitor, Trash2, AlertTriangle, LogOut, User, Shield, Lock, Bell, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import AdminPanel from './AdminPanel';

const SettingsModal = ({ user, onClose, onLogout, initialTab = 'account' }) => {
  const [activeTab, setActiveTab] = useState(initialTab); // account, security, admin

  // Update active tab if initialTab changes prop (e.g. reopening)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!user) return null;

  const handleRemoveDevice = async (deviceId) => {
    if (window.confirm("CAUTION: This will immediately log out this device. The user will need to log in again. Proceed?")) {
        try {
            const userRef = doc(db, "users", user.uid);
            const updatedDevices = user.devices.filter(d => d.id !== deviceId);
            
            const updatePayload = { devices: updatedDevices };
            
            if (deviceId === user.activeToken) {
                updatePayload.activeToken = "";
            }
            
            await updateDoc(userRef, updatePayload);
        } catch (err) {
            console.error("Error removing device:", err);
            alert("Failed to remove device.");
        }
    }
  };

  const handleDeleteAllOther = async () => {
    const otherDevicesCount = user.devices?.filter(d => d.id !== user.activeToken).length || 0;
    
    if (otherDevicesCount === 0) {
        alert("No other devices to remove.");
        return;
    }

    if (window.confirm(`CAUTION: This will log out ${otherDevicesCount} other device(s). Only your current device will remain active. Proceed?`)) {
        try {
            const userRef = doc(db, "users", user.uid);
            const currentDevice = user.devices.find(d => d.id === user.activeToken);
            const updatedDevices = currentDevice ? [currentDevice] : [];
            
            await updateDoc(userRef, { devices: updatedDevices });
        } catch (err) {
            console.error("Error removing devices:", err);
            alert("Failed to remove devices.");
        }
    }
  };

  const navItems = [
    { id: 'account', label: 'My Account', icon: User },
    { id: 'security', label: 'Security & Login', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette, disabled: true },
    { id: 'notifications', label: 'Notifications', icon: Bell, disabled: true },
  ];

  if (user.isAdmin) {
    navItems.push({ id: 'admin', label: 'Command Center', icon: Shield, highlight: true });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="flex h-[85vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0f172a] text-white shadow-2xl flex-col md:flex-row"
      >
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-white/5 bg-[#0b1121] p-4 md:p-6 flex flex-row md:flex-col overflow-x-auto md:overflow-visible">
          <h2 className="hidden md:block mb-8 text-xl font-black uppercase tracking-tight pl-2">Settings</h2>
          
          <div className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-1 flex-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => !item.disabled && setActiveTab(item.id)}
                disabled={item.disabled}
                className={`flex shrink-0 items-center rounded-xl p-3 text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === item.id 
                    ? item.highlight 
                        ? 'bg-red-500/10 text-red-500 shadow-lg shadow-red-500/10' 
                        : 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                    : item.disabled
                        ? 'text-gray-600 cursor-not-allowed hidden md:flex'
                        : item.highlight
                            ? 'text-red-400 hover:bg-red-500/5'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={18} className="mr-2 md:mr-3" />
                {item.label}
              </button>
            ))}
          </div>

          <button 
            onClick={onLogout}
            className="hidden md:flex mt-6 w-full items-center rounded-xl border border-white/5 bg-white/[0.02] p-3 text-sm font-bold text-gray-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all"
          >
            <LogOut size={18} className="mr-3" />
            Sign Out
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0f172a] relative h-full">
            {/* Close Button */}
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 md:top-6 md:right-6 z-10 rounded-full bg-black/20 p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-all backdrop-blur-sm"
            >
                <X size={20} />
            </button>

            {/* Content scroller */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-0">
                
                {/* Account Details Tab */}
                {activeTab === 'account' && (
                    <div className="p-4 md:p-8 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="mb-6 text-2xl font-bold">My Account</h3>
                        
                        <div className="flex flex-col md:flex-row items-center p-6 mb-8 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-white/5 text-center md:text-left">
                            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-indigo-500/20 mb-4 md:mb-0">
                                {user.username[0].toUpperCase()}
                            </div>
                            <div className="md:ml-6">
                                <h4 className="text-2xl font-black">{user.username}</h4>
                                <p className="text-sm font-mono text-indigo-300 mt-1 opacity-70">UID: {user.uid}</p>
                                <div className="mt-3 flex gap-2 justify-center md:justify-start">
                                    <span className="px-2 py-1 rounded-lg bg-white/10 text-xs font-bold text-white uppercase tracking-wider">
                                        {user.isAdmin ? 'Administrator' : 'User'}
                                    </span>
                                    <span className="px-2 py-1 rounded-lg bg-green-500/10 text-xs font-bold text-green-400 uppercase tracking-wider border border-green-500/20">
                                        Active
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Logout Button */}
                        <button 
                          onClick={onLogout}
                          className="md:hidden w-full flex items-center justify-center rounded-xl bg-red-500/10 py-3 text-sm font-bold text-red-400 border border-red-500/20"
                        >
                          <LogOut size={18} className="mr-2" />
                          Sign Out
                        </button>
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <div className="p-4 md:p-8 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                            <h3 className="text-2xl font-bold">Security & Login</h3>
                            <button 
                                onClick={handleDeleteAllOther}
                                className="w-full md:w-auto px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                            >
                                Sign Out All Other Devices
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-yellow-500/5 border border-yellow-500/10 p-4 rounded-xl flex items-start gap-3 mb-6">
                                <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
                                <div>
                                    <h4 className="text-yellow-500 font-bold text-sm uppercase tracking-wide">Single Device Policy</h4>
                                    <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                                        For your security, you can only be logged in on one device at a time. Logging in here will disconnect other sessions.
                                    </p>
                                </div>
                            </div>

                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 pl-1">Active Sessions</h4>
                            
                            {user.devices && user.devices.map((device, index) => (
                                <div key={index} className={`flex flex-col md:flex-row items-start md:items-center justify-between rounded-2xl p-5 border transition-all gap-4 ${
                                    device.id === user.activeToken 
                                        ? 'bg-indigo-500/5 border-indigo-500/30' 
                                        : 'bg-white/[0.02] border-white/5'
                                }`}>
                                    <div className="flex items-center gap-4 w-full md:w-auto overflow-hidden">
                                        <div className={`h-10 w-10 flex shrink-0 items-center justify-center rounded-xl ${
                                            device.id === user.activeToken ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-500'
                                        }`}>
                                            {device.name.toLowerCase().includes("win") ? <Monitor size={20} /> : <Smartphone size={20} />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-sm font-bold truncate ${device.id === user.activeToken ? 'text-white' : 'text-gray-300'}`}>
                                                {device.name}
                                                {device.id === user.activeToken && <span className="ml-2 text-indigo-400 text-[10px]">(Current)</span>}
                                            </p>
                                            <p className="text-[10px] text-gray-500 mt-0.5 font-mono truncate">
                                                {new Date(device.loginTime).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {device.id !== user.activeToken && (
                                        <button 
                                            onClick={() => handleRemoveDevice(device.id)}
                                            className="w-full md:w-auto p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center bg-white/5 md:bg-transparent"
                                            title="Revoke Access"
                                        >
                                            <Trash2 size={18} className="md:hidden mr-2" />
                                            <Trash2 size={18} className="hidden md:block" />
                                            <span className="md:hidden text-sm font-bold">Remove Device</span>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Admin Tab */}
                {activeTab === 'admin' && user.isAdmin && (
                    <div className="h-full w-full animate-in fade-in zoom-in-95 duration-300">
                        <AdminPanel onClose={() => setActiveTab('account')} />
                    </div>
                )}

            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsModal;
