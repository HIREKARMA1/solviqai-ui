import ExcelAssessmentReport from '@/components/excel-assessment/ExcelAssessmentReport'

export default function ReportPage({ params }: { params: { id: string; reportId: string } }) {
  return <ExcelAssessmentReport assessmentId={params.id} />
}
