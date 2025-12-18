import React, { useState, useEffect } from 'react';
import { X, Trash2, Shield, Search, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

const AdminPanel = ({ onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching users:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "users", userId));
        setUsers(users.filter(user => user.id !== userId));
      } catch (err) {
        console.error("Error deleting user:", err);
        alert("Failed to delete user.");
      }
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="flex h-[80vh] w-full max-w-4xl flex-col rounded-2xl border border-glassBorder bg-[#1e293b]/90 text-white shadow-2xl backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <div className="flex items-center">
             <div className="mr-4 rounded-full bg-red-500/20 p-3 text-red-400">
                <Shield size={24} />
             </div>
             <div>
                <h2 className="text-2xl font-bold">Admin Panel</h2>
                <p className="text-sm text-gray-400">User Management System</p>
             </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10 transition">
            <X size={24} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between bg-black/20 p-4 border-b border-white/5">
            <div className="relative w-full max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search users..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white focus:border-primary/50 focus:outline-none"
                />
            </div>
            <div className="ml-4 text-sm text-gray-400">
                Total Users: <span className="text-white font-bold">{users.length}</span>
            </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
            {loading ? (
                <div className="flex bg-white/5 rounded-xl p-8 justify-center">Loading users...</div>
            ) : (
                <div className="space-y-2">
                    {filteredUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-4 transition hover:bg-white/10">
                            <div className="flex items-center">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-lg">
                                    {user.username[0].toUpperCase()}
                                </div>
                                <div className="ml-4">
                                    <h3 className="font-semibold flex items-center">
                                        {user.username}
                                        {user.isAdmin && <span className="ml-2 rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-300 border border-red-500/30">ADMIN</span>}
                                    </h3>
                                    <p className="text-xs text-gray-400">ID: {user.id}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-6">
                                <div className="text-right text-xs text-gray-400 hidden md:block">
                                    <p>Created: {new Date(user.createdAt).toLocaleDateString()}</p>
                                    <p>Devices: {user.devices?.length || 0}</p>
                                </div>
                                {user.username !== "admin" && ( 
                                    <button 
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500 hover:text-white transition"
                                        title="Delete User"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredUsers.length === 0 && (
                        <div className="text-center text-gray-500 py-10">No users found.</div>
                    )}
                </div>
            )}
        </div>

      </motion.div>
    </div>
  );
};

export default AdminPanel;
