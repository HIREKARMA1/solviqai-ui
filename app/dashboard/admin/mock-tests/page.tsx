'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  MOCK_TEST_CATEGORY_IDS,
  getCategoryLabel,
} from '@/lib/mockTestCategories';
import toast from 'react-hot-toast';
import {
  Sparkles,
  Plus,
  Trash2,
  FileQuestion,
  Clock,
  Building2,
  Save,
  Rocket,
} from 'lucide-react';

type ManualQuestionDraft = {
  localId: string;
  question_text: string;
  options: [string, string, string, string];
  correct_answer: string;
  explanation: string;
  difficulty: string;
  round_type: string;
  points: number;
};

const EMPTY_MANUAL = (): ManualQuestionDraft => ({
  localId: crypto.randomUUID(),
  question_text: '',
  options: ['', '', '', ''],
  correct_answer: 'A',
  explanation: '',
  difficulty: 'medium',
  round_type: 'aptitude',
  points: 1,
});

const glassInput =
  'h-11 rounded-xl border-gray-200/80 bg-white/90 shadow-sm backdrop-blur-sm placeholder:text-gray-400 focus-visible:border-brand-blue/40 dark:border-gray-700/60 dark:bg-gray-900/70';

const glassSelect =
  'h-11 w-full rounded-xl border border-gray-200/80 bg-white/90 px-3 text-sm text-gray-700 shadow-sm backdrop-blur-sm focus:border-brand-blue/40 focus:outline-none focus:ring-2 focus:ring-brand-blue/15 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-200';

const labelClass =
  'mb-1.5 block text-sm font-semibold text-gray-800 dark:text-gray-200';

function FormField({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={labelClass}>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const TEMPLATE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'unpublished', label: 'Unpublished' },
  { id: 'draft', label: 'Draft' },
] as const;

type TemplateFilterId = (typeof TEMPLATE_FILTERS)[number]['id'];

function matchesTemplateFilter(t: { is_published?: boolean }, filter: TemplateFilterId): boolean {
  if (filter === 'all') return true;
  if (filter === 'published') return Boolean(t.is_published);
  // Draft & unpublished: not currently published (saved draft or toggled off)
  return !t.is_published;
}

export default function AdminMockTestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [step, setStep] = useState(1);

  const [templateFilter, setTemplateFilter] = useState<TemplateFilterId>('all');

  const [form, setForm] = useState({
    title: '',
    description: '',
    company: '',
    target_role: '',
    topic: '',
    round_type: 'aptitude',
    difficulty: 'medium',
    duration_minutes: 30,
    passing_score: 70,
    instructions: '',
    ai_question_count: 0,
    manual_question_count: 0,
  });

  const [aiQuestions, setAiQuestions] = useState<any[]>([]);
  const [manualQuestions, setManualQuestions] = useState<ManualQuestionDraft[]>([]);

  const totalQuestions = useMemo(
    () => aiQuestions.length + manualQuestions.length,
    [aiQuestions.length, manualQuestions.length],
  );

  const filteredTests = useMemo(
    () => tests.filter((t) => matchesTemplateFilter(t, templateFilter)),
    [tests, templateFilter],
  );

  const templateFilterCounts = useMemo(() => {
    const counts: Record<TemplateFilterId, number> = {
      all: tests.length,
      published: tests.filter((t) => t.is_published).length,
      unpublished: tests.filter((t) => !t.is_published).length,
      draft: tests.filter((t) => !t.is_published).length,
    };
    return counts;
  }, [tests]);

  const load = async () => {
    setLoading(true);
    try {
      const t = await apiClient.adminListMockTests();
      setTests(Array.isArray(t) ? t : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const applyQuestionCounts = () => {
    const ai = Math.max(0, form.ai_question_count);
    const manual = Math.max(0, form.manual_question_count);
    setForm((f) => ({ ...f, ai_question_count: ai, manual_question_count: manual }));
    setManualQuestions(Array.from({ length: manual }, () => ({
      ...EMPTY_MANUAL(),
      round_type: form.round_type,
      difficulty: form.difficulty,
    })));
    setAiQuestions([]);
    setStep(2);
  };

  const generateAi = async () => {
    if (form.ai_question_count <= 0) {
      setStep(3);
      return;
    }
    setGeneratingAi(true);
    try {
      const res = await apiClient.adminPreviewAiQuestions({
        count: form.ai_question_count,
        topic: form.topic || form.title || 'General aptitude',
        target_role: form.target_role || 'Software Engineer',
        difficulty: form.difficulty,
        company: form.company || undefined,
        round_type: form.round_type,
      });
      setAiQuestions(
        (res.items || []).map((q: any) => ({
          ...q,
          localId: q.id || crypto.randomUUID(),
          round_type: form.round_type,
          difficulty: form.difficulty,
          points: 1,
        })),
      );
      toast.success(`Generated ${res.generated || 0} AI questions — review and edit below`);
      setStep(3);
    } catch {
      toast.error('AI generation failed');
    } finally {
      setGeneratingAi(false);
    }
  };

  const buildInlineQuestions = () => {
    const inline: any[] = [];

    for (const q of aiQuestions) {
      inline.push({
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation || '',
        round_type: q.round_type || form.round_type,
        difficulty: q.difficulty || form.difficulty,
        company: form.company,
        target_role: form.target_role,
        topic: form.topic,
        source: 'ai_generated',
        points: q.points || 1,
      });
    }

    for (const q of manualQuestions) {
      if (!q.question_text.trim()) continue;
      inline.push({
        question_text: q.question_text.trim(),
        options: q.options.map((o) => o.trim()).filter(Boolean),
        correct_answer: q.correct_answer,
        explanation: q.explanation || '',
        round_type: q.round_type || form.round_type,
        difficulty: q.difficulty,
        company: form.company,
        target_role: form.target_role,
        topic: form.topic,
        source: 'manual',
        points: q.points || 1,
      });
    }

    return inline;
  };

  const create = async (publish: boolean) => {
    const inline = buildInlineQuestions();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (inline.length === 0) {
      toast.error('Add at least one question');
      return;
    }

    setSaving(true);
    try {
      const created = await apiClient.adminCreateMockTest({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        company: form.company.trim() || undefined,
        target_role: form.target_role.trim() || undefined,
        topic: form.topic.trim() || undefined,
        round_type: form.round_type,
        difficulty: form.difficulty,
        duration_minutes: form.duration_minutes,
        passing_score: form.passing_score,
        instructions: form.instructions.trim() || undefined,
        question_mode: aiQuestions.length && manualQuestions.length ? 'mixed' : aiQuestions.length ? 'ai' : 'manual',
        ai_question_count: 0,
        inline_questions: inline,
        is_published: publish,
      });
      toast.success(publish ? 'Mock test published' : 'Draft saved');
      setTests((prev) => [created, ...prev]);
      setStep(1);
      setAiQuestions([]);
      setManualQuestions([]);
      setForm({
        title: '',
        description: '',
        company: '',
        target_role: '',
        topic: '',
        round_type: 'aptitude',
        difficulty: 'medium',
        duration_minutes: 30,
        passing_score: 70,
        instructions: '',
        ai_question_count: 0,
        manual_question_count: 0,
      });
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to create mock test');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (id: string, current: boolean) => {
    try {
      await apiClient.adminUpdateMockTest(id, { is_published: !current });
      toast.success(current ? 'Unpublished' : 'Published');
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  const updateManual = (localId: string, patch: Partial<ManualQuestionDraft>) => {
    setManualQuestions((prev) =>
      prev.map((q) => (q.localId === localId ? { ...q, ...patch } : q)),
    );
  };

  const updateAi = (localId: string, patch: Record<string, unknown>) => {
    setAiQuestions((prev) =>
      prev.map((q) => (q.localId === localId ? { ...q, ...patch } : q)),
    );
  };

  return (
    <DashboardLayout requiredUserType="admin">
      <div className="relative min-h-screen bg-mock-page-bg dark:bg-brand-hero-dark -mx-6 -mb-6 -mt-20 lg:-mt-24 p-4 sm:p-6 pt-20 lg:pt-24 pb-10">
        <div className="mx-auto max-w-6xl space-y-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-blue dark:text-brand-cyan">
              Admin CMS
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-50">
              Mock Test Templates
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Build AI + manual mock tests and publish to the student library
            </p>
          </div>

          {/* Builder */}
          <section className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur-md dark:border-gray-800/60 dark:bg-gray-900/70 sm:p-6">
            <div className="mb-6 flex flex-wrap gap-2">
              {[1, 2, 3].map((s) => (
                <span
                  key={s}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold',
                    step === s
                      ? 'bg-brand-blue text-white'
                      : step > s
                        ? 'bg-brand-green/15 text-brand-green-dark'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
                  )}
                >
                  Step {s}
                </span>
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Test title" required>
                    <Input
                      className={glassInput}
                      placeholder="e.g. React.js Fundamentals Assessment"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Category">
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
                  </FormField>
                </div>

                <FormField label="Description">
                  <Input
                    className={glassInput}
                    placeholder="e.g. A beginner-friendly assessment covering React components, hooks, routing, and state management."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </FormField>

                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField label="Company">
                    <Input
                      className={glassInput}
                      placeholder="e.g. Amazon"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Target role">
                    <Input
                      className={glassInput}
                      placeholder="e.g. Software Development Engineer"
                      value={form.target_role}
                      onChange={(e) => setForm({ ...form, target_role: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Topic / skill area">
                    <Input
                      className={glassInput}
                      placeholder="e.g. React & Frontend"
                      value={form.topic}
                      onChange={(e) => setForm({ ...form, topic: e.target.value })}
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <FormField label="Duration (minutes)">
                    <Input
                      type="number"
                      className={glassInput}
                      placeholder="e.g. 30"
                      value={form.duration_minutes}
                      onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                    />
                  </FormField>
                  <FormField label="Passing score (%)">
                    <Input
                      type="number"
                      className={glassInput}
                      placeholder="e.g. 70"
                      value={form.passing_score}
                      onChange={(e) => setForm({ ...form, passing_score: Number(e.target.value) })}
                    />
                  </FormField>
                  <FormField label="Difficulty">
                    <select
                      className={glassSelect}
                      value={form.difficulty}
                      onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </FormField>
                </div>

                <FormField label="Instructions for students">
                  <Input
                    className={glassInput}
                    placeholder="e.g. Each question carries one mark. No negative marking."
                    value={form.instructions}
                    onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  />
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Number of AI questions">
                    <Input
                      type="number"
                      min={0}
                      className={glassInput}
                      placeholder="e.g. 10"
                      value={form.ai_question_count}
                      onChange={(e) => setForm({ ...form, ai_question_count: Number(e.target.value) })}
                    />
                  </FormField>
                  <FormField label="Number of manual questions">
                    <Input
                      type="number"
                      min={0}
                      className={glassInput}
                      placeholder="e.g. 5"
                      value={form.manual_question_count}
                      onChange={(e) =>
                        setForm({ ...form, manual_question_count: Number(e.target.value) })
                      }
                    />
                  </FormField>
                </div>

                <Button
                  variant="mockPrimary"
                  className="h-11 rounded-xl px-6"
                  onClick={applyQuestionCounts}
                >
                  Continue to Questions
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 text-center py-8">
                <Sparkles className="mx-auto h-10 w-10 text-brand-cyan" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generate {form.ai_question_count} AI question(s), then review and edit before saving.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button variant="outline" className="rounded-xl" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  {form.ai_question_count > 0 ? (
                    <Button
                      variant="mockPrimary"
                      className="h-11 rounded-xl px-6"
                      disabled={generatingAi}
                      onClick={generateAi}
                    >
                      {generatingAi ? 'Generating…' : 'Generate AI Questions'}
                    </Button>
                  ) : (
                    <Button variant="mockPrimary" className="h-11 rounded-xl px-6" onClick={() => setStep(3)}>
                      Skip to Manual Questions
                    </Button>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Total: {totalQuestions} question(s) · {aiQuestions.length} AI · {manualQuestions.length} manual
                  </p>
                  <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setStep(2)}>
                    Regenerate AI
                  </Button>
                </div>

                {aiQuestions.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                      <Sparkles className="h-4 w-4 text-brand-cyan" /> AI Questions (editable)
                    </h3>
                    {aiQuestions.map((q, idx) => (
                      <div
                        key={q.localId}
                        className="rounded-xl border border-brand-cyan/20 bg-brand-cyan/5 p-4 dark:border-brand-cyan/30 dark:bg-brand-cyan/10"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-semibold text-brand-cyan">AI Q{idx + 1}</span>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-red-500"
                            onClick={() => setAiQuestions((prev) => prev.filter((x) => x.localId !== q.localId))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <FormField label="Question">
                          <Input
                            className={glassInput}
                            placeholder="Enter the question text"
                            value={q.question_text}
                            onChange={(e) => updateAi(q.localId, { question_text: e.target.value })}
                          />
                        </FormField>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {(['A', 'B', 'C', 'D'] as const).map((letter, oi) => (
                            <FormField key={letter} label={`Option ${letter}`}>
                              <Input
                                className={glassInput}
                                placeholder={`Enter option ${letter}`}
                                value={(q.options || ['', '', '', ''])[oi] || ''}
                                onChange={(e) => {
                                  const opts = [...(q.options || ['', '', '', ''])];
                                  opts[oi] = e.target.value;
                                  updateAi(q.localId, { options: opts });
                                }}
                              />
                            </FormField>
                          ))}
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <FormField label="Correct answer">
                            <select
                              className={glassSelect}
                              value={q.correct_answer || 'A'}
                              onChange={(e) => updateAi(q.localId, { correct_answer: e.target.value })}
                            >
                              {['A', 'B', 'C', 'D'].map((l) => (
                                <option key={l} value={l}>
                                  Option {l}
                                </option>
                              ))}
                            </select>
                          </FormField>
                          <FormField label="Explanation (optional)">
                            <Input
                              className={glassInput}
                              placeholder="Enter explanation shown after the test"
                              value={q.explanation || ''}
                              onChange={(e) => updateAi(q.localId, { explanation: e.target.value })}
                            />
                          </FormField>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {manualQuestions.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                      <FileQuestion className="h-4 w-4 text-brand-blue" /> Manual Questions
                    </h3>
                    {manualQuestions.map((q, idx) => (
                      <div
                        key={q.localId}
                        className="rounded-xl border border-gray-200/80 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/50"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-semibold text-brand-blue">Manual Q{idx + 1}</span>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-red-500"
                            onClick={() =>
                              setManualQuestions((prev) => prev.filter((x) => x.localId !== q.localId))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <FormField label="Question">
                          <Input
                            className={glassInput}
                            placeholder="Enter the question text"
                            value={q.question_text}
                            onChange={(e) => updateManual(q.localId, { question_text: e.target.value })}
                          />
                        </FormField>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {(['A', 'B', 'C', 'D'] as const).map((letter, oi) => (
                            <FormField key={letter} label={`Option ${letter}`}>
                              <Input
                                className={glassInput}
                                placeholder={`Enter option ${letter}`}
                                value={q.options[oi]}
                                onChange={(e) => {
                                  const opts = [...q.options] as [string, string, string, string];
                                  opts[oi] = e.target.value;
                                  updateManual(q.localId, { options: opts });
                                }}
                              />
                            </FormField>
                          ))}
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <FormField label="Correct answer">
                            <select
                              className={glassSelect}
                              value={q.correct_answer}
                              onChange={(e) => updateManual(q.localId, { correct_answer: e.target.value })}
                            >
                              {['A', 'B', 'C', 'D'].map((l) => (
                                <option key={l} value={l}>
                                  Option {l}
                                </option>
                              ))}
                            </select>
                          </FormField>
                          <FormField label="Difficulty">
                            <select
                              className={glassSelect}
                              value={q.difficulty}
                              onChange={(e) => updateManual(q.localId, { difficulty: e.target.value })}
                            >
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                            </select>
                          </FormField>
                          <FormField label="Category">
                            <select
                              className={glassSelect}
                              value={q.round_type}
                              onChange={(e) => updateManual(q.localId, { round_type: e.target.value })}
                            >
                              {MOCK_TEST_CATEGORY_IDS.map((id) => (
                                <option key={id} value={id}>
                                  {getCategoryLabel(id)}
                                </option>
                              ))}
                            </select>
                          </FormField>
                        </div>
                        <FormField label="Explanation (optional)" className="mt-3">
                          <Input
                            className={glassInput}
                            placeholder="Enter explanation shown after the test"
                            value={q.explanation}
                            onChange={(e) => updateManual(q.localId, { explanation: e.target.value })}
                          />
                        </FormField>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      className="gap-2 rounded-xl"
                      onClick={() => setManualQuestions((prev) => [...prev, EMPTY_MANUAL()])}
                    >
                      <Plus className="h-4 w-4" /> Add manual question
                    </Button>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 border-t border-gray-200/80 pt-4 dark:border-gray-700">
                  <Button variant="outline" className="rounded-xl" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button
                    variant="mockFilter"
                    className="h-11 gap-2 rounded-xl px-5"
                    disabled={saving}
                    onClick={() => create(false)}
                  >
                    <Save className="h-4 w-4" /> Save draft
                  </Button>
                  <Button
                    variant="mockPrimary"
                    className="h-11 gap-2 rounded-xl px-5"
                    disabled={saving}
                    onClick={() => create(true)}
                  >
                    <Rocket className="h-4 w-4" /> {saving ? 'Publishing…' : 'Publish'}
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* Templates list */}
          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Published & draft templates
              </h2>
              {!loading && tests.length > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {filteredTests.length} of {tests.length}
                </p>
              )}
            </div>

            {!loading && tests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {TEMPLATE_FILTERS.map((f) => {
                  const active = templateFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setTemplateFilter(f.id)}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200',
                        active
                          ? 'border-brand-blue bg-brand-blue text-white shadow-sm'
                          : 'border-gray-200/80 bg-white/80 text-gray-600 hover:border-brand-blue/25 hover:bg-white dark:border-gray-700/60 dark:bg-gray-900/50 dark:text-gray-300 dark:hover:border-brand-blue/30',
                      )}
                    >
                      {f.label}
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                        )}
                      >
                        {templateFilterCounts[f.id]}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader size="lg" />
              </div>
            ) : tests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 py-16 text-center dark:border-gray-700 dark:bg-gray-900/40">
                <FileQuestion className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm text-gray-500">No mock test templates yet. Create one above.</p>
              </div>
            ) : filteredTests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 py-16 text-center dark:border-gray-700 dark:bg-gray-900/40">
                <p className="text-sm text-gray-500">
                  No{' '}
                  {TEMPLATE_FILTERS.find((f) => f.id === templateFilter)?.label.toLowerCase()}{' '}
                  templates yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredTests.map((t) => (
                  <article
                    key={t.id}
                    className="flex flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge className="rounded-md bg-blue-50 text-blue-600 hover:bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300">
                        {getCategoryLabel(t.round_type)}
                      </Badge>
                      <Badge
                        variant={t.is_published ? 'default' : 'secondary'}
                        className={cn(
                          t.is_published
                            ? 'bg-brand-green/15 text-brand-green-dark hover:bg-brand-green/15 dark:bg-brand-green/20 dark:text-brand-green-light'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300',
                        )}
                      >
                        {t.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{t.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                      {t.company && (
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {t.company}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {t.duration_minutes} min
                      </span>
                      <span>{t.question_count ?? 0} Qs</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-4 w-full rounded-lg"
                      onClick={() => togglePublish(t.id, t.is_published)}
                    >
                      {t.is_published ? 'Unpublish' : 'Publish'}
                    </Button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
