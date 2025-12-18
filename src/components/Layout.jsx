import React from 'react';

const Layout = ({ children }) => {
  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-[#020617] p-0 md:p-8 overflow-hidden relative">
      {/* Dynamic Background Orbs - Layered & Animated */}
      <div className="pointer-events-none absolute -left-10 top-1/4 h-64 w-64 rounded-full bg-blue-600 opacity-20 blur-[120px] animate-pulse"></div>
      <div className="pointer-events-none absolute right-1/4 -top-20 h-80 w-80 rounded-full bg-indigo-600 opacity-20 blur-[130px]"></div>
      <div className="pointer-events-none absolute bottom-1/4 -right-10 h-72 w-72 rounded-full bg-purple-600 opacity-15 blur-[110px]"></div>
      <div className="pointer-events-none absolute left-1/3 bottom-0 h-40 w-40 rounded-full bg-cyan-500 opacity-10 blur-[80px]"></div>

      <div className="relative flex h-full w-full max-w-7xl overflow-hidden md:rounded-[2.5rem] border-0 md:border border-white/10 bg-white/[0.02] backdrop-blur-3xl md:shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-500">
        {children}
      </div>
    </div>
  );
};


export default Layout;
