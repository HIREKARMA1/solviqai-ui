'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { apiClient } from '@/lib/api';
import { Plus, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminQuestionBankPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    question_text: '',
    options: 'A,B,C,D',
    correct_answer: 'A',
    company: '',
    target_role: '',
    topic: '',
    round_type: 'aptitude',
    difficulty: 'medium',
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiClient.adminListQuestionBank({ limit: 100 });
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createQuestion = async () => {
    try {
      await apiClient.adminCreateQuestion({
        ...form,
        options: form.options.split(',').map((s) => s.trim()),
        source: 'manual',
      });
      toast.success('Question created');
      load();
    } catch {
      toast.error('Failed to create question');
    }
  };

  const generateAi = async () => {
    try {
      await apiClient.adminGenerateAiQuestions({
        count: 5,
        topic: form.topic || 'aptitude',
        target_role: form.target_role || 'Software Engineer',
        difficulty: form.difficulty,
        company: form.company || undefined,
        round_type: form.round_type,
      });
      toast.success('AI questions generated');
      load();
    } catch {
      toast.error('AI generation failed');
    }
  };

  return (
    <DashboardLayout requiredUserType="admin">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <h1 className="text-2xl font-bold">Question Bank CMS</h1>

        <div className="rounded-xl border p-4 dark:border-gray-700 space-y-3">
          <h2 className="font-semibold">Add manual question</h2>
          <Input placeholder="Question text" value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })} />
          <div className="grid gap-2 md:grid-cols-3">
            <Input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            <Input placeholder="Target role" value={form.target_role} onChange={(e) => setForm({ ...form, target_role: e.target.value })} />
            <Input placeholder="Topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
          </div>
          <Input placeholder="Options (comma-separated)" value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} />
          <Input placeholder="Correct answer" value={form.correct_answer} onChange={(e) => setForm({ ...form, correct_answer: e.target.value })} />
          <div className="flex gap-2">
            <Button onClick={createQuestion} className="gap-2"><Plus className="h-4 w-4" /> Save manual</Button>
            <Button variant="outline" onClick={generateAi} className="gap-2"><Sparkles className="h-4 w-4" /> Generate 5 via AI</Button>
          </div>
        </div>

        {loading ? <Loader /> : (
          <div className="space-y-2">
            {items.map((q) => (
              <div key={q.id} className="rounded-lg border p-3 text-sm dark:border-gray-700">
                <div className="flex flex-wrap gap-2 mb-1">
                  {q.company && <span className="rounded bg-gray-100 px-2 py-0.5 dark:bg-gray-800">{q.company}</span>}
                  <span className="rounded bg-blue-100 px-2 py-0.5 dark:bg-blue-900">{q.source}</span>
                  <span className="text-gray-500">{q.round_type}</span>
                </div>
                <p>{q.question_text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
