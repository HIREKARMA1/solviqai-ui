'use client';

import { LandingNavbar } from '@/components/landing';
import { SimulationLibrary } from '@/components/simulation/SimulationLibrary';

export default function PublicSimulationsPage() {
  return (
    <div className="min-h-screen bg-[#f7fbff] dark:bg-gray-950">
      <LandingNavbar />
      <main className="mx-auto max-w-[1240px] px-4 pb-16 pt-24 sm:px-6">
        <SimulationLibrary startBasePath="/dashboard/student/simulations/start" />
      </main>
    </div>
  );
}
