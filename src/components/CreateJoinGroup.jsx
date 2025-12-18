import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, arrayUnion, doc, getDoc } from 'firebase/firestore';
import { Users, Plus, Hash } from 'lucide-react';
import { motion } from 'framer-motion';

const CreateJoinGroup = ({ user, onClose, onGroupJoined }) => {
  const [mode, setMode] = useState('join'); // 'join' or 'create'
  const [groupName, setGroupName] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [error, setError] = useState("");

  const handleAction = async () => {
    setError("");
    if (!groupCode) return;

    try {
      const groupsRef = collection(db, "groups");

      if (mode === 'join') {
        const q = query(groupsRef, where("code", "==", groupCode));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError("Invalid Group Code");
          return;
        }

        const groupDoc = querySnapshot.docs[0];
        // Add user to group members
        await updateDoc(doc(db, "groups", groupDoc.id), {
          members: arrayUnion(user.uid)
        });
        
        onGroupJoined();
        onClose();

      } else {
        // Create Logic
        if (!groupName) {
            setError("Group Name is required");
            return;
        }
        // Check if code exists
        const q = query(groupsRef, where("code", "==", groupCode));
        const check = await getDocs(q);
        if (!check.empty) {
            setError("Code already taken. Choose another.");
            return;
        }

        await addDoc(groupsRef, {
            name: groupName,
            code: groupCode,
            createdBy: user.uid,
            members: [user.uid],
            createdAt: new Date().toISOString()
        });
        
        onGroupJoined();
        onClose();
      }

    } catch (err) {
      console.error(err);
      setError("Failed. Try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        className="w-full max-w-sm rounded-2xl bg-[#1e293b] p-6 border border-white/10 shadow-2xl"
      >
        <h3 className="text-xl font-bold mb-4">{mode === 'join' ? "Join a Group" : "Create a Group"}</h3>
        
        <div className="space-y-4">
            {mode === 'create' && (
                <input 
                    className="w-full rounded-lg bg-black/30 p-3 outline-none border border-white/10 focus:border-primary"
                    placeholder="Group Name"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                />
            )}
            <input 
                className="w-full rounded-lg bg-black/30 p-3 outline-none border border-white/10 focus:border-primary"
                placeholder={mode === 'join' ? "Enter Group Code" : "Set Access Code"}
                value={groupCode}
                onChange={e => setGroupCode(e.target.value)}
            />
        </div>

        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

        <div className="mt-6 flex gap-2">
            <button onClick={onClose} className="flex-1 rounded-lg bg-white/5 py-2 hover:bg-white/10">Cancel</button>
            <button onClick={handleAction} className="flex-1 rounded-lg bg-primary py-2 hover:bg-blue-600">
                {mode === 'join' ? "Join" : "Create"}
            </button>
        </div>

        <p 
            onClick={() => setMode(mode === 'join' ? 'create' : 'join')}
            className="text-center text-xs text-gray-400 mt-4 cursor-pointer hover:text-white"
        >
            {mode === 'join' ? "Want to create a group?" : "Have a code to join?"}
        </p>

      </motion.div>
    </div>
  );
};

export default CreateJoinGroup;
