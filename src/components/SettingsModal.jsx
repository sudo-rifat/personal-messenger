import React from 'react';
import { X, Smartphone, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SettingsModal = ({ user, onClose }) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg rounded-2xl border border-glassBorder bg-[#1e293b]/90 p-6 text-white shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold">Account Settings</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-white/10 transition">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* User Info */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">Profile</h3>
            <div className="flex items-center rounded-xl bg-black/20 p-3 border border-white/5">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-xl font-bold">
                    {user.username[0].toUpperCase()}
                </div>
                <div className="ml-4">
                    <p className="font-medium text-lg">{user.username}</p>
                    <p className="text-sm text-gray-500">ID: {user.uid}</p>
                </div>
            </div>
          </div>

          {/* Active Devices */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">Active Devices</h3>
            <p className="text-xs text-gray-500 mb-3">
                These devices are currently logged into your account. Only one active session is allowed at a time.
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {user.devices && user.devices.length > 0 ? (
                    user.devices.map((device, index) => (
                        <div key={index} className="flex items-center justify-between rounded-lg bg-black/20 p-3 border border-white/5">
                            <div className="flex items-center">
                                {device.name.toLowerCase().includes("mobile") ? (
                                    <Smartphone size={18} className="text-gray-400 mr-3" />
                                ) : (
                                    <Monitor size={18} className="text-gray-400 mr-3" />
                                )}
                                <div>
                                    <p className="text-sm font-medium truncate max-w-[200px]">{device.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(device.loginTime).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            {device.id === user.activeToken && (
                                <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400 border border-green-500/30">
                                    Current
                                </span>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-sm">No device history found.</p>
                )}
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end">
            <button 
                onClick={onClose}
                className="rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20 transition text-sm"
            >
                Close
            </button>
        </div>

      </motion.div>
    </div>
  );
};

export default SettingsModal;
