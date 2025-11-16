'use client';

import { ReleaseNotes } from '@/components/landing/ReleaseNotes';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { Footer } from '@/components/landing/Footer';

export default function ReleaseNotesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingNavbar />
      <main className="flex-1">
        <ReleaseNotes />
      </main>
      <Footer />
    </div>
  );
}

