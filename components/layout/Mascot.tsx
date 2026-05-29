'use client';

import { useEffect, useState, useRef } from 'react';

export default function Mascot() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Disable cursor tracking on mobile/tablet viewports and touch devices for butter-smooth scrolling
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;
      if (isMobile) return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const mascotCenterX = rect.left + rect.width / 2;
      const mascotCenterY = rect.top + rect.height / 2;
      
      // Get distance from cursor to mascot center
      const dx = e.clientX - mascotCenterX;
      const dy = e.clientY - mascotCenterY;
      
      // Normalize values (between -1 and 1) with max radius clamp of 400px
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      const maxDist = 400;
      const clampFactor = Math.min(distance, maxDist) / maxDist;
      
      const angle = Math.atan2(dy, dx);
      
      setMousePos({
        x: Math.cos(angle) * clampFactor,
        y: Math.sin(angle) * clampFactor
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Parallax offsets
  const bodyTranslateX = mousePos.x * 16;
  const bodyTranslateY = mousePos.y * 16;
  
  const ringTranslateX = mousePos.x * -8;
  const ringTranslateY = mousePos.y * -8;
  
  const eyeTranslateX = mousePos.x * 4;
  const eyeTranslateY = mousePos.y * 4;
  
  const pupilTranslateX = mousePos.x * 6;
  const pupilTranslateY = mousePos.y * 6;

  return (
    <div 
      ref={containerRef}
      className="flex items-center justify-center relative mb-4 h-24 sm:h-28 w-full cursor-pointer select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        // Slowly return center when mouse leaves
      }}
    >
      {/* ── BACKGROUND GLOW LAYER ────────────────────────── */}
      <div 
        className="absolute w-20 h-20 bg-gradient-to-tr from-primary/30 to-accent/20 rounded-full blur-2xl pointer-events-none transition-all duration-500 scale-125"
        style={{
          transform: `translate(${bodyTranslateX * 0.5}px, ${bodyTranslateY * 0.5}px) scale(${isHovered ? 1.4 : 1.1})`,
          transition: 'transform 0.2s ease-out'
        }}
      />

      {/* ── INTERACTIVE 3D MASCOT CONTAINER ──────────────── */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
        
        {/* Layer 1: Orbiting Cybernetic Rings (Reverse Parallax) */}
        <svg 
          className="absolute inset-0 w-full h-full text-primary/40 pointer-events-none"
          viewBox="0 0 100 100"
          fill="none"
          style={{
            transform: `translate(${ringTranslateX}px, ${ringTranslateY}px) rotate(${isHovered ? 45 : 0}deg)`,
            transition: 'transform 0.15s ease-out'
          }}
        >
          {/* Main outer ring */}
          <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="animate-spin-slow opacity-60" />
          {/* Orbital path */}
          <ellipse cx="50" cy="50" rx="46" ry="16" stroke="url(#mascot-ring-grad)" strokeWidth="1" transform="rotate(-15 50 50)" className="opacity-40" />
          {/* Orbiting nodes */}
          <circle cx="10" cy="38" r="2.5" fill="hsl(var(--accent))" className="animate-pulse" />
          <circle cx="90" cy="62" r="2.5" fill="hsl(var(--primary))" className="animate-pulse" />
          
          <defs>
            <linearGradient id="mascot-ring-grad" x1="0" y1="0" x2="100" y2="100">
              <stop stopColor="hsl(var(--primary))" />
              <stop offset="0.5" stopColor="hsl(var(--accent))" />
              <stop offset="1" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>

        {/* Layer 2: Main Mascot Body & Face (Positive Parallax) */}
        <div 
          className="w-full h-full relative flex items-center justify-center drop-shadow-[0_0_16px_rgba(167,139,250,0.45)]"
          style={{
            transform: `translate(${bodyTranslateX}px, ${bodyTranslateY}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Ambient Shadow under mascot inside SVG */}
            <ellipse cx="40" cy="74" rx="18" ry="3" fill="#000" opacity="0.25" />

            {/* Glowing Antenna / Neuro Node */}
            <circle cx="40" cy="11" r="3.5" fill="url(#antenna-glow)" />
            <path d="M40 14V22" stroke="url(#body-glow-grad)" strokeWidth="1.5" strokeLinecap="round" />

            {/* Main Capsule Body (Futuristic Glassmorphic Floating Pod) */}
            <rect x="20" y="22" width="40" height="42" rx="20" fill="url(#body-core-grad)" stroke="url(#body-glow-grad)" strokeWidth="1.5" />
            
            {/* Glossy Reflection Highlight */}
            <path d="M24 38C24 29.1634 31.1634 24 40 24" stroke="white" strokeWidth="1.25" strokeLinecap="round" opacity="0.3" />

            {/* Academic Graduation Tassel Accent (Futuristic Tech Cap overlay) */}
            <path d="M30 20L40 16L50 20L40 24L30 20Z" fill="hsl(var(--primary))" opacity="0.8" />
            <path d="M50 20V26L48 28" stroke="hsl(var(--accent))" strokeWidth="1" strokeLinecap="round" />

            {/* Cybernetic Headphone Side Nodes */}
            <rect x="16" y="36" width="5" height="12" rx="2.5" fill="hsl(var(--primary))" />
            <rect x="59" y="36" width="5" height="12" rx="2.5" fill="hsl(var(--primary))" />

            {/* ── MASCOT EYES (Cursor-Tracking Parallax) ────────── */}
            <g style={{ transform: `translate(${eyeTranslateX}px, ${eyeTranslateY}px)`, transition: 'transform 0.1s ease-out' }}>
              {/* Left Eye Socket */}
              <circle cx="33" cy="40" r="5.5" fill="#13131A" stroke="url(#body-glow-grad)" strokeWidth="1" />
              {/* Right Eye Socket */}
              <circle cx="47" cy="40" r="5.5" fill="#13131A" stroke="url(#body-glow-grad)" strokeWidth="1" />

              {/* Pupils (Tracking Cursor even closer) */}
              <g style={{ transform: `translate(${pupilTranslateX}px, ${pupilTranslateY}px)`, transition: 'transform 0.08s ease-out' }}>
                {/* Left Pupil */}
                <circle cx="33" cy="40" r="2.5" fill="#A78BFA" />
                <circle cx="34" cy="39" r="0.75" fill="#FFFFFF" /> {/* Catchlight */}

                {/* Right Pupil */}
                <circle cx="47" cy="40" r="2.5" fill="#A78BFA" />
                <circle cx="48" cy="39" r="0.75" fill="#FFFFFF" /> {/* Catchlight */}
              </g>
            </g>

            {/* Cute Happy Glowing Smile */}
            <path 
              d={isHovered ? "M36 51C37.5 53 42.5 53 44 51" : "M37 50C38.5 51.5 41.5 51.5 43 50"} 
              stroke="#FFFFFF" 
              strokeWidth="2" 
              strokeLinecap="round"
              className="transition-all duration-300"
            />
            
            {/* Blushing cheeks */}
            <circle cx="27" cy="46" r="1.5" fill="hsl(var(--accent))" opacity="0.4" />
            <circle cx="53" cy="46" r="1.5" fill="hsl(var(--accent))" opacity="0.4" />

            {/* SVG Definitions */}
            <defs>
              <linearGradient id="body-core-grad" x1="20" y1="22" x2="60" y2="64" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1E1B4B" />
                <stop offset="0.6" stopColor="#0B0914" />
                <stop offset="1" stopColor="#131124" />
              </linearGradient>
              
              <linearGradient id="body-glow-grad" x1="20" y1="22" x2="60" y2="64" gradientUnits="userSpaceOnUse">
                <stop stopColor="#A78BFA" />
                <stop offset="0.5" stopColor="#EC4899" />
                <stop offset="1" stopColor="#3B82F6" />
              </linearGradient>
              
              <radialGradient id="antenna-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(40 11) rotate(90) scale(3.5)">
                <stop stopColor="#FFFFFF" />
                <stop offset="0.6" stopColor="#EC4899" />
                <stop offset="1" stopColor="transparent" />
              </radialGradient>
            </defs>
          </svg>
        </div>

      </div>
    </div>
  );
}
