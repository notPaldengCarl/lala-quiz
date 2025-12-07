import React from 'react';

const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#FFF8F3]">
       {/* Subtle noise or texture could go here if needed, but keeping it clean solid cream for now */}
       <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D96C2C] rounded-full blur-[150px] opacity-10 translate-x-1/2 -translate-y-1/2"></div>
       <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#241738] rounded-full blur-[200px] opacity-5 -translate-x-1/3 translate-y-1/3"></div>
    </div>
  );
};

export default Background;