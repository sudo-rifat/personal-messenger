import React, { useState, useEffect } from 'react';
import { Users, Plus, Settings, Shield, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import CreateJoinGroup from './CreateJoinGroup';

const Sidebar = ({ user, onLogout, activeGroup, setActiveGroup, onSettingsClick, onAdminClick }) => {
  const [groups, setGroups] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = React.useRef(null);

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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <>
    <div className={`flex h-full flex-col items-stretch border-r border-white/5 bg-black/20 py-4 md:py-8 transition-all duration-500 backdrop-blur-3xl shrink-0 ${
      activeGroup ? 'hidden md:flex md:w-80 md:px-4' : 'w-full md:w-80 px-4'
    }`}>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 p-4 md:p-6">
        <div className="flex items-center">
          <div className="mr-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-2.5 text-indigo-300">
            <Users size={22} />
          </div>
          <h1 className="text-lg font-black uppercase tracking-tight md:text-xl">Groups</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Plus Button */}
          <button 
              onClick={() => setShowGroupModal(true)}
              className="rounded-xl p-2 text-primary hover:bg-white/5 hover:text-white transition"
          >
            <Plus size={20} />
          </button>

          {/* Menu Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-xl p-2 text-gray-400 hover:bg-white/5 hover:text-white transition"
            >
              {showMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-12 bg-[#0f172a]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl p-2 min-w-[200px] z-50">
                <button
                  onClick={() => {
                    onSettingsClick();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 rounded-lg transition"
                >
                  <Settings size={16} className="mr-3" />
                  Settings
                </button>
                
                {user.isAdmin && (
                  <button
                    onClick={() => {
                      onAdminClick();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  >
                    <Shield size={16} className="mr-3" />
                    Command Center
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
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
    </div>



    {showGroupModal && <CreateJoinGroup user={user} onClose={() => setShowGroupModal(false)} onGroupJoined={fetchGroups} />}
    </>
  );
};

export default Sidebar;
