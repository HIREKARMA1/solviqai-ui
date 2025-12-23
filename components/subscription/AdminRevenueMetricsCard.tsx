'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { DollarSign, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { getAdminRevenueMetrics } from '@/lib/api';

interface RevenueMetrics {
  total_revenue: number;
  breakdown: {
    premium_revenue: number;
    college_license_revenue: number;
    premium_count: number;
    college_count: number;
  };
  per_student_metrics: {
    arpu: number;
    premium_arpu: number;
    college_arpu: number;
  };
  projections: {
    monthly_recurring_revenue: number;
    annual_run_rate: number;
    lifetime_value: number;
  };
  business_health: {
    revenue_per_active_student: number;
    paid_student_percentage: number;
    revenue_concentration: string;
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminRevenueMetricsCard() {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await getAdminRevenueMetrics();
      setMetrics(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch revenue metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue & Business Metrics</CardTitle>
          <CardDescription>Loading revenue data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue & Business Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!metrics || !metrics.breakdown) {
    return null;
  }

  const revenueBreakdownData = [
    { name: 'Premium Students', value: metrics.breakdown.premium_revenue },
    { name: 'College Licenses', value: metrics.breakdown.college_license_revenue },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue & Business Metrics</CardTitle>
        <CardDescription>Financial performance and business intelligence</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Revenue Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm font-medium">Total Revenue</span>
            </div>
            <div className="text-3xl font-bold text-green-700">
              ₹{(metrics.total_revenue / 1000).toFixed(1)}K
            </div>
            <div className="text-xs text-green-600 mt-1">Current Value</div>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">MRR</span>
            </div>
            <div className="text-3xl font-bold text-blue-700">
              ₹{(metrics.projections.monthly_recurring_revenue / 1000).toFixed(1)}K
            </div>
            <div className="text-xs text-blue-600 mt-1">Monthly Recurring</div>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm font-medium">ARR</span>
            </div>
            <div className="text-3xl font-bold text-purple-700">
              ₹{(metrics.projections.annual_run_rate / 100000).toFixed(1)}L
            </div>
            <div className="text-xs text-purple-600 mt-1">Annual Run Rate</div>
          </div>

          <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">ARPU</span>
            </div>
            <div className="text-3xl font-bold text-orange-700">
              ₹{metrics.per_student_metrics.arpu}
            </div>
            <div className="text-xs text-orange-600 mt-1">Avg Revenue/Student</div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Revenue Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueBreakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number | undefined) => `₹${(value ?? 0).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Details */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Revenue Breakdown</h3>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">Premium Students</span>
                  <span className="text-xs text-blue-600">{metrics.breakdown.premium_count} students</span>
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  ₹{metrics.breakdown.premium_revenue.toLocaleString()}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  ARPU: ₹{metrics.per_student_metrics.premium_arpu}
                </div>
              </div>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700">College Licenses</span>
                  <span className="text-xs text-green-600">{metrics.breakdown.college_count} students</span>
                </div>
                <div className="text-2xl font-bold text-green-700">
                  ₹{metrics.breakdown.college_license_revenue.toLocaleString()}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  ARPU: ₹{metrics.per_student_metrics.college_arpu}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Business Health Indicators */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold mb-3">Business Health Indicators</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="text-xs text-gray-500 mb-1">Revenue per Active Student</div>
              <div className="text-2xl font-bold text-gray-700">
                ₹{metrics.business_health.revenue_per_active_student}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="text-xs text-gray-500 mb-1">Paid Student %</div>
              <div className="text-2xl font-bold text-gray-700">
                {metrics.business_health.paid_student_percentage}%
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="text-xs text-gray-500 mb-1">Revenue Concentration</div>
              <div className="text-lg font-bold text-gray-700">
                {metrics.business_health.revenue_concentration}
              </div>
            </div>
          </div>
        </div>

        {/* Projections */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold mb-3">Financial Projections</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg">
              <div className="text-xs text-indigo-600 mb-1">Monthly Recurring Revenue</div>
              <div className="text-2xl font-bold text-indigo-700">
                ₹{(metrics.projections.monthly_recurring_revenue / 1000).toFixed(1)}K
              </div>
              <div className="text-xs text-indigo-600 mt-1">Projected MRR</div>
            </div>

            <div className="p-4 bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg">
              <div className="text-xs text-violet-600 mb-1">Annual Run Rate</div>
              <div className="text-2xl font-bold text-violet-700">
                ₹{(metrics.projections.annual_run_rate / 100000).toFixed(2)}L
              </div>
              <div className="text-xs text-violet-600 mt-1">ARR Projection</div>
            </div>

            <div className="p-4 bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 rounded-lg">
              <div className="text-xs text-fuchsia-600 mb-1">Customer Lifetime Value</div>
              <div className="text-2xl font-bold text-fuchsia-700">
                ₹{metrics.projections.lifetime_value.toLocaleString()}
              </div>
              <div className="text-xs text-fuchsia-600 mt-1">Estimated LTV</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
