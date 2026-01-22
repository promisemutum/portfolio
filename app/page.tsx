'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function Home() {
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
          return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
        },
        pinType: (document.querySelector('#main') as HTMLElement).style.transform ? 'transform' : 'fixed',
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
            context.drawImage(img, 0, 0, img.width, img.height, x, y, img.width * ratio, img.height * ratio);
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

  return (
    <div id="main">
      <div id="nav">
        <h3><b>CYBER</b>FICTION*</h3>
        <button>APRIL, 2023</button>
      </div>

      <div id="page">
        <div id="loop">
          <h1><b>CYBER</b>FICTION IS THE <b><i>REAL</i></b> <span>STORY</span> IN THE <span><i>METAVERSE.</i></span></h1>
          <h1><b>CYBER</b>FICTION IS THE <b><i>REAL</i></b> <span>STORY</span> IN THE <span><i>METAVERSE.</i></span></h1>
          <h1><b>CYBER</b>FICTION IS THE <b><i>REAL</i></b> <span>STORY</span> IN THE <span><i>METAVERSE.</i></span></h1>
        </div>
        <h3>CYBERFICTION AIMS TO BE A DECENTRALIZED COMMUNITY THAT CAN <br /> CREATE NEW VALUES AND PROFITS THROUGH PLAY IN THE VIRTUAL <br /> WORLD.</h3>
        <h4>...SCROLL TO READ</h4>
        <canvas></canvas>
      </div>

      <div id="page1">
        <div id="right-text">
          <h3>CYBERFICTION / KEY WORD</h3>
          <h1>HAVE FUN <br /> LET'S PLAY <br /> JUST BE TOGETHER</h1>
        </div>
        <div id="left-text">
          <h1>MAKE A STORY <br /> TAKE A CHANCE <br /> BUILD AND OWNED</h1>
          <h3>..AND MAINTAIN GOOD HUMANITY</h3>
        </div>
      </div>

      <div id="page2">
        <div id="text1">
          <h3>CYBERFICTION / HAVE FUN</h3>
          <h1>LET'S <br /> HAVE FUN <br /> TOGETHER</h1>
        </div>
        <div id="text2">
          <p>LET'S HAVE A BLAST! LET'S JUST THROW AWAY AGE, GENDER, REGION, <br /> STATUS, ETC., DON'T COMPETE, DON'T FIGHT, COOPERATE AND SHARE <br /> WITH EACH OTHER AND ENJOY IT TOGETHER!</p>
        </div>
      </div>

      <div id="page3">
        <div id="text3">
          <h3>CYBERFICTION / PLAYGROUND</h3>
          <h1>CYBERFIELD <br /> IS OUR <br /> PLAYGROUND</h1>
        </div>
      </div>
    </div>
  );
}