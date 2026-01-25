'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function useCyberScroll() {
  useEffect(() => {
    let locoScroll: any;

    const init = async () => {
      const LocomotiveScroll = (await import('locomotive-scroll')).default;
      gsap.registerPlugin(ScrollTrigger);

      // 1. Initialize Locomotive Scroll
      locoScroll = new LocomotiveScroll({
        el: document.querySelector('#main') as HTMLElement,
        smooth: true,
      });

      locoScroll.on('scroll', ScrollTrigger.update);

      ScrollTrigger.scrollerProxy('#main', {
        scrollTop(value) {
          return arguments.length
            ? locoScroll.scrollTo(value, 0, 0)
            : locoScroll.scroll.instance.scroll.y;
        },
        getBoundingClientRect() {
          return {
            top: 0,
            left: 0,
            width: window.innerWidth,
            height: window.innerHeight,
          };
        },
        pinType: (document.querySelector('#main') as HTMLElement).style.transform
          ? 'transform'
          : 'fixed',
      });

      // 2. Canvas Logic
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const context = canvas?.getContext('2d');

      if (canvas && context) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const frameCount = 300;
        const images: HTMLImageElement[] = [];
        const imageSeq = { frame: 0 };

        // Preload from public/images/
        for (let i = 0; i < frameCount; i++) {
          const img = new Image();
          const number = (i + 1).toString().padStart(4, '0');
          img.src = `/images/male${number}.png`;
          images.push(img);
        }

        const render = () => {
          const img = images[imageSeq.frame];
          if (img && img.complete) {
            const hRatio = canvas.width / img.width;
            const vRatio = canvas.height / img.height;
            const ratio = Math.max(hRatio, vRatio);
            const x = (canvas.width - img.width * ratio) / 2;
            const y = (canvas.height - img.height * ratio) / 2;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(
              img,
              0,
              0,
              img.width,
              img.height,
              x,
              y,
              img.width * ratio,
              img.height * ratio
            );
          }
        };

        gsap.to(imageSeq, {
          frame: frameCount - 1,
          snap: 'frame',
          ease: 'none',
          scrollTrigger: {
            scrub: 0.15,
            trigger: '#page>canvas',
            start: 'top top',
            end: '600% top',
            scroller: '#main',
          },
          onUpdate: render,
        });

        images[0].onload = render;

        ScrollTrigger.create({
          trigger: '#page>canvas',
          pin: true,
          scroller: '#main',
          start: 'top top',
          end: '600% top',
        });
      }

      // 3. Text Pinning
      ['#page1', '#page2', '#page3'].forEach((id) => {
        ScrollTrigger.create({
          trigger: id,
          pin: true,
          scroller: '#main',
          start: 'top top',
          end: 'bottom top',
        });
      });

      ScrollTrigger.addEventListener('refresh', () => locoScroll.update());
      ScrollTrigger.refresh();
    };

    init();

    return () => {
      if (locoScroll) locoScroll.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);
}

