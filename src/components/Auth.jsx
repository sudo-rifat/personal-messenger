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
    <div className="flex min-h-screen items-center justify-center p-4">
       <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-glassBorder bg-glass p-8 shadow-2xl backdrop-blur-xl"
       >
          <div className="mb-8 flex justify-center">
            <div className="rounded-full bg-primary/20 p-4">
              <ShieldCheck size={48} className="text-primary" />
            </div>
          </div>

          <h2 className="mb-2 text-center text-3xl font-bold">{isLogin ? "Welcome Back" : "Create Account"}</h2>
          <p className="mb-8 text-center text-gray-400">
            {isLogin ? "Login to continue to message." : "Join the private network."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-12 pr-4 text-white placeholder-gray-500 outline-none focus:border-primary/50"
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-12 pr-4 text-white placeholder-gray-500 outline-none focus:border-primary/50"
              />
            </div>

            {error && <p className="text-center text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 font-semibold text-white shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? "Processing..." : (isLogin ? "Login Securely" : "Register Now")}
              {!loading && <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" size={20} />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-gray-400 hover:text-white hover:underline"
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
            </button>
          </div>
       </motion.div>
    </div>
  );
};

export default Auth;
