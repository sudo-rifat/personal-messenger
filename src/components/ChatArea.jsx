import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, Paperclip, MoreVertical, Users, ArrowLeft, Home, LogOut, UserMinus, X, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, addDoc, query, onSnapshot, serverTimestamp, where, doc, getDoc, updateDoc, arrayRemove, getDocs } from 'firebase/firestore';

const ChatArea = ({ user, activeGroupId, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [groupData, setGroupData] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!activeGroupId) return;

    const q = query(collection(db, "messages"), where("groupId", "==", activeGroupId));
    const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      msgs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
        return timeA - timeB;
      });
      
      setMessages(msgs);
    });

    return () => unsubscribeSnapshot();
  }, [activeGroupId]);

  // Fetch group data
  useEffect(() => {
    if (!activeGroupId) return;
    
    const fetchGroup = async () => {
      try {
        const groupDoc = await getDoc(doc(db, "groups", activeGroupId));
        if (groupDoc.exists()) {
          setGroupData({ id: groupDoc.id, ...groupDoc.data() });
        }
      } catch (err) {
        console.error("Error fetching group:", err);
      }
    };
    
    fetchGroup();
  }, [activeGroupId]);

  // Fetch group members details
  const fetchGroupMembers = async () => {
    if (!groupData?.members) return;
    
    try {
      const usersQuery = query(collection(db, "users"));
      const snapshot = await getDocs(usersQuery);
      const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const members = allUsers.filter(u => groupData.members.includes(u.id));
      setGroupMembers(members);
    } catch (err) {
      console.error("Error fetching members:", err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update last seen when viewing messages
  useEffect(() => {
    if (!activeGroupId || messages.length === 0) return;
    
    // Get timestamp of latest message
    const latestMessage = messages[messages.length - 1];
    const latestTime = latestMessage.createdAt?.toMillis?.() || Date.now();
    
    // Update last seen in localStorage
    try {
      const lastSeen = JSON.parse(localStorage.getItem('skylark_last_seen_messages') || '{}');
      lastSeen[activeGroupId] = latestTime;
      localStorage.setItem('skylark_last_seen_messages', JSON.stringify(lastSeen));
    } catch (err) {
      console.error('Failed to update last seen:', err);
    }
  }, [activeGroupId, messages]);

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

  const handleSend = async () => {
    if (!inputText.trim() || !user || !activeGroupId) return;
    
    try {
        await addDoc(collection(db, "messages"), {
          text: inputText,
          sender: user.username,
          uid: user.uid,
          groupId: activeGroupId,
          createdAt: serverTimestamp()
        });
        setInputText("");
    } catch (e) {
        console.error("Error sending message: ", e);
        alert("Message failed to send. Check Firebase console for errors.");
    }
  };

  const handleLeaveGroup = async () => {
    if (window.confirm(`Are you sure you want to leave "${groupData?.name}"?`)) {
      try {
        const groupRef = doc(db, "groups", activeGroupId);
        await updateDoc(groupRef, {
          members: arrayRemove(user.uid)
        });
        onBack();
      } catch (err) {
        console.error("Error leaving group:", err);
        alert("Failed to leave group.");
      }
    }
  };

  const handleRemoveMember = async (memberId, memberUsername) => {
    if (window.confirm(`Remove ${memberUsername} from "${groupData?.name}"?`)) {
      try {
        const groupRef = doc(db, "groups", activeGroupId);
        await updateDoc(groupRef, {
          members: arrayRemove(memberId)
        });
        // Refresh member list
        await fetchGroupMembers();
      } catch (err) {
        console.error("Error removing member:", err);
        alert("Failed to remove member.");
      }
    }
  };

  const isAdmin = groupData?.admin === user.uid;

  if (!activeGroupId) {
       return (
        <div className="hidden md:flex flex-1 items-center justify-center bg-white/5 text-gray-400">
            <div className="text-center">
                <Users size={64} className="mx-auto mb-4 opacity-50" />
                <p>Select a group from the sidebar <br/> or join one to start chatting.</p>
            </div>
        </div>
       )
  }

  return (
    <div className="flex flex-1 flex-col bg-white/[0.01] relative h-full overflow-hidden">
      {/* Header - Fixed for mobile viewport */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/5 bg-black/20 px-4 pb-3 md:pb-0 md:h-20 md:px-6 backdrop-blur-xl z-20" style={{ paddingTop: 'max(env(safe-area-inset-top), 1.5rem)' }}>
        <div className="flex items-center">
          <button 
            onClick={onBack}
            className="mr-3 rounded-xl bg-white/5 p-2 text-gray-400 hover:bg-white/10 hover:text-white md:hidden transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          
          <div className="relative">
             <div className="mr-3 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-white/5">
                <Users size={20} />
             </div>
             <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0f172a] bg-green-500"></div>
          </div>
          <div>
            <h2 className="text-sm font-bold md:text-lg tracking-tight">{groupData?.name || "Group Chat"}</h2>
            <div className="flex items-center text-[10px] md:text-xs text-green-400 font-medium">
                <span className="mr-1.5 flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                {groupData?.members?.length || 0} Members
            </div>
          </div>
        </div>
        <div className="flex space-x-2 text-gray-400 relative" ref={menuRef}>
           <button 
              onClick={onBack}
              title="Back to Groups"
              className="hidden md:flex rounded-full p-2 hover:bg-white/5 hover:text-white transition"
           >
               <Home size={20} />
           </button>
           <button 
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-full p-2 hover:bg-white/5 hover:text-white transition"
           >
               <MoreVertical size={20} />
           </button>
           
           {/* Dropdown Menu */}
           {showMenu && (
             <div className="absolute right-0 top-12 bg-[#0f172a]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl p-2 min-w-[200px] z-50">
               <button
                 onClick={() => {
                   handleLeaveGroup();
                   setShowMenu(false);
                 }}
                 className="w-full flex items-center px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition"
               >
                 <LogOut size={16} className="mr-3" />
                 Leave Group
               </button>
               {isAdmin && (
                 <button
                   onClick={() => {
                     fetchGroupMembers();
                     setShowMembersModal(true);
                     setShowMenu(false);
                   }}
                   className="w-full flex items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 rounded-lg transition"
                 >
                   <UserMinus size={16} className="mr-3" />
                   Manage Members
                 </button>
               )}
             </div>
           )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scroll-smooth" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
        <AnimatePresence>
          {messages.map((msg, idx) => {
            const isMe = user && msg.uid === user.uid;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.05 < 0.3 ? idx * 0.05 : 0 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
              >
                {!isMe && (
                   <div className="mr-3 mt-auto self-end flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 border border-white/5 text-[10px] text-indigo-300 font-bold uppercase">
                        {msg.sender ? msg.sender[0] : "?"}
                   </div>
                )}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                  {!isMe && <p className="ml-1 text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-tighter">{msg.sender}</p>}
                  <div 
                    className={`rounded-2xl px-4 py-3 shadow-md transition-all duration-300 ${
                      isMe
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-blue-900/20 hover:shadow-blue-600/20' 
                        : 'bg-white/5 text-gray-100 rounded-tl-none border border-white/10 shadow-black/20 hover:bg-white/10'
                    }`}
                  >
                    <p className="text-sm md:text-base leading-relaxed break-words font-medium">{msg.text}</p>
                  </div>
                  <p className="mt-1 px-1 text-[9px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {msg.createdAt ? new Date(msg.createdAt.toMillis ? msg.createdAt.toMillis() : msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-gradient-to-t from-black/20 to-transparent">
        <div className="flex items-center rounded-3xl bg-white/5 p-1.5 border border-white/10 focus-within:border-blue-500/50 focus-within:bg-white/[0.08] transition-all duration-300 shadow-2xl">
          <button className="hidden md:flex p-2.5 text-gray-500 hover:text-white transition">
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Write your message..."
            className="flex-1 bg-transparent px-4 py-2.5 text-sm md:text-base text-white placeholder-gray-600 outline-none"
          />
          <button className="hidden md:flex p-2.5 text-gray-500 hover:text-yellow-400 transition">
            <Smile size={20} />
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={`relative rounded-2xl p-3.5 text-white shadow-lg transition-all duration-300 overflow-hidden ${
              inputText.trim() 
                ? 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-blue-500/40 hover:shadow-blue-500/60' 
                : 'bg-gray-700/50 shadow-none cursor-not-allowed'
            }`}
          >
            {inputText.trim() && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
            )}
            <Send size={18} className={`relative z-10 ${inputText.trim() ? '' : 'opacity-50'}`} />
          </motion.button>
        </div>
      </div>

      {/* Members Management Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0f172a]/95 p-6 text-white shadow-2xl backdrop-blur-3xl"
          >
            <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center">
                <div className="mr-3 rounded-xl bg-indigo-500/20 p-2 text-indigo-300">
                  <Users size={20} />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight">Manage Members</h2>
              </div>
              <button onClick={() => setShowMembersModal(false)} className="rounded-full p-2 hover:bg-white/5 transition text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {groupMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-2xl bg-white/[0.02] p-3 border border-white/5">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-lg font-black text-white mr-3">
                      {member.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{member.username}</p>
                      {member.id === groupData?.admin && (
                        <div className="flex items-center text-[9px] text-yellow-400 font-bold uppercase">
                          <Shield size={10} className="mr-1" />
                          Admin
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {member.id !== user.uid && (
                    <button
                      onClick={() => handleRemoveMember(member.id, member.username)}
                      className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition-all"
                    >
                      Remove
                    </button>
                  )}
                  
                  {member.id === user.uid && (
                    <span className="text-[9px] text-gray-500 font-bold uppercase">You</span>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowMembersModal(false)}
              className="w-full mt-6 rounded-2xl bg-white/5 py-3 hover:bg-white/10 transition text-sm font-bold uppercase tracking-widest border border-white/5"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ChatArea;
