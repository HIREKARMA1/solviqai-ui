"use client"

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import ExcelAssessmentDetail from '@/components/excel-assessment/ExcelAssessmentDetail'

export default function ExcelAssessmentDetailPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout requiredUserType="student">
      <div className="p-6">
        <ExcelAssessmentDetail assessmentId={params.id} />
      </div>
    </DashboardLayout>
  )
}
