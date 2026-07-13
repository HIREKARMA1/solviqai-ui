'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Copy, Pencil, Plus } from 'lucide-react';
import { PlacementDriveWizard } from '@/components/placement-drive/PlacementDriveWizard';
import { STAGE_LABELS } from '@/components/placement-drive/PlacementDriveStageEditor';

function stageSummary(stages: Array<{ stage_type?: string }>): string {
  if (!stages?.length) return '0 stages';
  const labels = stages
    .slice(0, 4)
    .map((s) => STAGE_LABELS[s.stage_type || ''] || s.stage_type)
    .join(', ');
  const extra = stages.length > 4 ? ` +${stages.length - 4} more` : '';
  return `${stages.length} stages · ${labels}${extra}`;
}

export default function AdminPlacementDrivesPage() {
  const [drives, setDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const d = await apiClient.adminListPlacementDrives();
      setDrives(Array.isArray(d) ? d : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
      await apiClient.adminDuplicatePlacementDrive(id);
      toast.success('Drive duplicated as draft');
      load();
    } catch {
      toast.error('Duplicate failed');
    }
  };

  const togglePublish = async (id: string, current: boolean) => {
    try {
      await apiClient.adminUpdatePlacementDrive(id, { is_published: !current });
      toast.success(!current ? 'Drive published' : 'Drive unpublished');
      load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Update failed';
      toast.error(typeof msg === 'string' ? msg : 'Update failed');
    }
  };

  return (
    <DashboardLayout requiredUserType="admin">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Placement Drive Templates</h1>
            <p className="mt-1 text-muted-foreground">
              Campus-style sequential drives — reuse simulation round types and AI recommendations.
              Students only see drives marked <strong>Published</strong>.
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New drive
          </Button>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <div className="space-y-3">
            {drives.length === 0 && (
              <p className="text-sm text-muted-foreground">No placement drives yet.</p>
            )}
            {drives.map((d) => (
              <div
                key={d.id}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{d.title}</p>
                    <Badge variant={d.is_published ? 'default' : 'outline'}>
                      {d.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {d.company || 'General'} · {d.target_role}
                  </p>
                  <p className="text-xs text-muted-foreground">{stageSummary(d.stages || [])}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => openEdit(d.id)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => duplicate(d.id)}>
                    <Copy className="h-3.5 w-3.5" />
                    Duplicate
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => togglePublish(d.id, d.is_published)}>
                    {d.is_published ? 'Unpublish' : 'Publish'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PlacementDriveWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        driveId={editId}
        onSaved={load}
      />
    </DashboardLayout>
  );
}
