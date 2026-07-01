'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Sparkles } from 'lucide-react';
import {
  DEFAULT_NEW_DRIVE_STAGES,
  DRIVE_ROLE_PRESETS,
  driveStageFromApi,
  driveStagesFromRecommendations,
  driveStagesToPayload,
  PlacementDriveStageEditor,
  type DriveStageDraft,
} from '@/components/placement-drive/PlacementDriveStageEditor';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driveId?: string | null;
  onSaved: () => void;
};

export function PlacementDriveWizard({ open, onOpenChange, driveId, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recommending, setRecommending] = useState(false);
  const [stageTypes, setStageTypes] = useState<string[]>([]);
  const [rationale, setRationale] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    company: '',
    target_role: 'Software Engineer',
    min_combined_score: 60,
  });
  const [stages, setStages] = useState<DriveStageDraft[]>(DEFAULT_NEW_DRIVE_STAGES);
  const [publishOnSave, setPublishOnSave] = useState(true);

  const isEdit = Boolean(driveId);

  const reset = useCallback(() => {
    setForm({
      title: '',
      description: '',
      company: '',
      target_role: 'Software Engineer',
      min_combined_score: 60,
    });
    setStages(DEFAULT_NEW_DRIVE_STAGES);
    setPublishOnSave(true);
    setRationale('');
  }, []);

  useEffect(() => {
    if (!open) return;
    apiClient.adminListPlacementDriveStageTypes().then((res) => {
      setStageTypes(res.stage_types || []);
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (driveId) {
      setLoading(true);
      apiClient
        .adminGetPlacementDrive(driveId)
        .then((d) => {
          setForm({
            title: d.title || '',
            description: d.description || '',
            company: d.company || '',
            target_role: d.target_role || 'Software Engineer',
            min_combined_score: d.min_combined_score ?? 60,
          });
          setStages((d.stages || []).map((s: Record<string, unknown>) => driveStageFromApi(s)));
          setPublishOnSave(Boolean(d.is_published));
        })
        .catch(() => toast.error('Failed to load drive'))
        .finally(() => setLoading(false));
    } else {
      reset();
    }
  }, [open, driveId, reset]);

  const runRecommend = async () => {
    setRecommending(true);
    try {
      const result = await apiClient.adminRecommendSimulationRounds({
        job_role_name: form.target_role || undefined,
        company: form.company || undefined,
        experience_level: 'fresher',
        difficulty: 'medium',
        use_ai: true,
      });
      setStages(driveStagesFromRecommendations(result.stages || []));
      setRationale(result.rationale || '');
      toast.success(result.snapshot?.ai_used ? 'AI rounds recommended' : 'Rounds recommended (rules)');
    } catch {
      toast.error('Recommendation failed');
    } finally {
      setRecommending(false);
    }
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast.error('Enter a drive title');
      return;
    }
    if (stages.length === 0) {
      toast.error('Add at least one stage');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        is_published: publishOnSave,
        stages: driveStagesToPayload(stages),
      };
      if (isEdit && driveId) {
        await apiClient.adminUpdatePlacementDrive(driveId, payload);
        toast.success(publishOnSave ? 'Drive updated & published' : 'Drive updated');
      } else {
        await apiClient.adminCreatePlacementDrive(payload);
        toast.success(publishOnSave ? 'Drive published' : 'Drive saved as draft');
      }
      onSaved();
      onOpenChange(false);
      reset();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Save failed';
      toast.error(typeof msg === 'string' ? msg : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit placement drive' : 'Create placement drive'}</DialogTitle>
          <DialogDescription>
            Compose sequential rounds using the same catalog as Job Prep Simulation.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader size="lg" />
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              placeholder="Drive title (e.g. TCS Campus Drive — SDE)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
              <Input
                placeholder="Target role"
                value={form.target_role}
                onChange={(e) => setForm({ ...form, target_role: e.target.value })}
              />
            </div>
            <textarea
              className="w-full rounded-md border px-3 py-2 dark:bg-gray-800"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
            <Input
              type="number"
              placeholder="Min combined score (%)"
              value={form.min_combined_score}
              onChange={(e) =>
                setForm({ ...form, min_combined_score: Number(e.target.value) || 60 })
              }
            />

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Quick presets:</span>
              {DRIVE_ROLE_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setForm((f) => ({ ...f, target_role: preset.target_role }));
                    setStages(preset.stages.map((s) => ({ ...s })));
                    setRationale(`${preset.label} preset applied — adjust rounds as needed.`);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
              <Button type="button" variant="outline" onClick={runRecommend} disabled={recommending}>
                {recommending ? (
                  <Loader size="sm" className="mr-2" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                AI recommend rounds
              </Button>
            </div>
            {rationale && (
              <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{rationale}</p>
            )}

            <PlacementDriveStageEditor stages={stages} onChange={setStages} stageTypes={stageTypes} />

            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={publishOnSave}
                onChange={(e) => setPublishOnSave(e.target.checked)}
              />
              Publish drive (students only see published drives in their library)
            </label>
            {!publishOnSave && (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                This drive will be saved as a draft. Use <strong>Publish</strong> on the admin list or check this box
                before students can start it.
              </p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={saving || loading}>
            {saving
              ? 'Saving…'
              : isEdit
                ? publishOnSave
                  ? 'Save & publish'
                  : 'Save changes'
                : publishOnSave
                  ? 'Create & publish'
                  : 'Save as draft'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
