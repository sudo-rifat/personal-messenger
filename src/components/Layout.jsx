import React from 'react';

const Layout = ({ children }) => {
  return (
    <div className="flex h-[100svh] w-full items-center justify-center p-0 md:p-8 overflow-hidden">
      <div className="relative flex h-full w-full max-w-7xl overflow-hidden md:rounded-3xl border-0 md:border border-glassBorder bg-[#0f172a]/80 backdrop-blur-2xl md:shadow-2xl">
        {/* Background Orbs */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-500 opacity-20 blur-[100px]"></div>
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-purple-500 opacity-20 blur-[100px]"></div>
        
        {children}
      </div>
    </div>
  );
};

export default Layout;
