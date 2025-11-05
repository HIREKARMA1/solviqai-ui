// app/dashboard/student/resume/page.tsx
"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import { 
    Upload, 
    FileText, 
    CheckCircle, 
    AlertCircle, 
    X,
    BarChart,
    TrendingUp,
    Download,
    RefreshCw,
    Zap,
    BarChart3,
    Home,
    User,
    Briefcase
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Textarea } from '@/components/ui/textarea'
import { AxiosError } from 'axios'

const sidebarItems = [
    { name: 'Dashboard', href: '/dashboard/student', icon: Home },
    { name: 'Profile', href: '/dashboard/student/profile', icon: User },
    { name: 'Resume', href: '/dashboard/student/resume', icon: FileText },
    { name: 'Job Recommendations', href: '/dashboard/student/jobs', icon: Briefcase },
    { name: 'Auto Job Apply', href: '/dashboard/student/auto-apply', icon: Zap },
    { name: 'Analytics', href: '/dashboard/student/analytics', icon: BarChart3 },
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc']

interface ATSScore {
    ats_score: number
    overall_assessment: string
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
    keyword_analysis?: {
        found_keywords: string[]
        missing_keywords: string[]
    }
    sections_analysis?: Record<string, string>
    formatting_score?: number
    content_score?: number
    keyword_score?: number
}

interface ResumeStatus {
    has_resume: boolean
    resume_uploaded: boolean
    resume_filename?: string
    resume_path?: string
    uploaded_at?: string
    can_upload: boolean
    can_calculate_ats: boolean
}

export default function ResumePage() {
    const [file, setFile] = useState<File | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadSuccess, setUploadSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [dragActive, setDragActive] = useState(false)
    
    // ATS Score states
    const [atsScore, setAtsScore] = useState<ATSScore | null>(null)
    const [isCalculatingATS, setIsCalculatingATS] = useState(false)
    const [jobDescription, setJobDescription] = useState('')
    
    // ✅ NEW: Resume status
    const [resumeStatus, setResumeStatus] = useState<ResumeStatus | null>(null)
    const [loadingStatus, setLoadingStatus] = useState(true)
    const [showUploadSection, setShowUploadSection] = useState(false)
    
    const fileInputRef = useRef<HTMLInputElement>(null)

    // ✅ NEW: Fetch resume status on mount
    useEffect(() => {
        fetchResumeStatus()
    }, [])

    // ✅ NEW: Fetch existing resume status
    const fetchResumeStatus = async () => {
        try {
            const status = await apiClient.getResumeStatus()
            setResumeStatus(status)
            
            // If no resume exists, show upload section
            if (!status.data.has_resume) {
                setShowUploadSection(true)
            }
        } catch (error) {
            console.error('Error fetching resume status:', error)
        } finally {
            setLoadingStatus(false)
        }
    }

    // Validate file
    const validateFile = (file: File): string | null => {
        if (file.size > MAX_FILE_SIZE) {
            return `File size exceeds 5MB limit. Your file: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
        }
        
        const extension = file.name.split('.').pop()?.toLowerCase()
        if (!extension || !ALLOWED_EXTENSIONS.includes(`.${extension}`)) {
            return 'Only PDF and DOCX files are allowed'
        }
        
        if (!ALLOWED_TYPES.includes(file.type) && file.type !== '') {
            return 'Invalid file type. Only PDF and DOCX files are supported'
        }
        
        return null
    }

    const handleFileSelect = (selectedFile: File) => {
        const validationError = validateFile(selectedFile)
        
        if (validationError) {
            setError(validationError)
            return
        }
        
        setFile(selectedFile)
        setError(null)
        setUploadSuccess(false)
        setUploadProgress(0)
        setAtsScore(null)
    }

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0])
        }
    }, [])

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0])
        }
    }

    const handleUpload = async () => {
        if (!file) return
        
        setIsUploading(true)
        setError(null)
        setUploadProgress(0)
        
        try {
            await apiClient.uploadResume(file, (progress) => {
                setUploadProgress(progress)
            })
            
            setUploadSuccess(true)
            setUploadProgress(100)
            
            // ✅ Refresh resume status after upload
            await fetchResumeStatus()
            setShowUploadSection(false)
        } catch (err) {
            const axiosError = err as AxiosError<{ detail: string }>
            setError(
                axiosError.response?.data?.detail || 
                axiosError.message || 
                'Failed to upload resume'
            )
            setUploadProgress(0)
        } finally {
            setIsUploading(false)
        }
    }

    const handleCalculateATS = async () => {
        setIsCalculatingATS(true)
        setError(null)
        
        try {
            const result = await apiClient.getATSScore(jobDescription || undefined)
            setAtsScore(result)
        } catch (err) {
            const axiosError = err as AxiosError<{ detail: string }>
            setError(
                axiosError.response?.data?.detail || 
                axiosError.message || 
                'Failed to calculate ATS score'
            )
        } finally {
            setIsCalculatingATS(false)
        }
    }

    const handleReset = () => {
        setFile(null)
        setUploadProgress(0)
        setUploadSuccess(false)
        setError(null)
        setAtsScore(null)
        setJobDescription('')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 dark:text-green-500'
        if (score >= 60) return 'text-yellow-600 dark:text-yellow-500'
        return 'text-red-600 dark:text-red-500'
    }

    if (loadingStatus) {
        return (
            <DashboardLayout requiredUserType="student">
                <div className="flex justify-center py-12">
                    <Loader size="lg" />
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout requiredUserType="student">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Resume Management</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Upload your resume and get instant ATS score analysis
                    </p>
                </div>

                {/* ✅ NEW: Existing Resume Card */}
                {resumeStatus?.has_resume && !showUploadSection && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-green-950 dark:via-gray-900 dark:to-emerald-950 shadow-lg group">
                            {/* Decorative shapes */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-green-200/30 to-emerald-200/20 blur-3xl group-hover:blur-[40px] transition-all duration-500" />
                            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-gradient-to-tr from-teal-200/25 to-cyan-200/15 blur-3xl group-hover:blur-[40px] transition-all duration-500" />
                            
                            <CardHeader className="relative z-10 border-b border-green-200 dark:border-green-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-md">
                                            <CheckCircle className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl font-bold">Resume Uploaded</CardTitle>
                                            <CardDescription className="mt-1">Your resume is ready for ATS analysis</CardDescription>
                                        </div>
                                    </div>
                                    <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md">
                                        Active
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10 mt-6">
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200/50 dark:border-green-800/50">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-lg">
                                            <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{resumeStatus.resume_filename}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Uploaded {resumeStatus.uploaded_at ? new Date(resumeStatus.uploaded_at).toLocaleDateString() : 'recently'}
                                            </p>
                                        </div>
                                    </div>
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowUploadSection(true)}
                                            className="border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/50"
                                        >
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Replace
                                        </Button>
                                    </motion.div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Upload Card - Show only if no resume or user wants to replace */}
                {(showUploadSection || !resumeStatus?.has_resume) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                    >
                        <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-white via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 shadow-lg group">
                            {/* Decorative shapes */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-200/30 to-indigo-200/20 blur-3xl group-hover:blur-[40px] transition-all duration-500" />
                            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-gradient-to-tr from-cyan-200/25 to-teal-200/15 blur-3xl group-hover:blur-[40px] transition-all duration-500" />
                            
                            <CardHeader className="relative z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 shadow-md">
                                            <Upload className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl font-bold">
                                                {resumeStatus?.has_resume ? 'Replace Resume' : 'Upload Resume'}
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                Upload your resume in PDF or DOCX format (Max 5MB)
                                            </CardDescription>
                                        </div>
                                    </div>
                                    {resumeStatus?.has_resume && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setShowUploadSection(false)
                                                handleReset()
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10 space-y-4">
                                {/* Drag & Drop Zone */}
                                <div
                                    className={`
                                        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                                        transition-colors duration-200
                                        ${dragActive 
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' 
                                            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                                        }
                                        ${file ? 'bg-green-50 dark:bg-green-900/10 border-green-500' : ''}
                                        ${isUploading ? 'pointer-events-none opacity-60' : ''}
                                    `}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={() => !isUploading && fileInputRef.current?.click()}
                                >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleFileInputChange}
                                    className="hidden"
                                    disabled={isUploading}
                                />
                                
                                {!file ? (
                                    <div className="space-y-4">
                                        <Upload className="h-12 w-12 mx-auto text-gray-400" />
                                        <div>
                                            <p className="text-lg font-medium">
                                                Drag and drop your resume here
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                or click to browse files
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            Supported formats: PDF, DOC, DOCX (Max 5MB)
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                                        <div>
                                            <p className="text-lg font-medium flex items-center justify-center gap-2">
                                                <FileText className="h-5 w-5" />
                                                {file.name}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Error Message */}
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* Success Message */}
                            {uploadSuccess && (
                                <Alert className="border-green-500 bg-green-50 dark:bg-green-900/10">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-green-600 dark:text-green-500">
                                        Resume uploaded successfully! You can now calculate your ATS score.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Progress Bar */}
                            {isUploading && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">Uploading...</span>
                                        <span className="font-semibold">{uploadProgress}%</span>
                                    </div>
                                    <Progress value={uploadProgress} className="h-2" />
                                </div>
                            )}

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                                        <Button
                                            onClick={handleUpload}
                                            disabled={!file || isUploading || uploadSuccess}
                                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                                        >
                                            {isUploading ? (
                                                <>
                                                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                                                    Uploading {uploadProgress}%
                                                </>
                                            ) : uploadSuccess ? (
                                                <>
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                    Uploaded
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    {resumeStatus?.has_resume ? 'Replace Resume' : 'Upload Resume'}
                                                </>
                                            )}
                                        </Button>
                                    </motion.div>
                                    
                                    {(file || uploadSuccess) && (
                                        <Button
                                            onClick={handleReset}
                                            variant="outline"
                                            disabled={isUploading}
                                        >
                                            <X className="mr-2 h-4 w-4" />
                                            Clear
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* ATS Score Card - Show if resume exists */}
                {(resumeStatus?.has_resume || uploadSuccess) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-white via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 shadow-lg group">
                            {/* Decorative shapes */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-purple-200/30 to-pink-200/20 blur-3xl group-hover:blur-[40px] transition-all duration-500" />
                            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-200/25 to-purple-200/15 blur-3xl group-hover:blur-[40px] transition-all duration-500" />
                            
                            <CardHeader className="relative z-10 border-b border-purple-200 dark:border-purple-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-md">
                                        <BarChart className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl font-bold">ATS Score Analysis</CardTitle>
                                        <CardDescription className="mt-1">Get detailed ATS score and recommendations powered by AI</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10 mt-6 space-y-6">
                                {/* Job Description (Optional) */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        Job Description (Optional)
                                        <Badge variant="outline" className="text-xs">
                                            Better matching
                                        </Badge>
                                    </label>
                                    <Textarea
                                        placeholder="Paste the job description here to get tailored ATS recommendations and keyword matching..."
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                        rows={4}
                                        disabled={isCalculatingATS}
                                        className="resize-none border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                                    />
                                </div>

                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Button
                                        onClick={handleCalculateATS}
                                        disabled={isCalculatingATS}
                                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                                        size="lg"
                                    >
                                        {isCalculatingATS ? (
                                            <>
                                                <Loader className="mr-2 h-4 w-4 animate-spin" />
                                                Analyzing Resume with AI...
                                            </>
                                        ) : (
                                            <>
                                                <TrendingUp className="mr-2 h-4 w-4" />
                                                Calculate ATS Score
                                            </>
                                        )}
                                    </Button>
                                </motion.div>

                                {/* ATS Results - Keep all the existing display code */}
                                {atsScore && (
                                    <div className="space-y-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        {/* All your existing ATS score display code stays here */}
                                        {/* Score Display */}
                                        <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide font-semibold">
                                                Your ATS Score
                                            </p>
                                            <p className={`text-6xl font-bold ${getScoreColor(atsScore.ats_score)}`}>
                                                {atsScore.ats_score}
                                                <span className="text-2xl text-gray-500">/100</span>
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                                Powered by Cohere Command-A
                                            </p>
                                        </div>

                                        {/* ... rest of your existing ATS display code ... */}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>
        </DashboardLayout>
    )
}
