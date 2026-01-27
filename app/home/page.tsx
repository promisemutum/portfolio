'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';

const LOW_RES_BASE = '/images/optimized/1_lowres.png';
const LOW_RES_TOP = '/images/optimized/2_lowres.png';
const HIGH_RES_BASE = '/images/optimized/1.png';
const HIGH_RES_TOP = '/images/optimized/2.png';

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHighResReady, setIsHighResReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId = 0;
    let latestX = 0;
    let latestY = 0;

    const updateMask = () => {
      container.style.setProperty('--x', `${latestX}px`);
      container.style.setProperty('--y', `${latestY}px`);
      rafId = 0;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      latestX = e.clientX - rect.left;
      latestY = e.clientY - rect.top;

      if (rafId === 0) {
        rafId = window.requestAnimationFrame(updateMask);
      }
    };

    container.addEventListener('pointermove', handlePointerMove, { passive: true });

    return () => {
      container.removeEventListener('pointermove', handlePointerMove);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let loaded = 0;

    const handleLoad = () => {
      loaded += 1;
      if (loaded === 2 && isMounted) {
        setIsHighResReady(true);
      }
    };

    const baseImage = new window.Image();
    baseImage.src = HIGH_RES_BASE;
    baseImage.onload = handleLoad;

    const topImage = new window.Image();
    topImage.src = HIGH_RES_TOP;
    topImage.onload = handleLoad;

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="mask-container" ref={containerRef}>
      
      {/* 2.png: The "Top" Layer (Revealed by Mask) */}
      <div className="image-wrapper colored-image">
        <Image
          src={isHighResReady ? HIGH_RES_TOP : LOW_RES_TOP}
          alt="Revealed Image"
          fill
          sizes="100vw"
        />
      </div>

      {/* 1.png: The "Base" Layer (Always Visible) */}
      <div className="image-wrapper bw-image">
        <Image
          src={isHighResReady ? HIGH_RES_BASE : LOW_RES_BASE}
          alt="Base Image"
          fill
          priority
          sizes="100vw"
        />
      </div>

    </main>
  );
}
