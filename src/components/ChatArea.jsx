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
    <div className="flex flex-1 flex-col bg-white/5 relative h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-glassBorder bg-white/5 p-4 backdrop-blur-md">
        <div className="flex items-center">
          {/* Mobile Back Button */}
          <button 
            onClick={onBack}
            className="mr-4 rounded-full p-2 text-gray-400 hover:bg-white/10 hover:text-white md:hidden"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="relative">
             <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                <Users size={20} />
             </div>
          </div>
          <div>
            <h2 className="text-sm font-bold md:text-lg">Group Chat</h2>
            <p className="text-[10px] text-green-400 md:text-xs">Active</p>
          </div>
        </div>
        <div className="flex space-x-4 text-gray-400">
          <MoreVertical size={20} className="cursor-pointer hover:text-white" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => {
            const isMe = user && msg.uid === user.uid;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                   <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-[10px] text-white">
                        {msg.sender ? msg.sender[0].toUpperCase() : "?"}
                   </div>
                )}
                <div 
                  className={`max-w-[85%] md:max-w-md rounded-2xl px-4 py-2 shadow-sm ${
                    isMe
                      ? 'bg-primary text-white rounded-tr-none shadow-blue-500/10' 
                      : 'bg-white/10 text-gray-100 rounded-tl-none border border-white/5 shadow-black/10'
                  }`}
                >
                  {!isMe && <p className="text-[10px] text-gray-400 mb-1">{msg.sender}</p>}
                  <p className="text-sm md:text-base break-words font-medium">{msg.text}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-glassBorder p-4 bg-black/5">
        <div className="flex items-center rounded-2xl bg-black/20 p-1 md:p-2 border border-glassBorder focus-within:border-primary/50 transition-colors">
          <button className="hidden md:block p-2 text-gray-400 hover:text-white transition">
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent px-3 py-2 text-sm md:text-base text-white placeholder-gray-500 outline-none"
          />
          <button className="hidden md:block p-2 text-gray-400 hover:text-yellow-400 transition">
            <Smile size={20} />
          </button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            className="rounded-xl bg-primary p-2 md:p-3 text-white shadow-lg shadow-primary/30 transition hover:bg-blue-600"
          >
            <Send size={18} md:size={20} />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;

