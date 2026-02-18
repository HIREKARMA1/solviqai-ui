'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { getAdminSubscriptionTrends } from '@/lib/api';

interface TrendData {
  month: string;
  total_students: number;
  free_students: number;
  premium_students: number;
  college_license_students: number;
  new_students: number;
  active_students: number;
}

interface TrendsResponse {
  monthly_trends: TrendData[];
  conversion_rates: {
    free_to_premium: number;
    free_to_college: number;
    overall_conversion: number;
  };
  growth_indicators: {
    student_growth_rate: number;
    revenue_growth_rate: number;
    avg_monthly_signups: number;
  };
}

export default function AdminSubscriptionTrendsCard() {
  const [trends, setTrends] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartView, setChartView] = useState<'total' | 'subscriptions'>('total');

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      const data = await getAdminSubscriptionTrends();
      setTrends(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch subscription trends');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Trends</CardTitle>
          <CardDescription>Loading trend data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-80 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Trends</CardTitle>
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

  if (!trends || !trends.conversion_rates || !trends.growth_indicators || !trends.monthly_trends) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Trends & Analytics</CardTitle>
        <CardDescription>6-month growth trajectory and conversion metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Growth Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Student Growth</span>
            </div>
            <div className="text-3xl font-bold text-blue-700">
              {trends.growth_indicators.student_growth_rate}%
            </div>
            <div className="text-xs text-blue-600 mt-1">
              ~{trends.growth_indicators.avg_monthly_signups} new/month
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Revenue Growth</span>
            </div>
            <div className="text-3xl font-bold text-green-700">
              {trends.growth_indicators.revenue_growth_rate}%
            </div>
            <div className="text-xs text-green-600 mt-1">Last 6 months</div>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">Overall Conversion</span>
            </div>
            <div className="text-3xl font-bold text-purple-700">
              {trends.conversion_rates.overall_conversion}%
            </div>
            <div className="text-xs text-purple-600 mt-1">Free to Paid</div>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-sm font-semibold mb-3">Conversion Funnel</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Free → Premium</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${trends.conversion_rates.free_to_premium}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{trends.conversion_rates.free_to_premium}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Free → College License</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${trends.conversion_rates.free_to_college}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{trends.conversion_rates.free_to_college}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setChartView('total')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              chartView === 'total'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Total Growth
          </button>
          <button
            onClick={() => setChartView('subscriptions')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              chartView === 'subscriptions'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Subscription Breakdown
          </button>
        </div>

        {/* Charts */}
        {chartView === 'total' ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends.monthly_trends}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="total_students"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                  name="Total Students"
                />
                <Area
                  type="monotone"
                  dataKey="active_students"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorActive)"
                  name="Active Students"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends.monthly_trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="free_students"
                  stroke="#6b7280"
                  strokeWidth={2}
                  name="Free"
                  dot={{ fill: '#6b7280', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="premium_students"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Premium"
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="college_license_students"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="College License"
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Monthly Trends Table */}
        <div className="overflow-x-auto">
          <h3 className="text-sm font-semibold mb-2">Monthly Breakdown</h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-2">Month</th>
                <th className="text-right p-2">Total</th>
                <th className="text-right p-2">Active</th>
                <th className="text-right p-2">New</th>
                <th className="text-right p-2">Free</th>
                <th className="text-right p-2">Premium</th>
                <th className="text-right p-2">College</th>
              </tr>
            </thead>
            <tbody>
              {trends.monthly_trends.map((trend, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{trend.month}</td>
                  <td className="text-right p-2">{trend.total_students}</td>
                  <td className="text-right p-2 text-green-600">{trend.active_students}</td>
                  <td className="text-right p-2 text-blue-600">{trend.new_students}</td>
                  <td className="text-right p-2">{trend.free_students}</td>
                  <td className="text-right p-2">{trend.premium_students}</td>
                  <td className="text-right p-2">{trend.college_license_students}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
