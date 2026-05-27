import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = '', size = 32 }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      style={{ display: 'block' }}
    >
      <defs>
        {/* Logo Icon Gradient */}
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(280 85% 65%)" />
          <stop offset="50%" stopColor="hsl(255 85% 68%)" />
          <stop offset="100%" stopColor="hsl(220 85% 65%)" />
        </linearGradient>

        {/* Glow Filter */}
        <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#logoGlow)">
        {/* Main Synap S-Lightning Path */}
        <path
          d="M 330 130 
             L 210 250 
             L 280 250 
             L 182 382 
             L 302 262 
             L 232 262 
             Z"
          fill="url(#logoGrad)"
        />

        {/* Synaptic Nodes (Glowing connecting circles at key vertices) */}
        <circle cx="330" cy="130" r="14" fill="hsl(280 85% 65%)" />
        <line x1="330" y1="130" x2="370" y2="90" stroke="hsl(280 85% 65%)" strokeWidth="6" strokeLinecap="round" />
        <circle cx="370" cy="90" r="10" fill="hsl(280 85% 65%)" />

        <line x1="330" y1="130" x2="385" y2="150" stroke="hsl(280 85% 65%)" strokeWidth="6" strokeLinecap="round" />
        <circle cx="385" cy="150" r="8" fill="hsl(255 85% 68%)" />

        <circle cx="182" cy="382" r="14" fill="hsl(220 85% 65%)" />
        <line x1="182" y1="382" x2="142" y2="422" stroke="hsl(220 85% 65%)" strokeWidth="6" strokeLinecap="round" />
        <circle cx="142" cy="422" r="10" fill="hsl(220 85% 65%)" />

        <line x1="182" y1="382" x2="127" y2="362" stroke="hsl(220 85% 65%)" strokeWidth="6" strokeLinecap="round" />
        <circle cx="127" cy="362" r="8" fill="hsl(255 85% 68%)" />

        {/* Central Synapse bridges (Micro connection details) */}
        <line x1="280" y1="250" x2="330" y2="230" stroke="hsl(255 85% 68%)" strokeWidth="4" strokeDasharray="3,3" />
        <circle cx="330" cy="230" r="6" fill="hsl(255 85% 68%)" />

        <line x1="210" y1="250" x2="160" y2="270" stroke="hsl(255 85% 68%)" strokeWidth="4" strokeDasharray="3,3" />
        <circle cx="160" cy="270" r="6" fill="hsl(255 85% 68%)" />
      </g>
    </svg>
  );
}
