"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SimulationPrepCard,
  SimulationRoleCard,
} from "@/components/simulation/SimulationPrepCard";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Briefcase,
  Building2,
  CalendarClock,
  ClipboardList,
  FileBarChart,
  LayoutGrid,
  Play,
  RefreshCw,
  Search,
  Trophy,
  UserSquare2,
} from "lucide-react";

type MainTab = "browse" | "assigned";

type RunSummary = {
  run_id: string;
  status?: string;
  job_role_slug?: string;
  company?: string;
  current_stage_index?: number;
  total_stages?: number;
  current_stage?: { title?: string };
  verdict?: string;
  job_readiness_score?: number;
  pipeline?: { name?: string };
};

type SortOption = "relevant" | "company_asc" | "role_asc";

type Props = {
  startBasePath: string;
  loginRedirectBase?: string;
  inProgress?: RunSummary[];
  completed?: RunSummary[];
  loadingRuns?: boolean;
  mainTab?: MainTab;
  onMainTabChange?: (tab: MainTab) => void;
  assignedCount?: number;
  assignedContent?: ReactNode;
};

type FilterState = {
  search: string;
  company: string;
  role: string;
  category: string;
  difficulty: string;
};

const EMPTY_FILTERS: FilterState = {
  search: "",
  company: "",
  role: "",
  category: "",
  difficulty: "",
};

const panelClass =
  "rounded-[24px] border border-[#e7eef8] bg-white shadow-[0_8px_28px_rgba(17,44,150,0.06)] dark:border-gray-800 dark:bg-gray-900";

export function SimulationLibrary({
  startBasePath,
  loginRedirectBase = "/auth/login",
  inProgress = [],
  completed = [],
  loadingRuns = false,
  mainTab = "browse",
  onMainTabChange,
  assignedCount = 0,
  assignedContent,
}: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [roles, setRoles] = useState<any[]>([]);
  const [preps, setPreps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("relevant");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState<FilterState>(EMPTY_FILTERS);

  useEffect(() => {
    Promise.all([
      apiClient.getSimulationJobRoles(),
      apiClient.getSimulationCompanyPreps(),
    ])
      .then(([r, p]) => {
        setRoles(Array.isArray(r) ? r : []);
        setPreps(Array.isArray(p) ? p : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const goToStart = (params: {
    role: string;
    prep_id?: string;
    company?: string;
  }) => {
    const q = new URLSearchParams({ role: params.role });
    if (params.prep_id) q.set("prep_id", params.prep_id);
    if (params.company) q.set("company", params.company);
    const startUrl = `${startBasePath}?${q.toString()}`;

    if (!user) {
      router.push(
        `${loginRedirectBase}?redirect=${encodeURIComponent(startUrl)}`,
      );
      return;
    }
    router.push(startUrl);
  };

  const companies = useMemo(
    () => Array.from(new Set(preps.map((p) => p.company).filter(Boolean))).sort(),
    [preps],
  );
  const roleOptions = useMemo(
    () =>
      Array.from(
        new Set(
          roles
            .map((r) => r.display_name || r.slug?.replace(/_/g, " "))
            .filter(Boolean),
        ),
      ).sort(),
    [roles],
  );
  const categories = useMemo(
    () => Array.from(new Set(roles.map((r) => r.category).filter(Boolean))).sort(),
    [roles],
  );
  const difficulties = useMemo(
    () =>
      Array.from(
        new Set(preps.map((p) => p.difficulty_bias).filter(Boolean)),
      ).sort(),
    [preps],
  );

  const roleCategoryBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const role of roles) {
      if (role.slug && role.category) map.set(role.slug, role.category);
    }
    return map;
  }, [roles]);

  const roleDisplayNameBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const role of roles) {
      if (role.slug) {
        map.set(
          role.slug,
          role.display_name || role.slug.replace(/_/g, " "),
        );
      }
    }
    return map;
  }, [roles]);

  const roleMatchesFilter = (slug: string | undefined, roleFilter: string) => {
    if (!slug || !roleFilter) return true;
    const normalizedFilter = roleFilter.toLowerCase();
    const slugLabel = slug.replace(/_/g, " ").toLowerCase();
    const displayName = roleDisplayNameBySlug.get(slug)?.toLowerCase() || "";
    return (
      slugLabel === normalizedFilter ||
      displayName === normalizedFilter ||
      slug.toLowerCase() === normalizedFilter
    );
  };

  const filteredPreps = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const list = preps.filter((prep) => {
      const displayRole = prep.job_role_slug?.replace(/_/g, " ") || "";
      const catalogRoleName = roleDisplayNameBySlug.get(prep.job_role_slug) || "";
      const hay = [
        prep.card_title,
        prep.company,
        prep.job_role_slug,
        prep.card_description,
        displayRole,
        catalogRoleName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (q && !hay.includes(q)) return false;
      if (filters.company && prep.company !== filters.company) return false;
      if (filters.role && !roleMatchesFilter(prep.job_role_slug, filters.role)) {
        return false;
      }
      if (
        filters.category &&
        roleCategoryBySlug.get(prep.job_role_slug) !== filters.category
      ) {
        return false;
      }
      if (
        filters.difficulty &&
        (prep.difficulty_bias || "standard") !== filters.difficulty
      ) {
        return false;
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === "company_asc") {
        return (a.company || "").localeCompare(b.company || "");
      }
      if (sortBy === "role_asc") {
        return (a.card_title || "").localeCompare(b.card_title || "");
      }
      const aStages = a.stage_count ?? a.pipeline?.stage_count ?? 0;
      const bStages = b.stage_count ?? b.pipeline?.stage_count ?? 0;
      return bStages - aStages;
    });

    return list;
  }, [filters, preps, roleCategoryBySlug, roleDisplayNameBySlug, sortBy]);

  const filteredRoles = useMemo(() => {
    const q = filters.search.trim().toLowerCase();

    return roles.filter((role) => {
      const displayName =
        role.display_name || role.slug?.replace(/_/g, " ") || "";
      const slugLabel = role.slug?.replace(/_/g, " ") || "";
      const hay = [displayName, slugLabel, role.slug, role.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (q && !hay.includes(q)) return false;
      if (filters.role && !roleMatchesFilter(role.slug, filters.role)) {
        return false;
      }
      if (filters.category && role.category !== filters.category) {
        return false;
      }

      if (filters.company || filters.difficulty) {
        const matchingPreps = preps.filter((prep) => {
          if (prep.job_role_slug !== role.slug) return false;
          if (filters.company && prep.company !== filters.company) return false;
          if (
            filters.difficulty &&
            (prep.difficulty_bias || "standard") !== filters.difficulty
          ) {
            return false;
          }
          return true;
        });

        if (matchingPreps.length === 0) return false;
      }

      return true;
    });
  }, [filters, preps, roles, roleDisplayNameBySlug]);

  const filteredInProgress = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return inProgress.filter((run) => {
      const hay = [
        run.job_role_slug,
        run.company,
        run.pipeline?.name,
        run.current_stage?.title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (q && !hay.includes(q)) return false;
      if (filters.company && run.company !== filters.company) return false;
      return true;
    });
  }, [filters, inProgress]);

  const filteredCompleted = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return completed.filter((run) => {
      const hay = [
        run.job_role_slug,
        run.company,
        run.pipeline?.name,
        run.verdict,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (q && !hay.includes(q)) return false;
      if (filters.company && run.company !== filters.company) return false;
      return true;
    });
  }, [completed, filters]);

  const stats = useMemo(() => {
    const totalRounds = preps.reduce((sum, prep) => {
      return sum + Number(prep.stage_count ?? prep.pipeline?.stage_count ?? 0);
    }, 0);

    return [
      {
        icon: Briefcase,
        label: "Total Simulations",
        value: String(preps.length),
        hint: "Across all categories",
        tone:
          "bg-blue-50 text-brand-blue dark:bg-brand-blue/15 dark:text-brand-blue-light",
      },
      {
        icon: Building2,
        label: "Companies",
        value: String(companies.length),
        hint: "Top hiring companies",
        tone:
          "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400",
      },
      {
        icon: UserSquare2,
        label: "Roles Covered",
        value: String(roles.length),
        hint: "High demand roles",
        tone:
          "bg-blue-50 text-brand-blue dark:bg-brand-blue/15 dark:text-brand-blue-light",
      },
      {
        icon: BarChart3,
        label: "Rounds Included",
        value: `${totalRounds}+`,
        hint: "Mock rounds",
        tone:
          "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400",
      },
    ];
  }, [companies.length, preps, roles.length]);

  const hasHistoryContent =
    loadingRuns || filteredInProgress.length > 0 || filteredCompleted.length > 0;

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const rolesToShow = hasActiveFilters
    ? filteredRoles
    : filteredRoles.slice(0, 6);

  const applyFilters = () => setFilters(draftFilters);
  const clearFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[24px] border border-[#e7eef8] bg-gradient-to-r from-emerald-50/80 via-blue-50/50 to-orange-50/60 p-6 shadow-[0_8px_28px_rgba(17,44,150,0.04)] sm:p-8 dark:border-gray-800 dark:from-emerald-950/15 dark:via-blue-950/10 dark:to-orange-950/15">
        {/* Decorative background blobs and mesh */}
        <div className="absolute inset-0 opacity-40 pointer-events-none overflow-hidden">
          <div className="absolute -left-10 -top-10 h-44 w-44 rounded-full bg-emerald-100/50 blur-3xl dark:bg-emerald-900/10" />
          <div className="absolute right-1/4 bottom-0 h-48 w-48 rounded-full bg-blue-100/50 blur-3xl dark:bg-blue-900/10" />
          <svg
            className="absolute right-0 top-0 h-full w-[55%] pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="blueSvgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1B52A4" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#1B52A4" stopOpacity="0.25" />
              </linearGradient>
            </defs>
            <polygon points="35,0 100,0 100,100 0,100" fill="url(#blueSvgGrad)" />
          </svg>
        </div>

        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.2fr_0.9fr]">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-[#111827] dark:text-white sm:text-[2.1rem]">
              Job Prep <span className="text-brand-blue">Simulation</span>
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-400 sm:text-base">
              Full multi-round placement prep tailored to your role — free,
              resume-aware, adaptive difficulty.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onMainTabChange?.("browse")}
                className={cn(
                  "inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition-all border shadow-sm",
                  mainTab === "browse"
                    ? "border-transparent bg-brand-blue text-white hover:bg-brand-blue-dark"
                    : "border-orange-500/60 bg-white text-gray-600 hover:border-orange-500 hover:text-orange-600 dark:border-orange-500/40 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-orange-500 dark:hover:text-orange-400",
                )}
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Browse
              </button>
              {onMainTabChange && (
                <button
                  type="button"
                  onClick={() => onMainTabChange("assigned")}
                  className={cn(
                    "inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition-all border shadow-sm",
                    mainTab === "assigned"
                      ? "border-transparent bg-brand-blue text-white hover:bg-brand-blue-dark"
                      : "border-orange-500/60 bg-white text-gray-600 hover:border-orange-500 hover:text-orange-600 dark:border-orange-500/40 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-orange-500 dark:hover:text-orange-400",
                  )}
                >
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Assigned
                  {assignedCount > 0 && (
                    <span
                      className={cn(
                        "ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold transition-all",
                        mainTab === "assigned"
                          ? "bg-white text-brand-blue"
                          : "bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400",
                      )}
                    >
                      {assignedCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="hidden items-center justify-end self-end lg:flex">
            <div className="relative flex h-[150px] w-full max-w-[300px] items-end justify-end xl:h-[165px] xl:max-w-[330px]">
              <Image
                src="/images/20943965.png"
                alt="Job preparation simulation illustration"
                width={360}
                height={240}
                className="h-full w-auto object-contain brightness-110 drop-shadow-md"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {mainTab === "assigned" ? (
        assignedContent ?? (
          <EmptyBrowse message="No assigned simulations available." />
        )
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
          <aside className="shrink-0 lg:sticky lg:top-0 lg:block lg:w-[260px] xl:w-[280px]">
            <div className={cn("p-5 sm:p-6", panelClass)}>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-[#111827] dark:text-white">
                    Filter Simulations
                  </h2>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Narrow down simulations to find the perfect prep for you.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reset All
                </button>
              </div>

              <div className="space-y-4">
                {/* <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  className="h-10 rounded-xl border-gray-200 pl-9 text-sm dark:border-gray-700"
                  placeholder="Search roles, companies, or simulations..."
                  value={draftFilters.search}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      search: e.target.value,
                    }))
                  }
                />
              </div>
            </div> */}

                <FilterSelect
                  label="Filter by Company"
                  value={draftFilters.company || "__all__"}
                  onChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      company: value === "__all__" ? "" : value,
                    }))
                  }
                  options={companies}
                  allLabel="All Companies"
                />

                <FilterSelect
                  label="Browse by Role"
                  value={draftFilters.role || "__all__"}
                  onChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      role: value === "__all__" ? "" : value,
                    }))
                  }
                  options={roleOptions}
                  allLabel="All Roles"
                />

                <FilterSelect
                  label="Category"
                  value={draftFilters.category || "__all__"}
                  onChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      category: value === "__all__" ? "" : value,
                    }))
                  }
                  options={categories}
                  allLabel="All Categories"
                />

                <FilterSelect
                  label="Difficulty"
                  value={draftFilters.difficulty || "__all__"}
                  onChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      difficulty: value === "__all__" ? "" : value,
                    }))
                  }
                  options={difficulties}
                  allLabel="All Difficulties"
                />

                <Button
                  variant="mockPrimary"
                  className="mt-2 h-11 w-full rounded-xl text-sm font-semibold"
                  onClick={applyFilters}
                >
                  {/* <Play className="mr-2 h-4 w-4" /> */}
                  Apply Filters
                </Button>
              </div>

              <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50/70 p-4 dark:border-orange-950/30 dark:bg-orange-950/10">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-orange-500 shadow-sm dark:bg-gray-900">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111827] dark:text-white">
                      Not sure where to start?
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                      Take a quick assessment and get personalized recommendations.
                    </p>
                    <Button
                      variant="link"
                      className="mt-1 h-auto p-0 text-sm font-semibold text-brand-blue"
                      asChild
                    >
                      <Link href="/dashboard/student/mock-tests">Take Assessment</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="min-w-0 flex-1 space-y-5 lg:max-h-[calc(100dvh-11rem)] lg:overflow-y-auto scrollbar-hide">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map(({ icon: Icon, label, value, hint, tone }) => (
                <div key={label} className={cn("p-4", panelClass)}>
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl",
                        tone,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {label}
                      </p>
                      <p className="mt-1 text-2xl font-bold text-[#111827] dark:text-white">
                        {value}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {hint}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasHistoryContent && (
              <HistoryPanel
                inProgress={filteredInProgress}
                completed={filteredCompleted}
                loadingRuns={loadingRuns}
              />
            )}

            <section className={cn("p-5 sm:p-6", panelClass)}>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-[#111827] dark:text-white">
                    All Simulations
                  </h2>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-brand-blue dark:bg-brand-blue/15 dark:text-brand-blue-light">
                    {filteredPreps.length} Results
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Sort by:
                  </span>
                  <Select
                    value={sortBy}
                    onValueChange={(value) => setSortBy(value as SortOption)}
                  >
                    <SelectTrigger className="h-9 w-[170px] rounded-xl border-gray-200 text-sm dark:border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevant">Most Relevant</SelectItem>
                      <SelectItem value="company_asc">Company A-Z</SelectItem>
                      <SelectItem value="role_asc">Role A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredPreps.length === 0 ? (
                <EmptyBrowse
                  message={
                    hasActiveFilters
                      ? "No simulations match your current filters."
                      : "No simulation cards are available yet."
                  }
                />
              ) : (
                <>
                  <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredPreps.map((prep) => (
                      <SimulationPrepCard
                        key={prep.id}
                        prep={prep}
                        onStart={() =>
                          goToStart({
                            role: prep.job_role_slug,
                            prep_id: prep.id,
                            company: prep.company,
                          })
                        }
                      />
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                    <span>
                      Showing 1 to {filteredPreps.length} of {filteredPreps.length}
                    </span>
                    <span>{roles.length} roles covered</span>
                  </div>
                </>
              )}
            </section>

            {roles.length > 0 && (
              <section className={cn("p-5 sm:p-6", panelClass)}>
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#111827] dark:text-white">
                      Browse by Role
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Start a simulation pipeline from your target role.
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {hasActiveFilters
                      ? `${rolesToShow.length} of ${roles.length} roles`
                      : `${roles.length} roles`}
                  </Badge>
                </div>
                {rolesToShow.length === 0 ? (
                  <EmptyBrowse message="No roles match your current filters." />
                ) : (
                  <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {rolesToShow.map((role) => (
                      <SimulationRoleCard
                        key={role.slug}
                        role={role}
                        disabled={!role.default_pipeline}
                        onStart={() => goToStart({ role: role.slug })}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  allLabel: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 rounded-xl border-gray-200 text-sm dark:border-gray-700">
          <SelectValue placeholder={allLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function HistoryPanel({
  inProgress,
  completed,
  loadingRuns,
}: {
  inProgress: RunSummary[];
  completed: RunSummary[];
  loadingRuns: boolean;
}) {
  if (loadingRuns) {
    return (
      <div className={cn("flex justify-center py-10", panelClass)}>
        <Loader />
      </div>
    );
  }

  if (inProgress.length === 0 && completed.length === 0) return null;

  return (
    <section className={cn("space-y-5 p-5 sm:p-6", panelClass)}>
      {inProgress.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-[#111827] dark:text-white">
              Continue in Progress
            </h3>
            {/* <Badge variant="secondary">{inProgress.length}</Badge> */}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {inProgress.map((run) => (
              <div
                key={run.run_id}
                className="min-w-[300px] max-w-[320px] shrink-0 rounded-2xl border border-orange-100 bg-orange-50/30 p-4 transition-all duration-200 hover:border-orange-200 hover:shadow-sm dark:border-orange-950/40 dark:bg-orange-950/10 dark:hover:border-orange-900/50"
              >
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge variant="success">
                    {run.job_role_slug?.replace(/_/g, " ")}
                  </Badge>
                  {run.company && (
                    <Badge className="border-none bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:hover:bg-orange-900/60">
                      {run.company}
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-semibold text-[#111827] dark:text-white">
                  {run.pipeline?.name || "Simulation"}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Stage {(run.current_stage_index ?? 0) + 1} of {run.total_stages}
                  {run.current_stage?.title ? ` — ${run.current_stage.title}` : ""}
                </p>
                <Button
                  className="mt-4 w-full gap-2 bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-700 border-none"
                  size="sm"
                  asChild
                >
                  <Link href={`/dashboard/student/simulations/run?run_id=${run.run_id}`}>
                    {/* <Play className="h-4 w-4" /> */}
                    Continue
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-[#111827] dark:text-white">
              Past Simulations
            </h3>
            <Badge variant="secondary">{completed.length}</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {completed.map((run) => (
              <div
                key={run.run_id}
                className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700"
              >
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge>{run.job_role_slug?.replace(/_/g, " ")}</Badge>
                  {run.verdict && (
                    <Badge variant="outline">
                      {run.verdict.replace(/_/g, " ")}
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-semibold text-[#111827] dark:text-white">
                  {run.pipeline?.name || "Completed Simulation"}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {Math.round(run.job_readiness_score ?? 0)}% readiness
                </p>
                <Button className="mt-4 w-full gap-2" size="sm" variant="outline" asChild>
                  <Link href={`/dashboard/student/simulations/report?run_id=${run.run_id}`}>
                    <FileBarChart className="h-4 w-4" />
                    View report
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function EmptyBrowse({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}
