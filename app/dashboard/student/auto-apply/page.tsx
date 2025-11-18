'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
    Briefcase, Home, User, FileText, Zap, Settings, CheckCircle, 
    XCircle, Clock, TrendingUp, AlertCircle, Loader2, Eye, Play,
    RefreshCw, Download, BarChart3
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { cn } from '@/lib/utils'
import { AnimatedBackground } from '@/components/ui/animated-background'

const sidebarItems = [
    { name: 'Dashboard', href: '/dashboard/student', icon: Home },
    { name: 'Profile', href: '/dashboard/student/profile', icon: User },
    { name: 'Resume', href: '/dashboard/student/resume', icon: FileText },
    { name: 'Job Recommendations', href: '/dashboard/student/jobs', icon: Briefcase },
    { name: 'Auto Job Apply', href: '/dashboard/student/auto-apply', icon: Zap },
    { name: 'Analytics', href: '/dashboard/student/analytics', icon: BarChart3 },
]

interface JobApplication {
    id: string
    job_title: string
    company_name: string
    job_location?: string
    job_url?: string
    status: string
    applied_at?: string
    platform: string
    skills_used?: string[]
    created_at: string
}

interface Session {
    id: string
    platform: string
    location: string
    experience_years: number
    max_applications: number
    total_applications: number
    last_run_at?: string
    skills_count: number
    created_at: string
}

interface Skills {
    id: string
    extracted_skills: string[]
    skill_categories: {
        technical: string[]
        soft: string[]
        domain: string[]
        tools: string[]
    }
    confidence_score?: number
}

export default function AutoJobApplyPage() {
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('configure')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    
    // State
    const [sessions, setSessions] = useState<Session[]>([])
    const [applications, setApplications] = useState<JobApplication[]>([])
    const [skills, setSkills] = useState<Skills | null>(null)
    const [stats, setStats] = useState<any>(null)
    
    // Form state
    const [formData, setFormData] = useState({
        platform: 'FOUNDIT',
        platform_email: '',
        platform_password: '',
        location: 'Delhi',
        experience_years: 0,
        max_applications: 5,
        use_resume_skills: true,
        custom_skills: ''
    })
    
    // Running job application
    const [runningSessionId, setRunningSessionId] = useState<string | null>(null)
    
    useEffect(() => {
        fetchData()
    }, [activeTab])
    
    const fetchData = async () => {
        try {
            if (activeTab === 'configure' || activeTab === 'sessions') {
                const sessionsData = await apiClient.client.get('/auto-apply/sessions')
                setSessions(sessionsData.data)
            }
            
            if (activeTab === 'applications') {
                const [appsData, statsData] = await Promise.all([
                    apiClient.client.get('/auto-apply/applications'),
                    apiClient.client.get('/auto-apply/applications/stats')
                ])
                setApplications(appsData.data)
                setStats(statsData.data)
            }
            
            if (activeTab === 'skills' || formData.use_resume_skills) {
                try {
                    const skillsData = await apiClient.client.get('/auto-apply/skills')
                    setSkills(skillsData.data)
                } catch (err: any) {
                    if (!err.message?.includes('No resume')) {
                        console.error('Skills fetch error:', err)
                    }
                }
            }
        } catch (err: any) {
            console.error('Fetch error:', err)
        }
    }
    
    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')
        
        try {
            const payload = {
                ...formData,
                custom_skills: formData.custom_skills ? formData.custom_skills.split(',').map(s => s.trim()) : null
            }
            
            const newSession = await apiClient.client.post('/auto-apply/sessions', payload)
            setSuccess('Session created successfully!')
            setSessions([newSession.data, ...sessions])
            
            // Reset form
            setFormData({
                ...formData,
                platform_email: '',
                platform_password: '',
                custom_skills: ''
            })
            
            setTimeout(() => setActiveTab('sessions'), 1500)
        } catch (err: any) {
            setError(err.message || 'Failed to create session')
        } finally {
            setLoading(false)
        }
    }
    
    const handleRunSession = async (sessionId: string) => {
        setRunningSessionId(sessionId)
        setError('')
        setSuccess('')
        
        try {
            const result = await apiClient.client.post(`/auto-apply/sessions/${sessionId}/run`, {})
            setSuccess(`Successfully applied to ${result.data.total_applications} jobs!`)
            fetchData()
        } catch (err: any) {
            setError(err.message || 'Failed to run job applications')
        } finally {
            setRunningSessionId(null)
        }
    }
    
    const handleRefreshSkills = async () => {
        setLoading(true)
        try {
            const newSkills = await apiClient.client.post('/auto-apply/skills/refresh', {})
            setSkills(newSkills.data)
            setSuccess('Skills refreshed successfully!')
        } catch (err: any) {
            setError(err.message || 'Failed to refresh skills')
        } finally {
            setLoading(false)
        }
    }
    
    const getStatusBadge = (status: string) => {
        const variants: any = {
            APPLIED: 'default',
            PENDING: 'secondary',
            FAILED: 'destructive',
            SKIPPED: 'outline'
        }
        
        const icons: any = {
            APPLIED: <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />,
            PENDING: <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />,
            FAILED: <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />,
            SKIPPED: <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
        }
        
        return (
            <Badge variant={variants[status] || 'outline'} className="flex items-center gap-1 text-[10px] sm:text-xs whitespace-nowrap">
                {icons[status]}
                {status}
            </Badge>
        )
    }

    return (
        <DashboardLayout requiredUserType="student">
            {/* Background with same style as home page */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 gradient-bg">
                    <AnimatedBackground variant="default" />
                </div>
            </div>
            
            {/* Content with margin-top */}
            <div className="relative z-10 pt-28 sm:pt-36 lg:pt-20 space-y-4 sm:space-y-6 px-3 sm:px-4 md:px-6">
                {/* Header */}
                <div className="relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 border">
                    {/* decorative corner */}
                    <div className="pointer-events-none absolute -top-8 -right-8 sm:-top-10 sm:-right-10 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rotate-45 bg-gradient-to-br from-primary-100/40 to-secondary-100/30 dark:from-primary-900/30 dark:to-secondary-900/20 opacity-30" />
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text relative z-10">Automatic Job Application</h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 relative z-10">
                        Apply to multiple jobs automatically using AI-extracted skills
                    </p>
                </div>

                {/* Alerts */}
                {error && (
                    <Alert variant="destructive" className="text-xs sm:text-sm">
                        <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
                    </Alert>
                )}
                
                {success && (
                    <Alert className="border-green-200 bg-green-50 text-xs sm:text-sm">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                        <AlertDescription className="text-green-800 text-xs sm:text-sm">{success}</AlertDescription>
                    </Alert>
                )}

                {/* Tabs with Modern Styling */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-hide">
                            <TabsList className="inline-flex w-full sm:w-auto min-w-full sm:min-w-0 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm p-1 rounded-lg sm:rounded-xl border border-gray-200/50 dark:border-gray-700/50 gap-1 sm:grid sm:grid-cols-4">
                                <TabsTrigger 
                                    value="configure"
                                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-500 data-[state=active]:to-secondary-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-xs sm:text-sm whitespace-nowrap flex-shrink-0 px-3 sm:px-4 py-2 flex items-center justify-center"
                                >
                                    <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                                    <span className="hidden sm:inline">Configure</span>
                                    <span className="sm:hidden">Config</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="sessions"
                                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-500 data-[state=active]:to-secondary-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-xs sm:text-sm whitespace-nowrap flex-shrink-0 px-3 sm:px-4 py-2 flex items-center justify-center"
                                >
                                    <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                                    <span>Sessions</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="applications"
                                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-500 data-[state=active]:to-secondary-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-xs sm:text-sm whitespace-nowrap flex-shrink-0 px-3 sm:px-4 py-2 flex items-center justify-center"
                                >
                                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                                    <span className="hidden sm:inline">Applications</span>
                                    <span className="sm:hidden">Apps</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="skills"
                                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-500 data-[state=active]:to-secondary-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-xs sm:text-sm whitespace-nowrap flex-shrink-0 px-3 sm:px-4 py-2 flex items-center justify-center"
                                >
                                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                                    <span className="hidden sm:inline">My Skills</span>
                                    <span className="sm:hidden">Skills</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                    {/* Configure Tab */}
                    <TabsContent value="configure" className="space-y-4 sm:space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <Card className="relative overflow-hidden border-2 border-transparent hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl">
                                {/* Gradient Background Effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-secondary-50/50 dark:from-primary-900/10 dark:via-transparent dark:to-secondary-900/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                                
                                <CardHeader className="relative p-4 sm:p-6">
                                    <div className="absolute -top-1 -left-1 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-full blur-2xl" />
                                    <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent relative z-10">
                                        Create New Application Session
                                    </CardTitle>
                                    <CardDescription className="relative z-10 text-sm sm:text-base">
                                    Configure platform credentials and job preferences
                                </CardDescription>
                            </CardHeader>
                                <CardContent className="relative z-10 p-4 sm:p-6">
                                <form onSubmit={handleCreateSession} className="space-y-3 sm:space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <Label htmlFor="platform" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">Platform</Label>
                                            <select
                                                id="platform"
                                                className="w-full mt-1 p-2 sm:p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 text-sm sm:text-base"
                                                value={formData.platform}
                                                onChange={(e) => setFormData({...formData, platform: e.target.value})}
                                            >
                                                <option value="FOUNDIT">Foundit (Monster India)</option>
                                                <option value="NAUKRI">Naukri</option>
                                                <option value="LINKEDIN" disabled>LinkedIn (Coming Soon)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <Label htmlFor="platform_email" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">Platform Email/Phone</Label>
                                            <Input
                                                id="platform_email"
                                                type="text"
                                                placeholder="your@email.com or phone"
                                                value={formData.platform_email}
                                                onChange={(e) => setFormData({...formData, platform_email: e.target.value})}
                                                required
                                                className="mt-1 border-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 text-sm sm:text-base"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="platform_password" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">Platform Password</Label>
                                            <Input
                                                id="platform_password"
                                                type="password"
                                                placeholder="••••••••"
                                                value={formData.platform_password}
                                                onChange={(e) => setFormData({...formData, platform_password: e.target.value})}
                                                required
                                                className="mt-1 border-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 text-sm sm:text-base"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="location" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">Location</Label>
                                            <Input
                                                id="location"
                                                type="text"
                                                placeholder="Delhi, Mumbai, Bangalore..."
                                                value={formData.location}
                                                onChange={(e) => setFormData({...formData, location: e.target.value})}
                                                required
                                                className="mt-1 border-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 text-sm sm:text-base"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="experience" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">Experience (Years)</Label>
                                            <Input
                                                id="experience"
                                                type="number"
                                                min="0"
                                                max="30"
                                                value={formData.experience_years}
                                                onChange={(e) => setFormData({...formData, experience_years: parseInt(e.target.value)})}
                                                className="mt-1 border-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 text-sm sm:text-base"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="max_apps" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">Max Applications</Label>
                                            <Input
                                                id="max_apps"
                                                type="number"
                                                min="1"
                                                max="50"
                                                value={formData.max_applications}
                                                onChange={(e) => setFormData({...formData, max_applications: parseInt(e.target.value)})}
                                                className="mt-1 border-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 text-sm sm:text-base"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="use_resume"
                                                checked={formData.use_resume_skills}
                                                onChange={(e) => setFormData({...formData, use_resume_skills: e.target.checked})}
                                                className="w-4 h-4 sm:w-5 sm:h-5"
                                            />
                                            <Label htmlFor="use_resume" className="cursor-pointer text-xs sm:text-sm">
                                                Use AI-extracted skills from my resume
                                            </Label>
                                        </div>
                                        
                                        {skills && formData.use_resume_skills && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.3 }}
                                                className="ml-4 sm:ml-6 p-3 sm:p-4 bg-gradient-to-br from-primary-50 via-secondary-50/50 to-primary-50 dark:from-primary-900/20 dark:via-secondary-900/20 dark:to-primary-900/20 rounded-lg border border-primary-200/50 dark:border-primary-700/50"
                                            >
                                                <p className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 text-gray-700 dark:text-gray-300">
                                                    {skills.extracted_skills.length} skills will be used:
                                                </p>
                                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                                    {skills.extracted_skills.slice(0, 10).map((skill, idx) => (
                                                        <motion.div
                                                            key={idx}
                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ duration: 0.2, delay: idx * 0.05 }}
                                                            whileHover={{ scale: 1.05 }}
                                                        >
                                                            <Badge className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 text-[10px] sm:text-xs whitespace-nowrap overflow-hidden text-ellipsis inline-block max-w-[150px] sm:max-w-none">
                                                                {skill}
                                                            </Badge>
                                                        </motion.div>
                                                    ))}
                                                    {skills.extracted_skills.length > 10 && (
                                                        <Badge className="bg-gray-100 dark:bg-gray-800 text-white dark:text-gray-300 border border-gray-300 dark:border-gray-600 text-[10px] sm:text-xs">
                                                            +{skills.extracted_skills.length - 10} more
                                                        </Badge>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    {!formData.use_resume_skills && (
                                        <div>
                                            <Label htmlFor="custom_skills" className="text-xs sm:text-sm">Custom Skills (comma-separated)</Label>
                                            <Input
                                                id="custom_skills"
                                                type="text"
                                                placeholder="Python, JavaScript, React, AWS, Docker..."
                                                value={formData.custom_skills}
                                                onChange={(e) => setFormData({...formData, custom_skills: e.target.value})}
                                                className="text-sm sm:text-base"
                                            />
                                        </div>
                                    )}

                                    <Button 
                                        type="submit" 
                                        disabled={loading} 
                                        className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-semibold py-4 sm:py-6 text-sm sm:text-base md:text-lg shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                                    >
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-secondary-500 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                        />
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {loading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> <span className="hidden sm:inline">Creating...</span><span className="sm:hidden">Creating</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-12 transition-transform duration-300" /> <span className="hidden sm:inline">Create Session</span><span className="sm:hidden">Create</span>
                                                </>
                                            )}
                                        </span>
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                        </motion.div>
                    </TabsContent>

                    {/* Sessions Tab */}
                    <TabsContent value="sessions" className="space-y-3 sm:space-y-4">
                        {sessions.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
                                    <CardContent className="p-8 sm:p-12 text-center">
                                        <motion.div
                                            animate={{ y: [0, -10, 0] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <Briefcase className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3 sm:mb-4" />
                                        </motion.div>
                                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">No sessions created yet</p>
                                        <Button 
                                            onClick={() => setActiveTab('configure')} 
                                            className="mt-3 sm:mt-4 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-lg text-sm sm:text-base"
                                        >
                                            Create First Session
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ) : (
                            sessions.map((session, index) => (
                                <motion.div
                                    key={session.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                >
                                    <Card className="relative overflow-hidden border-2 border-transparent hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300 shadow-md hover:shadow-xl group">
                                        {/* Gradient Background on Hover */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 via-transparent to-secondary-50/0 dark:from-primary-900/0 dark:via-transparent dark:to-secondary-900/0 group-hover:from-primary-50/30 group-hover:to-secondary-50/30 dark:group-hover:from-primary-900/20 dark:group-hover:to-secondary-900/20 transition-all duration-300" />
                                        
                                        <CardHeader className="relative z-10 p-4 sm:p-6">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                                                <div className="flex-1 min-w-0">
                                                    <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
                                                        <span className="truncate">{session.platform}</span>
                                                        <Badge className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white border-0 text-xs sm:text-sm whitespace-nowrap">
                                                            {session.location}
                                                        </Badge>
                                                    </CardTitle>
                                                    <CardDescription className="mt-1 text-xs sm:text-sm">
                                                        Created {new Date(session.created_at).toLocaleDateString()}
                                                    </CardDescription>
                                                </div>
                                                <Button
                                                    onClick={() => handleRunSession(session.id)}
                                                    disabled={runningSessionId === session.id}
                                                    size="sm"
                                                    className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-md hover:shadow-lg transition-all duration-300 w-full sm:w-auto text-xs sm:text-sm"
                                                >
                                                    {runningSessionId === session.id ? (
                                                        <><Loader2 className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> <span className="hidden sm:inline">Running...</span><span className="sm:hidden">Running</span></>
                                                    ) : (
                                                        <><Play className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Run Now</span><span className="sm:hidden">Run</span></>
                                                    )}
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="relative z-10 p-4 sm:p-6">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                                                <div className="p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Experience</p>
                                                    <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100">{session.experience_years} years</p>
                                                </div>
                                                <div className="p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Max Jobs</p>
                                                    <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100">{session.max_applications}</p>
                                                </div>
                                                <div className="p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Skills</p>
                                                    <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100">{session.skills_count}</p>
                                                </div>
                                                <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700">
                                                    <p className="text-xs sm:text-sm text-green-700 dark:text-green-400 mb-1">Total Applied</p>
                                                    <p className="font-semibold text-sm sm:text-base text-green-600 dark:text-green-400">{session.total_applications}</p>
                                                </div>
                                            </div>
                                            {session.last_run_at && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 sm:mt-4 flex items-center gap-1">
                                                    <Clock className="h-3 w-3 flex-shrink-0" />
                                                    <span className="truncate">Last run: {new Date(session.last_run_at).toLocaleString()}</span>
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))
                        )}
                    </TabsContent>

                    {/* Applications Tab */}
                    <TabsContent value="applications" className="space-y-4 sm:space-y-6">
                        {stats && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4"
                            >
                                {[
                                    { label: 'Total', value: stats.total_applications, color: 'from-gray-500 to-gray-600', textColor: 'text-gray-700 dark:text-gray-300' },
                                    { label: 'Applied', value: stats.applied, color: 'from-green-500 to-emerald-500', textColor: 'text-green-600 dark:text-green-400' },
                                    { label: 'Pending', value: stats.pending, color: 'from-yellow-500 to-orange-500', textColor: 'text-yellow-600 dark:text-yellow-400' },
                                    { label: 'Success Rate', value: `${stats.success_rate}%`, color: 'from-primary-500 to-secondary-500', textColor: 'text-primary-600 dark:text-primary-400' }
                                ].map((stat, index) => (
                                    <motion.div
                                        key={stat.label}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.4, delay: index * 0.1 }}
                                    >
                                        <Card className="relative overflow-hidden border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300 shadow-md hover:shadow-xl group">
                                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                                            <CardHeader className="pb-1 sm:pb-2 relative z-10 p-3 sm:p-6">
                                                <CardTitle className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{stat.label}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="relative z-10 p-3 sm:p-6 pt-0">
                                                <p className={`text-xl sm:text-2xl md:text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <Card className="border-2 border-transparent hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300 shadow-lg">
                                <CardHeader className="p-4 sm:p-6">
                                    <CardTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                                        Application History
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6">
                                    {applications.length === 0 ? (
                                        <div className="text-center py-8 sm:py-12">
                                            <Briefcase className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3 sm:mb-4" />
                                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">No applications yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 sm:space-y-3">
                                            {applications.map((app, index) => (
                                                <motion.div
                                                    key={app.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.4, delay: index * 0.05 }}
                                                    className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 hover:bg-gradient-to-br hover:from-primary-50/30 hover:to-secondary-50/30 dark:hover:from-primary-900/10 dark:hover:to-secondary-900/10 transition-all duration-300 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md"
                                                >
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-2">
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 line-clamp-2">{app.job_title}</h3>
                                                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">{app.company_name}</p>
                                                            {app.job_location && (
                                                                <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1 mt-1">
                                                                    <span className="w-1 h-1 bg-primary-500 rounded-full flex-shrink-0" />
                                                                    <span className="truncate">{app.job_location}</span>
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex-shrink-0">{getStatusBadge(app.status)}</div>
                                                    </div>
                                                    
                                                    {app.skills_used && app.skills_used.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                                                            {app.skills_used.slice(0, 5).map((skill, idx) => (
                                                                <Badge 
                                                                    key={idx} 
                                                                    className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700 text-[10px] sm:text-xs whitespace-nowrap overflow-hidden text-ellipsis inline-block max-w-[120px] sm:max-w-none"
                                                                >
                                                                    {skill}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mt-3 sm:mt-4 text-xs text-gray-500 dark:text-gray-400 pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
                                                        <span className="flex items-center gap-1">
                                                            <Briefcase className="h-3 w-3 flex-shrink-0" />
                                                            <span className="truncate">{app.platform}</span>
                                                        </span>
                                                        <span>{new Date(app.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    
                                                    {app.job_url && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="mt-2 sm:mt-3 w-full border-primary-200 dark:border-primary-800 hover:bg-gradient-to-r hover:from-primary-500 hover:to-secondary-500 hover:text-white hover:border-transparent transition-all duration-300 text-xs sm:text-sm"
                                                            onClick={() => window.open(app.job_url, '_blank')}
                                                        >
                                                            <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                                            View Job
                                                        </Button>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </TabsContent>

                    {/* Skills Tab */}
                    <TabsContent value="skills">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="relative overflow-hidden border-2 border-transparent hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300 shadow-lg">
                                {/* Gradient Background Effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-transparent to-secondary-50/30 dark:from-primary-900/10 dark:via-transparent dark:to-secondary-900/10 opacity-50" />
                                
                                <CardHeader className="relative z-10 p-4 sm:p-6">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                                                Extracted Skills from Resume
                                            </CardTitle>
                                            <CardDescription className="mt-1 text-xs sm:text-sm">
                                                AI-analyzed skills using Cohere
                                            </CardDescription>
                                        </div>
                                        <Button 
                                            onClick={handleRefreshSkills} 
                                            disabled={loading} 
                                            variant="outline"
                                            className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 w-full sm:w-auto text-xs sm:text-sm"
                                        >
                                            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                                            Refresh
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="relative z-10 p-4 sm:p-6">
                                    {!skills ? (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-center py-8 sm:py-12"
                                        >
                                            <motion.div
                                                animate={{ y: [0, -10, 0] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            >
                                                <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3 sm:mb-4" />
                                            </motion.div>
                                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">No resume uploaded or skills not extracted yet</p>
                                        </motion.div>
                                    ) : (
                                        <div className="space-y-4 sm:space-y-6">
                                            {/* All Skills */}
                                            <div>
                                                <h3 className="font-semibold mb-3 sm:mb-4 text-base sm:text-lg text-gray-900 dark:text-gray-100 flex flex-wrap items-center gap-2">
                                                    Your Skills
                                                    <Badge className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white border-0 text-xs sm:text-sm">
                                                        {skills.extracted_skills.length}
                                                    </Badge>
                                                </h3>
                                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                                    {skills.extracted_skills.map((skill, idx) => (
                                                        <motion.div
                                                            key={idx}
                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ duration: 0.2, delay: idx * 0.02 }}
                                                            whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                                                        >
                                                            <Badge className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 border-0 cursor-default whitespace-nowrap overflow-hidden text-ellipsis inline-block max-w-[200px] sm:max-w-none">
                                                                {skill}
                                                            </Badge>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>

                                            {skills.confidence_score && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.5, delay: 0.3 }}
                                                    className="pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700"
                                                >
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                        <div className="flex-1 w-full">
                                                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                                AI Confidence Score
                                                            </p>
                                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3 overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${skills.confidence_score * 100}%` }}
                                                                    transition={{ duration: 1, delay: 0.5 }}
                                                                    className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                                                                />
                                                            </div>
                                                        </div>
                                                        <span className="font-bold text-base sm:text-lg text-primary-600 dark:text-primary-400 flex-shrink-0">
                                                            {(skills.confidence_score * 100).toFixed(0)}%
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </TabsContent>
                    </Tabs>
                </motion.div>
            </div>
        </DashboardLayout>
    )
}
