'use client';

import { Nav } from '@/components/layout/Nav';
import { HeroSection } from '@/components/cyberfiction/HeroSection';
import { Page1Section } from '@/components/cyberfiction/Page1Section';
import { Page2Section } from '@/components/cyberfiction/Page2Section';
import { Page3Section } from '@/components/cyberfiction/Page3Section';
import { useCyberScroll } from '@/hooks/useCyberScroll';

export default function CyberfictionPage() {
  useCyberScroll();

  return (
    <div id="main">
      <Nav />
      <HeroSection />
      <Page1Section />
      <Page2Section />
      <Page3Section />
    </div>
  );
}

