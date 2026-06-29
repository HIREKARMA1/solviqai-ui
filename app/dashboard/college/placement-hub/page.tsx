'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Calendar,
  Download,
  FileText,
  Layers,
  Send,
  Users,
} from 'lucide-react';

function bandClass(band: string) {
  if (band === 'high') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
  if (band === 'medium') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
  if (band === 'low') return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200';
  return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
}

export default function CollegePlacementHubPage() {
  const [heatmap, setHeatmap] = useState<any>(null);
  const [atRisk, setAtRisk] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [drives, setDrives] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const load = async () => {
    try {
      const [hm, risk, assigns, pub, st] = await Promise.all([
        apiClient.getTpoCohortHeatmap(),
        apiClient.getTpoAtRiskStudents(),
        apiClient.getTpoDriveAssignments(),
        apiClient.getTpoPublishedDrives(),
        apiClient.getCollegeStudents(),
      ]);
      setHeatmap(hm);
      setAtRisk(risk.at_risk || []);
      setAssignments(assigns.assignments || []);
      setDrives(pub.drives || []);
      setStudents(st.students || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load placement hub data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const atRiskIds = useMemo(() => new Set(atRisk.map((a) => a.student_id)), [atRisk]);

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllAtRisk = () => {
    setSelectedStudents(new Set(atRisk.map((a) => a.student_id)));
  };

  const handleBulkSchedule = async () => {
    if (!selectedDrive || selectedStudents.size === 0) {
      toast.error('Select a drive and at least one student');
      return;
    }
    setScheduling(true);
    try {
      const result = await apiClient.bulkScheduleTpoDrives({
        template_id: selectedDrive,
        student_ids: Array.from(selectedStudents),
        due_at: dueDate ? new Date(dueDate).toISOString() : undefined,
        notes: notes || undefined,
      });
      toast.success(`Scheduled ${result.created} drive(s) (${result.skipped} skipped)`);
      setSelectedStudents(new Set());
      setNotes('');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Bulk schedule failed');
    } finally {
      setScheduling(false);
    }
  };

  const downloadCsv = async () => {
    try {
      const blob = await apiClient.downloadTpoCohortCsv();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `placement_cohort_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('CSV export failed');
    }
  };

  const openPrintReport = async () => {
    try {
      const html = await apiClient.getTpoCommitteeReportHtml();
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(html);
        w.document.close();
      }
    } catch {
      toast.error('Report export failed');
    }
  };

  if (loading) {
    return (
      <DashboardLayout requiredUserType="college">
        <div className="flex justify-center py-16"><Loader size="lg" /></div>
      </DashboardLayout>
    );
  }

  const sm = heatmap?.summary || {};

  return (
    <DashboardLayout requiredUserType="college">
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">Placement Hub</h1>
            <p className="text-sm text-gray-500 mt-1">
              Cohort readiness heatmap, at-risk flagging, bulk drive scheduling, and committee exports.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={downloadCsv} className="gap-2">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={openPrintReport} className="gap-2">
              <FileText className="h-4 w-4" /> Committee Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total students', value: sm.total || 0, icon: Users },
            { label: 'Assessed', value: sm.with_assessment || 0, icon: Layers },
            { label: 'Ready (≥70%)', value: sm.placement_ready || 0, icon: Calendar },
            { label: 'At risk', value: sm.at_risk_count || 0, icon: AlertTriangle },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl border p-4 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">{label}</p>
                <Icon className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold mt-1">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border dark:border-gray-700 overflow-hidden">
            <div className="border-b px-4 py-3 dark:border-gray-700">
              <h2 className="font-semibold">Cohort readiness heatmap</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 text-left">
                    <th className="px-3 py-2 font-medium">Student</th>
                    <th className="px-3 py-2 font-medium">Branch</th>
                    <th className="px-3 py-2 font-medium">Readiness</th>
                    {(heatmap?.columns || []).map((c: any) => (
                      <th key={c.key} className="px-3 py-2 font-medium whitespace-nowrap">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(heatmap?.rows || []).map((row: any) => (
                    <tr key={row.student_id} className="border-t dark:border-gray-800">
                      <td className="px-3 py-2">
                        <div className="font-medium">{row.name}</div>
                        {atRiskIds.has(row.student_id) && (
                          <Badge variant="destructive" className="mt-1 text-[10px]">At risk</Badge>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{row.branch}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${bandClass(row.readiness_band)}`}>
                          {row.has_assessment ? `${row.readiness_index}%` : 'N/A'}
                        </span>
                      </td>
                      {(heatmap?.columns || []).map((c: any) => {
                        const cell = row.cells?.[c.key] || {};
                        return (
                          <td key={c.key} className="px-3 py-2 text-center">
                            <span className={`inline-block min-w-[2.5rem] rounded px-2 py-0.5 text-xs ${bandClass(cell.band)}`}>
                              {cell.score != null ? cell.score : '—'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {(heatmap?.rows || []).length === 0 && (
                <p className="p-8 text-center text-gray-500">No students in cohort yet.</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border dark:border-gray-700">
              <div className="border-b px-4 py-3 dark:border-gray-700">
                <h2 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> At-risk students
                </h2>
              </div>
              <ul className="max-h-64 overflow-y-auto divide-y dark:divide-gray-800">
                {atRisk.length === 0 ? (
                  <li className="p-4 text-sm text-gray-500">No students flagged.</li>
                ) : (
                  atRisk.map((a) => (
                    <li key={a.student_id} className="px-4 py-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{a.name}</span>
                        <Badge variant={a.priority === 'high' ? 'destructive' : 'secondary'}>{a.priority}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{a.reasons?.join(' · ')}</p>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="rounded-xl border dark:border-gray-700 p-4 space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Send className="h-4 w-4" /> Bulk schedule drives
              </h2>
              <div>
                <label className="text-xs text-gray-500">Placement drive</label>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                  value={selectedDrive}
                  onChange={(e) => setSelectedDrive(e.target.value)}
                >
                  <option value="">Select published drive…</option>
                  {drives.map((d) => (
                    <option key={d.id} value={d.id}>{d.title}{d.company ? ` (${d.company})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Due date (optional)</label>
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Notes (optional)</label>
                <textarea
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={selectAllAtRisk}>
                  Select all at-risk
                </Button>
                <span className="text-xs text-gray-500 self-center">{selectedStudents.size} selected</span>
              </div>
              <div className="max-h-40 overflow-y-auto rounded border dark:border-gray-700 divide-y dark:divide-gray-800">
                {students.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <input
                      type="checkbox"
                      checked={selectedStudents.has(s.id)}
                      onChange={() => toggleStudent(s.id)}
                    />
                    <span>{s.name}</span>
                    {atRiskIds.has(s.id) && <Badge variant="outline" className="text-[10px] ml-auto">at risk</Badge>}
                  </label>
                ))}
              </div>
              <Button className="w-full gap-2" onClick={handleBulkSchedule} disabled={scheduling}>
                <Send className="h-4 w-4" />
                {scheduling ? 'Scheduling…' : 'Schedule drive'}
              </Button>
            </div>
          </div>
        </div>

        {assignments.length > 0 && (
          <div className="rounded-xl border dark:border-gray-700">
            <div className="border-b px-4 py-3 dark:border-gray-700">
              <h2 className="font-semibold">Recent drive assignments</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 text-left">
                    <th className="px-4 py-2">Student</th>
                    <th className="px-4 py-2">Drive</th>
                    <th className="px-4 py-2">Due</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.slice(0, 20).map((a) => (
                    <tr key={a.id} className="border-t dark:border-gray-800">
                      <td className="px-4 py-2">{a.student_name}</td>
                      <td className="px-4 py-2">{a.template_title}</td>
                      <td className="px-4 py-2">{a.due_at ? new Date(a.due_at).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-2"><Badge variant="secondary">{a.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
