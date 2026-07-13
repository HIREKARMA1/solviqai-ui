'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Check, Copy, CreditCard } from 'lucide-react';

function PayUForm({ action, fields }: { action: string; fields: Record<string, string> }) {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    formRef.current?.submit();
  }, []);
  return (
    <form ref={formRef} method="post" action={action} className="hidden">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
    </form>
  );
}

export default function StudentPlansPage() {
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkout, setCheckout] = useState<{ action: string; fields: Record<string, string> } | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [coupon, setCoupon] = useState('');
  const [referral, setReferral] = useState('');
  const [myReferral, setMyReferral] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const status = searchParams?.get('status');
    const plan = searchParams?.get('plan');
    if (status === 'success') {
      toast.success(plan ? `Subscribed to ${plan}!` : 'Payment successful!');
    } else if (status === 'failed') {
      toast.error('Payment failed or was cancelled.');
    }
  }, [searchParams]);

  useEffect(() => {
    Promise.all([
      apiClient.getPaymentPlans(),
      apiClient.getMyPaymentTransactions().catch(() => ({ transactions: [] })),
      apiClient.getMyReferralCode().catch(() => null),
    ])
      .then(([p, tx, ref]) => {
        setPlans(p.plans || []);
        setTransactions(tx.transactions || []);
        setMyReferral(ref);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleBuy = async (slug: string) => {
    setProcessing(slug);
    try {
      const result = await apiClient.initiateCheckout({
        plan_slug: slug,
        coupon_code: coupon || undefined,
        referral_code: referral || undefined,
      });
      if (result.demo_mode) {
        window.location.href = result.simulate_url;
        return;
      }
      setCheckout({ action: result.payu_url, fields: result.form_fields });
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Checkout failed');
      setProcessing(null);
    }
  };

  const copyReferral = () => {
    if (myReferral?.code) {
      navigator.clipboard.writeText(myReferral.code);
      toast.success('Referral code copied');
    }
  };

  if (loading) {
    return (
      <DashboardLayout requiredUserType="student">
        <div className="flex justify-center py-16"><Loader size="lg" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredUserType="student">
      {checkout && <PayUForm action={checkout.action} fields={checkout.fields} />}
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold">Upgrade your plan</h1>
          <p className="text-gray-600 mt-1">Unlock practice, mock tests, AI interviews, and placement drives.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Input placeholder="Coupon code" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} className="max-w-[180px]" />
          <Input placeholder="Referral code" value={referral} onChange={(e) => setReferral(e.target.value.toUpperCase())} className="max-w-[180px]" />
        </div>

        {myReferral?.code && (
          <div className="rounded-lg border border-dashed p-4 flex flex-wrap items-center justify-between gap-2 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium">Your referral code</p>
              <p className="text-xs text-gray-500">Friends get extra days when they subscribe · Used {myReferral.times_used} times</p>
            </div>
            <Button variant="outline" size="sm" onClick={copyReferral} className="gap-1">
              <Copy className="h-3 w-3" /> {myReferral.code}
            </Button>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.slug} className={`rounded-xl border p-6 flex flex-col dark:border-gray-700 ${plan.slug === 'pro' ? 'ring-2 ring-blue-500' : ''}`}>
              {plan.slug === 'pro' && <Badge className="mb-2 w-fit">Popular</Badge>}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-3xl font-bold mt-2">₹{plan.price_inr}<span className="text-sm font-normal text-gray-500">/{plan.duration_days}d</span></p>
              <p className="text-sm text-gray-600 mt-2 flex-1">{plan.description}</p>
              <ul className="mt-4 space-y-1 text-sm">
                {(plan.features || []).slice(0, 5).map((f: string) => (
                  <li key={f} className="flex items-center gap-2"><Check className="h-3 w-3 text-green-600" />{f.replace(/_/g, ' ')}</li>
                ))}
              </ul>
              <Button className="mt-6 w-full gap-2" onClick={() => handleBuy(plan.slug)} disabled={processing === plan.slug}>
                <CreditCard className="h-4 w-4" />
                {processing === plan.slug ? 'Redirecting…' : 'Subscribe'}
              </Button>
            </div>
          ))}
        </div>

        {transactions.length > 0 && (
          <div className="rounded-xl border dark:border-gray-700">
            <div className="border-b px-4 py-3 dark:border-gray-700 font-semibold">Payment history</div>
            <div className="divide-y dark:divide-gray-800">
              {transactions.map((t) => (
                <div key={t.txn_id} className="px-4 py-3 flex justify-between text-sm">
                  <span>{t.plan_slug} · {t.txn_id}</span>
                  <span>₹{t.amount_inr} · <Badge variant="outline">{t.status}</Badge></span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center">
          Payments processed via PayU. Without PayU keys configured, demo mode simulates success for testing.
        </p>
      </div>
    </DashboardLayout>
  );
}
