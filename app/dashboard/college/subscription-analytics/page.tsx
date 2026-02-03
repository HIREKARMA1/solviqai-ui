"use client"

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import CollegeLicenseOverviewCard from '@/components/subscription/CollegeLicenseOverviewCard'
import StudentSubscriptionDistribution from '@/components/subscription/StudentSubscriptionDistribution'
import SubscriptionHealthAlerts from '@/components/subscription/SubscriptionHealthAlerts'

export default function CollegeSubscriptionAnalytics() {
  return (
    <DashboardLayout requiredUserType="college">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Subscription Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor your college license, student subscriptions, and subscription health
          </p>
        </div>

        {/* License Overview */}
        <CollegeLicenseOverviewCard />

        {/* Student Distribution */}
        <StudentSubscriptionDistribution />

        {/* Subscription Health */}
        <SubscriptionHealthAlerts />

        {/* Help Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-100">
            Need Help?
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
            Contact HireKarma support to manage your license, upgrade capacity, or renew subscriptions.
          </p>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Contact Support
            </button>
            <button className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition">
              Upgrade License
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
