'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Building2, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { getAdminSubscriptionOverview } from '@/lib/api';

interface SubscriptionOverview {
  system_overview: {
    total_students: number;
    active_students: number;
    inactive_students: number;
    total_colleges: number;
    active_colleges: number;
  };
  subscription_breakdown: {
    [key: string]: number;
  };
  license_breakdown: {
    [key: string]: number;
  };
  revenue_metrics: {
    premium_students: number;
    college_license_students: number;
    total_paid_students: number;
    conversion_rate: number;
  };
  growth_metrics: {
    new_students_30d: number;
    new_colleges_30d: number;
    growth_rate: number;
  };
  alerts: {
    expiring_student_subscriptions: number;
    expiring_college_licenses: number;
  };
}

export default function AdminSubscriptionOverviewCard() {
  const [overview, setOverview] = useState<SubscriptionOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const data = await getAdminSubscriptionOverview();
      setOverview(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch subscription overview');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Subscription Overview</CardTitle>
          <CardDescription>Loading system metrics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Subscription Overview</CardTitle>
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

  if (!overview) {
    return null;
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">System Subscription Overview</CardTitle>
        <CardDescription>Platform-wide subscription and revenue metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alerts */}
        {(overview.alerts.expiring_student_subscriptions > 0 || overview.alerts.expiring_college_licenses > 0) && (
          <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              {overview.alerts.expiring_student_subscriptions} student subscription(s) and{' '}
              {overview.alerts.expiring_college_licenses} college license(s) expiring within 30 days
            </AlertDescription>
          </Alert>
        )}

        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Paid Students */}
          <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold">Paid Students</span>
            </div>
            <div className="text-4xl font-bold text-green-800 dark:text-green-300 mb-1">
              {overview.revenue_metrics.total_paid_students.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">{overview.revenue_metrics.conversion_rate}% conversion rate</span>
            </div>
          </div>

          {/* Premium Students */}
          <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold">Premium</span>
            </div>
            <div className="text-4xl font-bold text-blue-800 dark:text-blue-300 mb-1">
              {overview.revenue_metrics.premium_students.toLocaleString()}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              {overview.subscription_breakdown.premium && 
                `${((overview.revenue_metrics.premium_students / overview.system_overview.total_students) * 100).toFixed(1)}% of total`
              }
            </div>
          </div>

          {/* College License Students */}
          <div className="p-5 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold">College License</span>
            </div>
            <div className="text-4xl font-bold text-purple-800 dark:text-purple-300 mb-1">
              {overview.revenue_metrics.college_license_students.toLocaleString()}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400">
              {overview.subscription_breakdown.college_license && 
                `${((overview.revenue_metrics.college_license_students / overview.system_overview.total_students) * 100).toFixed(1)}% of total`
              }
            </div>
          </div>
        </div>

        {/* Subscription Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="bg-gray-50 dark:bg-gray-900/20 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
              Subscription Distribution
            </h3>
            <div className="space-y-3">
              {Object.entries(overview.subscription_breakdown).map(([type, count]) => {
                const total = overview.system_overview.total_students;
                const percentage = ((count / total) * 100).toFixed(1);
                const colorClass = 
                  type === 'free' ? 'bg-gray-500' :
                  type === 'premium' ? 'bg-blue-500' :
                  'bg-purple-500';
                
                return (
                  <div key={type} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${colorClass} shadow-sm`}></div>
                      <span className="text-sm font-medium capitalize">{type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold">{count.toLocaleString()}</span>
                      <Badge variant="secondary" className="text-xs font-semibold min-w-[50px] justify-center">
                        {percentage}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/20 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-purple-500 rounded-full"></div>
              College License Types
            </h3>
            <div className="space-y-3">
              {Object.keys(overview.license_breakdown).length > 0 ? (
                Object.entries(overview.license_breakdown).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-medium capitalize">{type === 'none' ? 'No License' : type}</span>
                    <Badge variant="outline" className="font-semibold">{count}</Badge>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No license data available
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
