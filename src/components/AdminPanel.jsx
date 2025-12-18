import React, { useState, useEffect } from 'react';
import { X, Trash2, Shield, Search, User, Filter, Users, Hash, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';

const AdminPanel = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("users"); // "users" or "groups"
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  const toggleAdmin = async (user) => {
    if (user.username === "admin") return; // Safety
    try {
        await updateDoc(doc(db, "users", user.id), {
            isAdmin: !user.isAdmin
        });
        setData(data.map(u => u.id === user.id ? { ...u, isAdmin: !u.isAdmin } : u));
    } catch (err) {
        alert("Failed to update status.");
    }
  };

  const filteredData = data.filter(item => {
    const searchIn = activeTab === "users" ? item.username : item.name;
    return searchIn?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0f172a]/95 text-white shadow-2xl"
      >
        {/* Header Section */}
        <div className="flex flex-col border-b border-white/10 bg-white/5">
            <div className="flex items-center justify-between p-6">
                <div className="flex items-center">
                    <div className="mr-4 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 p-3 shadow-lg shadow-red-500/20">
                        <Shield size={28} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-extrabold tracking-tight">Command Center</h2>
                        <p className="text-sm text-gray-400">Advanced System Oversight</p>
                    </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="rounded-full bg-white/5 p-2 text-gray-400 hover:bg-red-500 hover:text-white transition-all"
                >
                    <X size={24} />
                </button>
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

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/5 bg-black/20 p-6">
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
            <div className="flex items-center space-x-4">
                <div className="rounded-lg bg-primary/10 px-4 py-2 border border-primary/20">
                    <span className="text-xs text-gray-400 mr-2 uppercase">Total {activeTab}</span>
                    <span className="text-lg font-black text-primary">{data.length}</span>
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

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
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
                                    <div className="flex items-center">
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl font-black text-xl shadow-inner ${
                                            activeTab === "users" ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'
                                        }`}>
                                            {activeTab === "users" ? item.username[0].toUpperCase() : item.name[0].toUpperCase()}
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-bold flex items-center">
                                                {activeTab === "users" ? item.username : item.name}
                                                {activeTab === "users" && item.isAdmin && (
                                                    <Shield size={14} className="ml-2 text-red-400" />
                                                )}
                                            </h3>
                                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{item.id.slice(0, 12)}...</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex space-x-2">
                                        {activeTab === "users" ? (
                                            <>
                                                <button 
                                                    onClick={() => toggleAdmin(item)}
                                                    className={`rounded-lg p-2 transition-colors ${
                                                        item.isAdmin ? 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-gray-500/10 text-gray-400 hover:bg-primary/20 hover:text-primary'
                                                    }`}
                                                    title={item.isAdmin ? "Remove Admin" : "Demote to Admin"}
                                                >
                                                    <Shield size={18} />
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
                                            <button 
                                                onClick={() => handleDeleteGroup(item.id)}
                                                className="rounded-lg bg-white/5 p-2 text-gray-500 hover:bg-red-500 hover:text-white transition-all"
                                                title="Delete Group"
                                            >
                                                <Trash2 size={18} />
                                            </button>
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
        </div>
      </motion.div>
    </div>
  );
};

export default AdminPanel;

