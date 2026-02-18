'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Clock, 
  TrendingDown, 
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { getSubscriptionHealth } from '@/lib/api';

interface HealthData {
  summary: {
    expiring_count: number;
    at_limits_count: number;
    inactive_count: number;
    total_alerts: number;
  };
  expiring_subscriptions: Array<{
    student_id: string;
    student_name: string;
    student_email: string;
    subscription_type: string;
    expiry_date: string;
    days_remaining: number;
    severity: 'error' | 'warning';
  }>;
  students_at_limits: Array<{
    student_id: string;
    student_name: string;
    student_email: string;
    limits_hit: string[];
    message: string;
  }>;
  inactive_subscriptions: Array<{
    student_id: string;
    student_name: string;
    student_email: string;
    subscription_type: string;
    last_active: string | null;
    days_inactive: number | null;
  }>;
  recommendations: Array<{
    type: string;
    priority: 'high' | 'medium' | 'low';
    message: string;
    action: string;
  }>;
}

export default function SubscriptionHealthAlerts() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const data = await getSubscriptionHealth();
      setHealthData(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch subscription health data');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const badgeClasses = {
      high: 'bg-red-100 text-red-800 hover:bg-red-100',
      medium: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      low: 'bg-blue-100 text-blue-800 hover:bg-blue-100'
    };
    
    return (
      <Badge className={badgeClasses[priority as keyof typeof badgeClasses] || 'bg-gray-100 text-gray-800'}>
        {priority.toUpperCase()}
      </Badge>
    );
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
          <CardTitle>Subscription Health Dashboard</CardTitle>
          <CardDescription>Loading health data...</CardDescription>
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
          <CardTitle>Subscription Health Dashboard</CardTitle>
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

  if (!healthData) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Subscription Health Dashboard</CardTitle>
            <CardDescription>
              Monitor subscription issues and get actionable recommendations
            </CardDescription>
          </div>
          {healthData.summary.total_alerts === 0 ? (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              <CheckCircle className="w-3 h-3 mr-1" />
              All Clear
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {healthData.summary.total_alerts} Alerts
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border-2 ${
            healthData.summary.expiring_count > 0 
              ? 'border-red-200 bg-red-50' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <Clock className={`w-5 h-5 ${
                healthData.summary.expiring_count > 0 ? 'text-red-600' : 'text-gray-400'
              }`} />
              <span className="text-2xl font-bold">
                {healthData.summary.expiring_count}
              </span>
            </div>
            <div className="mt-2 text-sm font-medium">Expiring Soon</div>
            <div className="text-xs text-gray-500">Within 30 days</div>
          </div>

          <div className={`p-4 rounded-lg border-2 ${
            healthData.summary.at_limits_count > 0 
              ? 'border-yellow-200 bg-yellow-50' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <TrendingDown className={`w-5 h-5 ${
                healthData.summary.at_limits_count > 0 ? 'text-yellow-600' : 'text-gray-400'
              }`} />
              <span className="text-2xl font-bold">
                {healthData.summary.at_limits_count}
              </span>
            </div>
            <div className="mt-2 text-sm font-medium">At Usage Limits</div>
            <div className="text-xs text-gray-500">Premium students</div>
          </div>

          <div className={`p-4 rounded-lg border-2 ${
            healthData.summary.inactive_count > 0 
              ? 'border-blue-200 bg-blue-50' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <XCircle className={`w-5 h-5 ${
                healthData.summary.inactive_count > 0 ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <span className="text-2xl font-bold">
                {healthData.summary.inactive_count}
              </span>
            </div>
            <div className="mt-2 text-sm font-medium">Inactive Paid</div>
            <div className="text-xs text-gray-500">No activity in 30 days</div>
          </div>
        </div>

        {/* Recommendations */}
        {healthData.recommendations.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center">
              <Info className="w-4 h-4 mr-2" />
              Recommendations
            </h3>
            {healthData.recommendations.map((rec, index) => (
              <Alert 
                key={index}
                className={
                  rec.priority === 'high' 
                    ? 'border-red-200 bg-red-50' 
                    : rec.priority === 'medium'
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'border-blue-200 bg-blue-50'
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTitle className="text-sm">{rec.message}</AlertTitle>
                      {getPriorityBadge(rec.priority)}
                    </div>
                    <AlertDescription className="text-xs">
                      <strong>Action:</strong> {rec.action}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {/* Detailed Tabs */}
        <Tabs defaultValue="expiring" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="expiring">
              Expiring ({healthData.summary.expiring_count})
            </TabsTrigger>
            <TabsTrigger value="limits">
              At Limits ({healthData.summary.at_limits_count})
            </TabsTrigger>
            <TabsTrigger value="inactive">
              Inactive ({healthData.summary.inactive_count})
            </TabsTrigger>
          </TabsList>

          {/* Expiring Subscriptions */}
          <TabsContent value="expiring" className="space-y-3">
            {healthData.expiring_subscriptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>No expiring subscriptions in the next 30 days</p>
              </div>
            ) : (
              <div className="space-y-2">
                {healthData.expiring_subscriptions.map((student, index) => (
                  <Alert 
                    key={index}
                    variant={student.severity === 'error' ? 'destructive' : 'default'}
                    className={student.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' : ''}
                  >
                    <Clock className="h-4 w-4" />
                    <div className="flex-1">
                      <AlertTitle className="text-sm font-medium">
                        {student.student_name}
                      </AlertTitle>
                      <AlertDescription className="text-xs space-y-1">
                        <div>{student.student_email}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {getSubscriptionBadge(student.subscription_type)}
                          <Badge className={
                            student.days_remaining <= 7
                              ? 'bg-red-100 text-red-800 hover:bg-red-100'
                              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                          }>
                            {student.days_remaining} days left
                          </Badge>
                          <span className="text-gray-500">
                            Expires: {new Date(student.expiry_date).toLocaleDateString()}
                          </span>
                        </div>
                      </AlertDescription>
                    </div>
                  </Alert>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Students at Limits */}
          <TabsContent value="limits" className="space-y-3">
            {healthData.students_at_limits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>No students hitting usage limits</p>
              </div>
            ) : (
              <div className="space-y-2">
                {healthData.students_at_limits.map((student, index) => (
                  <Alert key={index} className="border-yellow-500 bg-yellow-50">
                    <TrendingDown className="h-4 w-4 text-yellow-600" />
                    <div className="flex-1">
                      <AlertTitle className="text-sm font-medium">
                        {student.student_name}
                      </AlertTitle>
                      <AlertDescription className="text-xs space-y-1">
                        <div>{student.student_email}</div>
                        <div className="mt-2">
                          <strong>Limits Hit:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {student.limits_hit.map((limit, idx) => (
                              <Badge key={idx} className="bg-red-100 text-red-800 hover:bg-red-100">
                                {limit}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </AlertDescription>
                    </div>
                  </Alert>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Inactive Subscriptions */}
          <TabsContent value="inactive" className="space-y-3">
            {healthData.inactive_subscriptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>All paid subscriptions are active</p>
              </div>
            ) : (
              <div className="space-y-2">
                {healthData.inactive_subscriptions.map((student, index) => (
                  <Alert key={index} className="border-blue-500 bg-blue-50">
                    <XCircle className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <AlertTitle className="text-sm font-medium">
                        {student.student_name}
                      </AlertTitle>
                      <AlertDescription className="text-xs space-y-1">
                        <div>{student.student_email}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {getSubscriptionBadge(student.subscription_type)}
                          {student.days_inactive !== null && (
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                              Inactive for {student.days_inactive} days
                            </Badge>
                          )}
                        </div>
                        {student.last_active && (
                          <div className="text-gray-500">
                            Last active: {new Date(student.last_active).toLocaleDateString()}
                          </div>
                        )}
                      </AlertDescription>
                    </div>
                  </Alert>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
