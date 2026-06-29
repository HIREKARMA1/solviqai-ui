'use client';

import { LandingNavbar } from '@/components/landing';
import { SimulationLibrary } from '@/components/simulation/SimulationLibrary';
import Link from 'next/link';

export default function PublicSimulationsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <LandingNavbar />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Job Prep Simulation</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl">
            Browse company and role-specific placement pipelines — aptitude, technical, interviews, and more.
            Free for all students. Sign in when you&apos;re ready to start.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/login?redirect=/dashboard/student/simulations" className="text-primary-600 underline">
              Sign in
            </Link>
          </p>
        </div>
        <SimulationLibrary startBasePath="/dashboard/student/simulations/start" />
      </main>
    </div>
  );
}
