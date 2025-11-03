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
    RefreshCw
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { cn } from '@/lib/utils'
import { AnimatedBackground } from '@/components/ui/animated-background'

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
            APPLIED: <CheckCircle className="h-3 w-3" />,
            PENDING: <Clock className="h-3 w-3" />,
            FAILED: <XCircle className="h-3 w-3" />,
            SKIPPED: <AlertCircle className="h-3 w-3" />
        }
        
        return (
            <Badge variant={variants[status] || 'outline'} className="flex items-center gap-1">
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
            <div className="relative z-10 mt-20 space-y-6">
                {/* Header */}
                <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 border">
                    {/* decorative corner */}
                    <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rotate-45 bg-gradient-to-br from-primary-100/40 to-secondary-100/30 dark:from-primary-900/30 dark:to-secondary-900/20" />
                    <h1 className="text-3xl font-bold gradient-text">Automatic Job Application</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Apply to multiple jobs automatically using AI-extracted skills
                    </p>
                </div>

                {/* Alerts */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                
                {success && (
                    <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                )}

                {/* Tabs with Modern Styling */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-4 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm p-1 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                            <TabsTrigger 
                                value="configure"
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-500 data-[state=active]:to-secondary-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                            >
                            <Settings className="h-4 w-4 mr-2" />
                            Configure
                        </TabsTrigger>
                            <TabsTrigger 
                                value="sessions"
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-500 data-[state=active]:to-secondary-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                            >
                            <Briefcase className="h-4 w-4 mr-2" />
                            Sessions
                        </TabsTrigger>
                            <TabsTrigger 
                                value="applications"
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-500 data-[state=active]:to-secondary-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                            >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Applications
                        </TabsTrigger>
                            <TabsTrigger 
                                value="skills"
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-500 data-[state=active]:to-secondary-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                            >
                            <FileText className="h-4 w-4 mr-2" />
                            My Skills
                        </TabsTrigger>
                    </TabsList>

                    {/* Configure Tab */}
                    <TabsContent value="configure" className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <Card className="relative overflow-hidden border-2 border-transparent hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl">
                                {/* Gradient Background Effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-secondary-50/50 dark:from-primary-900/10 dark:via-transparent dark:to-secondary-900/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                                
                                <CardHeader className="relative">
                                    <div className="absolute -top-1 -left-1 w-24 h-24 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-full blur-2xl" />
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent relative z-10">
                                        Create New Application Session
                                    </CardTitle>
                                    <CardDescription className="relative z-10 text-base">
                                    Configure platform credentials and job preferences
                                </CardDescription>
                            </CardHeader>
                                <CardContent className="relative z-10">
                                <form onSubmit={handleCreateSession} className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="platform" className="text-gray-700 dark:text-gray-300 font-medium">Platform</Label>
                                            <select
                                                id="platform"
                                                className="w-full mt-1 p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                                                value={formData.platform}
                                                onChange={(e) => setFormData({...formData, platform: e.target.value})}
                                            >
                                                <option value="FOUNDIT">Foundit (Monster India)</option>
                                                <option value="NAUKRI">Naukri</option>
                                                <option value="LINKEDIN" disabled>LinkedIn (Coming Soon)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <Label htmlFor="platform_email" className="text-gray-700 dark:text-gray-300 font-medium">Platform Email/Phone</Label>
                                            <Input
                                                id="platform_email"
                                                type="text"
                                                placeholder="your@email.com or phone"
                                                value={formData.platform_email}
                                                onChange={(e) => setFormData({...formData, platform_email: e.target.value})}
                                                required
                                                className="mt-1 border-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="platform_password" className="text-gray-700 dark:text-gray-300 font-medium">Platform Password</Label>
                                            <Input
                                                id="platform_password"
                                                type="password"
                                                placeholder="••••••••"
                                                value={formData.platform_password}
                                                onChange={(e) => setFormData({...formData, platform_password: e.target.value})}
                                                required
                                                className="mt-1 border-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="location" className="text-gray-700 dark:text-gray-300 font-medium">Location</Label>
                                            <Input
                                                id="location"
                                                type="text"
                                                placeholder="Delhi, Mumbai, Bangalore..."
                                                value={formData.location}
                                                onChange={(e) => setFormData({...formData, location: e.target.value})}
                                                required
                                                className="mt-1 border-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="experience" className="text-gray-700 dark:text-gray-300 font-medium">Experience (Years)</Label>
                                            <Input
                                                id="experience"
                                                type="number"
                                                min="0"
                                                max="30"
                                                value={formData.experience_years}
                                                onChange={(e) => setFormData({...formData, experience_years: parseInt(e.target.value)})}
                                                className="mt-1 border-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="max_apps" className="text-gray-700 dark:text-gray-300 font-medium">Max Applications</Label>
                                            <Input
                                                id="max_apps"
                                                type="number"
                                                min="1"
                                                max="50"
                                                value={formData.max_applications}
                                                onChange={(e) => setFormData({...formData, max_applications: parseInt(e.target.value)})}
                                                className="mt-1 border-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
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
                                            />
                                            <Label htmlFor="use_resume" className="cursor-pointer">
                                                Use AI-extracted skills from my resume
                                            </Label>
                                        </div>
                                        
                                        {skills && formData.use_resume_skills && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.3 }}
                                                className="ml-6 p-4 bg-gradient-to-br from-primary-50 via-secondary-50/50 to-primary-50 dark:from-primary-900/20 dark:via-secondary-900/20 dark:to-primary-900/20 rounded-lg border border-primary-200/50 dark:border-primary-700/50"
                                            >
                                                <p className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                                                    {skills.extracted_skills.length} skills will be used:
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {skills.extracted_skills.slice(0, 10).map((skill, idx) => (
                                                        <motion.div
                                                            key={idx}
                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ duration: 0.2, delay: idx * 0.05 }}
                                                            whileHover={{ scale: 1.05 }}
                                                        >
                                                            <Badge className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
                                                                {skill}
                                                            </Badge>
                                                        </motion.div>
                                                    ))}
                                                    {skills.extracted_skills.length > 10 && (
                                                        <Badge className="bg-gray-100 dark:bg-gray-800 text-white dark:text-gray-300 border border-gray-300 dark:border-gray-600">
                                                            +{skills.extracted_skills.length - 10} more
                                                        </Badge>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    {!formData.use_resume_skills && (
                                        <div>
                                            <Label htmlFor="custom_skills">Custom Skills (comma-separated)</Label>
                                            <Input
                                                id="custom_skills"
                                                type="text"
                                                placeholder="Python, JavaScript, React, AWS, Docker..."
                                                value={formData.custom_skills}
                                                onChange={(e) => setFormData({...formData, custom_skills: e.target.value})}
                                            />
                                        </div>
                                    )}

                                    <Button 
                                        type="submit" 
                                        disabled={loading} 
                                        className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                                    >
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-secondary-500 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                        />
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {loading ? (
                                                <>
                                                    <Loader2 className="h-5 w-5 animate-spin" /> Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <Zap className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" /> Create Session
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
                    <TabsContent value="sessions" className="space-y-4">
                        {sessions.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
                                    <CardContent className="p-12 text-center">
                                        <motion.div
                                            animate={{ y: [0, -10, 0] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <Briefcase className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                                        </motion.div>
                                        <p className="text-gray-600 dark:text-gray-400 mb-4">No sessions created yet</p>
                                        <Button 
                                            onClick={() => setActiveTab('configure')} 
                                            className="mt-4 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-lg"
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
                                        
                                        <CardHeader className="relative z-10">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="flex items-center gap-2 text-lg">
                                                        {session.platform}
                                                        <Badge className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white border-0">
                                                            {session.location}
                                                        </Badge>
                                                    </CardTitle>
                                                    <CardDescription className="mt-1">
                                                        Created {new Date(session.created_at).toLocaleDateString()}
                                                    </CardDescription>
                                                </div>
                                                <Button
                                                    onClick={() => handleRunSession(session.id)}
                                                    disabled={runningSessionId === session.id}
                                                    size="sm"
                                                    className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
                                                >
                                                    {runningSessionId === session.id ? (
                                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running...</>
                                                    ) : (
                                                        <><Play className="mr-2 h-4 w-4" /> Run Now</>
                                                    )}
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="relative z-10">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Experience</p>
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{session.experience_years} years</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Max Jobs</p>
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{session.max_applications}</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Skills</p>
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{session.skills_count}</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700">
                                                    <p className="text-sm text-green-700 dark:text-green-400 mb-1">Total Applied</p>
                                                    <p className="font-semibold text-green-600 dark:text-green-400">{session.total_applications}</p>
                                                </div>
                                            </div>
                                            {session.last_run_at && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    Last run: {new Date(session.last_run_at).toLocaleString()}
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))
                        )}
                    </TabsContent>

                    {/* Applications Tab */}
                    <TabsContent value="applications" className="space-y-6">
                        {stats && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="grid md:grid-cols-4 gap-4"
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
                                            <CardHeader className="pb-2 relative z-10">
                                                <CardTitle className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="relative z-10">
                                                <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
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
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                                        Application History
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {applications.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Briefcase className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                                            <p className="text-gray-600 dark:text-gray-400">No applications yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {applications.map((app, index) => (
                                                <motion.div
                                                    key={app.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.4, delay: index * 0.05 }}
                                                    className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gradient-to-br hover:from-primary-50/30 hover:to-secondary-50/30 dark:hover:from-primary-900/10 dark:hover:to-secondary-900/10 transition-all duration-300 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{app.job_title}</h3>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">{app.company_name}</p>
                                                            {app.job_location && (
                                                                <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1 mt-1">
                                                                    <span className="w-1 h-1 bg-primary-500 rounded-full" />
                                                                    {app.job_location}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {getStatusBadge(app.status)}
                                                    </div>
                                                    
                                                    {app.skills_used && app.skills_used.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-3">
                                                            {app.skills_used.slice(0, 5).map((skill, idx) => (
                                                                <Badge 
                                                                    key={idx} 
                                                                    className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700 text-xs"
                                                                >
                                                                    {skill}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex items-center justify-between mt-4 text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700">
                                                        <span className="flex items-center gap-1">
                                                            <Briefcase className="h-3 w-3" />
                                                            {app.platform}
                                                        </span>
                                                        <span>{new Date(app.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    
                                                    {app.job_url && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="mt-3 w-full border-primary-200 dark:border-primary-800 hover:bg-gradient-to-r hover:from-primary-500 hover:to-secondary-500 hover:text-white hover:border-transparent transition-all duration-300"
                                                            onClick={() => window.open(app.job_url, '_blank')}
                                                        >
                                                            <Eye className="h-3 w-3 mr-2" />
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
                                
                                <CardHeader className="relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                                                Extracted Skills from Resume
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                AI-analyzed skills using Cohere
                                            </CardDescription>
                                        </div>
                                        <Button 
                                            onClick={handleRefreshSkills} 
                                            disabled={loading} 
                                            variant="outline"
                                            className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
                                        >
                                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                            Refresh
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    {!skills ? (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-center py-12"
                                        >
                                            <motion.div
                                                animate={{ y: [0, -10, 0] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            >
                                                <FileText className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                                            </motion.div>
                                            <p className="text-gray-600 dark:text-gray-400">No resume uploaded or skills not extracted yet</p>
                                        </motion.div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* All Skills */}
                                            <div>
                                                <h3 className="font-semibold mb-4 text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                                    Your Skills
                                                    <Badge className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white border-0">
                                                        {skills.extracted_skills.length}
                                                    </Badge>
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {skills.extracted_skills.map((skill, idx) => (
                                                        <motion.div
                                                            key={idx}
                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ duration: 0.2, delay: idx * 0.02 }}
                                                            whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                                                        >
                                                            <Badge className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 text-sm shadow-md hover:shadow-lg transition-all duration-200 border-0 cursor-default">
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
                                                    className="pt-6 border-t border-gray-200 dark:border-gray-700"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1">
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                                AI Confidence Score
                                                            </p>
                                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${skills.confidence_score * 100}%` }}
                                                                    transition={{ duration: 1, delay: 0.5 }}
                                                                    className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                                                                />
                                                            </div>
                                                        </div>
                                                        <span className="font-bold text-lg text-primary-600 dark:text-primary-400">
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
