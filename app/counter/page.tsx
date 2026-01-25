'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function CounterPage() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [promptText, setPromptText] = useState('Press Enter to Start');

  // Counter animation effect
  useEffect(() => {
    if (count >= 100) {
      setIsLoaded(true);
      return;
    }
    const timeout = setTimeout(() => {
      const increment = Math.floor(Math.random() * 8) + 1;
      setCount((prev) => Math.min(prev + increment, 100));
    }, Math.floor(Math.random() * 100) + 20);
    return () => clearTimeout(timeout);
  }, [count]);

  // Start game handler
  const startGame = useCallback(() => {
    if (!isLoaded) return;
    setIsFlashing(true);
    setPromptText('SYSTEM ONLINE');
    setTimeout(() => {
      router.push('/home');
    }, 300);
  }, [isLoaded, router]);

  // Keyboard listener for Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') startGame();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startGame]);

  return (
    <main className={`boot-container ${isFlashing ? 'flash' : ''}`}>
      <div className="boot-overlay" />
      <div className="loader-container">
        <h1 id="counter" className={isLoaded ? 'counter-complete' : ''}>
          {count.toString().padStart(2, '0')}
        </h1>
        <div
          id="start-prompt"
          className={isLoaded ? 'blink' : ''}
          style={{ opacity: isLoaded ? 1 : 0 }}
          onClick={startGame}
        >
          {promptText}
        </div>
      </div>
    </main>
  );
}
