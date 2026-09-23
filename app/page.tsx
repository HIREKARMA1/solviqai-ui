'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

import { LandingLayout } from '@/components/landing/LandingLayout';
import { HeroSection } from '@/components/landing/HeroSection';

const FeatureCards = dynamic(() => import('@/components/landing/FeatureCards').then(mod => ({ default: mod.FeatureCards })), {
  loading: () => <div className="min-h-[400px] flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading features...</div></div>,
  ssr: true
});

const HowItWorks = dynamic(() => import('@/components/landing/HowItWorks').then(mod => ({ default: mod.HowItWorks })), {
  loading: () => <div className="min-h-[300px] flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading...</div></div>,
  ssr: true
});

const ProblemSolution = dynamic(() => import('@/components/landing/ProblemSolution').then(mod => ({ default: mod.ProblemSolution })), {
  loading: () => <div className="min-h-[300px] flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading...</div></div>,
  ssr: true
});

const FAQ = dynamic(() => import('@/components/landing/FAQ').then(mod => ({ default: mod.FAQ })), {
  loading: () => <div className="min-h-[300px] flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading FAQ...</div></div>,
  ssr: true
});

const Partners = dynamic(() => import('@/components/landing/Partners').then(mod => ({ default: mod.Partners })), {
  loading: () => <div className="min-h-[200px] flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading partners...</div></div>,
  ssr: true
});

const GuestReadinessFlow = dynamic(
  () => import('@/components/landing/GuestReadinessFlow').then((m) => ({ default: m.GuestReadinessFlow })),
  { ssr: false }
);

const HomeFeatureHost = dynamic(
  () => import('@/components/landing/HomeFeatureHost').then((m) => ({ default: m.HomeFeatureHost })),
  { ssr: false }
);

export default function Home() {
  const pathname = usePathname();
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  // Reset activeFeature when on root path
  useEffect(() => {
    if (pathname === '/') {
      setActiveFeature(null);
    }
  }, [pathname]);

  const handleFeatureChange = useCallback((featureId: string | null) => {
    setActiveFeature(featureId);

    // Scroll to top when switching features
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  return (
    <LandingLayout
      activeFeature={activeFeature}
      onFeatureChange={handleFeatureChange}
    >
      {activeFeature ? (
        // Render selected feature page
        <div className="min-h-screen">
          <HomeFeatureHost feature={activeFeature} />
        </div>
      ) : (
        // Render landing page sections with lazy loading
        <>
        {/* <LandingNavbar /> */}
          {/* Hero Section with animated background - Above the fold */}
          <HeroSection />

          <GuestReadinessFlow />

          {/* Feature Cards Section - Lazy loaded */}
          <Suspense fallback={<div className="min-h-[400px]" />}>
            <FeatureCards />
          </Suspense>

          {/* How It Works Section - Lazy loaded */}
          <Suspense fallback={<div className="min-h-[300px]" />}>
            <HowItWorks />
          </Suspense>

          {/* Problem Solution Section - Lazy loaded */}
          <Suspense fallback={<div className="min-h-[300px]" />}>
            <ProblemSolution />
          </Suspense>

          {/* FAQ Section - Lazy loaded */}
          <Suspense fallback={<div className="min-h-[300px]" />}>
            <FAQ />
          </Suspense>

          {/* Partners Section - Lazy loaded */}
          <Suspense fallback={<div className="min-h-[200px]" />}>
            <Partners />
          </Suspense>
        </>
      )}
    </LandingLayout>
  );
}
