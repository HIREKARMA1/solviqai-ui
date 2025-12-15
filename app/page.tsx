'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  LandingLayout,
  HeroSection,
  FeatureCards,
  WhyChooseUs,
  HowItWorks,
  ProblemSolution,
  Pricing,
  // Testimonials,
  Partners,
  FAQ,
} from '@/components/landing';

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

  const handleFeatureChange = (featureId: string | null) => {
    setActiveFeature(featureId);

    // Scroll to top when switching features
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderFeature = () => {
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
  };

  return (
    <LandingLayout
      activeFeature={activeFeature}
      onFeatureChange={handleFeatureChange}
    >
      {activeFeature ? (
        // Render selected feature page
        <div className="min-h-screen">
          {renderFeature()}
        </div>
      ) : (
        // Render landing page sections
        <>
          {/* Hero Section with animated background */}
          <HeroSection />

          {/* Feature Cards Section */}
          <FeatureCards />

          {/* Why Choose Us Section */}
          {/* <WhyChooseUs /> */}

          {/* How It Works Section */}
          <HowItWorks />

          {/* Problem Solution Section */}
          <ProblemSolution />

          {/* Pricing Section */}
          <Pricing />

          {/* Testimonials Section */}
          {/* <Testimonials /> */}

          {/* FAQ Section */}
          <FAQ />

          {/* Partners Section */}
          <Partners />
        </>
      )}
    </LandingLayout>
  );
}
