import React, { useState, useEffect } from 'react';
import { Search, Plus, Settings, LogOut, Shield, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import CreateJoinGroup from './CreateJoinGroup';

const Sidebar = ({ user, onLogout, activeGroup, setActiveGroup, onSettingsClick, onAdminClick }) => {
  const [groups, setGroups] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const fetchGroups = async () => {
    if (!user) return;
    try {
        const q = query(collection(db, "groups"), where("members", "array-contains", user.uid));
        const snapshot = await getDocs(q);
        const userGroups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGroups(userGroups);
    } catch (e) {
        console.error(e);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [user]);

  return (
    <>
    <div className={`flex h-full flex-col items-stretch border-r border-white/5 bg-black/20 py-4 md:py-8 transition-all duration-500 backdrop-blur-3xl ${
      activeGroup ? 'hidden md:flex w-0' : 'w-full md:w-80 px-4'
    }`}>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between px-2">
        <div className="flex flex-col">
            <h1 className={`${activeGroup ? 'hidden md:block' : 'block'} text-2xl font-black tracking-tighter bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent`}>Groups</h1>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-0.5">Community</p>
        </div>
        <button 
            onClick={() => setShowGroupModal(true)}
            className="rounded-2xl bg-white/5 p-3 text-primary transition-all hover:bg-primary hover:text-white shadow-lg hover:shadow-primary/20"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Groups List */}
      <div className="flex-1 space-y-3 overflow-y-auto px-1 pr-1 custom-scrollbar">
        {groups.map((group) => (
          <motion.div
            key={group.id}
            onClick={() => setActiveGroup(group.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex cursor-pointer items-center rounded-2xl p-4 transition-all duration-300 group ${
              activeGroup === group.id 
                ? 'bg-gradient-to-r from-primary/20 to-indigo-500/10 border border-primary/30 shadow-lg shadow-primary/10' 
                : 'hover:bg-white/[0.03] border border-transparent'
            }`}
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-500 shrink-0 ${
              activeGroup === group.id 
                ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30' 
                : 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white'
            }`}>
              <Users size={22} />
            </div>
            
            <div className={`ml-4 flex-1 overflow-hidden transition-opacity duration-300 ${activeGroup ? 'hidden md:block' : 'block'}`}>
               <h3 className={`truncate text-sm font-bold tracking-tight ${activeGroup === group.id ? 'text-white' : 'text-gray-300'}`}>
                 {group.name}
               </h3>
               <p className="text-[11px] font-medium text-gray-500 uppercase tracking-tighter">ID: {group.code}</p>
            </div>
            
            {activeGroup === group.id && (
                <div className="ml-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
            )}
          </motion.div>
        ))}
        {groups.length === 0 && (
            <div className="text-center text-gray-500 py-10 opacity-50">
                <Users size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">No groups found</p>
                <p className="text-[10px] mt-2">Join a group to start chatting</p>
            </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 space-y-1 border-t border-white/5 pt-6">
        {user.isAdmin && (
            <button 
                onClick={onAdminClick}
                className="flex w-full items-center rounded-xl bg-red-500/5 p-3 text-red-400 transition-all hover:bg-red-500 hover:text-white group"
            >
                <Shield size={20} className="shrink-0" />
                <span className={`ml-3 ${activeGroup ? 'hidden md:block' : 'block'} text-xs font-black uppercase tracking-widest`}>Command Center</span>
            </button>
        )}
        
        <button 
            onClick={onSettingsClick}
            className="flex w-full items-center p-3 text-gray-400 transition-all hover:text-white group"
        >
          <Settings size={20} className="shrink-0" />
          <span className={`ml-3 ${activeGroup ? 'hidden md:block' : 'block'} text-sm font-semibold`}>Account Settings</span>
        </button>

        <button 
           onClick={onLogout}
           className="flex w-full items-center p-3 text-gray-400 transition-all hover:text-red-400 group"
        >
          <LogOut size={20} className="shrink-0" />
          <span className={`ml-3 ${activeGroup ? 'hidden md:block' : 'block'} text-sm font-semibold`}>Sign Out</span>
        </button>
      </div>
    </div>


    {showGroupModal && <CreateJoinGroup user={user} onClose={() => setShowGroupModal(false)} onGroupJoined={fetchGroups} />}
    </>
  );
};

export default Sidebar;
