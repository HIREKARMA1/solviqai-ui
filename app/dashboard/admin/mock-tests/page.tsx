'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminMockTestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQ, setSelectedQ] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    company: '',
    target_role: '',
    topic: '',
    round_type: 'aptitude',
    difficulty: 'medium',
    question_mode: 'manual',
    ai_question_count: 0,
    duration_minutes: 30,
  });

  const load = async () => {
    setLoading(true);
    try {
      const [t, q] = await Promise.all([
        apiClient.adminListMockTests(),
        apiClient.adminListQuestionBank({ limit: 200 }),
      ]);
      setTests(Array.isArray(t) ? t : []);
      setQuestions(q.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (publish: boolean) => {
    try {
      const created = await apiClient.adminCreateMockTest({
        ...form,
        ai_question_count: form.question_mode === 'ai' ? 10 : form.question_mode === 'mixed' ? form.ai_question_count : 0,
        manual_question_ids: form.question_mode !== 'ai' ? selectedQ : [],
        is_published: publish,
      });
      if (publish) {
        toast.success('Mock test published');
      } else {
        toast.success('Draft saved');
      }
      setTests((prev) => [created, ...prev]);
    } catch {
      toast.error('Failed to create mock test');
    }
  };

  const togglePublish = async (id: string, current: boolean) => {
    await apiClient.adminUpdateMockTest(id, { is_published: !current });
    load();
  };

  const toggleQ = (id: string) => {
    setSelectedQ((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <DashboardLayout requiredUserType="admin">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <h1 className="text-2xl font-bold">Mock Test Templates</h1>

        <div className="rounded-xl border p-4 dark:border-gray-700 space-y-3">
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid gap-2 md:grid-cols-3">
            <Input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            <Input placeholder="Target role" value={form.target_role} onChange={(e) => setForm({ ...form, target_role: e.target.value })} />
            <Input placeholder="Topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <select className="rounded border px-3 py-2 dark:bg-gray-800" value={form.question_mode} onChange={(e) => setForm({ ...form, question_mode: e.target.value })}>
              <option value="manual">Manual only</option>
              <option value="ai">AI generated</option>
              <option value="mixed">Mixed (manual + AI)</option>
            </select>
            <Input type="number" placeholder="AI count (mixed)" value={form.ai_question_count} onChange={(e) => setForm({ ...form, ai_question_count: Number(e.target.value) })} />
            <Input type="number" placeholder="Duration (min)" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
          </div>

          {form.question_mode !== 'ai' && (
            <div className="max-h-40 overflow-y-auto rounded border p-2 dark:border-gray-600">
              <p className="mb-2 text-xs text-gray-500">Select manual questions ({selectedQ.length})</p>
              {questions.slice(0, 30).map((q) => (
                <label key={q.id} className="flex gap-2 text-sm">
                  <input type="checkbox" checked={selectedQ.includes(q.id)} onChange={() => toggleQ(q.id)} />
                  <span className="truncate">{q.question_text}</span>
                </label>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={() => create(false)}>Save draft</Button>
            <Button className="bg-[#FF541F] hover:bg-[#e04a1a]" onClick={() => create(true)}>Publish</Button>
          </div>
        </div>

        {loading ? <Loader /> : (
          <div className="space-y-3">
            {tests.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border p-4 dark:border-gray-700">
                <div>
                  <p className="font-semibold">{t.title}</p>
                  <p className="text-sm text-gray-500">{t.company} · {t.question_mode} · {t.duration_minutes}min</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={t.is_published ? 'default' : 'secondary'}>{t.is_published ? 'Published' : 'Draft'}</Badge>
                  <Button size="sm" variant="outline" onClick={() => togglePublish(t.id, t.is_published)}>
                    {t.is_published ? 'Unpublish' : 'Publish'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
