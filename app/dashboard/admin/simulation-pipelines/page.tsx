'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminSimulationPipelinesPage() {
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [preps, setPreps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [prepForm, setPrepForm] = useState({
    company: '',
    job_role_slug: 'software_developer',
    card_title: '',
    card_description: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [p, r, c] = await Promise.all([
        apiClient.adminListSimulationPipelines(),
        apiClient.adminListJobRoleCatalog(),
        apiClient.adminListCompanyRolePreps(),
      ]);
      setPipelines(Array.isArray(p) ? p : []);
      setRoles(Array.isArray(r) ? r : []);
      setPreps(Array.isArray(c) ? c : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (roles.length === 0) return;
    const slugs = roles.map((r) => r.slug);
    if (!slugs.includes(prepForm.job_role_slug)) {
      setPrepForm((prev) => ({ ...prev, job_role_slug: roles[0].slug }));
    }
  }, [roles, prepForm.job_role_slug]);

  const seed = async () => {
    setSeeding(true);
    try {
      const result = await apiClient.adminSeedSimulationPipelines();
      toast.success(`Seeded ${result.plan_count} plans (${result.created_pipelines} new)`);
      load();
    } catch {
      toast.error('Seed failed — run DB migration first');
    } finally {
      setSeeding(false);
    }
  };

  const togglePublish = async (id: string, current: boolean) => {
    await apiClient.adminUpdateSimulationPipeline(id, { is_published: !current });
    load();
  };

  const createPrepCard = async (publish: boolean) => {
    try {
      const title =
        prepForm.card_title.trim() ||
        `${prepForm.company} — ${roles.find((r) => r.slug === prepForm.job_role_slug)?.display_name || prepForm.job_role_slug}`;
      await apiClient.adminCreateCompanyRolePrep({
        ...prepForm,
        card_title: title,
        is_published: publish,
      });
      toast.success(publish ? 'Prep card published' : 'Prep card saved');
      setPrepForm({ company: '', job_role_slug: 'software_developer', card_title: '', card_description: '' });
      load();
    } catch {
      toast.error('Failed to create prep card');
    }
  };

  return (
    <DashboardLayout requiredUserType="admin">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Simulation Pipelines</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Role-specific multi-round configs seeded from round_plans.json. Simulations are free for students.
            </p>
          </div>
          <Button onClick={seed} disabled={seeding}>
            {seeding ? 'Seeding…' : 'Seed from round_plans.json'}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader size="lg" />
          </div>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Job role catalog ({roles.length})</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {roles.map((r) => (
                  <div key={r.slug} className="rounded-lg border p-3 dark:border-gray-700">
                    <div className="font-medium">{r.display_name}</div>
                    <div className="text-sm text-gray-500">{r.slug} · {r.category}</div>
                    {r.default_pipeline && (
                      <Badge variant="outline" className="mt-2">
                        {r.default_pipeline.name} · {r.default_pipeline.stage_count} stages
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Pipelines ({pipelines.length})</h2>
              {pipelines.length === 0 ? (
                <p className="text-gray-500">No pipelines yet. Click &quot;Seed from round_plans.json&quot;.</p>
              ) : (
                pipelines.map((p) => (
                  <div key={p.id} className="rounded-xl border p-4 dark:border-gray-700">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-sm text-gray-500">{p.slug} · v{p.version}</div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={p.is_published ? 'default' : 'secondary'}>
                          {p.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => togglePublish(p.id, p.is_published)}>
                          {p.is_published ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                          {expandedId === p.id ? 'Hide stages' : `${p.stage_count} stages`}
                        </Button>
                      </div>
                    </div>
                    {expandedId === p.id && p.stages && (
                      <ol className="mt-3 space-y-1 border-t pt-3 text-sm dark:border-gray-700">
                        {p.stages.map((s: any) => (
                          <li key={s.id}>
                            {s.order_index + 1}. {s.title}{' '}
                            <span className="text-gray-500">({s.stage_type})</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                ))
              )}
            </section>

            <section className="rounded-xl border p-4 space-y-3 dark:border-gray-700 overflow-visible">
              <h2 className="text-lg font-semibold">Company + role prep cards</h2>
              <Input
                placeholder="Company (e.g. Flipkart)"
                value={prepForm.company}
                onChange={(e) => setPrepForm({ ...prepForm, company: e.target.value })}
              />
              <div className="relative z-20">
                <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Job role</label>
                <Select
                  value={prepForm.job_role_slug}
                  onValueChange={(value) => setPrepForm({ ...prepForm, job_role_slug: value })}
                  disabled={roles.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={roles.length === 0 ? 'Seed pipelines to load roles' : 'Select job role'} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.slug} value={r.slug}>
                        {r.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Card title (optional)"
                value={prepForm.card_title}
                onChange={(e) => setPrepForm({ ...prepForm, card_title: e.target.value })}
              />
              <textarea
                className="w-full rounded-md border px-3 py-2 dark:bg-gray-800"
                placeholder="Short description"
                rows={2}
                value={prepForm.card_description}
                onChange={(e) => setPrepForm({ ...prepForm, card_description: e.target.value })}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => createPrepCard(false)} disabled={!prepForm.company.trim()}>
                  Save draft
                </Button>
                <Button onClick={() => createPrepCard(true)} disabled={!prepForm.company.trim()}>
                  Publish card
                </Button>
              </div>

              {preps.length > 0 && (
                <ul className="space-y-2 pt-2">
                  {preps.map((c) => (
                    <li key={c.id} className="flex items-center justify-between rounded-lg border px-3 py-2 dark:border-gray-700">
                      <span>{c.card_title}</span>
                      <Badge variant={c.is_published ? 'default' : 'secondary'}>
                        {c.is_published ? 'Live' : 'Draft'}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
