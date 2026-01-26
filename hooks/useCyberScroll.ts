'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function useCyberScroll() {
  const scrollRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let locoScroll: any = null;
    let isInitialized = false;
    let refreshListener: ((e: any) => void) | null = null;
    let resizeHandlers: (() => void)[] = [];

    const init = async () => {
      try {
        // 🔒 SAFETY 1: Verify DOM elements exist BEFORE proceeding
        const scrollEl = document.querySelector<HTMLElement>('#main');
        const canvasEl = document.querySelector<HTMLCanvasElement>('canvas');
        
        if (!scrollEl) {
          console.error('[CyberScroll] ❌ CRITICAL: Element #main not found in DOM. Check your page structure!');
          return;
        }
        scrollRef.current = scrollEl;

        if (!canvasEl) {
          console.warn('[CyberScroll] ⚠️ Canvas not found. Skipping animation sequence.');
        } else {
          canvasRef.current = canvasEl;
        }

        // 🔒 SAFETY 2: Register plugins only once
        if (!gsap.plugins.length) {
          gsap.registerPlugin(ScrollTrigger);
        }

        // 1. Initialize Locomotive Scroll (with validated element)
        const LocomotiveScroll = (await import('locomotive-scroll')).default;
        locoScroll = new LocomotiveScroll({
          el: scrollEl,
          smooth: true,
          multiplier: 1.2, // Smoother scroll feel
          smartphone: { smooth: true },
          tablet: { smooth: true },
        });

        isInitialized = true;

        // Sync GSAP with Locomotive Scroll
        locoScroll.on('scroll', () => {
          if (ScrollTrigger && locoScroll && isInitialized) {
            ScrollTrigger.update();
          }
        });

        ScrollTrigger.scrollerProxy(scrollEl, {
          scrollTop(value) {
            if (arguments.length && locoScroll && isInitialized) {
              locoScroll.scrollTo(value, 0, 0);
            }
            return locoScroll && isInitialized ? locoScroll.scroll.instance.scroll.y : 0;
          },
          getBoundingClientRect() {
            return {
              top: 0,
              left: 0,
              width: window.innerWidth,
              height: window.innerHeight,
            };
          },
          pinType: scrollEl.style.transform ? 'transform' : 'fixed',
        });

        // 2. CANVAS ANIMATION (only if canvas exists)
        if (canvasEl && canvasRef.current) {
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          
          if (context) {
            // Responsive canvas setup
            const resizeCanvas = () => {
              if (!isInitialized) return;
              canvas.width = window.innerWidth;
              canvas.height = window.innerHeight;
            };
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            resizeHandlers.push(resizeCanvas);

            const frameCount = 300;
            const images: HTMLImageElement[] = [];
            const imageSeq = { frame: 0 };

            // Preload images with error handling
            for (let i = 0; i < frameCount; i++) {
              const img = new Image();
              const num = (i + 1).toString().padStart(4, '0');
              img.src = `/images/male${num}.png`;
              img.onerror = () => console.error(`[CyberScroll] Failed to load frame: male${num}.png`);
              images.push(img);
            }

            const render = () => {
              if (!images[imageSeq.frame] || !images[imageSeq.frame].complete) return;
              
              const img = images[imageSeq.frame];
              const hRatio = canvas.width / img.width;
              const vRatio = canvas.height / img.height;
              const ratio = Math.max(hRatio, vRatio);
              const x = (canvas.width - img.width * ratio) / 2;
              const y = (canvas.height - img.height * ratio) / 2;
              
              context.clearRect(0, 0, canvas.width, canvas.height);
              context.drawImage(
                img,
                0, 0, img.width, img.height,
                x, y, img.width * ratio, img.height * ratio
              );
            };

            // Only create ScrollTrigger if canvas trigger exists
            if (document.querySelector('#page>canvas')) {
              gsap.to(imageSeq, {
                frame: frameCount - 1,
                snap: 'frame',
                ease: 'none',
                scrollTrigger: {
                  scrub: 0.15,
                  trigger: '#page>canvas',
                  start: 'top top',
                  end: '600% top',
                  scroller: scrollEl,
                },
                onUpdate: render,
              });

              ScrollTrigger.create({
                trigger: '#page>canvas',
                pin: true,
                scroller: scrollEl,
                start: 'top top',
                end: '600% top',
              });
            }

            // Render first frame when ready
            if (images[0].complete) {
              render();
            } else {
              images[0].onload = render;
            }
          }
        }

        // 3. TEXT PINNING (with existence checks)
        ['#page1', '#page2', '#page3'].forEach((id) => {
          if (document.querySelector(id)) {
            ScrollTrigger.create({
              trigger: id,
              pin: true,
              scroller: scrollEl,
              start: 'top top',
              end: 'bottom top',
            });
          } else {
            console.warn(`[CyberScroll] Trigger element ${id} not found. Skipping pin.`);
          }
        });

        // Final sync
        const handleRefresh = () => {
          if (locoScroll && isInitialized) {
            try {
              locoScroll.update();
            } catch (err) {
              console.warn('[CyberScroll] ⚠️ locoScroll.update() failed (likely destroyed):', err);
            }
          }
        };
        
        refreshListener = handleRefresh;
        ScrollTrigger.addEventListener('refresh', refreshListener);
        
        // Force refresh after initialization
        setTimeout(() => {
          if (ScrollTrigger && isInitialized) {
            ScrollTrigger.refresh();
          }
        }, 100);

      } catch (error) {
        console.error('[CyberScroll] Initialization failed:', error);
        if (locoScroll) locoScroll.destroy();
      }
    };

    // 🌐 Only run on client-side
    if (typeof window !== 'undefined') {
      init();
    }

    // Cleanup function
    return () => {
      isInitialized = false;

      // Remove refresh listener FIRST
      if (refreshListener && ScrollTrigger) {
        try {
          ScrollTrigger.removeEventListener('refresh', refreshListener);
        } catch (err) {
          console.warn('[CyberScroll] ⚠️ Failed to remove refresh listener:', err);
        }
      }

      // Kill all ScrollTriggers
      if (ScrollTrigger) {
        try {
          ScrollTrigger.getAll().forEach(trigger => {
            if (trigger && trigger.kill) {
              trigger.kill();
            }
          });
        } catch (err) {
          console.warn('[CyberScroll] ⚠️ Failed to kill ScrollTriggers:', err);
        }
      }

      // Cleanup resize listeners
      resizeHandlers.forEach(handler => {
        window.removeEventListener('resize', handler);
      });
      resizeHandlers = [];

      // Destroy locoScroll LAST
      if (locoScroll) {
        try {
          locoScroll.destroy();
        } catch (err) {
          console.warn('[CyberScroll] ⚠️ Failed to destroy locoScroll:', err);
        }
      }
      
      locoScroll = null;
      scrollRef.current = null;
      canvasRef.current = null;
      refreshListener = null;
    };
  }, []);

  return { scrollRef, canvasRef };
}
