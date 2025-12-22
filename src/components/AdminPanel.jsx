import React, { useState, useEffect } from 'react';
import { X, Trash2, Shield, Search, User, Filter, Users, Hash, AlertTriangle, CheckCircle, Edit, UserMinus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy, updateDoc, arrayRemove, where, getDoc } from 'firebase/firestore';

const AdminPanel = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("users");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupMessages, setGroupMessages] = useState([]);

  // Fetch detailed group data
  const handleManageGroup = async (group) => {
    setSelectedGroup(group);
    setLoading(true);
    try {
        // Fetch Members
        const membersData = [];
        if (group.members && group.members.length > 0) {
            for (const memberId of group.members) {
                const memberDoc = await getDoc(doc(db, "users", memberId));
                if (memberDoc.exists()) {
                    membersData.push({ id: memberDoc.id, ...memberDoc.data() });
                }
            }
        }
        setGroupMembers(membersData);

        // Fetch Messages
        const msgQuery = query(collection(db, "messages"), where("groupId", "==", group.id), orderBy("createdAt", "desc"));
        const msgSnapshot = await getDocs(msgQuery);
        setGroupMessages(msgSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (err) {
        console.error("Error details:", err);
        alert("Failed to load group details.");
    } finally {
        setLoading(false);
    }
  };

  const handleRemoveMemberFromGroup = async (memberId) => {
      if (!confirm("Remove this member from group?")) return;
      try {
          await updateDoc(doc(db, "groups", selectedGroup.id), {
              members: arrayRemove(memberId)
          });
          setGroupMembers(prev => prev.filter(m => m.id !== memberId));
          alert("Member removed.");
      } catch (err) {
          console.error(err);
          alert("Failed.");
      }
  };

  const handleDeleteMessage = async (msgId) => {
      if (!confirm("Delete this message?")) return;
      try {
          await deleteDoc(doc(db, "messages", msgId));
          setGroupMessages(prev => prev.filter(m => m.id !== msgId));
      } catch (err) {
          console.error(err);
          alert("Failed.");
      }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "users") {
        const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        const q = query(collection(db, "groups"), orderBy("name"));
        const snapshot = await getDocs(q);
        setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user? All their session data will be lost.")) {
      try {
        await deleteDoc(doc(db, "users", userId));
        setData(data.filter(item => item.id !== userId));
      } catch (err) {
        alert("Failed to delete user.");
      }
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm("Delete this group? This will remove access for all members.")) {
      try {
        await deleteDoc(doc(db, "groups", groupId));
        setData(data.filter(item => item.id !== groupId));
      } catch (err) {
        alert("Failed to delete group.");
      }
    }
  };

  const handleImpersonate = (targetUser) => {
    if (window.confirm(`Switch to ${targetUser.username}'s account? You will see their messages and groups.`)) {
        // Save current admin session to backup
        const adminUser = localStorage.getItem("skylark_user");
        const adminToken = localStorage.getItem("skylark_token");
        
        localStorage.setItem("skylark_admin_backup", JSON.stringify({ 
            user: JSON.parse(adminUser), 
            token: adminToken 
        }));


        // Map 'id' to 'uid' for proper user object structure
        const impersonatedUser = {
            ...targetUser,
            uid: targetUser.id || targetUser.uid
        };

        localStorage.setItem("skylark_user", JSON.stringify(impersonatedUser));
        localStorage.setItem("skylark_token", targetUser.activeToken || "impersonated");
        window.location.reload();
    }
  };

  const filteredData = data.filter(item => {
    const searchIn = activeTab === "users" ? item.username : item.name;
    return searchIn?.toLowerCase().includes(searchTerm.toLowerCase());
  });


  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#0f172a]/50 text-white">
        {/* Header Section */}
        <div className="flex flex-col border-b border-white/10 bg-white/5">
            <div className="flex items-center justify-between p-4 md:p-6">
                <div className="flex items-center">
                    <div className="mr-3 md:mr-4 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 p-2.5 md:p-3 shadow-lg shadow-red-500/20">
                        <Shield size={24} className="text-white md:w-7 md:h-7" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">Command Center</h2>
                        <p className="text-[10px] md:text-xs font-medium text-gray-400">System Administration & Controls</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex px-6 space-x-8">
                {["users", "groups"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`relative pb-4 text-sm font-bold uppercase tracking-wider transition-colors ${
                            activeTab === tab ? 'text-primary' : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        <div className="flex items-center space-x-2">
                             {tab === "users" ? <Users size={16} /> : <Hash size={16} />}
                             <span>{tab}</span>
                        </div>
                        {activeTab === tab && (
                            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>
        </div>

        {/* Details View Header - Only show if selectedGroup active */}
        {selectedGroup && (
             <div className="flex items-center justify-between border-b border-white/5 bg-black/20 p-4">
                <div className="flex items-center">
                    <button onClick={() => setSelectedGroup(null)} className="mr-4 rounded-lg bg-white/5 p-2 hover:bg-white/10">
                        <X size={18} />
                    </button>
                    <div>
                        <h3 className="font-bold text-lg">{selectedGroup.name}</h3>
                        <p className="text-[10px] text-gray-400 font-mono">ID: {selectedGroup.id}</p>
                    </div>
                </div>
             </div>
        )}

        {!selectedGroup && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/5 bg-black/20 p-4 md:p-6">
            <div className="relative w-full max-w-lg">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder={`Search ${activeTab}...`} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-sm text-white placeholder-gray-500 focus:border-primary/50 focus:bg-white/10 focus:outline-none transition-all"
                />
            </div>
            <div className="flex w-full md:w-auto items-center justify-between md:justify-end space-x-4">
                <div className="rounded-lg bg-primary/10 px-4 py-2 border border-primary/20 flex items-center">
                    <span className="text-[10px] md:text-xs text-gray-400 mr-2 uppercase">Total {activeTab}</span>
                    <span className="text-base md:text-lg font-black text-primary">{data.length}</span>
                </div>
                <button 
                    onClick={fetchData}
                    className="rounded-lg bg-white/5 p-2.5 text-gray-400 hover:bg-white/10 transition"
                    title="Refresh Data"
                >
                    <Users size={18} />
                </button>
            </div>
        </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {selectedGroup ? (
                // Group Details View
                <div className="space-y-8 animate-in slide-in-from-right duration-300">
                    
                    {/* Members Section */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Group Members ({groupMembers.length})</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {groupMembers.map(member => (
                                <div key={member.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                                    <div className="flex items-center">
                                        <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-xs mr-3">
                                            {member.username[0].toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold truncate text-gray-200">{member.username}</p>
                                            <p className="text-[10px] text-gray-500 truncate">{member.id}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveMemberFromGroup(member.id)}
                                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                        title="Remove Member"
                                    >
                                        <UserMinus size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Messages Section */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Recent Messages ({groupMessages.length})</h4>
                        <div className="space-y-2">
                            {groupMessages.map(msg => (
                                <div key={msg.id} className="group flex items-start justify-between bg-white/[0.02] p-3 rounded-xl hover:bg-white/5 transition border border-white/5 hover:border-white/10">
                                    <div className="flex-1 min-w-0 mr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold text-indigo-400">{msg.senderName || "Unknown"}</span>
                                            <span className="text-[9px] text-gray-600">{msg.createdAt?.toDate?.().toLocaleString() || "Just now"}</span>
                                        </div>
                                        <p className="text-sm text-gray-300 break-words">{msg.text}</p>
                                        {msg.file && (
                                            <div className="mt-1 text-[10px] text-blue-400 flex items-center bg-blue-500/10 px-2 py-1 rounded w-fit">
                                                File Attached
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteMessage(msg.id)}
                                        className="md:opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                        title="Delete Message"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {groupMessages.length === 0 && <p className="text-sm text-gray-600 italic">No messages found.</p>}
                        </div>
                    </div>

                </div>
            ) : (
                <>
                    {/* List View */}
                    {loading ? (
                        <div className="flex h-64 items-center justify-center space-x-3">
                            <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]"></div>
                            <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]"></div>
                            <div className="h-2 w-2 animate-bounce rounded-full bg-primary"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <AnimatePresence mode="popLayout">
                                {filteredData.map((item) => (
                                    <motion.div 
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        key={item.id} 
                                        className="group flex flex-col justify-between rounded-2xl border border-white/5 bg-white/5 p-5 transition-all hover:border-primary/30 hover:bg-white/10"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center flex-1 min-w-0 mr-3">
                                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-black text-xl shadow-inner ${
                                                    activeTab === "users" ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'
                                                }`}>
                                                    {activeTab === "users" ? item.username[0].toUpperCase() : item.name[0].toUpperCase()}
                                                </div>
                                                <div className="ml-3 md:ml-4 flex-1 min-w-0">
                                                    <h3 className="text-base md:text-lg font-bold flex items-center truncate">
                                                        {activeTab === "users" ? item.username : item.name}
                                                        {activeTab === "users" && item.isAdmin && (
                                                            <Shield size={14} className="ml-2 text-red-400 shrink-0" />
                                                        )}
                                                    </h3>
                                                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest truncate">{item.id}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex space-x-2 shrink-0">
                                                {activeTab === "users" ? (
                                                    <>
                                                        <button 
                                                            onClick={() => handleImpersonate(item)}
                                                            className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all"
                                                            title="Access This Account"
                                                        >
                                                            <User size={18} />
                                                        </button>
                                                        {item.username !== "admin" && (
                                                            <button 
                                                                onClick={() => handleDeleteUser(item.id)}
                                                                className="rounded-lg bg-white/5 p-2 text-gray-500 hover:bg-red-500 hover:text-white transition-all"
                                                                title="Delete User"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <button 
                                                            onClick={() => handleManageGroup(item)}
                                                            className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
                                                            title="Manage Group"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteGroup(item.id)}
                                                            className="rounded-lg bg-white/5 p-2 text-gray-500 hover:bg-red-500 hover:text-white transition-all"
                                                            title="Delete Group"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4 text-[11px] text-gray-400">
                                            {activeTab === "users" ? (
                                                <>
                                                    <div className="flex items-center">
                                                        <CheckCircle size={10} className="mr-1 text-green-500" />
                                                        Verified Sessions: {item.devices?.length || 0}
                                                    </div>
                                                    <div>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Legacy Account'}</div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex items-center">
                                                        <Users size={10} className="mr-1 text-blue-400" />
                                                        Members: {item.members?.length || 0}
                                                    </div>
                                                    <div className="rounded bg-white/5 px-2 py-0.5 font-mono text-white">CODE: {item.code}</div>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                    
                    {!loading && filteredData.length === 0 && (
                        <div className="flex h-48 flex-col items-center justify-center text-gray-500">
                            <AlertTriangle size={48} className="mb-2 opacity-20" />
                            <p>No results found matching your search.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    </div>
  );
};

export default AdminPanel;

