"use client"

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import ExcelAssessmentList from '@/components/excel-assessment/ExcelAssessmentList'

export default function ExcelAssessmentPage() {
  return (
    <DashboardLayout requiredUserType="student">
      <div className="p-6">
        <ExcelAssessmentList />
      </div>
    </DashboardLayout>
  )
}
