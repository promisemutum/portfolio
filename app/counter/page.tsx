'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function CounterPage() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoaded = count >= 100;

  // Counter animation effect - slowed down significantly
  useEffect(() => {
    if (count >= 100) {
      return;
    }
    
    // Slower animation: increased base timeout to 300ms + random variation
    const timeout = setTimeout(() => {
      // Smaller increments: 1-3 instead of 1-8
      const increment = Math.floor(Math.random() * 7) + 1;
      setCount((prev) => Math.min(prev + increment, 100));
    }, Math.floor(Math.random() * 300) + 100); // 300-500ms intervals
    
    return () => clearTimeout(timeout);
  }, [count]);

  // Start game handler
  const startGame = useCallback(() => {
    if (!isLoaded || isFlashing) return;
    setIsFlashing(true);
    flashTimeoutRef.current = setTimeout(() => {
      router.push('/home');
    }, 300);
  }, [isLoaded, isFlashing, router]);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isLoaded) {
      router.prefetch('/home');
    }
  }, [isLoaded, router]);

  // Keyboard listener for Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isLoaded) startGame();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startGame, isLoaded]);

  return (
    <main 
      className={`boot-container ${isFlashing ? 'flash' : ''}`}
    >
      <div className="boot-overlay" />
      <div className="loader-container">
        {/* Show counter only when not loaded */}
        {!isLoaded && (
          <div className="counter-number-position">
            <h1 
              className="counter-display"
            >
              {count.toString().padStart(2, '0')}
            </h1>
          </div>
        )}
        
        {/* Show prompt only when loaded */}
        {isLoaded && (
          <div className="prompt-text-position">
            <button
              className="start-prompt blink"
              type="button"
              onClick={startGame}
            >
              Press Enter to Start
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
