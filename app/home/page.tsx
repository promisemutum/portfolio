'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate mouse position relative to the container
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Update CSS variables directly on the element
      // This is much faster than React state updates
      container.style.setProperty('--x', `${x}px`);
      container.style.setProperty('--y', `${y}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <main className="mask-container" ref={containerRef}>
      
      {/* 2.png: The "Top" Layer (Revealed by Mask) */}
      <div className="image-wrapper colored-image">
        <Image
          src="/images/2.png"
          alt="Revealed Image"
          fill
          priority
        />
      </div>

      {/* 1.png: The "Base" Layer (Always Visible) */}
      <div className="image-wrapper bw-image">
        <Image
          src="/images/1.png"
          alt="Base Image"
          fill
          priority
        />
      </div>

    </main>
  );
}