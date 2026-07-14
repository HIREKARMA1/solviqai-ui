'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SimulationPipelineWizard } from '@/components/simulation/SimulationPipelineWizard';
import { SimulationAssignDialog } from '@/components/simulation/SimulationAssignDialog';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Building2, Copy, Layers, Pencil, Plus, Trash2, Users, Briefcase } from 'lucide-react';

export default function AdminSimulationPipelinesPage() {
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [preps, setPreps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<{ id: string; name: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [activeTab, setActiveTab] = useState('pipelines');
  const [prepForm, setPrepForm] = useState({
    company: '',
    job_role_slug: '',
    card_title: '',
    card_description: '',
  });
  const [newRole, setNewRole] = useState({
    slug: '',
    display_name: '',
    category: 'IT',
  });
  const [creatingRole, setCreatingRole] = useState(false);

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
      toast.success(
        `Seeded ${result.plan_count} plans (${result.created_pipelines} new pipelines, ${result.created_roles || 0} roles)`,
      );
      await load();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(
        typeof detail === 'string'
          ? detail
          : 'Seed failed — run DB migration (alembic upgrade head) then retry',
      );
    } finally {
      setSeeding(false);
    }
  };

  const createRole = async () => {
    if (!newRole.display_name.trim()) {
      toast.error('Enter a role display name');
      return;
    }
    const slug =
      newRole.slug.trim() ||
      newRole.display_name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
    if (!slug) {
      toast.error('Could not derive a role slug');
      return;
    }
    setCreatingRole(true);
    try {
      await apiClient.adminCreateJobRoleCatalog({
        slug,
        display_name: newRole.display_name.trim(),
        category: newRole.category.trim() || 'General',
      });
      toast.success('Job role added to catalog');
      setNewRole({ slug: '', display_name: '', category: 'IT' });
      await load();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Could not create job role');
    } finally {
      setCreatingRole(false);
    }
  };

  const openCreate = () => {
    setEditId(null);
    setWizardOpen(true);
  };

  const openEdit = (id: string) => {
    setEditId(id);
    setWizardOpen(true);
  };

  const duplicate = async (id: string) => {
    try {
      await apiClient.adminDuplicateSimulationPipeline(id);
      toast.success('Pipeline duplicated as draft');
      load();
    } catch {
      toast.error('Duplicate failed');
    }
  };

  const archive = async (id: string) => {
    if (!confirm('Archive this pipeline? It will be unpublished.')) return;
    try {
      await apiClient.adminArchiveSimulationPipeline(id);
      toast.success('Pipeline archived');
      load();
    } catch {
      toast.error('Archive failed');
    }
  };

  const togglePublish = async (id: string, current: boolean) => {
    try {
      await apiClient.adminUpdateSimulationPipeline(id, {
        is_published: !current,
        status: !current ? 'published' : 'draft',
      });
      load();
    } catch {
      toast.error('Publish failed — ensure prompt engineering round exists');
    }
  };

  const createPrepCard = async (publish: boolean) => {
    if (!prepForm.company.trim()) {
      toast.error('Enter a company name');
      return;
    }
    if (!prepForm.job_role_slug) {
      toast.error('Select a job role — seed or add roles in the Job role catalog first');
      return;
    }
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
      setPrepForm({
        company: '',
        job_role_slug: roles[0]?.slug || '',
        card_title: '',
        card_description: '',
      });
      load();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Failed to create prep card');
    }
  };

  const deletePrepCard = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This will remove the prep card from the student library.`)) return;
    try {
      await apiClient.adminDeleteCompanyRolePrep(id);
      toast.success('Prep card deleted');
      load();
    } catch {
      toast.error('Failed to delete prep card');
    }
  };

  const filteredPipelines = pipelines.filter((p) => {
    if (statusFilter === 'archived') return p.status === 'archived';
    if (statusFilter === 'active') return p.status !== 'archived';
    return true;
  });

  const publishedPrepCount = preps.filter((c) => c.is_published).length;

  const statusBadge = (p: any) => {
    if (p.status === 'archived') return <Badge variant="secondary">Archived</Badge>;
    if (p.status === 'scheduled') return <Badge variant="outline">Scheduled</Badge>;
    if (p.is_published) return <Badge variant="default">Published</Badge>;
    return <Badge variant="secondary">Draft</Badge>;
  };

  return (
    <DashboardLayout requiredUserType="admin">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Simulation Pipelines</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400 max-w-2xl">
            Manage multi-round job prep assessments, role catalog, and company prep cards. Simulations
            are free for students.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader size="lg" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 p-1 sm:w-auto sm:inline-flex">
              <TabsTrigger value="pipelines" className="gap-2 px-4 py-2.5">
                <Layers className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Pipelines</span>
                <span className="sm:hidden">Pipes</span>
                <Badge variant="secondary" className="ml-1 h-5 min-w-[1.25rem] px-1.5 text-xs">
                  {filteredPipelines.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="catalog" className="gap-2 px-4 py-2.5">
                <Briefcase className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Job roles</span>
                <span className="sm:hidden">Roles</span>
                <Badge variant="secondary" className="ml-1 h-5 min-w-[1.25rem] px-1.5 text-xs">
                  {roles.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="prep-cards" className="gap-2 px-4 py-2.5">
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Prep cards</span>
                <span className="sm:hidden">Cards</span>
                <Badge variant="secondary" className="ml-1 h-5 min-w-[1.25rem] px-1.5 text-xs">
                  {preps.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pipelines" className="mt-0 space-y-4 focus-visible:outline-none">
              <Card>
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0 pb-4">
                  <div>
                    <CardTitle className="text-lg">Assessment pipelines</CardTitle>
                    <CardDescription>
                      Create, publish, and assign multi-round simulation flows.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={seed} disabled={seeding}>
                      {seeding ? 'Seeding…' : 'Seed from JSON'}
                    </Button>
                    <Button onClick={openCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create assessment
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground">
                      {filteredPipelines.length} pipeline{filteredPipelines.length === 1 ? '' : 's'}
                    </p>
                    <Select
                      value={statusFilter}
                      onValueChange={(v: 'all' | 'active' | 'archived') => setStatusFilter(v)}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                        <SelectItem value="all">All</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {filteredPipelines.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center dark:border-gray-700">
                      <Layers className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                      <p className="font-medium">No pipelines yet</p>
                      <p className="mt-1 text-sm text-gray-500">
                        Create an assessment or seed from round_plans.json to get started.
                      </p>
                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <Button variant="outline" onClick={seed} disabled={seeding}>
                          Seed from JSON
                        </Button>
                        <Button onClick={openCreate}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create assessment
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredPipelines.map((p) => (
                        <div
                          key={p.id}
                          className="rounded-xl border p-4 transition-colors hover:bg-muted/30 dark:border-gray-700"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold">{p.name}</span>
                                {p.ai_recommended && (
                                  <Badge variant="outline" className="text-xs">
                                    AI recommended
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {p.slug} · v{p.version}
                                {p.department && ` · ${p.department}`}
                                {p.experience_level && ` · ${p.experience_level}`}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {statusBadge(p)}
                              {p.status !== 'archived' && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => openEdit(p.id)}>
                                    <Pencil className="mr-1 h-3 w-3" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setAssignTarget({ id: p.id, name: p.name })}
                                  >
                                    <Users className="mr-1 h-3 w-3" />
                                    Assign
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => duplicate(p.id)}>
                                    <Copy className="mr-1 h-3 w-3" />
                                    Duplicate
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => togglePublish(p.id, p.is_published)}
                                  >
                                    {p.is_published ? 'Unpublish' : 'Publish'}
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => archive(p.id)}>
                                    <Trash2 className="mr-1 h-3 w-3" />
                                    Archive
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                              >
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
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="catalog" className="mt-0 focus-visible:outline-none">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Job role catalog</CardTitle>
                  <CardDescription>
                    Roles linked to default simulation pipelines. Seed from JSON or add roles manually
                    so Create Pipeline / Prep Card dropdowns work.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border p-4 space-y-3 dark:border-gray-700">
                    <p className="text-sm font-medium">Add job role</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <Input
                        placeholder="Display name (e.g. Software Developer)"
                        value={newRole.display_name}
                        onChange={(e) => setNewRole({ ...newRole, display_name: e.target.value })}
                      />
                      <Input
                        placeholder="Slug (optional)"
                        value={newRole.slug}
                        onChange={(e) => setNewRole({ ...newRole, slug: e.target.value })}
                      />
                      <Input
                        placeholder="Category (e.g. IT)"
                        value={newRole.category}
                        onChange={(e) => setNewRole({ ...newRole, category: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={createRole} disabled={creatingRole}>
                        {creatingRole ? 'Adding…' : 'Add role'}
                      </Button>
                      <Button variant="outline" onClick={seed} disabled={seeding}>
                        {seeding ? 'Seeding…' : 'Seed roles from JSON'}
                      </Button>
                    </div>
                  </div>

                  {roles.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center dark:border-gray-700">
                      <Briefcase className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                      <p className="font-medium">No roles in catalog</p>
                      <p className="mt-1 text-sm text-gray-500">
                        Seed pipelines from JSON or add a role above to unlock role dropdowns.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {roles.map((r) => (
                        <div
                          key={r.slug}
                          className="rounded-lg border p-4 dark:border-gray-700 hover:bg-muted/30 transition-colors"
                        >
                          <div className="font-medium">{r.display_name}</div>
                          <div className="text-sm text-gray-500 mt-0.5">
                            {r.slug} · {r.category}
                          </div>
                          {r.default_pipeline && (
                            <Badge variant="outline" className="mt-2">
                              {r.default_pipeline.name} · {r.default_pipeline.stage_count} stages
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prep-cards" className="mt-0 space-y-4 focus-visible:outline-none">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Create prep card</CardTitle>
                    <CardDescription>
                      Company + role cards shown to students in the simulation library (Apna-style).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 overflow-visible">
                    <Input
                      placeholder="Company (e.g. Flipkart)"
                      value={prepForm.company}
                      onChange={(e) => setPrepForm({ ...prepForm, company: e.target.value })}
                    />
                    <div className="relative z-20">
                      <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
                        Job role
                      </label>
                      <Select
                        value={prepForm.job_role_slug || undefined}
                        onValueChange={(value) => setPrepForm({ ...prepForm, job_role_slug: value })}
                        disabled={roles.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              roles.length === 0
                                ? 'Add/seed roles in Job role catalog first'
                                : 'Select job role'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="z-[10050]">
                          {roles.map((r) => (
                            <SelectItem key={r.slug} value={r.slug}>
                              {r.display_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {roles.length === 0 && (
                        <p className="mt-1 text-xs text-amber-600">
                          Open the Job role catalog tab → Seed from JSON or Add role.
                        </p>
                      )}
                    </div>
                    <Input
                      placeholder="Card title (optional)"
                      value={prepForm.card_title}
                      onChange={(e) => setPrepForm({ ...prepForm, card_title: e.target.value })}
                    />
                    <textarea
                      className="w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                      placeholder="Short description for the card"
                      rows={3}
                      value={prepForm.card_description}
                      onChange={(e) => setPrepForm({ ...prepForm, card_description: e.target.value })}
                    />
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        onClick={() => createPrepCard(false)}
                        disabled={!prepForm.company.trim()}
                      >
                        Save draft
                      </Button>
                      <Button onClick={() => createPrepCard(true)} disabled={!prepForm.company.trim()}>
                        Publish card
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Published cards</CardTitle>
                    <CardDescription>
                      {preps.length === 0
                        ? 'No prep cards yet.'
                        : `${publishedPrepCount} live · ${preps.length - publishedPrepCount} draft`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {preps.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-6 text-center dark:border-gray-700">
                        <Building2 className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">
                          Create a company prep card to appear in the student library.
                        </p>
                      </div>
                    ) : (
                      <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                        {preps.map((c) => (
                          <li
                            key={c.id}
                            className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 dark:border-gray-700"
                          >
                            <div className="min-w-0">
                              <p className="font-medium truncate">{c.card_title}</p>
                              {c.company && (
                                <p className="text-xs text-gray-500 truncate">{c.company}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={c.is_published ? 'default' : 'secondary'}
                                className="shrink-0"
                              >
                                {c.is_published ? 'Live' : 'Draft'}
                              </Badge>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 shrink-0 text-gray-500 hover:text-red-600"
                                onClick={() => deletePrepCard(c.id, c.card_title)}
                                aria-label={`Delete ${c.card_title}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <SimulationPipelineWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        roles={roles}
        pipelineId={editId}
        onSaved={load}
      />

      {assignTarget && (
        <SimulationAssignDialog
          open={Boolean(assignTarget)}
          onOpenChange={(open) => !open && setAssignTarget(null)}
          pipelineId={assignTarget.id}
          pipelineName={assignTarget.name}
          onAssigned={load}
        />
      )}
    </DashboardLayout>
  );
}
