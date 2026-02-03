'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Users, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getAdminCollegeLicenses } from '@/lib/api';

interface CollegeLicense {
  college_id: number;
  college_name: string;
  total_students: number;
  active_students: number;
  premium_students: number;
  college_license_students: number;
  license_limit: number | null;
  license_expiry: string | null;
  utilization_rate: number;
  days_until_expiry: number | null;
  status: string;
  revenue_potential: number;
}

export default function AdminCollegeLicensesCard() {
  const [licenses, setLicenses] = useState<CollegeLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'expiring' | 'inactive'>('all');

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const data = await getAdminCollegeLicenses();
      setLicenses(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch college licenses');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredLicenses = () => {
    switch (filter) {
      case 'active':
        return licenses.filter(l => l.status === 'active');
      case 'expiring':
        return licenses.filter(l => l.status === 'expiring_soon');
      case 'inactive':
        return licenses.filter(l => l.status === 'inactive' || l.status === 'no_license');
      default:
        return licenses;
    }
  };

  const getStatusBadge = (license: CollegeLicense) => {
    switch (license.status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'expiring_soon':
        return <Badge className="bg-yellow-500">Expiring Soon</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'inactive':
        return <Badge variant="outline">Inactive</Badge>;
      default:
        return <Badge variant="secondary">No License</Badge>;
    }
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return 'text-red-600 bg-red-50';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>College License Management</CardTitle>
          <CardDescription>Loading college licenses...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>College License Management</CardTitle>
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

  if (!Array.isArray(licenses)) {
    return null;
  }

  const filteredLicenses = getFilteredLicenses();
  const expiringCount = licenses.filter(l => l.status === 'expiring_soon').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>College License Management</CardTitle>
        <CardDescription>
          Monitoring {licenses.length} college{licenses.length !== 1 ? 's' : ''} and their licensing status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alert for expiring licenses */}
        {expiringCount > 0 && (
          <Alert className="border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              {expiringCount} college license{expiringCount !== 1 ? 's' : ''} expiring within 30 days
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({licenses.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              filter === 'active'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active ({licenses.filter(l => l.status === 'active').length})
          </button>
          <button
            onClick={() => setFilter('expiring')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              filter === 'expiring'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Expiring ({licenses.filter(l => l.status === 'expiring_soon').length})
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              filter === 'inactive'
                ? 'bg-gray-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Inactive ({licenses.filter(l => l.status === 'inactive' || l.status === 'no_license').length})
          </button>
        </div>

        {/* College Cards */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredLicenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No colleges found in this category
            </div>
          ) : (
            filteredLicenses.map((license) => (
              <div
                key={license.college_id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-lg">{license.college_name}</h3>
                  </div>
                  {getStatusBadge(license)}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="text-sm">
                    <div className="text-gray-500">Total Students</div>
                    <div className="text-xl font-bold text-blue-600">
                      {license.total_students}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-500">Active Students</div>
                    <div className="text-xl font-bold text-green-600">
                      {license.active_students}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-500">License Limit</div>
                    <div className="text-xl font-bold text-purple-600">
                      {license.license_limit || 'N/A'}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-500">Utilization</div>
                    <div className={`text-xl font-bold px-2 py-1 rounded ${getUtilizationColor(license.utilization_rate)}`}>
                      {license.utilization_rate}%
                    </div>
                  </div>
                </div>

                {/* Subscription Details */}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    {license.premium_students} Premium
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    {license.college_license_students} College License
                  </span>
                </div>

                {/* Expiry & Revenue */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    {license.license_expiry ? (
                      <>
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className={license.days_until_expiry && license.days_until_expiry <= 30 ? 'text-yellow-600 font-medium' : 'text-gray-600'}>
                          {license.days_until_expiry !== null
                            ? `${license.days_until_expiry} days remaining`
                            : `Expires ${new Date(license.license_expiry).toLocaleDateString()}`
                          }
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-400">No license expiry</span>
                    )}
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Revenue: </span>
                    <span className="font-semibold text-green-600">
                      ₹{license.revenue_potential.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
