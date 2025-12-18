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
    <div className="flex h-full w-20 flex-col items-center border-r border-glassBorder bg-black/10 py-6 md:w-80 md:items-stretch md:px-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between px-2">
        <h1 className="hidden text-xl font-bold tracking-tight md:block">Groups</h1>
        <button 
            onClick={() => setShowGroupModal(true)}
            className="rounded-full bg-primary/20 p-2 text-primary transition hover:bg-primary hover:text-white"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Groups List */}
      <div className="flex-1 space-y-2 overflow-y-auto px-1 pr-1 scrollbar-hide">
        {groups.map((group) => (
          <motion.div
            key={group.id}
            onClick={() => setActiveGroup(group.id)} 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex cursor-pointer items-center rounded-xl p-3 transition-colors ${
              activeGroup === group.id ? 'bg-primary/20 border border-primary/30' : 'hover:bg-white/5 border border-transparent'
            }`}
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 md:h-12 md:w-12">
              <Users size={20} />
            </div>
            
            <div className="ml-3 hidden flex-1 overflow-hidden md:block">
               <h3 className="truncate text-sm font-semibold">{group.name}</h3>
               <p className="text-xs text-gray-400">Code: {group.code}</p>
            </div>
          </motion.div>
        ))}
        {groups.length === 0 && (
            <div className="text-center text-gray-500 text-sm mt-10">
                No groups yet. <br/> Join or create one!
            </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 border-t border-glassBorder pt-4 space-y-2 md:px-2">
        {user.isAdmin && (
            <button 
                onClick={onAdminClick}
                className="flex w-full items-center justify-center rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500 hover:text-white md:justify-start"
            >
            <Shield size={20} />
            <span className="ml-2 hidden text-sm md:block">Admin Panel</span>
            </button>
        )}
        
        <button 
            onClick={onSettingsClick}
            className="flex w-full items-center justify-center p-2 text-gray-400 hover:text-white md:justify-start"
        >
          <Settings size={20} />
          <span className="ml-2 hidden text-sm md:block">Settings & Devices</span>
        </button>

        <button 
           onClick={onLogout}
           className="flex w-full items-center justify-center p-2 text-gray-400 hover:text-white md:justify-start"
        >
          <LogOut size={20} />
          <span className="ml-2 hidden text-sm md:block">Logout</span>
        </button>
      </div>
    </div>

    {showGroupModal && <CreateJoinGroup user={user} onClose={() => setShowGroupModal(false)} onGroupJoined={fetchGroups} />}
    </>
  );
};

export default Sidebar;
