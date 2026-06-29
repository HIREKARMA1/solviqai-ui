'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { Search, Building2, Play, Filter } from 'lucide-react';

export default function MockTestLibraryPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [filters, setFilters] = useState({ company: '', target_role: '', topic: '', search: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.company) params.company = filters.company;
      if (filters.target_role) params.target_role = filters.target_role;
      if (filters.topic) params.topic = filters.topic;
      if (filters.search) params.search = filters.search;
      const [lib, co] = await Promise.all([
        apiClient.getMockTestLibrary(params),
        apiClient.getMockTestCompanies(),
      ]);
      setTests(lib.tests || []);
      setCompanies(co.companies || []);
    } catch (e) {
      console.error('Failed to load mock tests', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleStart = async (templateId: string) => {
    setStarting(templateId);
    try {
      const attempt = await apiClient.startMockTest(templateId);
      window.location.href = `/dashboard/student/mock-tests/exam?attempt_id=${attempt.attempt_id}`;
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Could not start test');
    } finally {
      setStarting(null);
    }
  };

  return (
    <DashboardLayout requiredUserType="student">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mock Test Library</h1>
          <p className="text-gray-600 dark:text-gray-400">Company-wise practice tests — timed MCQs with instant scoring</p>
        </div>

        <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 md:grid-cols-4">
          <Input placeholder="Search title…" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          <select className="rounded-md border px-3 py-2 dark:bg-gray-800" value={filters.company} onChange={(e) => setFilters({ ...filters, company: e.target.value })}>
            <option value="">All companies</option>
            {companies.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <Input placeholder="Target role" value={filters.target_role} onChange={(e) => setFilters({ ...filters, target_role: e.target.value })} />
          <Button onClick={load} className="gap-2"><Filter className="h-4 w-4" /> Apply filters</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader size="lg" /></div>
        ) : tests.length === 0 ? (
          <p className="py-12 text-center text-gray-500">No published mock tests yet. Check back soon.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {tests.map((t) => (
              <div key={t.id} className="rounded-xl border border-gray-200 p-5 dark:border-gray-700 dark:bg-gray-900">
                <div className="mb-2 flex flex-wrap gap-2">
                  {t.company && <Badge variant="secondary" className="gap-1"><Building2 className="h-3 w-3" />{t.company}</Badge>}
                  <Badge>{t.round_type}</Badge>
                  <Badge variant="outline">{t.question_mode}</Badge>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t.title}</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t.description || t.target_role}</p>
                <p className="mt-2 text-xs text-gray-500">{t.duration_minutes} min · {t.difficulty}</p>
                <Button className="mt-4 w-full gap-2" onClick={() => handleStart(t.id)} disabled={starting === t.id}>
                  <Play className="h-4 w-4" />
                  {starting === t.id ? 'Starting…' : 'Start Test'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
