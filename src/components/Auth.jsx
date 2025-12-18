import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError("");

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (isLogin) {
        // LOGIN LOGIC
        if (querySnapshot.empty) {
          setError("User not found.");
          setLoading(false);
          return;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        if (userData.password !== password) {
          setError("Incorrect password.");
          setLoading(false);
          return;
        }

        // Generate new session token
        const newToken = uuidv4();
        
        // Update device info
        const deviceName = navigator.userAgent; // Simple device info
        const newDevice = {
            id: newToken,
            name: deviceName,
            loginTime: new Date().toISOString()
        };

        // Update Firestore: Set activeToken AND add to devices list (for history/settings)
        await updateDoc(doc(db, "users", userDoc.id), {
          activeToken: newToken,
          devices: [newDevice, ...(userData.devices || [])].slice(0, 5) // Keep last 5 logins
        });

        // Save to LocalStorage
        localStorage.setItem("skylark_user", JSON.stringify({ ...userData, uid: userDoc.id }));
        localStorage.setItem("skylark_token", newToken);

        onLogin({ ...userData, uid: userDoc.id, activeToken: newToken });

      } else {
        // REGISTER LOGIC
        if (!querySnapshot.empty) {
          setError("Username already exists.");
          setLoading(false);
          return;
        }

        const newToken = uuidv4();
        const newUser = {
          username,
          password, // In production, hash this!
          activeToken: newToken,
          isAdmin: false, // Default false, manually set to true for Admin
          createdAt: new Date().toISOString(),
          devices: [{ id: newToken, name: navigator.userAgent, loginTime: new Date().toISOString() }]
        };

        const docRef = await addDoc(usersRef, newUser);
        
        // Save to LocalStorage
        localStorage.setItem("skylark_user", JSON.stringify({ ...newUser, uid: docRef.id }));
        localStorage.setItem("skylark_token", newToken);

        onLogin({ ...newUser, uid: docRef.id });
      }

    } catch (err) {
      console.error(err);
      setError("An error occurred. Try again.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 relative overflow-hidden bg-[#020617]">
       {/* Background Glows for Auth */}
       <div className="pointer-events-none absolute -left-20 top-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[100px]"></div>
       <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-indigo-600/10 blur-[100px]"></div>

       <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-10 shadow-2xl backdrop-blur-3xl relative z-10"
       >
          <div className="mb-10 flex flex-col items-center">
             <div className="mb-6 rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 p-5 shadow-xl shadow-blue-500/20">
               <ShieldCheck size={40} className="text-white" />
             </div>
             <h2 className="text-4xl font-black tracking-tighter text-white">{isLogin ? "Sign In" : "Join Us"}</h2>
             <p className="mt-2 text-sm font-medium text-gray-500 uppercase tracking-[0.2em]">
               {isLogin ? "Secure Channel" : "Private Network"}
             </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-500">Username</label>
                <div className="relative group">
                    <User className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="e.g. rifat_admin"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full rounded-2xl border border-white/5 bg-white/[0.03] py-3.5 pl-12 pr-4 text-white placeholder-gray-600 outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all"
                    />
                </div>
            </div>
            
            <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-500">Password</label>
                <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-2xl border border-white/5 bg-white/[0.03] py-3.5 pl-12 pr-4 text-white placeholder-gray-600 outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all"
                    />
                </div>
            </div>

            {error && (
                <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center rounded-xl bg-red-500/10 p-3 text-xs font-bold text-red-400 border border-red-500/20"
                >
                    <ArrowRight size={14} className="mr-2 rotate-180" />
                    {error}
                </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 py-4 font-black uppercase tracking-widest text-white shadow-xl shadow-blue-900/40 transition-all disabled:opacity-50"
            >
              {loading ? "Verifying..." : (isLogin ? "Authenticate" : "Create Account")}
              {!loading && <ArrowRight className="ml-3 transition-transform group-hover:translate-x-1" size={18} />}
            </motion.button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-bold text-gray-500 hover:text-white transition-colors"
            >
              {isLogin ? "NEW HERE? CREATE AN ACCOUNT" : "ALREADY ENROLLED? SIGN IN"}
            </button>
          </div>
       </motion.div>
    </div>
  );
};

export default Auth;

