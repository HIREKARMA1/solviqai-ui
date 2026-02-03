'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { Users, UserPlus, AlertTriangle } from 'lucide-react';
import { getStudentSubscriptionDistribution } from '@/lib/api';

interface SubscriptionDistribution {
  total_students: number;
  distribution: {
    [key: string]: {
      count: number;
      percentage: number;
    };
  };
  creation_source: {
    admin_created: {
      count: number;
      percentage: number;
    };
    self_registered: {
      count: number;
      percentage: number;
    };
  };
  students_list: Array<{
    id: string;
    name: string;
    email: string;
    subscription_type: string;
    subscription_expiry: string | null;
    created_by_admin: boolean;
    status: string;
    created_at: string;
  }>;
}

const COLORS = {
  free: '#94a3b8',
  premium: '#3b82f6',
  college_license: '#10b981'
};

export default function StudentSubscriptionDistribution() {
  const [distributionData, setDistributionData] = useState<SubscriptionDistribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDistribution();
  }, []);

  const fetchDistribution = async () => {
    try {
      setLoading(true);
      const data = await getStudentSubscriptionDistribution();
      setDistributionData(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch subscription distribution');
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionBadge = (type: string) => {
    const badgeClasses = {
      free: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
      premium: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      college_license: 'bg-green-100 text-green-800 hover:bg-green-100'
    };
    
    return (
      <Badge className={badgeClasses[type as keyof typeof badgeClasses] || 'bg-gray-100 text-gray-800'}>
        {type.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student Subscription Distribution</CardTitle>
          <CardDescription>Loading distribution data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student Subscription Distribution</CardTitle>
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

  if (!distributionData) {
    return null;
  }

  // Prepare data for pie chart
  const pieData = Object.entries(distributionData.distribution).map(([type, data]) => ({
    name: type.replace('_', ' ').toUpperCase(),
    value: data.count,
    percentage: data.percentage
  }));

  // Prepare data for bar chart
  const barData = Object.entries(distributionData.distribution).map(([type, data]) => ({
    type: type.replace('_', ' ').toUpperCase(),
    count: data.count,
    percentage: data.percentage
  }));

  // Prepare creation source data
  const creationSourceData = [
    {
      name: 'Admin Created',
      value: distributionData.creation_source.admin_created.count,
      percentage: distributionData.creation_source.admin_created.percentage
    },
    {
      name: 'Self Registered',
      value: distributionData.creation_source.self_registered.count,
      percentage: distributionData.creation_source.self_registered.percentage
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Subscription Distribution</CardTitle>
        <CardDescription>
          Breakdown of {distributionData.total_students} students by subscription type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="charts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="charts">Visual Overview</TabsTrigger>
            <TabsTrigger value="table">Student List</TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-6">
            {/* Subscription Type Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Subscription Type Distribution
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percent }) => `${((percent ?? 0) * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => {
                        const typeKey = entry.name.toLowerCase().replace(' ', '_');
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[typeKey as keyof typeof COLORS] || '#94a3b8'} 
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Student Count by Type</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Creation Source Distribution */}
            <div className="space-y-2 pt-4 border-t">
              <h3 className="text-sm font-medium flex items-center">
                <UserPlus className="w-4 h-4 mr-2" />
                Student Creation Source
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600">Admin Created</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {distributionData.creation_source.admin_created.count}
                  </div>
                  <div className="text-xs text-gray-500">
                    {distributionData.creation_source.admin_created.percentage.toFixed(1)}% of total
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-600">Self Registered</div>
                  <div className="text-2xl font-bold text-green-600">
                    {distributionData.creation_source.self_registered.count}
                  </div>
                  <div className="text-xs text-gray-500">
                    {distributionData.creation_source.self_registered.percentage.toFixed(1)}% of total
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              {Object.entries(distributionData.distribution).map(([type, data]) => (
                <div key={type} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    {getSubscriptionBadge(type)}
                  </div>
                  <div className="text-3xl font-bold">{data.count}</div>
                  <div className="text-sm text-gray-500">{data.percentage.toFixed(1)}% of students</div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="table" className="space-y-4">
            <div className="rounded-md border">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subscription
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {distributionData.students_list.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {student.email}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {getSubscriptionBadge(student.subscription_type)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {student.created_by_admin ? (
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Admin</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Self</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <Badge 
                            className={
                              student.status === 'active' 
                                ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                            }
                          >
                            {student.status.toUpperCase()}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
