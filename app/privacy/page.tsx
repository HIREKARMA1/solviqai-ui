'use client';

import { PrivacyPolicy } from '@/components/landing/PrivacyPolicy';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { Footer } from '@/components/landing/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingNavbar />
      <main className="flex-1">
        <PrivacyPolicy />
      </main>
      <Footer />
    </div>
  );
}

