'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp, Plus, Sparkles, Trash2 } from 'lucide-react';

export type WizardStage = {
  order_index: number;
  stage_type: string;
  title: string;
  duration_seconds: number;
  pass_threshold: number;
  weight: number;
  config: Record<string, unknown>;
  question_mode: 'ai' | 'manual' | 'mixed';
};

type WizardMeta = {
  name: string;
  slug: string;
  job_role_slug: string;
  department: string;
  experience_level: string;
  company: string;
  difficulty: string;
  estimated_duration_minutes: number;
};

type AssignmentScope = {
  type: 'platform' | 'colleges' | 'students';
  college_ids: string[];
  student_ids: string[];
};

const EXPERIENCE_LEVELS = [
  { value: 'fresher', label: 'Fresher / Entry' },
  { value: '0-2', label: '0–2 years' },
  { value: '2-5', label: '2–5 years' },
  { value: '5+', label: '5+ years / Senior' },
];

const STAGE_LABELS: Record<string, string> = {
  aptitude: 'Aptitude Test',
  soft_skills: 'Soft Skills',
  technical_mcq: 'Technical MCQ',
  coding: 'Coding Challenge',
  technical_interview: 'Technical Interview',
  hr_interview: 'HR Interview',
  culture_fit: 'Culture Fit',
  group_discussion: 'Group Discussion',
  gd_playground: 'GD Playground',
  sales_roleplay: 'Sales Roleplay',
  short_answer: 'Short Answer',
  essay: 'Essay Writing',
  prompt_engineering: 'Prompt Engineering',
  case_study: 'Case Study',
  finance: 'Finance Assessment',
  automation_technical: 'Automation Technical',
  test_case_triage: 'Test Case Triage',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 80);
}

function FieldLabel({
  htmlFor,
  label,
  hint,
}: {
  htmlFor?: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function WizardNumberInput({
  id,
  label,
  hint,
  placeholder,
  value,
  onChange,
  min,
  max,
  fallback,
  integer = true,
}: {
  id: string;
  label: string;
  hint?: string;
  placeholder: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  fallback: number;
  integer?: boolean;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const clamp = (num: number) => {
    let next = num;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    return integer ? Math.round(next) : next;
  };

  const commit = (raw: string) => {
    if (raw.trim() === '' || Number.isNaN(Number(raw))) {
      const next = fallback;
      setDraft(String(next));
      onChange(next);
      return;
    }
    const next = clamp(Number(raw));
    setDraft(String(next));
    onChange(next);
  };

  return (
    <div>
      <FieldLabel htmlFor={id} label={label} hint={hint} />
      <Input
        id={id}
        type="text"
        inputMode={integer ? 'numeric' : 'decimal'}
        placeholder={placeholder}
        value={draft}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '' || (integer ? /^\d*$/ : /^\d*\.?\d*$/).test(raw)) {
            setDraft(raw);
            if (raw !== '' && !Number.isNaN(Number(raw))) {
              onChange(clamp(Number(raw)));
            }
          }
        }}
        onBlur={() => commit(draft)}
        className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
    </div>
  );
}

function defaultStage(type: string, index: number): WizardStage {
  const durations: Record<string, number> = {
    aptitude: 1800,
    coding: 3600,
    prompt_engineering: 1200,
  };
  return {
    order_index: index,
    stage_type: type,
    title: STAGE_LABELS[type] || type.replace(/_/g, ' '),
    duration_seconds: durations[type] || 900,
    pass_threshold: 50,
    weight: 1,
    config: type === 'prompt_engineering' ? { task_count: 3 } : {},
    question_mode: 'ai',
  };
}

function reindex(stages: WizardStage[]): WizardStage[] {
  return stages.map((s, i) => ({ ...s, order_index: i }));
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Array<{ slug: string; display_name: string; category?: string }>;
  pipelineId?: string | null;
  onSaved: () => void;
};

export function SimulationPipelineWizard({ open, onOpenChange, roles, pipelineId, onSaved }: Props) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [recommending, setRecommending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stageTypes, setStageTypes] = useState<string[]>([]);
  const [mandatoryTypes, setMandatoryTypes] = useState<string[]>(['prompt_engineering']);
  const [rationale, setRationale] = useState('');
  const [aiSnapshot, setAiSnapshot] = useState<Record<string, unknown> | null>(null);

  const [meta, setMeta] = useState<WizardMeta>({
    name: '',
    slug: '',
    job_role_slug: '',
    department: '',
    experience_level: 'fresher',
    company: '',
    difficulty: 'medium',
    estimated_duration_minutes: 60,
  });

  const [stages, setStages] = useState<WizardStage[]>([]);
  const [assignmentScope, setAssignmentScope] = useState<AssignmentScope>({
    type: 'platform',
    college_ids: [],
    student_ids: [],
  });
  const [publishMode, setPublishMode] = useState<'draft' | 'publish' | 'schedule'>('draft');
  const [publishAt, setPublishAt] = useState('');
  const [colleges, setColleges] = useState<Array<{ id: string; college_name?: string; name?: string }>>([]);
  const [assignDueAt, setAssignDueAt] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  const isEdit = Boolean(pipelineId);

  const reset = useCallback(() => {
    setStep(1);
    setMeta({
      name: '',
      slug: '',
      job_role_slug: roles[0]?.slug || '',
      department: roles[0]?.category || '',
      experience_level: 'fresher',
      company: '',
      difficulty: 'medium',
      estimated_duration_minutes: 60,
    });
    setStages([]);
    setAssignmentScope({ type: 'platform', college_ids: [], student_ids: [] });
    setPublishMode('draft');
    setPublishAt('');
    setRationale('');
    setAiSnapshot(null);
    setAssignDueAt('');
    setAssignNotes('');
  }, [roles]);

  useEffect(() => {
    if (!open) return;
    apiClient.adminListSimulationStageTypes().then((res) => {
      setStageTypes(res.stage_types || []);
      setMandatoryTypes(res.mandatory_for_publish || ['prompt_engineering']);
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (pipelineId) {
      setLoading(true);
      apiClient
        .adminGetSimulationPipeline(pipelineId)
        .then((p) => {
          setMeta({
            name: p.name || '',
            slug: p.slug || '',
            job_role_slug: p.job_role_slug || '',
            department: p.department || '',
            experience_level: p.experience_level || 'fresher',
            company: (p.metadata?.company as string) || '',
            difficulty: (p.metadata?.difficulty as string) || 'medium',
            estimated_duration_minutes: p.estimated_duration_minutes || 60,
          });
          setStages(
            (p.stages || []).map((s: WizardStage) => ({
              order_index: s.order_index,
              stage_type: s.stage_type,
              title: s.title,
              duration_seconds: s.duration_seconds || 900,
              pass_threshold: s.pass_threshold ?? 50,
              weight: s.weight ?? 1,
              config: s.config || {},
              question_mode: s.question_mode || 'ai',
            }))
          );
          setAssignmentScope(
            p.assignment_scope || { type: 'platform', college_ids: [], student_ids: [] }
          );
          if (p.status === 'published') setPublishMode('publish');
          else if (p.status === 'scheduled') setPublishMode('schedule');
          else setPublishMode('draft');
          if (p.publish_at) setPublishAt(p.publish_at.slice(0, 16));
          setAiSnapshot(p.ai_recommendation_snapshot || null);
        })
        .catch(() => toast.error('Failed to load pipeline'))
        .finally(() => setLoading(false));
    } else {
      reset();
    }
  }, [open, pipelineId, reset]);

  useEffect(() => {
    if (isEdit) return;
    if (meta.name && !meta.slug) {
      setMeta((m) => ({ ...m, slug: slugify(m.name) }));
    }
  }, [meta.name, meta.slug, isEdit]);

  useEffect(() => {
    const role = roles.find((r) => r.slug === meta.job_role_slug);
    if (role?.category && !meta.department) {
      setMeta((m) => ({ ...m, department: role.category || '' }));
    }
  }, [meta.job_role_slug, roles, meta.department]);

  useEffect(() => {
    if (step !== 3 || !open) return;
    apiClient.getColleges({ limit: 200 }).then((res) => setColleges(res.colleges || [])).catch(() => {});
  }, [step, open]);

  const toggleAssignCollege = (id: string) => {
    setAssignmentScope((prev) => {
      const ids = prev.college_ids.includes(id)
        ? prev.college_ids.filter((x) => x !== id)
        : [...prev.college_ids, id];
      return { ...prev, college_ids: ids, type: ids.length ? 'colleges' : prev.type };
    });
  };

  const runRecommend = async () => {
    setRecommending(true);
    try {
      const role = roles.find((r) => r.slug === meta.job_role_slug);
      const result = await apiClient.adminRecommendSimulationRounds({
        job_role_slug: meta.job_role_slug || undefined,
        job_role_name: role?.display_name,
        department: meta.department || undefined,
        experience_level: meta.experience_level,
        company: meta.company || undefined,
        difficulty: meta.difficulty,
        use_ai: true,
      });
      setStages(
        (result.stages || []).map((s: WizardStage, i: number) => ({
          order_index: i,
          stage_type: s.stage_type,
          title: s.title,
          duration_seconds: s.duration_seconds || 900,
          pass_threshold: s.pass_threshold ?? 50,
          weight: s.weight ?? 1,
          config: s.config || {},
          question_mode: s.question_mode || 'ai',
        }))
      );
      setMeta((m) => ({
        ...m,
        estimated_duration_minutes: result.estimated_duration_minutes || m.estimated_duration_minutes,
      }));
      setRationale(result.rationale || '');
      setAiSnapshot(result.snapshot || null);
      toast.success(result.snapshot?.ai_used ? 'AI rounds recommended' : 'Rounds recommended (rules)');
    } catch {
      toast.error('Recommendation failed');
    } finally {
      setRecommending(false);
    }
  };

  const moveStage = (idx: number, dir: -1 | 1) => {
    const next = [...stages];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setStages(reindex(next));
  };

  const removeStage = (idx: number) => {
    setStages(reindex(stages.filter((_, i) => i !== idx)));
  };

  const addStage = (type: string) => {
    setStages(reindex([...stages, defaultStage(type, stages.length)]));
  };

  const updateStage = (idx: number, patch: Partial<WizardStage>) => {
    const next = [...stages];
    next[idx] = { ...next[idx], ...patch };
    setStages(next);
  };

  const hasMandatory = mandatoryTypes.every((t) => stages.some((s) => s.stage_type === t));

  const canProceedStep1 = meta.name.trim() && meta.slug.trim();
  const canProceedStep2 = stages.length > 0;

  const buildPayload = () => {
    const isPublished = publishMode === 'publish';
    const status =
      publishMode === 'publish' ? 'published' : publishMode === 'schedule' ? 'scheduled' : 'draft';

    return {
      slug: meta.slug,
      name: meta.name.trim(),
      job_role_slug: meta.job_role_slug || null,
      department: meta.department || null,
      experience_level: meta.experience_level,
      estimated_duration_minutes: meta.estimated_duration_minutes,
      assignment_scope: assignmentScope,
      is_published: isPublished,
      status,
      publish_at: publishMode === 'schedule' && publishAt ? new Date(publishAt).toISOString() : null,
      ai_recommended: Boolean(aiSnapshot),
      ai_recommendation_snapshot: aiSnapshot,
      metadata: {
        company: meta.company || null,
        difficulty: meta.difficulty,
      },
      stages: stages.map((s) => ({
        order_index: s.order_index,
        stage_type: s.stage_type,
        title: s.title,
        duration_seconds: s.duration_seconds,
        pass_threshold: s.pass_threshold,
        weight: s.weight,
        config: s.config,
        question_mode: s.question_mode,
      })),
    };
  };

  const save = async () => {
    if (!meta.job_role_slug) {
      toast.error('Select a job role first — seed or add roles in Job role catalog if the list is empty');
      setStep(1);
      return;
    }
    if (!hasMandatory && publishMode === 'publish') {
      toast.error('Published pipelines must include Prompt Engineering');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      let savedId = pipelineId;
      if (isEdit && pipelineId) {
        await apiClient.adminUpdateSimulationPipeline(pipelineId, payload);
        toast.success(publishMode === 'publish' ? 'Pipeline published' : 'Pipeline updated');
      } else {
        const created = await apiClient.adminCreateSimulationPipeline(payload);
        savedId = created.id;
        toast.success(publishMode === 'publish' ? 'Pipeline created & published' : 'Pipeline saved');
      }

      const shouldAssign =
        assignmentScope.type !== 'platform' &&
        (assignmentScope.college_ids.length > 0 || assignmentScope.student_ids.length > 0);
      if (shouldAssign && savedId) {
        const assignResult = await apiClient.adminAssignSimulationPipeline(savedId, {
          college_ids: assignmentScope.college_ids,
          student_ids: assignmentScope.student_ids,
          due_at: assignDueAt ? new Date(assignDueAt).toISOString() : undefined,
          notes: assignNotes.trim() || undefined,
        });
        toast.success(`Assigned to ${assignResult.created} students`);
      }

      onSaved();
      onOpenChange(false);
      reset();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Save failed — check stages include prompt engineering for publish';
      toast.error(typeof msg === 'string' ? msg : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Simulation Pipeline' : 'Create Simulation Pipeline'}</DialogTitle>
          <DialogDescription>
            Step {step} of 3 — {step === 1 ? 'Job details' : step === 2 ? 'Round sequence' : 'Publish & assign'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader size="lg" />
          </div>
        ) : (
          <>
            <div className="flex gap-2 pb-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={`h-1 flex-1 rounded ${n <= step ? 'bg-primary' : 'bg-muted'}`}
                />
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <FieldLabel
                    htmlFor="assessment-name"
                    label="Assessment name"
                    hint="Shown to admins and used as the pipeline title."
                  />
                  <Input
                    id="assessment-name"
                    placeholder="Enter the assessment name (e.g. Flipkart SDE Simulation)"
                    value={meta.name}
                    onChange={(e) =>
                      setMeta({
                        ...meta,
                        name: e.target.value,
                        slug: isEdit ? meta.slug : slugify(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <FieldLabel
                    htmlFor="assessment-slug"
                    label="Slug"
                    hint="Unique identifier used in URLs and API references."
                  />
                  <Input
                    id="assessment-slug"
                    placeholder="Enter a unique slug (auto-generated from name)"
                    value={meta.slug}
                    onChange={(e) => setMeta({ ...meta, slug: slugify(e.target.value) })}
                    disabled={isEdit}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel label="Job role" hint="Primary role this simulation prepares for." />
                    {roles.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-3 text-sm text-amber-700 dark:border-amber-800 dark:text-amber-300">
                        Job role catalog is empty. Close this wizard and open{' '}
                        <strong>Job role catalog</strong> → Seed from JSON (or Add role), then retry.
                      </div>
                    ) : (
                      <Select
                        value={meta.job_role_slug || undefined}
                        onValueChange={(v) => setMeta({ ...meta, job_role_slug: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a job role" />
                        </SelectTrigger>
                        <SelectContent className="z-[10050]">
                          {roles.map((r) => (
                            <SelectItem key={r.slug} value={r.slug}>
                              {r.display_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div>
                    <FieldLabel
                      htmlFor="department"
                      label="Department"
                      hint="Academic or business department (e.g. IT, MBA)."
                    />
                    <Input
                      id="department"
                      placeholder="Enter the department (e.g. IT, MBA, Business)"
                      value={meta.department}
                      onChange={(e) => setMeta({ ...meta, department: e.target.value })}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Experience level" hint="Target candidate experience for this flow." />
                    <Select
                      value={meta.experience_level}
                      onValueChange={(v) => setMeta({ ...meta, experience_level: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPERIENCE_LEVELS.map((e) => (
                          <SelectItem key={e.value} value={e.value}>
                            {e.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel label="Difficulty" hint="Default difficulty for AI-generated content." />
                    <Select
                      value={meta.difficulty}
                      onValueChange={(v) => setMeta({ ...meta, difficulty: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <FieldLabel
                    htmlFor="company"
                    label="Company context"
                    hint="Optional — tailors scenarios to a specific employer."
                  />
                  <Input
                    id="company"
                    placeholder="Enter the company name (optional, e.g. Flipkart)"
                    value={meta.company}
                    onChange={(e) => setMeta({ ...meta, company: e.target.value })}
                  />
                </div>
                <WizardNumberInput
                  id="estimated-duration"
                  label="Estimated duration"
                  hint="Total time students should expect to complete all rounds."
                  placeholder="Enter the estimated duration in minutes"
                  value={meta.estimated_duration_minutes}
                  onChange={(n) => setMeta({ ...meta, estimated_duration_minutes: n })}
                  min={15}
                  max={480}
                  fallback={60}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" onClick={runRecommend} disabled={recommending}>
                    {recommending ? (
                      <Loader size="sm" className="mr-2" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    AI recommend rounds
                  </Button>
                  {!hasMandatory && (
                    <Badge variant="destructive">Missing: {mandatoryTypes.join(', ')}</Badge>
                  )}
                </div>
                {rationale && (
                  <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{rationale}</p>
                )}

                <div className="space-y-2">
                  {stages.map((s, idx) => (
                    <div key={`${s.stage_type}-${idx}`} className="rounded-lg border p-3 dark:border-gray-700">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge>Round {idx + 1}</Badge>
                        <Badge variant="outline">{STAGE_LABELS[s.stage_type] || s.stage_type}</Badge>
                        <div className="ml-auto flex gap-1">
                          <Button type="button" size="icon" variant="ghost" onClick={() => moveStage(idx, -1)} disabled={idx === 0}>
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button type="button" size="icon" variant="ghost" onClick={() => moveStage(idx, 1)} disabled={idx === stages.length - 1}>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button type="button" size="icon" variant="ghost" onClick={() => removeStage(idx)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <FieldLabel
                          htmlFor={`round-title-${idx}`}
                          label="Round title"
                          hint="Display name for this stage in the student flow."
                        />
                        <Input
                          id={`round-title-${idx}`}
                          className="mb-3"
                          placeholder="Enter the round title"
                          value={s.title}
                          onChange={(e) => updateStage(idx, { title: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <WizardNumberInput
                          id={`duration-${idx}`}
                          label="Duration (seconds)"
                          hint="Time limit for this round."
                          placeholder="Enter duration in seconds"
                          value={s.duration_seconds}
                          onChange={(n) => updateStage(idx, { duration_seconds: n })}
                          min={60}
                          max={7200}
                          fallback={900}
                        />
                        <WizardNumberInput
                          id={`pass-${idx}`}
                          label="Pass score (%)"
                          hint="Minimum score required to pass."
                          placeholder="Enter pass threshold (0–100)"
                          value={s.pass_threshold}
                          onChange={(n) => updateStage(idx, { pass_threshold: n })}
                          min={0}
                          max={100}
                          fallback={50}
                        />
                        <div>
                          <FieldLabel label="Round type" hint="Assessment format for this stage." />
                          <Select
                            value={s.stage_type}
                            onValueChange={(v) =>
                              updateStage(idx, {
                                stage_type: v,
                                title: STAGE_LABELS[v] || v,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select round type" />
                            </SelectTrigger>
                            <SelectContent>
                              {stageTypes.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {STAGE_LABELS[t] || t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Select onValueChange={addStage}>
                    <SelectTrigger className="w-[220px]">
                      <Plus className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Add round" />
                    </SelectTrigger>
                    <SelectContent>
                      {stageTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {STAGE_LABELS[t] || t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="self-center text-sm text-muted-foreground">
                    {stages.length} rounds · ~{Math.round(stages.reduce((a, s) => a + s.duration_seconds, 0) / 60)} min
                  </span>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <FieldLabel
                    label="Assignment scope"
                    hint="Who can access this simulation after publishing."
                  />
                  <Select
                    value={assignmentScope.type}
                    onValueChange={(v: AssignmentScope['type']) =>
                      setAssignmentScope({ ...assignmentScope, type: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="platform">All students (public library)</SelectItem>
                      <SelectItem value="colleges">Assign to specific colleges</SelectItem>
                      <SelectItem value="students">Assign to specific students</SelectItem>
                    </SelectContent>
                  </Select>
                  {assignmentScope.type === 'platform' && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Published simulations with this scope appear in every student&apos;s simulation
                      library (no per-student Assign required).
                    </p>
                  )}
                  {assignmentScope.type === 'colleges' && (
                    <div className="mt-2 max-h-32 space-y-1 overflow-y-auto rounded-lg border p-2 dark:border-gray-700">
                      {colleges.map((c) => (
                        <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-muted">
                          <input
                            type="checkbox"
                            checked={assignmentScope.college_ids.includes(c.id)}
                            onChange={() => toggleAssignCollege(c.id)}
                          />
                          <span className="text-sm">{c.college_name || c.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {assignmentScope.type === 'students' && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Use the Assign button on the pipeline list to pick individual students after saving.
                    </p>
                  )}
                  {assignmentScope.type !== 'platform' && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <FieldLabel
                          htmlFor="assign-due"
                          label="Due date"
                          hint="Optional deadline for assigned students."
                        />
                        <Input
                          id="assign-due"
                          type="datetime-local"
                          value={assignDueAt}
                          onChange={(e) => setAssignDueAt(e.target.value)}
                        />
                      </div>
                      <div>
                        <FieldLabel
                          htmlFor="assign-notes"
                          label="Assignment notes"
                          hint="Optional message shown with the assignment."
                        />
                        <Input
                          id="assign-notes"
                          placeholder="Enter notes for assigned students"
                          value={assignNotes}
                          onChange={(e) => setAssignNotes(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <FieldLabel label="Publish option" hint="Control when students can start this simulation." />
                  <div className="space-y-2">
                    {(['draft', 'publish', 'schedule'] as const).map((mode) => (
                      <label
                        key={mode}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 dark:border-gray-700 ${
                          publishMode === mode ? 'border-primary bg-primary/5' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="publishMode"
                          checked={publishMode === mode}
                          onChange={() => setPublishMode(mode)}
                        />
                        <span>
                          {mode === 'draft' && 'Save as draft'}
                          {mode === 'publish' && 'Publish now (students can start)'}
                          {mode === 'schedule' && 'Schedule for later'}
                        </span>
                      </label>
                    ))}
                  </div>
                  {publishMode === 'schedule' && (
                    <div className="mt-3">
                      <FieldLabel
                        htmlFor="publish-at"
                        label="Scheduled publish date"
                        hint="Pipeline becomes available to students at this time."
                      />
                      <Input
                        id="publish-at"
                        type="datetime-local"
                        value={publishAt}
                        onChange={(e) => setPublishAt(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-lg border p-3 text-sm dark:border-gray-700">
                  <div className="font-medium">{meta.name || 'Untitled'}</div>
                  <div className="text-muted-foreground">
                    {stages.length} rounds · {meta.experience_level} · {meta.department || 'General'}
                  </div>
                  {!hasMandatory && publishMode === 'publish' && (
                    <p className="mt-2 text-destructive">
                      Cannot publish without a Prompt Engineering round.
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)
              }
            >
              Next
            </Button>
          ) : (
            <Button type="button" onClick={save} disabled={saving || loading}>
              {saving ? 'Saving…' : publishMode === 'publish' ? 'Publish' : 'Save'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
