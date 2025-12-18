import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, Paperclip, MoreVertical, Phone, Video, Users, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, where } from 'firebase/firestore';

const ChatArea = ({ user, activeGroupId, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!activeGroupId) return;

    // Remove orderBy because it requires a manual index in Firebase Console.
    // We will sort in memory to ensure it works immediately for the user.
    const q = query(collection(db, "messages"), where("groupId", "==", activeGroupId));
    const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in memory - handle null createdAt by putting them at the end
      msgs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
        return timeA - timeB;
      });
      setMessages(msgs);
    });

    return () => unsubscribeSnapshot();
  }, [activeGroupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      {/* Header - Optimized for stability */}
      <div className="flex h-16 md:h-20 shrink-0 items-center justify-between border-b border-white/5 bg-black/20 px-4 md:px-6 backdrop-blur-xl z-20">
        <div className="flex items-center">
          {/* Mobile Back Button */}
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
            <h2 className="text-sm font-bold md:text-lg tracking-tight">Group Chat</h2>
            <div className="flex items-center text-[10px] md:text-xs text-green-400 font-medium">
                <span className="mr-1.5 flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Secure Connection
            </div>
          </div>
        </div>
        <div className="flex space-x-2 text-gray-400">
           <button className="rounded-full p-2 hover:bg-white/5 hover:text-white transition">
               <MoreVertical size={20} />
           </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth custom-scrollbar">
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
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-3 text-white shadow-lg shadow-blue-500/30 transition hover:brightness-110 active:brightness-90"
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;


