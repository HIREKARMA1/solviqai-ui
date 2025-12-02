"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import { FileSpreadsheet, Clock, CheckCircle, XCircle, ArrowRight, Trophy, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface ExcelAssessment {
  id: string
  title: string
  description: string
  status: string
  total_score: number
  max_possible_score: number
  percentage_score: number
  created_at: string
  submitted_at: string | null
  total_time_minutes: number | null
  question_ids: string[]
}

export default function ExcelAssessmentList() {
  const [assessments, setAssessments] = useState<ExcelAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchAssessments()
  }, [])

  const fetchAssessments = async () => {
    try {
      const data = await apiClient.excelAssessment.getAssessments()
      setAssessments(data)
    } catch (error) {
      console.error('Error fetching assessments:', error)
    } finally {
      setLoading(false)
    }
  }

  const createNewAssessment = async () => {
    setCreating(true)
    try {
      const newAssessment = await apiClient.excelAssessment.createAssessment({
        title: 'Accountant Assessment',
        description: 'Test your Excel skills with practical accounting scenarios',
        num_questions: 1,
        difficulty_level: 'intermediate'
      })
      
      // Redirect to the new assessment
      window.location.href = `/dashboard/student/excel-assessment/${newAssessment.id}`
    } catch (error) {
      console.error('Error creating assessment:', error)
      setCreating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
      not_started: { label: 'Not Started', color: 'bg-gray-500', icon: Clock },
      in_progress: { label: 'In Progress', color: 'bg-blue-500', icon: Clock },
      submitted: { label: 'Submitted', color: 'bg-yellow-500', icon: CheckCircle },
      evaluated: { label: 'Evaluated', color: 'bg-green-500', icon: Trophy }
    }

    const config = statusConfig[status] || statusConfig.not_started
    const Icon = config.icon

    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const getScoreBadge = (percentage: number) => {
    let color = 'bg-red-500'
    if (percentage >= 80) color = 'bg-green-500'
    else if (percentage >= 60) color = 'bg-yellow-500'
    else if (percentage >= 40) color = 'bg-orange-500'

    return (
      <Badge className={`${color} text-white`}>
        {percentage.toFixed(1)}%
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-green-600" />
            Accountant Assessments
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Test your Excel skills with AI-generated accounting scenarios
          </p>
        </div>
        <Button 
          onClick={createNewAssessment} 
          disabled={creating}
          size="lg"
          className="bg-green-600 hover:bg-green-700"
        >
          {creating ? (
            <>
              <Loader size="sm" className="mr-2" />
              Creating...
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-5 h-5 mr-2" />
              New Assessment
            </>
          )}
        </Button>
      </div>

      {/* Assessment Grid */}
      {assessments.length === 0 ? (
        <Card className="p-12 text-center">
          <FileSpreadsheet className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Assessments Yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start your first Accountant assessment to test your accounting skills
          </p>
          <Button onClick={createNewAssessment} disabled={creating} className="bg-green-600 hover:bg-green-700">
            Create Your First Assessment
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map((assessment, index) => (
            <motion.div
              key={assessment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                    {getStatusBadge(assessment.status)}
                  </div>
                  <CardTitle className="text-xl">{assessment.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {assessment.description || 'Accountant assessment for accounting professionals'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Questions</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {assessment.question_ids?.length || 0}
                      </div>
                    </div>
                    {assessment.status === 'evaluated' && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Score</div>
                        <div className="text-2xl font-bold text-green-600">
                          {assessment.percentage_score.toFixed(0)}%
                        </div>
                      </div>
                    )}
                    {assessment.total_time_minutes && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Time</div>
                        <div className="text-lg font-bold text-purple-600 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {assessment.total_time_minutes}m
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Link href={
                    assessment.status === 'evaluated' 
                      ? `/dashboard/student/excel-assessment/${assessment.id}/report`
                      : `/dashboard/student/excel-assessment/${assessment.id}`
                  }>
                    <Button className="w-full group" variant={assessment.status === 'evaluated' ? 'outline' : 'default'}>
                      {assessment.status === 'not_started' && 'Start Assessment'}
                      {assessment.status === 'in_progress' && 'Continue Assessment'}
                      {assessment.status === 'evaluated' && 'View Report'}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>

                  {/* Date */}
                  <div className="text-xs text-gray-500 text-center">
                    Created {new Date(assessment.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
