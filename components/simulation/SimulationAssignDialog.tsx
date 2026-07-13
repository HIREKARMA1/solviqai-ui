'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelineId: string;
  pipelineName: string;
  onAssigned?: () => void;
};

export function SimulationAssignDialog({ open, onOpenChange, pipelineId, pipelineName, onAssigned }: Props) {
  const [colleges, setColleges] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [existing, setExisting] = useState<any[]>([]);

  useEffect(() => {
    if (!open || !pipelineId) return;
    setLoading(true);
    Promise.all([
      apiClient.getColleges({ limit: 200 }),
      apiClient.adminListSimulationAssignments(pipelineId),
    ])
      .then(([colRes, assignRes]) => {
        setColleges(colRes.colleges || []);
        setExisting(assignRes.assignments || []);
      })
      .catch(() => toast.error('Failed to load assign data'))
      .finally(() => setLoading(false));
  }, [open, pipelineId]);

  useEffect(() => {
    if (!open) return;
    const params: Record<string, string> = { limit: '50' };
    if (studentSearch) params.search = studentSearch;
    if (collegeFilter) params.college_id = collegeFilter;
    apiClient.getStudents(params).then((res) => setStudents(res.students || [])).catch(() => {});
  }, [open, studentSearch, collegeFilter]);

  const toggleCollege = (id: string) => {
    setSelectedColleges((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const assign = async () => {
    if (selectedColleges.length === 0 && selectedStudents.length === 0) {
      toast.error('Select at least one college or student');
      return;
    }
    setAssigning(true);
    try {
      const result = await apiClient.adminAssignSimulationPipeline(pipelineId, {
        college_ids: selectedColleges,
        student_ids: selectedStudents,
        due_at: dueAt ? new Date(dueAt).toISOString() : undefined,
        notes: notes.trim() || undefined,
      });
      toast.success(`Assigned to ${result.created} students (${result.skipped} skipped)`);
      setSelectedColleges([]);
      setSelectedStudents([]);
      onAssigned?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(typeof msg === 'string' ? msg : 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign simulation</DialogTitle>
          <DialogDescription>
            Bulk assign &quot;{pipelineName}&quot; to colleges or individual students.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Colleges</label>
              <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border p-2 dark:border-gray-700">
                {colleges.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No colleges found</p>
                ) : (
                  colleges.map((c) => (
                    <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-muted">
                      <input
                        type="checkbox"
                        checked={selectedColleges.includes(c.id)}
                        onChange={() => toggleCollege(c.id)}
                      />
                      <span className="text-sm">{c.college_name || c.name}</span>
                    </label>
                  ))
                )}
              </div>
              {selectedColleges.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  All active students in {selectedColleges.length} college(s) will be assigned.
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Individual students</label>
              <div className="mb-2 grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Search by name or email"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
                <select
                  className="rounded-md border px-3 py-2 text-sm dark:bg-gray-800"
                  value={collegeFilter}
                  onChange={(e) => setCollegeFilter(e.target.value)}
                >
                  <option value="">All colleges</option>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.college_name || c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border p-2 dark:border-gray-700">
                {students.map((s) => (
                  <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(s.id)}
                      onChange={() => toggleStudent(s.id)}
                    />
                    <span className="text-sm">
                      {s.name} <span className="text-muted-foreground">({s.email})</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm">Due date (optional)</label>
                <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm">Notes (optional)</label>
                <Input placeholder="e.g. Complete before placement week" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>

            {existing.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium">Recent assignments ({existing.length})</h4>
                <div className="max-h-28 space-y-1 overflow-y-auto text-sm">
                  {existing.slice(0, 10).map((a) => (
                    <div key={a.assignment_id} className="flex items-center justify-between rounded border px-2 py-1 dark:border-gray-700">
                      <span>{a.student_name || a.student_email}</span>
                      <Badge variant="outline">{a.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={assign} disabled={assigning || loading}>
            {assigning ? 'Assigning…' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
