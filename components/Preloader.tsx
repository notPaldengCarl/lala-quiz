
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface PreloaderProps {
  message?: string;
}

const Preloader: React.FC<PreloaderProps> = ({ message = "Constructing Knowledge" }) => {
  const lRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lRef.current && containerRef.current) {
      const tl = gsap.timeline({ repeat: -1, yoyo: true });
      
      tl.to(lRef.current, {
        scale: 1.2,
        rotation: 10,
        textShadow: "0px 0px 20px rgba(160, 130, 103, 0.6)",
        duration: 0.8,
        ease: "power1.inOut"
      });

      gsap.to(containerRef.current, {
        opacity: 1,
        duration: 0.5
      });
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F5F1E8] opacity-0 transition-opacity duration-500"
    >
      <div className="relative">
        <div 
            ref={lRef}
            className="text-[12rem] font-black text-[#544230] leading-none select-none font-kanit"
        >
            L
        </div>
        
        {/* Decorative dots */}
        <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-[#A08267] rounded-full animate-bounce delay-100"></div>
        <div className="absolute -top-4 -left-4 w-4 h-4 bg-[#C9A585] rounded-full animate-bounce delay-300"></div>
      </div>
      
      <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-[#79614B] font-bold uppercase tracking-[0.3em] text-sm animate-pulse text-center px-4">
            {message}
          </p>
          <div className="w-32 h-1 bg-[#C9A585]/30 rounded-full overflow-hidden">
            <div className="w-full h-full bg-[#544230] origin-left animate-[loading_1.5s_ease-in-out_infinite]"></div>
          </div>
      </div>

      <style>{`
        @keyframes loading {
            0% { transform: scaleX(0); }
            50% { transform: scaleX(1); }
            100% { transform: scaleX(0); transform-origin: right; }
        }
        .font-kanit { font-family: 'Kanit', sans-serif; }
      `}</style>
    </div>
  );
};

export default Preloader;