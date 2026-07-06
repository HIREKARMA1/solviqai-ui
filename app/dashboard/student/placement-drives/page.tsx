'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { PlacementDriveCard } from '@/components/placement-drive/PlacementDriveCard';
import {
  PlacementDriveFiltersSidebar,
  type DriveFilters,
} from '@/components/placement-drive/PlacementDriveFiltersSidebar';
import { PlacementDriveHero } from '@/components/placement-drive/PlacementDriveHero';
import { PlacementDriveInProgressSection } from '@/components/placement-drive/PlacementDriveInProgressSection';
import { useDashboardShell } from '@/components/dashboard/DashboardShellContext';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  ArrowUpDown,
  CalendarClock,
  Play,
  RefreshCw,
  Trophy,
  User,
} from 'lucide-react';

const EMPTY_FILTERS: DriveFilters = { search: '', company: '', target_role: '', stage_type: '' };

const sortSelectClass =
  'h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 shadow-sm focus:border-brand-blue/40 focus:outline-none focus:ring-2 focus:ring-brand-blue/15 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 sm:text-sm';

type SortOption = 'newest' | 'title_asc' | 'title_desc';

export default function PlacementDriveLibraryPage() {
  const [drives, setDrives] = useState<any[]>([]);
  const [inProgress, setInProgress] = useState<any[]>([]);
  const [assigned, setAssigned] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const [filters, setFilters] = useState<DriveFilters>(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState<DriveFilters>(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const pageScrollRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsScrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isNavSidebarCollapsed, isMobileNavOpen } = useDashboardShell();

  /** Hide filter column when app nav sidebar is expanded or mobile drawer is open */
  const showFilterColumn = isNavSidebarCollapsed && !isMobileNavOpen;

  const loadLibrary = () => {
    setLoading(true);
    setLoadError(null);
    Promise.all([
      apiClient.getPlacementDriveLibrary(),
      apiClient.getAssignedPlacementDrives(),
    ])
      .then(([lib, asn]) => {
        setDrives(Array.isArray(lib?.drives) ? lib.drives : []);
        setInProgress(Array.isArray(lib?.in_progress) ? lib.in_progress : []);
        setAssigned(Array.isArray(asn?.assignments) ? asn.assignments : []);
      })
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          'Could not load placement drives';
        setLoadError(typeof msg === 'string' ? msg : 'Could not load placement drives');
        toast.error('Failed to load placement drives');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLibrary();
  }, []);

  const { scrollY } = useScroll({
    container: pageScrollRef,
    layoutEffect: false,
  });

  const headerOpacity = useTransform(scrollY, [0, 320], [1, 0]);
  const headerScale = useTransform(scrollY, [0, 320], [1, 0.97]);

  /** Scroll up on dock (filter or cards) chains to page when cards are at top — reveals hero. */
  useEffect(() => {
    const pageScroll = pageScrollRef.current;
    const cardsEl = cardsScrollRef.current;
    if (!pageScroll || !cardsEl) return;

    const onWheel = (e: WheelEvent) => {
      if (window.innerWidth < 1024) return;
      if (e.deltaY >= 0) return;
      if (cardsEl.scrollTop > 1) return;
      if (pageScroll.scrollTop <= 0) return;

      const target = e.target as HTMLElement;
      if (!target.closest('[data-drives-dock]')) return;

      e.preventDefault();
      pageScroll.scrollTop += e.deltaY;
    };

    pageScroll.addEventListener('wheel', onWheel, { passive: false });
    return () => pageScroll.removeEventListener('wheel', onWheel);
  }, []);

  const inProgressByTemplate = useMemo(() => {
    const map: Record<string, any> = {};
    for (const a of inProgress) {
      if (a.template_id) map[a.template_id] = a;
    }
    return map;
  }, [inProgress]);

  const filterOptions = useMemo(() => {
    const companies = new Set<string>();
    const roles = new Set<string>();
    const stageTypes = new Set<string>();
    for (const d of drives) {
      if (d.company) companies.add(d.company);
      if (d.target_role) roles.add(d.target_role);
      for (const s of d.stages ?? []) {
        if (s.stage_type) stageTypes.add(s.stage_type);
      }
    }
    return {
      companies: Array.from(companies).sort(),
      roles: Array.from(roles).sort(),
      stageTypes: Array.from(stageTypes).sort(),
    };
  }, [drives]);

  const filteredDrives = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    let list = drives.filter((d) => {
      if (filters.company && d.company !== filters.company) return false;
      if (filters.target_role && d.target_role !== filters.target_role) return false;
      if (filters.stage_type) {
        const hasStage = (d.stages ?? []).some(
          (s: { stage_type?: string }) => s.stage_type === filters.stage_type,
        );
        if (!hasStage) return false;
      }
      if (!q) return true;
      const haystack = [d.title, d.company, d.target_role, d.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'title_asc') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'title_desc') return (b.title || '').localeCompare(a.title || '');
      return 0;
    });

    return list;
  }, [drives, filters, sortBy]);

  const continueDrive = (attemptId: string) => {
    router.push(`/dashboard/student/placement-drives/run?attempt_id=${attemptId}`);
  };

  const handleStart = async (templateId: string) => {
    const existing = inProgressByTemplate[templateId];
    if (existing?.attempt_id) {
      continueDrive(existing.attempt_id);
      return;
    }
    setStarting(templateId);
    try {
      const attempt = await apiClient.startPlacementDrive(templateId);
      router.push(`/dashboard/student/placement-drives/run?attempt_id=${attempt.attempt_id}`);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Could not start drive');
    } finally {
      setStarting(null);
    }
  };

  const applyFilters = () => setFilters(draftFilters);

  const resetFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
  };

  const pendingAssigned = assigned.filter((a) => ['ASSIGNED', 'OVERDUE', 'STARTED'].includes(a.status));

  return (
    <DashboardLayout requiredUserType="student">
      {/* Reserves main height while the desktop panel is position:fixed */}
      <div className="hidden lg:block lg:min-h-[calc(100dvh-5rem)]" aria-hidden />
      <div
        ref={pageScrollRef}
        className={cn(
          'relative -mx-6 -mt-20 w-auto bg-brand-hero p-4 pb-8 pt-24 dark:bg-brand-hero-dark sm:p-6 sm:pt-28',
          'lg:fixed lg:z-10 lg:mt-0 lg:overflow-y-auto',
          'lg:top-20 lg:right-0 lg:bottom-0 lg:px-6 lg:pb-6 lg:pt-6',
          isNavSidebarCollapsed ? 'lg:left-[80px]' : 'lg:left-[280px]',
        )}
      >
        <div className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8">
          <motion.div
            ref={headerRef}
            style={{ opacity: headerOpacity, scale: headerScale }}
            className="origin-top space-y-6 sm:space-y-8"
          >
            <PlacementDriveHero />

            {inProgress.length > 0 && (
              <PlacementDriveInProgressSection attempts={inProgress} onContinue={continueDrive} />
            )}

            {pendingAssigned.length > 0 && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/20 sm:p-5">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-100 sm:text-base">
                  <CalendarClock className="h-4 w-4" /> Assigned by your TPO
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {pendingAssigned.map((a) => (
                    <div
                      key={a.assignment_id}
                      className="rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
                    >
                      <div className="mb-2 flex flex-wrap gap-2">
                        {a.company && <Badge variant="secondary">{a.company}</Badge>}
                        <Badge variant={a.status === 'OVERDUE' ? 'destructive' : 'outline'}>{a.status}</Badge>
                      </div>
                      <h3 className="font-semibold">{a.title}</h3>
                      {a.due_at && (
                        <p className="mt-1 text-xs text-gray-500">Due {new Date(a.due_at).toLocaleString()}</p>
                      )}
                      {a.notes && <p className="mt-2 text-sm text-gray-600">{a.notes}</p>}
                      <Button
                        variant="mockPrimary"
                        className="mt-3 w-full gap-2 rounded-xl"
                        size="sm"
                        onClick={() => handleStart(a.template_id)}
                        disabled={starting === a.template_id}
                      >
                        <Play className="h-4 w-4 fill-current" />
                        {starting === a.template_id ? 'Starting…' : a.status === 'STARTED' ? 'Continue' : 'Start assigned drive'}
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </motion.div>

          <div
            data-drives-dock
            className={cn(
              'flex flex-col gap-4 sm:gap-5',
              'lg:sticky lg:top-0 lg:z-20',
            )}
          >
            {showFilterColumn && (
              <div className="shrink-0 lg:hidden">
                <PlacementDriveFiltersSidebar
                  draft={draftFilters}
                  onDraftChange={setDraftFilters}
                  onApply={applyFilters}
                  onReset={resetFilters}
                  options={filterOptions}
                />
              </div>
            )}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
              {showFilterColumn && (
                <div className="hidden shrink-0 lg:sticky lg:top-0 lg:block lg:w-[260px] xl:w-[280px]">
                  <PlacementDriveFiltersSidebar
                    draft={draftFilters}
                    onDraftChange={setDraftFilters}
                    onApply={applyFilters}
                    onReset={resetFilters}
                    options={filterOptions}
                  />
                </div>
              )}

              <div
                ref={cardsScrollRef}
                className="min-w-0 flex-1 space-y-4 lg:max-h-[calc(100dvh-11rem)] lg:overflow-y-auto scrollbar-hide"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-50 sm:text-lg">
                      Placement Drives
                    </h2>
                    {!loading && (
                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-brand-blue dark:bg-brand-blue/15 dark:text-brand-blue-light">
                        {filteredDrives.length} Drive{filteredDrives.length !== 1 ? 's' : ''} Available
                      </span>
                    )}
                  </div>
                  {/* <div className="flex items-center gap-2">
                    <ArrowUpDown className="hidden h-4 w-4 text-gray-400 sm:block" />
                    <select
                      className={sortSelectClass}
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      aria-label="Sort drives"
                    >
                      <option value="newest">Sort by: Newest</option>
                      <option value="title_asc">Sort by: A–Z</option>
                      <option value="title_desc">Sort by: Z–A</option>
                    </select>
                  </div> */}
                </div>

                {loading ? (
                  <div className="flex justify-center py-20">
                    <Loader size="lg" />
                  </div>
                ) : loadError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/20">
                    <p className="text-red-800 dark:text-red-200">{loadError}</p>
                    <Button className="mt-4 gap-2" variant="outline" onClick={loadLibrary}>
                      <RefreshCw className="h-4 w-4" /> Retry
                    </Button>
                  </div>
                ) : filteredDrives.length === 0 && pendingAssigned.length === 0 && inProgress.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-white/50 p-10 text-center dark:border-gray-700 dark:bg-gray-900/50">
                    <p className="font-semibold text-gray-600 dark:text-gray-400">No published placement drives yet.</p>
                    <p className="mt-2 text-sm text-gray-500">
                      An admin must publish a drive before it appears here.
                    </p>
                  </div>
                ) : filteredDrives.length === 0 ? (
                  <p className="py-16 text-center text-sm text-gray-500">No drives match your filters.</p>
                ) : (
                  <div className="grid auto-rows-fr gap-5 xl:grid-cols-2">
                    {filteredDrives.map((d) => (
                      <PlacementDriveCard
                        key={d.id}
                        drive={d}
                        inProgress={Boolean(inProgressByTemplate[d.id])}
                        starting={starting === d.id}
                        onStart={handleStart}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Full-width footer — pinned under filter + cards when docked on desktop */}
            <section className="w-full shrink-0 rounded-2xl border border-blue-100/80 bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-blue-50/90 p-5 shadow-sm dark:border-brand-blue/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 sm:p-6">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/40">
                    <Trophy className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Stay Consistent, Get Hired!</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Practice every round. Improve your skills. Crack your dream job.
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className={cn(
                    'h-11 shrink-0 gap-2 rounded-xl border-brand-blue/40 bg-white px-6 font-semibold text-brand-blue',
                    'hover:bg-blue-50 hover:text-brand-blue dark:border-brand-blue/50 dark:bg-gray-900 dark:hover:bg-gray-800',
                  )}
                >
                  <Link href="/dashboard/student">
                    <User className="h-4 w-4" />
                    View My Progress
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
