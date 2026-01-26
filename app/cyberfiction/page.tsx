'use client';

import Link from 'next/link';
import { Nav } from '@/components/layout/Nav';
import { HeroSection } from '@/components/cyberfiction/HeroSection';
import { Page1Section } from '@/components/cyberfiction/Page1Section';
import { Page2Section } from '@/components/cyberfiction/Page2Section';
import { Page3Section } from '@/components/cyberfiction/Page3Section';
import { useCyberScroll } from '@/hooks/useCyberScroll';

export default function CyberfictionPage() {
  useCyberScroll();

  return (
    <>
      {/* FIXED BUTTON - OUTSIDE SCROLL CONTAINER */}
      <div className="cyber-home-btn-container">
        <Link href="/home" className="cyber-home-btn">
          <span className="cyber-btn-text">⌂ HOME</span>
        </Link>
      </div>

      {/* CRITICAL: MUST BE id="main" FOR LOCOMOTIVE SCROLL */}
      <main id="main"> {/* ✅ FIXED ID */}
        <Nav />
        <HeroSection />
        <Page1Section />
        <Page2Section />
        <Page3Section />
      </main>
    </>
  );
}