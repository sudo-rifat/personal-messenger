import React from 'react';
import { X, Smartphone, Monitor, Trash2, AlertTriangle, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const SettingsModal = ({ user, onClose, onLogout }) => {
  if (!user) return null;

  const handleRemoveDevice = async (deviceId) => {
    if (window.confirm("CAUTION: This will immediately log out this device. The user will need to log in again. Proceed?")) {
        try {
            const userRef = doc(db, "users", user.uid);
            const updatedDevices = user.devices.filter(d => d.id !== deviceId);
            
            const updatePayload = { devices: updatedDevices };
            
            // If we are removing the CURRENT active device session, clear activeToken
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
            // Keep only current device
            const currentDevice = user.devices.find(d => d.id === user.activeToken);
            const updatedDevices = currentDevice ? [currentDevice] : [];
            
            await updateDoc(userRef, { devices: updatedDevices });
        } catch (err) {
            console.error("Error removing devices:", err);
            alert("Failed to remove devices.");
        }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0f172a]/95 p-6 text-white shadow-2xl backdrop-blur-3xl"
      >
        <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center">
             <div className="mr-3 rounded-xl bg-primary/20 p-2 text-primary">
                <Smartphone size={20} />
             </div>
             <h2 className="text-xl font-black uppercase tracking-tight">Account Settings</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-white/5 transition text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* User Info */}
          <div>
            <h3 className="mb-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Your Profile</h3>
            <div className="flex items-center rounded-2xl bg-white/[0.02] p-4 border border-white/5 shadow-inner">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-blue-500/20">
                    {user.username[0].toUpperCase()}
                </div>
                <div className="ml-4">
                    <p className="font-black text-xl tracking-tight text-white">{user.username}</p>
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">ID: {user.uid}</p>
                </div>
            </div>
          </div>

          {/* Active Devices */}
          <div>
            <div className="flex items-center justify-between mb-3">
               <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Active Sessions</h3>
               <div className="flex items-center text-[9px] text-yellow-500/80 font-bold uppercase tracking-widest bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                  <AlertTriangle size={10} className="mr-1" />
                  Single Device Rule
               </div>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {user.devices && user.devices.length > 0 ? (
                    user.devices.map((device, index) => (
                        <div key={index} className={`flex items-center justify-between rounded-2xl p-4 border transition-all ${
                            device.id === user.activeToken 
                                ? 'bg-primary/10 border-primary/30 shadow-lg shadow-primary/5' 
                                : 'bg-white/[0.02] border-white/5'
                        }`}>
                            <div className="flex items-center overflow-hidden">
                                <div className={`mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                     device.id === user.activeToken ? 'bg-primary text-white' : 'bg-white/5 text-gray-500'
                                }`}>
                                    {device.name.toLowerCase().includes("win") ? <Monitor size={20} /> : <Smartphone size={20} />}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-bold truncate text-gray-200">{device.name}</p>
                                    <p className="text-[10px] text-gray-500 font-medium">
                                        {new Date(device.loginTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4">
                                {device.id === user.activeToken ? (
                                    <span className="rounded-lg bg-green-500/20 px-2 py-1 text-[9px] font-black uppercase text-green-400 border border-green-500/30">
                                        Current
                                    </span>
                                ) : (
                                    <button 
                                        onClick={() => handleRemoveDevice(device.id)}
                                        className="rounded-lg bg-white/5 p-2 text-gray-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                        title="Remove Device"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-6 opacity-40">
                        <Smartphone size={32} className="mx-auto mb-2" />
                        <p className="text-xs font-bold uppercase tracking-widest">No active sessions</p>
                    </div>
                )}
            </div>
            
            {/* Delete All Other Devices Button */}
            {user.devices && user.devices.filter(d => d.id !== user.activeToken).length > 0 && (
                <button
                    onClick={handleDeleteAllOther}
                    className="w-full mt-3 rounded-lg bg-red-500/5 py-2.5 text-red-400 hover:bg-red-500/10 transition-all text-xs font-bold uppercase tracking-widest border border-red-500/20 flex items-center justify-center"
                >
                    <Trash2 size={14} className="mr-2" />
                    Delete All Other Devices ({user.devices.filter(d => d.id !== user.activeToken).length})
                </button>
            )}
          </div>
        </div>
        
        <div className="mt-8 space-y-2">
            <button 
                onClick={onLogout}
                className="w-full rounded-2xl bg-red-500/10 py-3 hover:bg-red-500 hover:text-white transition-all text-sm font-bold uppercase tracking-widest border border-red-500/30 text-red-400 flex items-center justify-center"
            >
                <LogOut size={18} className="mr-2" />
                Sign Out
            </button>
            
            <button 
                onClick={onClose}
                className="w-full rounded-2xl bg-white/5 py-3 hover:bg-white/10 transition text-sm font-bold uppercase tracking-widest border border-white/5"
            >
                Dismiss Settings
            </button>
        </div>

      </motion.div>
    </div>
  );
};

export default SettingsModal;

