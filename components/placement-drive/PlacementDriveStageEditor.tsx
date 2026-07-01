'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

export type DriveStageDraft = {
  stage_type: string;
  title: string;
  duration_seconds: number;
  pass_threshold: number;
  question_mode: 'ai' | 'manual' | 'mixed';
  question_count: number;
  difficulty: 'easy' | 'medium' | 'hard';
  max_turns: number;
  task_count: number;
  /** Legacy mock_test only */
  mock_test_template_id?: string;
  /** Legacy mock_interview only */
  persona?: 'technical' | 'hr';
};

export const STAGE_LABELS: Record<string, string> = {
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
  mock_test: 'Mock Test (legacy)',
  mock_interview: 'Mock Interview (legacy)',
};

const MCQ_STAGE_TYPES = new Set([
  'aptitude',
  'soft_skills',
  'technical_mcq',
  'automation_technical',
  'test_case_triage',
]);

const INTERVIEW_STAGE_TYPES = new Set([
  'technical_interview',
  'hr_interview',
  'culture_fit',
  'mock_interview',
]);

const DEFAULT_DURATIONS: Record<string, number> = {
  aptitude: 1800,
  soft_skills: 900,
  technical_mcq: 1200,
  coding: 3600,
  technical_interview: 900,
  hr_interview: 900,
  culture_fit: 900,
  group_discussion: 1200,
  gd_playground: 1200,
  sales_roleplay: 900,
  case_study: 1800,
  short_answer: 900,
  essay: 1800,
  prompt_engineering: 1200,
  finance: 1800,
  automation_technical: 1200,
  test_case_triage: 900,
};

const DEFAULT_QUESTION_COUNTS: Record<string, number> = {
  aptitude: 15,
  soft_skills: 10,
  technical_mcq: 10,
  automation_technical: 10,
  test_case_triage: 8,
};

export function isMcqStageType(type: string): boolean {
  return MCQ_STAGE_TYPES.has(type) || type === 'mock_test';
}

export function isInterviewStageType(type: string): boolean {
  return INTERVIEW_STAGE_TYPES.has(type);
}

export function defaultDriveStage(type: string): DriveStageDraft {
  return {
    stage_type: type,
    title: STAGE_LABELS[type] || type.replace(/_/g, ' '),
    duration_seconds: DEFAULT_DURATIONS[type] || 900,
    pass_threshold: 50,
    question_mode: 'ai',
    question_count: DEFAULT_QUESTION_COUNTS[type] || 10,
    difficulty: 'medium',
    max_turns: type === 'hr_interview' || type === 'mock_interview' ? 5 : 6,
    task_count: 3,
    persona: type === 'hr_interview' ? 'hr' : 'technical',
  };
}

export function driveStageFromApi(raw: Record<string, unknown>): DriveStageDraft {
  const config = (raw.config as Record<string, unknown>) || {};
  const stageType = String(raw.stage_type || 'aptitude');
  const base = defaultDriveStage(stageType);
  return {
    ...base,
    stage_type: stageType,
    title: String(raw.title || base.title),
    duration_seconds: Number(raw.duration_seconds) || base.duration_seconds,
    pass_threshold: Number(raw.pass_threshold ?? base.pass_threshold),
    question_mode: (raw.question_mode as DriveStageDraft['question_mode']) || base.question_mode,
    question_count: Number(config.question_count ?? base.question_count),
    difficulty: (config.difficulty as DriveStageDraft['difficulty']) || base.difficulty,
    max_turns: Number(config.max_turns ?? base.max_turns),
    task_count: Number(config.task_count ?? base.task_count),
    mock_test_template_id: config.mock_test_template_id
      ? String(config.mock_test_template_id)
      : undefined,
    persona: (config.persona as DriveStageDraft['persona']) || base.persona,
  };
}

export function driveStagesFromRecommendations(stages: Array<Record<string, unknown>>): DriveStageDraft[] {
  return stages.map((s) => {
    const stageType = String(s.stage_type || 'aptitude');
    const config = (s.config as Record<string, unknown>) || {};
    const base = defaultDriveStage(stageType);
    return {
      ...base,
      stage_type: stageType,
      title: String(s.title || STAGE_LABELS[stageType] || base.title),
      duration_seconds: Number(s.duration_seconds) || base.duration_seconds,
      pass_threshold: Number(s.pass_threshold ?? base.pass_threshold),
      question_mode: (s.question_mode as DriveStageDraft['question_mode']) || base.question_mode,
      question_count: Number(config.question_count ?? base.question_count),
      difficulty: (config.difficulty as DriveStageDraft['difficulty']) || base.difficulty,
      max_turns: Number(config.max_turns ?? base.max_turns),
      task_count: Number(config.task_count ?? base.task_count),
    };
  });
}

export function driveStagesToPayload(stages: DriveStageDraft[]) {
  return stages.map((s, idx) => {
    const config: Record<string, unknown> = {};

    if (isMcqStageType(s.stage_type)) {
      if (s.stage_type === 'mock_test' && s.mock_test_template_id) {
        config.mock_test_template_id = s.mock_test_template_id;
      } else {
        config.question_count = s.question_count;
        config.difficulty = s.difficulty;
        config.topic = s.stage_type;
      }
    } else if (isInterviewStageType(s.stage_type)) {
      if (s.stage_type === 'mock_interview') {
        config.persona = s.persona || 'technical';
      }
      config.max_turns = s.max_turns;
    } else if (s.stage_type === 'prompt_engineering') {
      config.task_count = s.task_count;
    }

    return {
      order: idx + 1,
      stage_type: s.stage_type,
      title: s.title,
      pass_threshold: s.pass_threshold,
      duration_seconds: s.duration_seconds,
      ...(isMcqStageType(s.stage_type) && s.stage_type !== 'mock_test'
        ? { question_mode: s.question_mode }
        : {}),
      config,
    };
  });
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
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const clamp = (num: number) => {
    let next = Math.round(num);
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    return next;
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
        inputMode="numeric"
        placeholder={placeholder}
        value={draft}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '' || /^\d*$/.test(raw)) {
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

type Props = {
  stages: DriveStageDraft[];
  onChange: (stages: DriveStageDraft[]) => void;
  stageTypes: string[];
};

export function PlacementDriveStageEditor({ stages, onChange, stageTypes }: Props) {
  const reindex = (next: DriveStageDraft[]) => next;

  const moveStage = (idx: number, dir: -1 | 1) => {
    const next = [...stages];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(reindex(next));
  };

  const removeStage = (idx: number) => {
    onChange(reindex(stages.filter((_, i) => i !== idx)));
  };

  const addStage = (type: string) => {
    onChange(reindex([...stages, defaultDriveStage(type)]));
  };

  const updateStage = (idx: number, patch: Partial<DriveStageDraft>) => {
    const next = [...stages];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const totalMinutes = Math.round(stages.reduce((a, s) => a + s.duration_seconds, 0) / 60);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {stages.map((s, idx) => (
          <div key={`${s.stage_type}-${idx}`} className="rounded-lg border p-3 dark:border-gray-700">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge>Stage {idx + 1}</Badge>
              <Badge variant="outline">{STAGE_LABELS[s.stage_type] || s.stage_type}</Badge>
              <div className="ml-auto flex gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => moveStage(idx, -1)}
                  disabled={idx === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => moveStage(idx, 1)}
                  disabled={idx === stages.length - 1}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => removeStage(idx)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>

            <div className="mb-3">
              <FieldLabel
                htmlFor={`stage-title-${idx}`}
                label="Stage title"
                hint="Display name shown to students during the drive."
              />
              <Input
                id={`stage-title-${idx}`}
                placeholder="Enter stage title"
                value={s.title}
                onChange={(e) => updateStage(idx, { title: e.target.value })}
              />
            </div>

            <div className="mb-3 grid gap-3 sm:grid-cols-3">
              <WizardNumberInput
                id={`duration-${idx}`}
                label="Duration (seconds)"
                hint="Time limit for this round."
                placeholder="e.g. 1800"
                value={s.duration_seconds}
                onChange={(n) => updateStage(idx, { duration_seconds: n })}
                min={60}
                max={7200}
                fallback={900}
              />
              <WizardNumberInput
                id={`pass-${idx}`}
                label="Pass score (%)"
                hint="Minimum score to pass this stage."
                placeholder="e.g. 50"
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
                  onValueChange={(v) => {
                    const defaults = defaultDriveStage(v);
                    updateStage(idx, {
                      stage_type: v,
                      title: STAGE_LABELS[v] || defaults.title,
                      duration_seconds: defaults.duration_seconds,
                      question_count: defaults.question_count,
                      max_turns: defaults.max_turns,
                      task_count: defaults.task_count,
                      persona: defaults.persona,
                    });
                  }}
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

            {isMcqStageType(s.stage_type) && s.stage_type !== 'mock_test' && (
              <div className="grid gap-3 sm:grid-cols-3">
                <WizardNumberInput
                  id={`qcount-${idx}`}
                  label="Question count"
                  hint="Number of MCQ questions to generate."
                  placeholder="e.g. 15"
                  value={s.question_count}
                  onChange={(n) => updateStage(idx, { question_count: n })}
                  min={5}
                  max={50}
                  fallback={10}
                />
                <div>
                  <FieldLabel label="Question mode" hint="AI generates questions on the fly." />
                  <Select
                    value={s.question_mode}
                    onValueChange={(v: DriveStageDraft['question_mode']) =>
                      updateStage(idx, { question_mode: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ai">AI generated</SelectItem>
                      <SelectItem value="manual">Manual bank</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabel label="Difficulty" hint="Default difficulty for generated questions." />
                  <Select
                    value={s.difficulty}
                    onValueChange={(v: DriveStageDraft['difficulty']) =>
                      updateStage(idx, { difficulty: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {s.stage_type === 'mock_test' && (
              <p className="text-xs text-muted-foreground">
                Legacy stage: links to an existing mock test template. Prefer Aptitude / Technical MCQ rounds for new drives.
              </p>
            )}

            {isInterviewStageType(s.stage_type) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {s.stage_type === 'mock_interview' && (
                  <div>
                    <FieldLabel label="Persona" hint="Legacy interview persona." />
                    <Select
                      value={s.persona || 'technical'}
                      onValueChange={(v: 'technical' | 'hr') => updateStage(idx, { persona: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <WizardNumberInput
                  id={`turns-${idx}`}
                  label="Max turns"
                  hint="Number of Q&A exchanges in the interview."
                  placeholder="e.g. 6"
                  value={s.max_turns}
                  onChange={(n) => updateStage(idx, { max_turns: n })}
                  min={3}
                  max={12}
                  fallback={6}
                />
              </div>
            )}

            {s.stage_type === 'prompt_engineering' && (
              <WizardNumberInput
                id={`tasks-${idx}`}
                label="Task count"
                hint="Number of prompt engineering tasks."
                placeholder="e.g. 3"
                value={s.task_count}
                onChange={(n) => updateStage(idx, { task_count: n })}
                min={1}
                max={10}
                fallback={3}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select onValueChange={addStage}>
          <SelectTrigger className="w-[220px]">
            <Plus className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Add stage" />
          </SelectTrigger>
          <SelectContent>
            {stageTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {STAGE_LABELS[t] || t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {stages.length} stages · ~{totalMinutes} min
        </span>
      </div>
    </div>
  );
}

export const DEFAULT_NEW_DRIVE_STAGES: DriveStageDraft[] = [
  defaultDriveStage('aptitude'),
  defaultDriveStage('technical_interview'),
  defaultDriveStage('hr_interview'),
];

/** Quick-start presets — same round catalog as Job Prep Simulation. */
export const DRIVE_ROLE_PRESETS: Array<{
  id: string;
  label: string;
  target_role: string;
  stages: DriveStageDraft[];
}> = [
  {
    id: 'sde',
    label: 'SDE campus drive',
    target_role: 'Software Engineer',
    stages: [
      defaultDriveStage('aptitude'),
      defaultDriveStage('technical_mcq'),
      defaultDriveStage('coding'),
      defaultDriveStage('prompt_engineering'),
      defaultDriveStage('technical_interview'),
      defaultDriveStage('hr_interview'),
    ],
  },
  {
    id: 'mba',
    label: 'MBA / consulting drive',
    target_role: 'Management Trainee',
    stages: [
      defaultDriveStage('aptitude'),
      defaultDriveStage('case_study'),
      defaultDriveStage('group_discussion'),
      defaultDriveStage('finance'),
      defaultDriveStage('hr_interview'),
    ],
  },
  {
    id: 'sales',
    label: 'Sales / BDE drive',
    target_role: 'Business Development Executive',
    stages: [
      defaultDriveStage('aptitude'),
      defaultDriveStage('soft_skills'),
      defaultDriveStage('sales_roleplay'),
      defaultDriveStage('hr_interview'),
    ],
  },
];
