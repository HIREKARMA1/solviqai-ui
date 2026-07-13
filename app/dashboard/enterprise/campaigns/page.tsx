'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Copy, Link2, Plus } from 'lucide-react';

export default function EnterpriseCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [mockTests, setMockTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [form, setForm] = useState({
    title: '',
    job_role: '',
    company: '',
    mock_test_template_id: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [c, t] = await Promise.all([
        apiClient.getEnterpriseCampaigns(),
        apiClient.getEnterpriseMockTests(),
      ]);
      setCampaigns(c.campaigns || []);
      setMockTests(t.mock_tests || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const loadResults = async (id: string) => {
    setSelectedId(id);
    const r = await apiClient.getEnterpriseCampaignResults(id);
    setResults(r);
  };

  const createCampaign = async () => {
    if (!form.title || !form.job_role || !form.mock_test_template_id) {
      toast.error('Fill title, role, and assessment template');
      return;
    }
    setCreating(true);
    try {
      await apiClient.createEnterpriseCampaign(form);
      toast.success('Campaign created');
      setForm({ title: '', job_role: '', company: '', mock_test_template_id: '' });
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const createInvite = async (campaignId: string, withEmail: boolean) => {
    try {
      const payload = withEmail && inviteEmail
        ? { emails: [inviteEmail], expires_in_days: 14 }
        : { expires_in_days: 14 };
      const r = await apiClient.createEnterpriseInvites(campaignId, payload);
      toast.success(`Created ${r.created} invite link(s)`);
      if (r.invites?.[0]?.invite_path) {
        const full = `${window.location.origin}${r.invites[0].invite_path}`;
        await navigator.clipboard.writeText(full);
        toast.success('Invite link copied to clipboard');
      }
      setInviteEmail('');
      if (selectedId === campaignId) await loadResults(campaignId);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to create invite');
    }
  };

  if (loading) {
    return (
      <DashboardLayout requiredUserType="enterprise">
        <div className="flex justify-center py-16"><Loader size="lg" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredUserType="enterprise">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold">Hiring Campaigns</h1>
          <p className="text-gray-600">Create role-based assessments and share token invite links with candidates.</p>
        </div>

        <div className="rounded-xl border p-4 space-y-3 dark:border-gray-700">
          <h2 className="font-semibold flex items-center gap-2"><Plus className="h-4 w-4" /> New campaign</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Campaign title (e.g. Backend Engineer — Q2)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Job role" value={form.job_role} onChange={(e) => setForm({ ...form, job_role: e.target.value })} />
            <Input placeholder="Company (optional)" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            <select
              className="rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              value={form.mock_test_template_id}
              onChange={(e) => setForm({ ...form, mock_test_template_id: e.target.value })}
            >
              <option value="">Select published assessment…</option>
              {mockTests.map((t) => (
                <option key={t.id} value={t.id}>{t.title}{t.company ? ` (${t.company})` : ''}</option>
              ))}
            </select>
          </div>
          <Button onClick={createCampaign} disabled={creating}>{creating ? 'Creating…' : 'Create campaign'}</Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="font-semibold">Your campaigns</h2>
            {campaigns.length === 0 ? (
              <p className="text-gray-500 text-sm">No campaigns yet.</p>
            ) : (
              campaigns.map((c) => (
                <div key={c.id} className={`rounded-xl border p-4 dark:border-gray-700 ${selectedId === c.id ? 'ring-2 ring-blue-500' : ''}`}>
                  <div className="flex justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{c.title}</h3>
                      <p className="text-sm text-gray-500">{c.job_role}{c.company ? ` · ${c.company}` : ''}</p>
                    </div>
                    <Badge variant={c.is_active ? 'default' : 'secondary'}>{c.is_active ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{c.invite_count} invites · {c.completed_count} completed</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => loadResults(c.id)}>View results</Button>
                    <Button size="sm" className="gap-1" onClick={() => createInvite(c.id, false)}>
                      <Link2 className="h-3 w-3" /> Open link
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="rounded-xl border dark:border-gray-700">
            <div className="border-b px-4 py-3 dark:border-gray-700">
              <h2 className="font-semibold">Campaign results & invites</h2>
            </div>
            {!results ? (
              <p className="p-6 text-sm text-gray-500">Select a campaign to view candidate results and send invites.</p>
            ) : (
              <div className="p-4 space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Candidate email (optional)" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                  <Button onClick={() => selectedId && createInvite(selectedId, true)} className="gap-1 shrink-0">
                    <Copy className="h-4 w-4" /> Invite
                  </Button>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {(results.invites || []).map((i: any) => (
                    <div key={i.id} className="rounded border p-3 text-sm dark:border-gray-700">
                      <div className="flex justify-between">
                        <span>{i.candidate_name || i.candidate_email || 'Open invite'}</span>
                        <Badge variant="outline">{i.status}</Badge>
                      </div>
                      {i.score != null && <p className="text-xs mt-1">Score: {i.score}% · {i.hiring_verdict}</p>}
                      {i.invite_path && (
                        <p className="text-xs text-blue-600 mt-1 break-all">{typeof window !== 'undefined' ? window.location.origin : ''}{i.invite_path}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
