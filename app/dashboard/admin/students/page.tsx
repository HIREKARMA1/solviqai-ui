"use client"

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader } from '@/components/ui/loader'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'
import { Home, Users, Building2, BarChart3, Plus, Search, UserX, Trash2, Pencil, FileText, Eye, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminStudents() {
    const [students, setStudents] = useState<any[]>([])
    const [colleges, setColleges] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterCollege, setFilterCollege] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        degree: '',
        branch: '',
        graduation_year: '',
        institution: '',
        college_id: '',
    })
    const [creating, setCreating] = useState(false)
    const [expandedStudent, setExpandedStudent] = useState<string | null>(null)
    const [studentAssessments, setStudentAssessments] = useState<Record<string, any>>({})
    const [loadingAssessments, setLoadingAssessments] = useState<string | null>(null)
    const [selectedReport, setSelectedReport] = useState<any>(null)
    const [showReportModal, setShowReportModal] = useState(false)
    const [loadingReport, setLoadingReport] = useState(false)

    useEffect(() => {
        fetchData()
    }, [filterCollege])

    const fetchData = async () => {
        setLoading(true)
        try {
            const params: any = {}
            if (filterCollege) params.college_id = filterCollege

            const [studentsData, collegesData] = await Promise.all([
                apiClient.getStudents(params),
                apiClient.getColleges(),
            ])

            setStudents(studentsData.students || [])
            setColleges(collegesData.colleges || [])
        } catch (error: any) {
            console.error('Error fetching data:', error)
            const errorDetail = error.response?.data?.detail
            let errorMessage = 'Failed to load data'
            
            if (typeof errorDetail === 'string') {
                errorMessage = errorDetail
            } else if (Array.isArray(errorDetail)) {
                errorMessage = errorDetail.map((err: any) => err.msg || JSON.stringify(err)).join(', ')
            } else if (typeof errorDetail === 'object' && errorDetail !== null) {
                errorMessage = errorDetail.msg || JSON.stringify(errorDetail)
            }
            
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateStudent = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)

        try {
            const response = await apiClient.createStudent({
                ...formData,
                graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
                college_id: formData.college_id || null,
            })

            toast.success(`Student created! Temporary password: ${response.temporary_password}`)
            setShowCreateModal(false)
            setFormData({
                name: '',
                email: '',
                phone: '',
                degree: '',
                branch: '',
                graduation_year: '',
                institution: '',
                college_id: '',
            })
            fetchData()
        } catch (error: any) {
            console.error('Error creating student:', error)
            const errorDetail = error.response?.data?.detail
            let errorMessage = 'Failed to create student'
            
            if (typeof errorDetail === 'string') {
                errorMessage = errorDetail
            } else if (Array.isArray(errorDetail)) {
                errorMessage = errorDetail.map((err: any) => err.msg || JSON.stringify(err)).join(', ')
            } else if (typeof errorDetail === 'object' && errorDetail !== null) {
                errorMessage = errorDetail.msg || JSON.stringify(errorDetail)
            }
            
            toast.error(errorMessage)
        } finally {
            setCreating(false)
        }
    }

    const handleDeactivateStudent = async (studentId: string, studentName: string) => {
        if (!confirm(`Are you sure you want to mark "${studentName}" as inactive?\n\nThis will:\n- Keep the student data in the system\n- Change status to INACTIVE\n- Student can be reactivated later`)) {
            return
        }

        try {
            await apiClient.deactivateStudent(studentId)
            toast.success('Student marked as inactive successfully!')
            fetchData()
        } catch (error: any) {
            console.error('Error deactivating student:', error)
            const errorDetail = error.response?.data?.detail
            let errorMessage = 'Failed to deactivate student'
            
            if (typeof errorDetail === 'string') {
                errorMessage = errorDetail
            } else if (Array.isArray(errorDetail)) {
                errorMessage = errorDetail.map((err: any) => err.msg || JSON.stringify(err)).join(', ')
            } else if (typeof errorDetail === 'object' && errorDetail !== null) {
                errorMessage = errorDetail.msg || JSON.stringify(errorDetail)
            }
            
            toast.error(errorMessage)
        }
    }

    const handleActivateStudent = async (studentId: string, studentName: string) => {
        if (!confirm(`Are you sure you want to activate "${studentName}"?\n\nThis will:\n- Mark the student as ACTIVE\n- Allow student to access their account\n- Re-enable all student features`)) {
            return
        }

        try {
            await apiClient.activateStudent(studentId)
            toast.success('Student activated successfully!')
            fetchData()
        } catch (error: any) {
            console.error('Error activating student:', error)
            const errorDetail = error.response?.data?.detail
            let errorMessage = 'Failed to activate student'
            
            if (typeof errorDetail === 'string') {
                errorMessage = errorDetail
            } else if (Array.isArray(errorDetail)) {
                errorMessage = errorDetail.map((err: any) => err.msg || JSON.stringify(err)).join(', ')
            } else if (typeof errorDetail === 'object' && errorDetail !== null) {
                errorMessage = errorDetail.msg || JSON.stringify(errorDetail)
            }
            
            toast.error(errorMessage)
        }
    }

    const handleDeleteStudent = async (studentId: string, studentName: string) => {
        if (!confirm(`⚠️ PERMANENT DELETE WARNING ⚠️\n\nAre you sure you want to PERMANENTLY delete "${studentName}"?\n\nThis will:\n- Remove ALL student data from the database\n- Delete ALL associated records (assessments, reports, etc.)\n- CANNOT be undone\n\nType 'DELETE' to confirm this action.`)) {
            return
        }

        // Additional confirmation for permanent delete
        const confirmText = prompt('Type DELETE (in capital letters) to confirm permanent deletion:')
        if (confirmText !== 'DELETE') {
            toast.error('Deletion cancelled - confirmation text did not match')
            return
        }

        try {
            await apiClient.deleteStudent(studentId)
            toast.success('Student permanently deleted!')
            fetchData()
        } catch (error: any) {
            console.error('Error deleting student:', error)
            const errorDetail = error.response?.data?.detail
            let errorMessage = 'Failed to delete student'
            
            if (typeof errorDetail === 'string') {
                errorMessage = errorDetail
            } else if (Array.isArray(errorDetail)) {
                errorMessage = errorDetail.map((err: any) => err.msg || JSON.stringify(err)).join(', ')
            } else if (typeof errorDetail === 'object' && errorDetail !== null) {
                errorMessage = errorDetail.msg || JSON.stringify(errorDetail)
            }
            
            toast.error(errorMessage)
        }
    }

    const toggleStudentExpansion = async (studentId: string) => {
        if (expandedStudent === studentId) {
            setExpandedStudent(null)
        } else {
            setExpandedStudent(studentId)
            
            // Load assessments if not already loaded
            if (!studentAssessments[studentId]) {
                setLoadingAssessments(studentId)
                try {
                    const data = await apiClient.getStudentAssessmentsAdmin(studentId)
                    setStudentAssessments(prev => ({
                        ...prev,
                        [studentId]: data.assessments || []
                    }))
                } catch (error: any) {
                    console.error('Error loading assessments:', error)
                    toast.error('Failed to load student assessments')
                } finally {
                    setLoadingAssessments(null)
                }
            }
        }
    }

    const handleViewReport = async (studentId: string, assessmentId: string) => {
        setLoadingReport(true)
        setShowReportModal(true)
        try {
            const data = await apiClient.getStudentAssessmentReportAdmin(studentId, assessmentId, true)
            setSelectedReport(data)
        } catch (error: any) {
            console.error('Error loading report:', error)
            toast.error('Failed to load assessment report')
            setShowReportModal(false)
        } finally {
            setLoadingReport(false)
        }
    }

    const filteredStudents = students.filter(student =>
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <DashboardLayout requiredUserType="admin">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Students</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage student accounts</p>
                    </div>
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Student
                    </Button>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search students..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {/* College Filter */}
                            <div>
                                <select
                                    value={filterCollege}
                                    onChange={(e) => setFilterCollege(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                                >
                                    <option value="">All Colleges</option>
                                    {colleges.map((college) => (
                                        <option key={college.id} value={college.id}>
                                            {college.college_name || college.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Students List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader size="lg" />
                    </div>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>All Students ({filteredStudents.length})</CardTitle>
                            <CardDescription>View and manage student accounts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {filteredStudents.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No students found</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredStudents.map((student) => (
                                        <div
                                            key={student.id}
                                            className="border rounded-lg overflow-hidden"
                                        >
                                            {/* Student Header */}
                                            <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                                                <div className="flex-1">
                                                    <h3 className="font-medium">{student.name}</h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{student.email}</p>
                                                    {student.phone && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">{student.phone}</p>
                                                    )}
                                                    <div className="flex gap-4 mt-2">
                                                        {student.degree && (
                                                            <span className="text-xs text-gray-500">
                                                                {student.degree}
                                                                {student.branch && ` - ${student.branch}`}
                                                            </span>
                                                        )}
                                                        {student.graduation_year && (
                                                            <span className="text-xs text-gray-500">
                                                                Grad: {student.graduation_year}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-4 mt-1">
                                                        {student.college_name && (
                                                            <Badge variant="outline" className="text-xs">
                                                                <Building2 className="h-3 w-3 mr-1" />
                                                                {student.college_name}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <Badge variant={student.status === 'ACTIVE' ? 'success' : 'secondary'}>
                                                        {student.status}
                                                    </Badge>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => toggleStudentExpansion(student.id)}
                                                            title="View assessments"
                                                        >
                                                            <FileText className="h-4 w-4 mr-1" />
                                                            Assessments
                                                            {expandedStudent === student.id ? (
                                                                <ChevronUp className="h-4 w-4 ml-1" />
                                                            ) : (
                                                                <ChevronDown className="h-4 w-4 ml-1" />
                                                            )}
                                                        </Button>
                                                        {student.status === 'ACTIVE' ? (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleDeactivateStudent(student.id, student.name)}
                                                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                                title="Mark student as inactive"
                                                            >
                                                                <UserX className="h-4 w-4 mr-1" />
                                                                Deactivate
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleActivateStudent(student.id, student.name)}
                                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                title="Activate student"
                                                            >
                                                                <Users className="h-4 w-4 mr-1" />
                                                                Activate
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDeleteStudent(student.id, student.name)}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            title="Permanently delete student"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-1" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expanded Assessments Section */}
                                            {expandedStudent === student.id && (
                                                <div className="border-t bg-gray-50 dark:bg-gray-900 p-4">
                                                    {loadingAssessments === student.id ? (
                                                        <div className="flex justify-center py-4">
                                                            <Loader size="sm" />
                                                        </div>
                                                    ) : studentAssessments[student.id]?.length > 0 ? (
                                                        <div className="space-y-3">
                                                            <h4 className="font-medium text-sm">Assessment History</h4>
                                                            {studentAssessments[student.id].map((assessment: any) => (
                                                                <div
                                                                    key={assessment.id}
                                                                    className="bg-white dark:bg-gray-800 p-3 rounded border"
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex-1">
                                                                            <p className="font-medium text-sm">
                                                                                {assessment.job_role.title}
                                                                            </p>
                                                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                                {assessment.job_role.category}
                                                                            </p>
                                                                            <div className="flex gap-3 mt-2">
                                                                                <Badge variant={assessment.status === 'COMPLETED' ? 'success' : 'secondary'} className="text-xs">
                                                                                    {assessment.status}
                                                                                </Badge>
                                                                                {assessment.overall_score !== null && (
                                                                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                                                                        Score: {assessment.overall_score?.toFixed(1)}%
                                                                                    </span>
                                                                                )}
                                                                                {assessment.readiness_index !== null && (
                                                                                    <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                                                                        Readiness: {assessment.readiness_index?.toFixed(1)}%
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-xs text-gray-500 mt-1">
                                                                                {assessment.completed_at 
                                                                                    ? `Completed: ${new Date(assessment.completed_at).toLocaleDateString()}`
                                                                                    : `Started: ${new Date(assessment.created_at).toLocaleDateString()}`
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                        {assessment.status === 'COMPLETED' && (
                                                                            <Button
                                                                                size="sm"
                                                                                onClick={() => handleViewReport(student.id, assessment.id)}
                                                                                className="ml-3"
                                                                            >
                                                                                <Eye className="h-4 w-4 mr-1" />
                                                                                View Report
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-4 text-gray-500 text-sm">
                                                            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                            <p>No assessments found for this student</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Report Modal */}
                {showReportModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Student Assessment Report</CardTitle>
                                        {selectedReport?.student_info && (
                                            <CardDescription>
                                                {selectedReport.student_info.name} ({selectedReport.student_info.email})
                                            </CardDescription>
                                        )}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setShowReportModal(false)
                                            setSelectedReport(null)
                                        }}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loadingReport ? (
                                    <div className="flex justify-center py-12">
                                        <Loader size="lg" />
                                    </div>
                                ) : selectedReport ? (
                                    <div className="space-y-6">
                                        {/* Student Info */}
                                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                                            <h3 className="font-semibold mb-2">Student Information</h3>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">Name:</span>{' '}
                                                    <span className="font-medium">{selectedReport.student_info.name}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">Email:</span>{' '}
                                                    <span className="font-medium">{selectedReport.student_info.email}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">Degree:</span>{' '}
                                                    <span className="font-medium">{selectedReport.student_info.degree}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">Branch:</span>{' '}
                                                    <span className="font-medium">{selectedReport.student_info.branch}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Job Role */}
                                        <div>
                                            <h3 className="font-semibold mb-2">Job Role</h3>
                                            <Badge variant="outline" className="text-sm">
                                                {selectedReport.job_role.title} - {selectedReport.job_role.category}
                                            </Badge>
                                        </div>

                                        {/* Overall Performance */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <Card>
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-sm">Overall Score</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                                        {selectedReport.overall_score?.toFixed(1) || 0}%
                                                    </p>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-sm">Readiness Index</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                                        {selectedReport.readiness_index?.toFixed(1) || 0}%
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Round Performance */}
                                        <div>
                                            <h3 className="font-semibold mb-3">Round-wise Performance</h3>
                                            <div className="space-y-2">
                                                {selectedReport.rounds?.map((round: any, index: number) => (
                                                    <div key={index} className="border rounded-lg p-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-medium text-sm">
                                                                Round {round.round_number}: {round.round_type}
                                                            </span>
                                                            <Badge variant={round.percentage >= 70 ? 'success' : round.percentage >= 50 ? 'default' : 'secondary'}>
                                                                {round.percentage?.toFixed(1)}%
                                                            </Badge>
                                                        </div>
                                                        {round.ai_feedback && (
                                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                {typeof round.ai_feedback === 'string' 
                                                                    ? round.ai_feedback 
                                                                    : JSON.stringify(round.ai_feedback)}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* AI Feedback */}
                                        {selectedReport.ai_feedback && (
                                            <div>
                                                <h3 className="font-semibold mb-2">AI Analysis</h3>
                                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm">
                                                    {typeof selectedReport.ai_feedback === 'string' ? (
                                                        <p className="whitespace-pre-wrap">{selectedReport.ai_feedback}</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {selectedReport.ai_feedback.overall_performance && (
                                                                <div>
                                                                    <p className="font-medium mb-1">Overall Performance:</p>
                                                                    <p>{selectedReport.ai_feedback.overall_performance}</p>
                                                                </div>
                                                            )}
                                                            {selectedReport.ai_feedback.readiness_level && (
                                                                <div>
                                                                    <p className="font-medium mb-1">Readiness Level:</p>
                                                                    <p>{selectedReport.ai_feedback.readiness_level}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Detailed Analysis */}
                                        {selectedReport.detailed_analysis && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {selectedReport.detailed_analysis.strengths && (
                                                    <Card>
                                                        <CardHeader className="pb-3">
                                                            <CardTitle className="text-sm text-green-600 dark:text-green-400">Strengths</CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <p className="text-xs text-gray-700 dark:text-gray-300">
                                                                {selectedReport.detailed_analysis.strengths}
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                )}
                                                {selectedReport.detailed_analysis.weaknesses && (
                                                    <Card>
                                                        <CardHeader className="pb-3">
                                                            <CardTitle className="text-sm text-orange-600 dark:text-orange-400">Areas for Improvement</CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <p className="text-xs text-gray-700 dark:text-gray-300">
                                                                {selectedReport.detailed_analysis.weaknesses}
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                )}
                                                {selectedReport.detailed_analysis.recommendations && (
                                                    <Card>
                                                        <CardHeader className="pb-3">
                                                            <CardTitle className="text-sm text-blue-600 dark:text-blue-400">Recommendations</CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <p className="text-xs text-gray-700 dark:text-gray-300">
                                                                {selectedReport.detailed_analysis.recommendations}
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                )}
                                            </div>
                                        )}

                                        {/* Completion Date */}
                                        {selectedReport.completed_at && (
                                            <p className="text-sm text-gray-500 text-center">
                                                Completed on {new Date(selectedReport.completed_at).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        <p>No report data available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <CardHeader>
                                <CardTitle>Create Student Account</CardTitle>
                                <CardDescription>Add a new student to the platform</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreateStudent} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                Full Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                Email <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                required
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="student@example.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Phone</label>
                                            <Input
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="+919876543210"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Degree</label>
                                            <Input
                                                value={formData.degree}
                                                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                                                placeholder="B.Tech"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Branch</label>
                                            <Input
                                                value={formData.branch}
                                                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                                placeholder="Computer Science"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Graduation Year</label>
                                            <Input
                                                type="number"
                                                value={formData.graduation_year}
                                                onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
                                                placeholder="2025"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Institution</label>
                                            <Input
                                                value={formData.institution}
                                                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                                                placeholder="Institution Name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                College <span className="text-blue-500">(Optional)</span>
                                            </label>
                                            <select
                                                value={formData.college_id}
                                                onChange={(e) => setFormData({ ...formData, college_id: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                                            >
                                                <option value="">Select College (Optional)</option>
                                                {colleges.map((college) => (
                                                    <option key={college.id} value={college.id}>
                                                        {college.college_name || college.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                        <p className="text-sm text-blue-600 dark:text-blue-400">
                                            <strong>Note:</strong> You can assign a student to a college to help organize students and track their institutions.
                                        </p>
                                    </div>

                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setShowCreateModal(false)}
                                            disabled={creating}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={creating}>
                                            {creating ? 'Creating...' : 'Create Student'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
