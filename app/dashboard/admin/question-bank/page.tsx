'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { apiClient } from '@/lib/api';
import { MOCK_TEST_CATEGORY_IDS, getCategoryLabel } from '@/lib/mockTestCategories';
import { Plus, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const glassInput =
  'h-11 rounded-xl border-gray-200/80 bg-white/90 shadow-sm placeholder:text-gray-400 focus-visible:border-brand-blue/40 dark:border-gray-700/60 dark:bg-gray-900/70';

const glassSelect =
  'h-11 w-full rounded-xl border border-gray-200/80 bg-white/90 px-3 text-sm shadow-sm focus:border-brand-blue/40 focus:outline-none focus:ring-2 focus:ring-brand-blue/15 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-200';

export default function AdminQuestionBankPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    question_text: '',
    options: '',
    correct_answer: 'A',
    company: '',
    target_role: '',
    topic: '',
    round_type: 'aptitude',
    difficulty: 'medium',
    explanation: '',
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

  useEffect(() => {
    load();
  }, []);

  const createQuestion = async () => {
    const opts = form.options
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!form.question_text.trim() || opts.length < 2) {
      toast.error('Question text and at least 2 options are required');
      return;
    }
    try {
      await apiClient.adminCreateQuestion({
        question_text: form.question_text.trim(),
        options: opts,
        correct_answer: form.correct_answer,
        company: form.company.trim() || undefined,
        target_role: form.target_role.trim() || undefined,
        topic: form.topic.trim() || undefined,
        round_type: form.round_type,
        difficulty: form.difficulty,
        explanation: form.explanation.trim() || undefined,
        source: 'manual',
      });
      toast.success('Question created');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to create question');
    }
  };

  const generateAi = async () => {
    try {
      await apiClient.adminGenerateAiQuestions({
        count: 5,
        topic: form.topic || 'General aptitude',
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
      <div className="relative min-h-screen bg-mock-page-bg dark:bg-brand-hero-dark -mx-6 -mb-6 -mt-20 lg:-mt-24 p-4 sm:p-6 pt-20 lg:pt-24 pb-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Question Bank CMS</h1>

          <div className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur-md dark:border-gray-800/60 dark:bg-gray-900/70 space-y-3">
            <h2 className="font-semibold text-gray-900 dark:text-white">Add manual question</h2>
            <Input
              className={glassInput}
              placeholder="e.g. What is the output of console.log(typeof null) in JavaScript?"
              value={form.question_text}
              onChange={(e) => setForm({ ...form, question_text: e.target.value })}
            />
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                className={glassInput}
                placeholder="e.g. Amazon"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
              <Input
                className={glassInput}
                placeholder="e.g. Software Development Engineer"
                value={form.target_role}
                onChange={(e) => setForm({ ...form, target_role: e.target.value })}
              />
              <Input
                className={glassInput}
                placeholder="e.g. JavaScript fundamentals"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className={glassSelect}
                value={form.round_type}
                onChange={(e) => setForm({ ...form, round_type: e.target.value })}
              >
                {MOCK_TEST_CATEGORY_IDS.map((id) => (
                  <option key={id} value={id}>
                    {getCategoryLabel(id)}
                  </option>
                ))}
              </select>
              <select
                className={glassSelect}
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <Input
              className={glassInput}
              placeholder='e.g. object, null, undefined, number (comma-separated options)'
              value={form.options}
              onChange={(e) => setForm({ ...form, options: e.target.value })}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className={glassSelect}
                value={form.correct_answer}
                onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}
              >
                {['A', 'B', 'C', 'D'].map((l) => (
                  <option key={l} value={l}>
                    Correct answer: Option {l}
                  </option>
                ))}
              </select>
              <Input
                className={glassInput}
                placeholder="Explanation (optional)"
                value={form.explanation}
                onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="mockPrimary" onClick={createQuestion} className="gap-2 rounded-xl h-11">
                <Plus className="h-4 w-4" /> Save manual
              </Button>
              <Button variant="mockFilter" onClick={generateAi} className="gap-2 rounded-xl h-11">
                <Sparkles className="h-4 w-4" /> Generate 5 via AI
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader size="lg" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">No questions in the bank yet.</p>
          ) : (
            <div className="space-y-2">
              {items.map((q) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-gray-100 bg-white p-4 text-sm shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="mb-1 flex flex-wrap gap-2">
                    {q.company && (
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 dark:bg-gray-800">{q.company}</span>
                    )}
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                      {q.source}
                    </span>
                    <span className="text-gray-500">{getCategoryLabel(q.round_type)}</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">{q.question_text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
