"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SimulationFeaturedBanner,
  SimulationPrepCard,
  SimulationRoleCard,
} from "@/components/simulation/SimulationPrepCard";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  Briefcase,
  Building2,
  FileBarChart,
  History,
  LayoutGrid,
  Play,
  Search,
} from "lucide-react";

type BrowseSection = "all" | "company" | "roles" | "history";

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

type Props = {
  startBasePath: string;
  loginRedirectBase?: string;
  inProgress?: RunSummary[];
  completed?: RunSummary[];
  loadingRuns?: boolean;
};

export function SimulationLibrary({
  startBasePath,
  loginRedirectBase = "/auth/login",
  inProgress = [],
  completed = [],
  loadingRuns = false,
}: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [roles, setRoles] = useState<any[]>([]);
  const [preps, setPreps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [browseSection, setBrowseSection] = useState<BrowseSection>("all");
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

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
  const categories = useMemo(
    () => Array.from(new Set(roles.map((r) => r.category).filter(Boolean))).sort(),
    [roles],
  );

  const matchesSearch = (hay: string) =>
    !search || hay.toLowerCase().includes(search.toLowerCase());

  const filteredPreps = preps.filter((p) => {
    const hay = `${p.card_title} ${p.company} ${p.job_role_slug}`;
    const matchSearch = matchesSearch(hay);
    const matchCompany =
      !companyFilter ||
      p.company?.toLowerCase().includes(companyFilter.toLowerCase());
    return matchSearch && matchCompany;
  });

  const filteredRoles = roles.filter((r) => {
    const hay = `${r.display_name} ${r.slug} ${r.category}`;
    const matchSearch = matchesSearch(hay);
    const matchCategory = !categoryFilter || r.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const filteredInProgress = inProgress.filter((r) => {
    const hay = `${r.job_role_slug} ${r.company} ${r.pipeline?.name} ${r.current_stage?.title}`;
    return matchesSearch(hay);
  });

  const filteredCompleted = completed.filter((r) => {
    const hay = `${r.job_role_slug} ${r.company} ${r.pipeline?.name} ${r.verdict}`;
    const matchSearch = matchesSearch(hay);
    const matchCompany =
      !companyFilter ||
      r.company?.toLowerCase().includes(companyFilter.toLowerCase());
    return matchSearch && matchCompany;
  });

  const clearFilters = () => {
    setSearch("");
    setCompanyFilter("");
    setCategoryFilter("");
  };

  const hasActiveFilters = Boolean(search || companyFilter || categoryFilter);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SimulationFeaturedBanner />

      <Tabs
        value={browseSection}
        onValueChange={(v) => setBrowseSection(v as BrowseSection)}
        className="space-y-4"
      >
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 lg:grid-cols-4 lg:w-full">
          <TabsTrigger value="all" className="gap-2 px-4 py-2.5">
            <LayoutGrid className="h-4 w-4 shrink-0" />
            All
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2 px-4 py-2.5">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Company prep</span>
            <span className="sm:hidden">Company</span>
            <Badge
              variant="secondary"
              className="ml-1 h-5 min-w-[1.25rem] px-1.5 text-xs"
            >
              {filteredPreps.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2 px-4 py-2.5">
            <Briefcase className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Browse by role</span>
            <span className="sm:hidden">Roles</span>
            <Badge
              variant="secondary"
              className="ml-1 h-5 min-w-[1.25rem] px-1.5 text-xs"
            >
              {filteredRoles.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 px-4 py-2.5">
            <History className="h-4 w-4 shrink-0" />
            History
            <Badge
              variant="secondary"
              className="ml-1 h-5 min-w-[1.25rem] px-1.5 text-xs"
            >
              {filteredInProgress.length + filteredCompleted.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filter simulations</CardTitle>
            <CardDescription>
              Search and narrow results across all browse sections.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search roles, companies, or simulations…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Input
                placeholder="Filter by company"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                list="sim-companies"
              />
              <Select
                value={categoryFilter || "__all__"}
                onValueChange={(v) =>
                  setCategoryFilter(v === "__all__" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <datalist id="sim-companies">
                {companies.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {/* {companies.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Popular companies:</span>
                {companies.slice(0, 8).map((c) => (
                  <Button
                    key={c}
                    size="sm"
                    variant={companyFilter === c ? 'default' : 'outline'}
                    className="rounded-full h-8"
                    onClick={() => setCompanyFilter(companyFilter === c ? '' : c)}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            )} */}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-2 text-muted-foreground"
              >
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>

        <TabsContent
          value="all"
          className="mt-0 space-y-8 focus-visible:outline-none"
        >
          {renderBrowseSections()}
        </TabsContent>
        <TabsContent
          value="company"
          className="mt-0 focus-visible:outline-none"
        >
          {renderCompanySection()}
        </TabsContent>
        <TabsContent value="roles" className="mt-0 focus-visible:outline-none">
          {renderRolesSection()}
        </TabsContent>
        <TabsContent
          value="history"
          className="mt-0 focus-visible:outline-none"
        >
          {renderHistorySection()}
        </TabsContent>
      </Tabs>
    </div>
  );

  function renderBrowseSections() {
    const hasHistoryContent =
      loadingRuns ||
      filteredInProgress.length > 0 ||
      filteredCompleted.length > 0;

    return (
      <div className="space-y-8">
        {hasHistoryContent && renderHistorySection(false)}
        {renderCompanySection()}
        {renderRolesSection()}
      </div>
    );
  }

  function renderHistorySection(showEmptyWhenNone = true) {
    if (loadingRuns) {
      return (
        <div className="flex justify-center py-10">
          <Loader />
        </div>
      );
    }

    const hasHistory =
      filteredInProgress.length > 0 || filteredCompleted.length > 0;

    return (
      <div className="space-y-6">
        {filteredInProgress.length > 0 && (
          <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900 dark:bg-blue-950/20">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Continue in progress</h2>
              <Badge variant="secondary">{filteredInProgress.length}</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {filteredInProgress.map((r) => (
                <div
                  key={r.run_id}
                  className="rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
                >
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge>{r.job_role_slug?.replace(/_/g, " ")}</Badge>
                    {r.company && (
                      <Badge variant="secondary">{r.company}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Stage {(r.current_stage_index ?? 0) + 1} of {r.total_stages}
                    {r.current_stage?.title
                      ? ` — ${r.current_stage.title}`
                      : ""}
                  </p>
                  <Button className="mt-3 w-full gap-2" size="sm" asChild>
                    <Link
                      href={`/dashboard/student/simulations/run?run_id=${r.run_id}`}
                    >
                      <Play className="h-4 w-4" /> Continue
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {filteredCompleted.length > 0 && (
          <section className="rounded-xl border p-5 dark:border-gray-700">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Past simulations</h2>
              <Badge variant="secondary">{filteredCompleted.length}</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredCompleted.map((r) => (
                <div
                  key={r.run_id}
                  className="rounded-lg border p-4 dark:border-gray-700"
                >
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge>{r.job_role_slug?.replace(/_/g, " ")}</Badge>
                    {r.verdict && (
                      <Badge variant="outline">
                        {r.verdict.replace(/_/g, " ")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {r.pipeline?.name} ·{" "}
                    {Math.round(r.job_readiness_score ?? 0)}% readiness
                  </p>
                  <Button
                    className="mt-3 w-full gap-2"
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <Link
                      href={`/dashboard/student/simulations/report?run_id=${r.run_id}`}
                    >
                      <FileBarChart className="h-4 w-4" /> View report
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {!hasHistory && showEmptyWhenNone && (
          <EmptyBrowse message="No simulation history yet. Start a prep card or browse by role." />
        )}
      </div>
    );
  }

  function renderCompanySection() {
    if (filteredPreps.length === 0) {
      return (
        <EmptyBrowse
          message={
            preps.length === 0
              ? "No company prep cards published yet."
              : "No company prep cards match your filters."
          }
        />
      );
    }

    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Company + role prep</h2>
          <Badge variant="secondary">{filteredPreps.length} cards</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPreps.map((p) => (
            <SimulationPrepCard
              key={p.id}
              prep={p}
              onStart={() =>
                goToStart({
                  role: p.job_role_slug,
                  prep_id: p.id,
                  company: p.company,
                })
              }
            />
          ))}
        </div>
      </section>
    );
  }

  function renderRolesSection() {
    if (filteredRoles.length === 0) {
      return (
        <EmptyBrowse
          message={
            roles.length === 0
              ? "No published simulations yet. Ask your admin to seed pipelines."
              : "No roles match your filters."
          }
        />
      );
    }

    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Browse by role</h2>
          <Badge variant="secondary">{filteredRoles.length} roles</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRoles.map((r) => (
            <SimulationRoleCard
              key={r.slug}
              role={r}
              disabled={!r.default_pipeline}
              onStart={() => goToStart({ role: r.slug })}
            />
          ))}
        </div>
      </section>
    );
  }
}

function EmptyBrowse({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center dark:border-gray-700">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
