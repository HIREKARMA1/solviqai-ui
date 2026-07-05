'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  Search,
  Clock,
  Star,
  FileText,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import {
  POPULAR_CATEGORIES,
  MOCK_TEST_CATEGORY_IDS,
} from '@/lib/mockTestCategories';
import { MockTestCard } from '@/components/mock-tests/MockTestCard';

const glassInputClass =
  'h-11 rounded-xl border-gray-200/80 bg-white/90 shadow-sm backdrop-blur-sm placeholder:text-gray-400 focus-visible:border-brand-blue/40 focus-visible:ring-brand-blue/15 dark:border-gray-700/60 dark:bg-gray-900/70';

const glassSelectClass =
  'h-11 w-full rounded-xl border border-gray-200/80 bg-white/90 px-3 text-sm text-gray-700 shadow-sm backdrop-blur-sm focus:border-brand-blue/40 focus:outline-none focus:ring-2 focus:ring-brand-blue/15 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-200';

const EMPTY_FILTERS = { company: '', target_role: '', round_type: '', search: '' };

const BANNER_FEATURES = [
  {
    icon: FileText,
    iconClass: 'bg-orange-500/10 text-orange-500 dark:bg-orange-500/20 dark:text-orange-400',
    title: (count: number) => (count > 0 ? `${count}+ Tests` : '50+ Tests'),
    subtitle: 'Topic & Full Length',
  },
  {
    icon: Clock,
    iconClass: 'bg-orange-500/10 text-orange-500 dark:bg-orange-500/20 dark:text-orange-400',
    title: () => 'Real Exam Pattern',
    subtitle: 'Timed & Structured',
  },
  {
    icon: BarChart3,
    iconClass: 'bg-orange-500/10 text-orange-500 dark:bg-orange-500/20 dark:text-orange-400',
    title: () => 'Performance Insights',
    subtitle: 'Detailed Analysis',
  },
] as const;

export default function MockTestLibraryPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState<any[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [categoryChip, setCategoryChip] = useState<string>('all');

  const load = async (override?: typeof EMPTY_FILTERS) => {
    const active = override ?? filters;
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (active.company) params.company = active.company;
      if (active.target_role) params.target_role = active.target_role;
      if (active.round_type) params.round_type = active.round_type;
      if (active.search) params.search = active.search;
      const [lib, co] = await Promise.all([
        apiClient.getMockTestLibrary(params),
        apiClient.getMockTestCompanies(),
      ]);
      setTests(lib.tests || []);
      setCompanies(co.companies || []);
      if (override) setFilters(override);
    } catch (e) {
      console.error('Failed to load mock tests', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStart = async (templateId: string) => {
    setStarting(templateId);
    try {
      const attempt = await apiClient.startMockTest(templateId);
      window.location.href = `/dashboard/student/mock-tests/exam?attempt_id=${attempt.attempt_id}`;
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Could not start test');
    } finally {
      setStarting(null);
    }
  };

  const clearFilters = () => {
    setCategoryChip('all');
    load(EMPTY_FILTERS);
  };

  const handleApplyFilters = () => {
    setCategoryChip(filters.round_type || 'all');
    load();
  };

  const welcomeName = useMemo(() => {
    const first = user?.name?.trim().split(/\s+/)[0];
    return first ? first.toUpperCase() : 'STUDENT';
  }, [user?.name]);

  const scrollToTests = () => {
    document.getElementById('all-practice-tests')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const displayedTests = tests;

  const handleCategoryChip = (id: string) => {
    setCategoryChip(id);
    const next = { ...filters, round_type: id === 'all' ? '' : id };
    setFilters(next);
    load(next);
  };

  return (
    <DashboardLayout requiredUserType="student">
      <div className="relative min-h-screen bg-brand-hero dark:bg-brand-hero-dark -mx-6 -mb-6 -mt-20 lg:-mt-24 p-4 sm:p-6 pt-20 lg:pt-24 pb-10 w-auto">
        <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
          {/* Page header */}
          {/* <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
              Mock Test Library
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
              Company-wise practice tests — timed MCQs with instant scoring
            </p>
          </div> */}

          {/* Hero banner */}
          <section className="relative overflow-hidden rounded-2xl border border-[#e2e7f4] bg-brand-hero-2 shadow-[0_4px_28px_rgba(61,79,138,0.08)] dark:border-gray-800/60 dark:bg-brand-hero-dark-2">
            <div className="pointer-events-none absolute -right-8 -top-8 h-52 w-52 rounded-full bg-[#ffdcc8]/20" />
            <div className="pointer-events-none absolute right-12 top-6 hidden h-36 w-36 rounded-full border-[16px] border-[#ffe8dc]/40 sm:block" />
            <div className="pointer-events-none absolute right-8 top-5 hidden grid-cols-4 gap-1.5 opacity-55 sm:grid">
              {Array.from({ length: 12 }).map((_, i) => (
                <span key={i} className="h-1.5 w-1.5 rounded-full bg-orange-300/40" />
              ))}
            </div>

            <div className="relative flex flex-col p-6 sm:p-8 lg:min-h-[260px] lg:flex-row lg:items-center lg:pr-[min(36%,300px)] xl:pr-[min(34%,340px)]">
              <div className="flex flex-1 flex-col">
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-orange-200">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white">
                    <Star className="h-3 w-3 fill-current" />
                  </span>
                  Welcome, {welcomeName}!
                </span>

                <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-[2rem] dark:text-white">
                  Your Mock Test Series
                </h2>
                <p className="mt-2 text-base font-semibold text-orange-200 sm:text-lg dark:text-orange-300">
                  Practice. Analyze. Improve. Succeed!
                </p>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-blue-50/90 dark:text-gray-300">
                  Attempt tests crafted to match the real exam pattern and enhance your preparation.
                </p>

                <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:flex-wrap lg:items-center">
                  <div className="flex flex-wrap gap-x-8 gap-y-5 sm:gap-x-10">
                    {BANNER_FEATURES.map(({ icon: Icon, iconClass, title, subtitle }) => (
                      <div key={subtitle} className="flex items-start gap-3">
                        <div
                          className={cn(
                            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                            iconClass,
                          )}
                        >
                          <Icon className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div className="min-w-[120px]">
                          <p className="text-sm font-bold text-white dark:text-white">
                            {title(tests.length)}
                          </p>
                          <p className="text-xs text-orange-200/90 dark:text-orange-300/80">{subtitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* <Button
                    type="button"
                    variant="mockPrimary"
                    onClick={scrollToTests}
                    className="h-11 w-full shrink-0 gap-2 rounded-xl px-6 text-sm font-semibold sm:w-auto lg:ml-auto"
                  >
                    Browse All Tests
                    <ArrowRight className="h-4 w-4" />
                  </Button> */}
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute bottom-0 right-0 hidden w-[min(38%,300px)] max-w-[340px] lg:block xl:w-[min(36%,340px)]">
              <Image
                src="/images/clockbanner.png"
                alt="Mock test checklist and timer illustration"
                width={340}
                height={280}
                className="h-auto w-full object-contain object-bottom mix-blend-multiply"
                priority
              />
            </div>

            <div className="relative flex justify-center px-4 pb-4 pt-2 lg:hidden">
              <Image
                src="/images/clockbanner.png"
                alt="Mock test checklist and timer illustration"
                width={240}
                height={200}
                className="h-auto w-full max-w-[240px] object-contain mix-blend-multiply"
              />
            </div>
          </section>

          {/* Popular AI Driven Test Categories */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-50">
              Popular AI Driven Test Categories
            </h2>
            <div className="-mx-1 px-1">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {POPULAR_CATEGORIES.map((cat) => {
                  const active = categoryChip === cat.id;
                  return (
                    <Button
                      key={cat.id}
                      type="button"
                      variant={active ? 'mockCategoryActive' : 'mockCategoryInactive'}
                      onClick={() => handleCategoryChip(cat.id)}
                      className="shrink-0 rounded-full px-4 py-2 text-sm"
                    >
                      {cat.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Search & filters */}
          {/* <section className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-gray-800/60 dark:bg-gray-900/60 sm:p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center">
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search Test Title..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className={cn(glassInputClass, 'pl-10 pr-10')}
                />
                <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
              </div>
              <select
                className={glassSelectClass}
                value={filters.company}
                onChange={(e) => setFilters({ ...filters, company: e.target.value })}
              >
                <option value="">All Companies</option>
                {companies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <Input
                placeholder="All Roles"
                value={filters.target_role}
                onChange={(e) => setFilters({ ...filters, target_role: e.target.value })}
                className={glassInputClass}
              />
              <select
                className={glassSelectClass}
                value={filters.round_type}
                onChange={(e) => setFilters({ ...filters, round_type: e.target.value })}
              >
                <option value="">All Categories</option>
                {MOCK_TEST_CATEGORY_IDS.map((id) => (
                  <option key={id} value={id}>
                    {POPULAR_CATEGORIES.find((c) => c.id === id)?.label}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="mockPrimary"
                onClick={handleApplyFilters}
                className="h-11 w-full shrink-0 gap-2 rounded-xl px-6 sm:col-span-2 lg:col-span-1 lg:w-auto"
              >
                Apply Filters
              </Button>
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-gray-500 transition-colors hover:text-brand-blue dark:text-gray-400 dark:hover:text-brand-cyan"
              >
                Clear Filters
              </button>
            </div>
          </section> */}

          {/* Test grid */}
          <section id="all-practice-tests" className="scroll-mt-24 space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-50">
                All Practice Tests
              </h2>
              {!loading && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {displayedTests.length} Test{displayedTests.length !== 1 ? 's' : ''} Available
                </p>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader size="lg" />
              </div>
            ) : displayedTests.length === 0 ? (
              <p className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
                No published mock tests yet. Check back soon.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {displayedTests.map((t) => (
                  <MockTestCard
                    key={t.id}
                    test={t}
                    starting={starting === t.id}
                    onStart={handleStart}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
