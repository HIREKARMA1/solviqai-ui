"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent } from '@/components/ui/card'
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
    RefreshCw,
    Download,
    File
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Textarea } from '@/components/ui/textarea'
import { AxiosError } from 'axios'
import SubscriptionRequiredModal from '@/components/subscription/SubscriptionRequiredModal'

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

    // Resume status
    const [resumeStatus, setResumeStatus] = useState<ResumeStatus | null>(null)
    const [loadingStatus, setLoadingStatus] = useState(true)
    const [showUploadSection, setShowUploadSection] = useState(false)

    // Subscription modal state
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
    const [subscriptionFeature, setSubscriptionFeature] = useState('this feature')

    const fileInputRef = useRef<HTMLInputElement>(null)

    // Fetch resume status on mount
    useEffect(() => {
        fetchResumeStatus()
    }, [])

    // Fetch existing resume status
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

            // Refresh resume status after upload
            await fetchResumeStatus()
            setShowUploadSection(false)
        } catch (err) {
            const axiosError = err as AxiosError<{ detail: string }>
            const errorDetail = axiosError.response?.data?.detail || axiosError.message || 'Failed to upload resume'

            // Check if it's a subscription error
            if (axiosError.response?.status === 403 || errorDetail.includes('Contact HireKarma') || errorDetail.includes('subscription')) {
                setSubscriptionFeature('resume uploads')
                setShowSubscriptionModal(true)
            } else {
                setError(errorDetail)
            }
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
            const errorDetail = axiosError.response?.data?.detail || axiosError.message || 'Failed to calculate ATS score'

            // Check if it's a subscription error
            if (axiosError.response?.status === 403 || errorDetail.includes('Contact HireKarma') || errorDetail.includes('subscription')) {
                setSubscriptionFeature('ATS score calculation')
                setShowSubscriptionModal(true)
            } else {
                setError(errorDetail)
            }
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

    // Extract readable filename from stored resume filename
    const getReadableFilename = (filename: string | undefined): string => {
        if (!filename) return 'Resume.pdf'

        if (filename.includes('_')) {
            const parts = filename.split('_')
            const firstPart = parts[0]

            if (firstPart.includes('-') && firstPart.length >= 30) {
                const readableName = parts.slice(1).join('_')
                if (readableName && readableName.length > 0) {
                    return readableName
                }
            }
        }

        if (filename.includes('-') && filename.length > 30 && !filename.includes('.')) {
            return 'Resume.pdf'
        }

        if (!filename.includes('.')) {
            return filename + '.pdf'
        }

        return filename
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
            <div className="space-y-8 px-4 md:px-8 py-8 md:py-12 max-w-[1400px] mx-auto font-sans">
                {/* Header */}
                <div className="flex flex-col gap-2 mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Resume Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Upload your resume and get instant ATS score Analysis
                    </p>
                </div>

                {/* Existing Resume Section */}
                {!showUploadSection && resumeStatus?.has_resume && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-6"
                    >
                        {/* Resume Active Status Board */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 dark:bg-[#1C2938] rounded-lg border border-blue-100 dark:border-blue-900">
                                        <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Resume Uploaded</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">your resume is ready for ATS analysis</p>
                                    </div>
                                </div>
                                <Badge className="bg-[#10B981] hover:bg-[#059669] text-white px-4 py-1.5 rounded-full text-sm font-medium border-0 shadow-lg shadow-green-500/20">
                                    Active
                                </Badge>
                            </div>

                            {/* Resume File Banner (Frame 74) */}
                            <div className="w-full bg-[#DCFCE9] dark:bg-[#1C2938] dark:border dark:border-green-800/50 rounded-[16px] px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4 w-full overflow-hidden">
                                    <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-white/50 dark:bg-white/5 rounded-full">
                                        <FileText className="h-6 w-6 text-[#10B981] dark:text-green-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 dark:text-white truncate">
                                            {getReadableFilename(resumeStatus.resume_filename)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Uploaded {resumeStatus.uploaded_at ? new Date(resumeStatus.uploaded_at).toLocaleDateString() : 'Unknown date'}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => setShowUploadSection(true)}
                                    variant="outline"
                                    className="rounded-full bg-white dark:bg-transparent border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-medium px-6 h-[40px] shadow-sm"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Replace
                                </Button>
                            </div>
                        </div>

                        {/* ATS Analysis Section (Frame 2087328509) */}
                        <div className="bg-[#F1FEFF] dark:bg-[#1C2938] rounded-[16px] p-6 md:p-8 space-y-6 shadow-sm dark:shadow-none dark:border dark:border-[#292929]">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <BarChart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">ATS Score Analysis</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Get detailed ATS score and recommendations powered by AI</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Job Description (Optional)</label>
                                    <span className="text-xs px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-600 dark:text-gray-300 shadow-sm">
                                        Better Matching
                                    </span>
                                </div>
                                <Textarea
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    placeholder="paste the job description here to get tailored ATS ..."
                                    className="min-h-[140px] rounded-[16px] border-[0.5px] border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-[#020817] text-gray-900 dark:text-gray-100 resize-none p-4 text-sm"
                                    disabled={isCalculatingATS}
                                />
                            </div>

                            <Button
                                onClick={handleCalculateATS}
                                disabled={isCalculatingATS}
                                className="w-full h-[50px] bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white rounded-[10px] font-semibold text-lg shadow-md transition-all border-0"
                            >
                                {isCalculatingATS ? (
                                    <div className="flex items-center gap-2">
                                        <Loader className="h-5 w-5 animate-spin" />
                                        Analyzing Resume...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5" />
                                        Calculate ATS Score
                                    </div>
                                )}
                            </Button>

                            {/* Results Display */}
                            <div className="bg-white dark:bg-[#020817] rounded-[20px] border border-gray-200 dark:border-[#292929] p-8 flex flex-col items-center justify-center text-center shadow-sm">
                                {atsScore ? (
                                    <div className="space-y-4 w-full">
                                        <p className="text-sm uppercase tracking-widest font-bold text-gray-500 dark:text-gray-400">YOUR ATS SCORE</p>
                                        <div className="flex items-baseline justify-center gap-1">
                                            <span className={`text-8xl font-bold ${getScoreColor(atsScore.ats_score)}`}>{atsScore.ats_score}</span>
                                            <span className="text-2xl text-gray-400 font-medium">/100</span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Powered by Cohere command -A</p>

                                        {/* Detailed breakdown can go here if needed, keeping it clean for now per screenshot */}
                                        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full border-t border-gray-100 dark:border-gray-800 pt-8">
                                            <div className="p-4 bg-gray-50 dark:bg-[#1C2938]/50 rounded-xl border border-transparent dark:border-[#292929]">
                                                <h4 className="font-semibold mb-2 flex items-center gap-2 text-gray-900 dark:text-white"><div className="w-2 h-2 rounded-full bg-green-500" /> Strengths</h4>
                                                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                    {atsScore.strengths.slice(0, 3).map((s, i) => <li key={i} className="line-clamp-1">• {s}</li>)}
                                                </ul>
                                            </div>
                                            <div className="p-4 bg-gray-50 dark:bg-[#1C2938]/50 rounded-xl border border-transparent dark:border-[#292929]">
                                                <h4 className="font-semibold mb-2 flex items-center gap-2 text-gray-900 dark:text-white"><div className="w-2 h-2 rounded-full bg-red-500" /> Weaknesses</h4>
                                                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                    {atsScore.weaknesses.slice(0, 3).map((s, i) => <li key={i} className="line-clamp-1">• {s}</li>)}
                                                </ul>
                                            </div>
                                            <div className="p-4 bg-gray-50 dark:bg-[#1C2938]/50 rounded-xl border border-transparent dark:border-[#292929]">
                                                <h4 className="font-semibold mb-2 flex items-center gap-2 text-gray-900 dark:text-white"><div className="w-2 h-2 rounded-full bg-blue-500" /> Suggestions</h4>
                                                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                    {atsScore.recommendations.slice(0, 3).map((s, i) => <li key={i} className="line-clamp-1">• {s}</li>)}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 py-8 opacity-50">
                                        <div className="text-6xl font-bold text-gray-200 dark:text-gray-700">--</div>
                                        <p className="text-gray-400 dark:text-gray-500">Calculate your score to see results</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Powered by Cohere command -A</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </motion.div>
                )}

                {/* Upload Section (Hidden when resume exists, unless replacing) */}
                <AnimatePresence>
                    {(showUploadSection || !resumeStatus?.has_resume) && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white dark:bg-[#020817] rounded-[16px] border border-gray-100 dark:border-[#292929] shadow-sm p-[16px] md:p-8"
                        >
                            <div className="w-full max-w-[1208px] mx-auto flex flex-col gap-[10px]">
                                {/* Header Section */}
                                <div className="flex flex-col gap-2 mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-[#007AFF] rounded-[10px] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                            <Upload className="h-5 w-5" />
                                        </div>
                                        <h2 className="text-[24px] font-bold text-gray-900 dark:text-white">
                                            {resumeStatus?.has_resume ? 'Replace Resume' : 'Upload Resume'}
                                        </h2>
                                    </div>
                                    <p className="text-[#666666] dark:text-gray-400 text-sm ml-14">
                                        Upload your resume in PDF or DOCX format (Max 5MB)
                                    </p>
                                </div>

                                {/* Drop Zone */}
                                <div
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={() => !isUploading && fileInputRef.current?.click()}
                                    className={`
                                        relative group cursor-pointer
                                        border-[2px] border-dashed rounded-[10px]
                                        flex flex-col items-center justify-center
                                        transition-all duration-300 ease-in-out
                                        w-full max-w-[1016px] h-auto min-h-[313px] mx-auto
                                        py-[52px]
                                        ${dragActive
                                            ? 'border-[#9E9DF4] bg-[#9E9DF4]/5'
                                            : 'border-[#444444]/30 dark:border-[#292929] bg-white dark:bg-[#1C2938] hover:border-[#9E9DF4] hover:bg-gray-50 dark:hover:bg-[#1C2938]/80'
                                        }
                                        ${file ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10' : ''}
                                    `}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={handleFileInputChange}
                                        className="hidden"
                                        disabled={isUploading}
                                    />

                                    <div className="text-center space-y-6 max-w-sm px-4">
                                        {!file ? (
                                            <>
                                                <div className="flex flex-col items-center gap-6">
                                                    <div className="h-[64px] w-[64px] mx-auto flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                        <Upload className="h-10 w-10 text-gray-900 dark:text-white group-hover:text-[#9E9DF4]" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-[18px] font-bold text-gray-900 dark:text-white">
                                                            Drag and drop your resume here
                                                        </p>
                                                        <p className="text-[14px] text-gray-500 dark:text-gray-400">
                                                            here or click to browse files
                                                        </p>
                                                    </div>
                                                    <p className="text-[12px] text-gray-400 dark:text-gray-500 font-medium">
                                                        Supported formats: PDF, DOC, DOCX (Max 5MB)
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <AnimatePresence>
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="space-y-4"
                                                >
                                                    <div className="h-20 w-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                        <FileText className="h-10 w-10 text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-lg text-gray-900 dark:text-white truncate max-w-[250px] mx-auto">
                                                            {file.name}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            </AnimatePresence>
                                        )}
                                    </div>
                                </div>

                                {/* Upload Action */}
                                <div className="w-full max-w-[1016px] mx-auto mt-6">
                                    {error && (
                                        <Alert variant="destructive" className="mb-4 bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}

                                    {isUploading && (
                                        <div className="mb-4 space-y-2">
                                            <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                                                <span className="font-medium">Uploading...</span>
                                                <span className="font-semibold">{uploadProgress}%</span>
                                            </div>
                                            <Progress value={uploadProgress} className="h-2 bg-gray-100 dark:bg-gray-700" />
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleUpload}
                                        disabled={!file || isUploading || uploadSuccess}
                                        className="w-full h-[44px] bg-[#9E9DF4] hover:bg-[#8b8ae0] text-white rounded-[10px] text-base font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-none hover:shadow-md"
                                    >
                                        {isUploading ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <Loader className="h-5 w-5 animate-spin" />
                                                Uploading...
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-2">
                                                <Upload className="h-5 w-5" />
                                                <span>{resumeStatus?.has_resume ? 'Replace Resume' : 'Replace Resume'}</span>
                                            </div>
                                        )}
                                    </Button>

                                    {resumeStatus?.has_resume && (
                                        <div className="mt-3 text-center">
                                            <button
                                                onClick={() => {
                                                    setShowUploadSection(false)
                                                    handleReset()
                                                }}
                                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm font-medium"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <SubscriptionRequiredModal
                isOpen={showSubscriptionModal}
                onClose={() => setShowSubscriptionModal(false)}
                feature={subscriptionFeature}
            />
        </DashboardLayout>
    )
}
