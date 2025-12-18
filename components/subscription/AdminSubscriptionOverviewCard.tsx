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
    <Card>
      <CardHeader>
        <CardTitle>System Subscription Overview</CardTitle>
        <CardDescription>Platform-wide subscription and revenue metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alerts */}
        {(overview.alerts.expiring_student_subscriptions > 0 || overview.alerts.expiring_college_licenses > 0) && (
          <Alert className="border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              {overview.alerts.expiring_student_subscriptions} student subscription(s) and{' '}
              {overview.alerts.expiring_college_licenses} college license(s) expiring within 30 days
            </AlertDescription>
          </Alert>
        )}

        {/* Main Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">Total Students</span>
            </div>
            <div className="text-3xl font-bold text-blue-700">
              {overview.system_overview.total_students.toLocaleString()}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              {overview.system_overview.active_students} active
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <Building2 className="w-5 h-5" />
              <span className="text-sm font-medium">Total Colleges</span>
            </div>
            <div className="text-3xl font-bold text-purple-700">
              {overview.system_overview.total_colleges}
            </div>
            <div className="text-xs text-purple-600 mt-1">
              {overview.system_overview.active_colleges} active
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm font-medium">Paid Students</span>
            </div>
            <div className="text-3xl font-bold text-green-700">
              {overview.revenue_metrics.total_paid_students.toLocaleString()}
            </div>
            <div className="text-xs text-green-600 mt-1">
              {overview.revenue_metrics.conversion_rate}% conversion
            </div>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">30-Day Growth</span>
            </div>
            <div className="text-3xl font-bold text-orange-700">
              {overview.growth_metrics.new_students_30d}
            </div>
            <div className="text-xs text-orange-600 mt-1">
              {overview.growth_metrics.growth_rate}% growth rate
            </div>
          </div>
        </div>

        {/* Subscription Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
          <div>
            <h3 className="text-sm font-semibold mb-3">Subscription Distribution</h3>
            <div className="space-y-2">
              {Object.entries(overview.subscription_breakdown).map(([type, count]) => {
                const total = overview.system_overview.total_students;
                const percentage = ((count / total) * 100).toFixed(1);
                const colorClass = 
                  type === 'free' ? 'bg-gray-500' :
                  type === 'premium' ? 'bg-blue-500' :
                  'bg-green-500';
                
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
                      <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{count.toLocaleString()}</span>
                      <Badge variant="outline" className="text-xs">{percentage}%</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">College License Types</h3>
            <div className="space-y-2">
              {Object.entries(overview.license_breakdown).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{type === 'none' ? 'No License' : type}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Growth Metrics */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold mb-3">Recent Growth (Last 30 Days)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                +{overview.growth_metrics.new_students_30d}
              </div>
              <div className="text-xs text-gray-600">New Students</div>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                +{overview.growth_metrics.new_colleges_30d}
              </div>
              <div className="text-xs text-gray-600">New Colleges</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
