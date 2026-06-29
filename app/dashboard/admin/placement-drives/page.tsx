'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminPlacementDrivesPage() {
  const [drives, setDrives] = useState<any[]>([]);
  const [mockTests, setMockTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    description: '',
    company: '',
    target_role: 'Software Engineer',
    min_combined_score: 60,
  });
  const [stages, setStages] = useState([
    { order: 1, stage_type: 'mock_test' as const, title: 'Aptitude', pass_threshold: 50, mock_test_template_id: '' },
    { order: 2, stage_type: 'mock_interview' as const, title: 'Technical Interview', pass_threshold: 60, persona: 'technical' as const, max_turns: 6 },
    { order: 3, stage_type: 'mock_interview' as const, title: 'HR Interview', pass_threshold: 55, persona: 'hr' as const, max_turns: 5 },
  ]);

  const load = async () => {
    setLoading(true);
    try {
      const [d, t] = await Promise.all([
        apiClient.adminListPlacementDrives(),
        apiClient.adminListMockTests(),
      ]);
      setDrives(Array.isArray(d) ? d : []);
      setMockTests(Array.isArray(t) ? t : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (publish: boolean) => {
    try {
      const payload = {
        ...form,
        is_published: publish,
        stages: stages.map((s) => ({
          order: s.order,
          stage_type: s.stage_type,
          title: s.title,
          pass_threshold: s.pass_threshold,
          config:
            s.stage_type === 'mock_test'
              ? { mock_test_template_id: s.mock_test_template_id }
              : { persona: s.persona, max_turns: s.max_turns },
        })),
      };
      await apiClient.adminCreatePlacementDrive(payload);
      toast.success(publish ? 'Drive published' : 'Drive saved as draft');
      load();
    } catch {
      toast.error('Failed to create drive');
    }
  };

  const togglePublish = async (id: string, current: boolean) => {
    await apiClient.adminUpdatePlacementDrive(id, { is_published: !current });
    load();
  };

  return (
    <DashboardLayout requiredUserType="admin">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <h1 className="text-2xl font-bold">Placement Drive Templates</h1>
        <p className="text-gray-600">Compose sequential stages: mock test rounds + AI interviews (non-skippable student flow).</p>

        <div className="rounded-xl border p-4 space-y-3 dark:border-gray-700">
          <Input placeholder="Drive title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <Input placeholder="Target role" value={form.target_role} onChange={(e) => setForm({ ...form, target_role: e.target.value })} />
          <textarea
            className="w-full rounded-md border px-3 py-2 dark:bg-gray-800"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
          />

          <h3 className="font-semibold">Stages</h3>
          {stages.map((s, idx) => (
            <div key={s.order} className="rounded-lg border p-3 space-y-2 dark:border-gray-700">
              <div className="flex gap-2 items-center">
                <Badge>Stage {s.order}</Badge>
                <Badge variant="outline">{s.stage_type}</Badge>
              </div>
              <Input
                placeholder="Stage title"
                value={s.title}
                onChange={(e) => {
                  const next = [...stages];
                  next[idx] = { ...next[idx], title: e.target.value };
                  setStages(next);
                }}
              />
              {s.stage_type === 'mock_test' ? (
                <select
                  className="w-full rounded-md border px-3 py-2 dark:bg-gray-800"
                  value={s.mock_test_template_id}
                  onChange={(e) => {
                    const next = [...stages];
                    next[idx] = { ...next[idx], mock_test_template_id: e.target.value };
                    setStages(next);
                  }}
                >
                  <option value="">Select published mock test</option>
                  {mockTests.filter((t) => t.is_published).map((t) => (
                    <option key={t.id} value={t.id}>{t.title} ({t.company || 'General'})</option>
                  ))}
                </select>
              ) : (
                <select
                  className="w-full rounded-md border px-3 py-2 dark:bg-gray-800"
                  value={s.persona}
                  onChange={(e) => {
                    const next = [...stages];
                    next[idx] = { ...next[idx], persona: e.target.value as 'technical' | 'hr' };
                    setStages(next);
                  }}
                >
                  <option value="technical">Technical persona</option>
                  <option value="hr">HR persona</option>
                </select>
              )}
            </div>
          ))}

          <div className="flex gap-2">
            <Button onClick={() => create(false)}>Save draft</Button>
            <Button onClick={() => create(true)}>Publish drive</Button>
          </div>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <div className="space-y-3">
            {drives.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border p-4 dark:border-gray-700">
                <div>
                  <p className="font-semibold">{d.title}</p>
                  <p className="text-sm text-gray-500">{d.company} · {d.stage_count} stages · {d.target_role}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => togglePublish(d.id, d.is_published)}>
                  {d.is_published ? 'Unpublish' : 'Publish'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
