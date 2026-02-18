'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { getCollegeLicenseOverview } from '@/lib/api';

interface LicenseOverview {
  license_type: string;
  license_expiry: string | null;
  days_remaining: number | null;
  is_active: boolean;
  total_students_allowed: number;
  current_students: number;
  utilization_rate: number;
  capacity_status: 'healthy' | 'near_capacity' | 'at_capacity';
  students_breakdown: {
    active: number;
    inactive: number;
  };
  warnings: Array<{
    type: string;
    severity: 'error' | 'warning';
    message: string;
  }>;
}

export default function CollegeLicenseOverviewCard() {
  const [licenseData, setLicenseData] = useState<LicenseOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLicenseOverview();
  }, []);

  const fetchLicenseOverview = async () => {
    try {
      setLoading(true);
      const data = await getCollegeLicenseOverview();
      setLicenseData(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch license overview');
    } finally {
      setLoading(false);
    }
  };

  const getCapacityColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'near_capacity':
        return 'bg-yellow-500';
      case 'at_capacity':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
        <XCircle className="w-3 h-3 mr-1" />
        Expired
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>College License Overview</CardTitle>
          <CardDescription>Loading license information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>College License Overview</CardTitle>
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

  if (!licenseData) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>College License Overview</CardTitle>
            <CardDescription>Monitor your license status and student capacity</CardDescription>
          </div>
          {getStatusBadge(licenseData.is_active)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Warnings Section */}
        {licenseData.warnings.length > 0 && (
          <div className="space-y-2">
            {licenseData.warnings.map((warning, index) => (
              <Alert 
                key={index} 
                variant={warning.severity === 'error' ? 'destructive' : 'default'}
                className={warning.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' : ''}
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{warning.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* License Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              License Type
            </div>
            <div className="text-2xl font-bold capitalize">{licenseData.license_type}</div>
          </div>
          
          {licenseData.license_expiry && (
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                License Expiry
              </div>
              <div className="text-2xl font-bold">
                {licenseData.days_remaining !== null && licenseData.days_remaining >= 0
                  ? `${licenseData.days_remaining} days`
                  : 'Expired'}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(licenseData.license_expiry).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          )}
        </div>

        {/* Student Capacity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm font-medium">
              <Users className="w-4 h-4 mr-2" />
              Student Capacity
            </div>
            <Badge 
              className={`${
                licenseData.capacity_status === 'healthy' 
                  ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                  : licenseData.capacity_status === 'near_capacity'
                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                  : 'bg-red-100 text-red-800 hover:bg-red-100'
              }`}
            >
              {licenseData.capacity_status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {licenseData.current_students} / {licenseData.total_students_allowed} students
              </span>
              <span className="font-medium">{licenseData.utilization_rate}%</span>
            </div>
            <Progress 
              value={licenseData.utilization_rate} 
              className="h-3"
            />
          </div>
        </div>

        {/* Student Breakdown */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <div className="text-sm text-gray-600">Active Students</div>
            <div className="text-2xl font-bold text-green-600">
              {licenseData.students_breakdown.active}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-gray-600">Inactive Students</div>
            <div className="text-2xl font-bold text-gray-600">
              {licenseData.students_breakdown.inactive}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
