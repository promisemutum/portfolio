'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function CounterPage() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  // Counter animation effect - slowed down significantly
  useEffect(() => {
    if (count >= 100) {
      setIsLoaded(true);
      setShowPrompt(true); // Show prompt when counter completes
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
    if (!isLoaded) return;
    setIsFlashing(true);
    setTimeout(() => {
      router.push('/home');
    }, 300);
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
              id="counter" 
              className="counter-display"
            >
              {count.toString().padStart(2, '0')}
            </h1>
          </div>
        )}
        
        {/* Show prompt only when loaded */}
        {showPrompt && (
          <div 
            className="prompt-text-position"
          >
            <div
              id="start-prompt"
              className="start-prompt blink"
              onClick={startGame}
            >
              Press Enter to Start
            </div>
          </div>
        )}
      </div>
    </main>
  );
}