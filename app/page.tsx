'use client';

import React, { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// Critical above-the-fold components - load immediately
import { LandingLayout } from '@/components/landing';
import { HeroSection } from '@/components/landing/HeroSection';

// Lazy load below-the-fold components for better performance
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

const Pricing = dynamic(() => import('@/components/landing/Pricing').then(mod => ({ default: mod.Pricing })), {
  loading: () => <div className="min-h-[400px] flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading pricing...</div></div>,
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

// Dynamically import feature pages (these will handle their own auth)
const ResumePage = dynamic(() => import('@/app/dashboard/student/resume/page'), { ssr: false });
const AssessmentPage = dynamic(() => import('@/app/dashboard/student/assessment/page'), { ssr: false });
const JobsPage = dynamic(() => import('@/app/dashboard/student/jobs/page'), { ssr: false });
const AutoApplyPage = dynamic(() => import('@/app/dashboard/student/auto-apply/page'), { ssr: false });

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

  const renderFeature = useMemo(() => {
    switch (activeFeature) {
      case 'resume':
        return <ResumePage />;
      case 'assessment':
        return <AssessmentPage />;
      case 'jobs':
        return <JobsPage />;
      case 'auto-apply':
        return <AutoApplyPage />;
      default:
        return null;
    }
  }, [activeFeature]);

  return (
    <LandingLayout
      activeFeature={activeFeature}
      onFeatureChange={handleFeatureChange}
    >
      {activeFeature ? (
        // Render selected feature page
        <div className="min-h-screen">
          {renderFeature}
        </div>
      ) : (
        // Render landing page sections with lazy loading
        <>
          {/* Hero Section with animated background - Above the fold */}
          <HeroSection />

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

          {/* Pricing Section - Lazy loaded */}
          <Suspense fallback={<div className="min-h-[400px]" />}>
            <Pricing />
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
