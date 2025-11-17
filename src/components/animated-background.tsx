'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function AnimatedBackground() {
  const intensity = 50; // Default intensity

  useEffect(() => {
    const baseDuration = 4; // seconds
    const minDuration = 2;
    const maxDuration = 8;
    
    // Normalizing intensity from 0-100 to 0-1
    const normalizedIntensity = intensity / 100;
    const duration = maxDuration - (normalizedIntensity * (maxDuration - minDuration));
    
    document.documentElement.style.setProperty('--animation-duration', `${duration}s`);
  }, [intensity]);

  return (
    <div className="absolute inset-0 z-0 bg-background overflow-hidden">
      <svg
        width="100%"
        height="100%"
        className="absolute inset-0"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0.2 }} />
            <stop offset="100%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0 }} />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad1)" />
        <g stroke="hsl(var(--primary) / 0.2)" strokeWidth="1">
          {/* Main lines */}
          <path d="M-100 50 Q 500 100, 1000 50 T 2000 50" fill="none" />
          <path d="M-100 200 Q 400 250, 900 200 T 1900 200" fill="none" />
          <path d="M-100 800 Q 500 750, 1000 800 T 2000 800" fill="none" />
          <path d="M500 -100 Q 450 400, 500 900 T 500 1900" fill="none" />
          <path d="M1200 -100 Q 1250 500, 1200 1000 T 1200 2000" fill="none" />

          {/* Pulsing nodes */}
          <circle className="neuron-pulse" cx="500" cy="100" r="4" fill="hsl(var(--primary))" style={{ animationDuration: 'var(--animation-duration)', animationDelay: '0s' }} />
          <circle className="neuron-pulse" cx="1000" cy="50" r="3" fill="hsl(var(--primary))" style={{ animationDuration: 'var(--animation-duration)', animationDelay: '1s' }} />
          <circle className="neuron-pulse" cx="400" cy="250" r="5" fill="hsl(var(--accent))" style={{ animationDuration: 'var(--animation-duration)', animationDelay: '0.5s' }} />
          <circle className="neuron-pulse" cx="900" cy="200" r="3" fill="hsl(var(--accent))" style={{ animationDuration: 'var(--animation-duration)', animationDelay: '1.5s' }} />
          <circle className="neuron-pulse" cx="500" cy="750" r="4" fill="hsl(var(--primary))" style={{ animationDuration: 'var(--animation-duration)', animationDelay: '2s' }} />
          <circle className="neuron-pulse" cx="1200" cy="500" r="6" fill="hsl(var(--primary))" style={{ animationDuration: 'var(--animation-duration)', animationDelay: '0.2s' }} />
        </g>
      </svg>
    </div>
  );
}
