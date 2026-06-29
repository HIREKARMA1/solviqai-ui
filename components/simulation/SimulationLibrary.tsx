'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Building2, Layers, Play, Search, Workflow } from 'lucide-react';

type Props = {
  startBasePath: string;
  loginRedirectBase?: string;
};

export function SimulationLibrary({ startBasePath, loginRedirectBase = '/auth/login' }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [roles, setRoles] = useState<any[]>([]);
  const [preps, setPreps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');

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

  const goToStart = (params: { role: string; prep_id?: string; company?: string }) => {
    const q = new URLSearchParams({ role: params.role });
    if (params.prep_id) q.set('prep_id', params.prep_id);
    if (params.company) q.set('company', params.company);
    const startUrl = `${startBasePath}?${q.toString()}`;

    if (!user) {
      router.push(`${loginRedirectBase}?redirect=${encodeURIComponent(startUrl)}`);
      return;
    }
    router.push(startUrl);
  };

  const filteredPreps = preps.filter((p) => {
    const hay = `${p.card_title} ${p.company} ${p.job_role_slug}`.toLowerCase();
    const matchSearch = !search || hay.includes(search.toLowerCase());
    const matchCompany = !companyFilter || p.company?.toLowerCase().includes(companyFilter.toLowerCase());
    return matchSearch && matchCompany;
  });

  const filteredRoles = roles.filter((r) => {
    const hay = `${r.display_name} ${r.slug} ${r.category}`.toLowerCase();
    return !search || hay.includes(search.toLowerCase());
  });

  const companies = [...new Set(preps.map((p) => p.company).filter(Boolean))].sort();

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search roles or companies…"
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
        <datalist id="sim-companies">
          {companies.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      {filteredPreps.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Company + role prep</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {filteredPreps.map((p) => (
              <div key={p.id} className="rounded-xl border p-5 dark:border-gray-700">
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Building2 className="h-3 w-3" />
                    {p.company}
                  </Badge>
                  {p.pipeline && (
                    <Badge variant="outline" className="gap-1">
                      <Layers className="h-3 w-3" />
                      {p.pipeline.stage_count} rounds
                    </Badge>
                  )}
                  <Badge className="bg-green-600">Free</Badge>
                </div>
                <h3 className="text-lg font-semibold">{p.card_title}</h3>
                {p.card_description && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{p.card_description}</p>
                )}
                <Button
                  className="mt-4 w-full gap-2"
                  onClick={() =>
                    goToStart({ role: p.job_role_slug, prep_id: p.id, company: p.company })
                  }
                >
                  <Play className="h-4 w-4" />
                  Start Prep Simulation
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Browse by role</h2>
        {filteredRoles.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">
            No published simulations yet. Ask your admin to seed pipelines.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRoles.map((r) => (
              <div key={r.slug} className="rounded-xl border p-5 dark:border-gray-700">
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge variant="outline">{r.category || 'General'}</Badge>
                  {r.default_pipeline && (
                    <Badge className="gap-1">
                      <Layers className="h-3 w-3" />
                      {r.default_pipeline.stage_count} rounds
                    </Badge>
                  )}
                  <Badge className="bg-green-600">Free</Badge>
                </div>
                <h3 className="font-semibold">{r.display_name}</h3>
                <p className="text-xs text-gray-500 mt-1">{r.slug}</p>
                <Button
                  className="mt-4 w-full gap-2"
                  variant="outline"
                  onClick={() => goToStart({ role: r.slug })}
                  disabled={!r.default_pipeline}
                >
                  <Workflow className="h-4 w-4" />
                  {r.default_pipeline ? 'Start role simulation' : 'Pipeline pending'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
