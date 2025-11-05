"use client"

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import { Home, User, FileText, Briefcase, ClipboardList, Zap, BarChart3, Sparkles, Save } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
export default function StudentProfile() {
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const data = await apiClient.getStudentProfile()
            setProfile(data)
        } catch (error) {
            console.error('Error fetching profile:', error)
            toast.error('Failed to load profile')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            await apiClient.updateStudentProfile(profile)
            toast.success('Profile updated successfully')
        } catch (error) {
            console.error('Error updating profile:', error)
            toast.error('Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    return (
        <DashboardLayout requiredUserType="student">
            <div className="space-y-6">
                {/* Header - Matching Dashboard Style */}
                <motion.div 
                    className="relative overflow-hidden rounded-2xl p-8 text-gray-900 dark:text-white border bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    whileHover={{ scale: 1.01 }}
                >
                    {/* Decorative corners */}
                    <div className="pointer-events-none absolute -top-12 -right-12 w-56 h-56 rotate-45 bg-gradient-to-br from-primary-100/40 to-secondary-100/30 dark:from-primary-900/30 dark:to-secondary-900/20" />
                    <div className="pointer-events-none absolute -bottom-14 -left-14 w-64 h-64 rounded-full bg-gradient-to-tr from-secondary-100/30 to-accent-100/20 dark:from-secondary-900/20 dark:to-accent-900/10" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <motion.div 
                                className="p-2 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400"
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            >
                                <Sparkles className="h-6 w-6" />
                            </motion.div>
                            <motion.h1 
                                className="text-4xl font-bold gradient-text"
                                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                style={{ backgroundSize: '200% 200%' }}
                            >
                                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">Profile</span>
                                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent"> Settings</span>
                            </motion.h1>
                        </div>
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                            Manage your personal information and preferences
                        </p>
                    </div>
                </motion.div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader size="lg" />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 shadow-lg group">
                            {/* Decorative shapes */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-200/30 to-purple-200/20 blur-3xl group-hover:blur-[40px] transition-all duration-500" />
                            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-gradient-to-tr from-cyan-200/25 to-teal-200/15 blur-3xl group-hover:blur-[40px] transition-all duration-500" />
                            
                            <CardHeader className="relative z-10 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                                        <User className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl font-bold">Personal Information</CardTitle>
                                        <CardDescription className="mt-1">Update your profile details to help us personalize your experience</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10 mt-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Full Name</label>
                                            <Input
                                                value={profile?.name || ''}
                                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email</label>
                                            <Input
                                                value={profile?.email || ''}
                                                disabled
                                                className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Phone</label>
                                            <Input
                                                value={profile?.phone || ''}
                                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                                                placeholder="Enter your phone number"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Degree</label>
                                            <Input
                                                value={profile?.degree || ''}
                                                onChange={(e) => setProfile({ ...profile, degree: e.target.value })}
                                                placeholder="e.g., B.Tech, B.E., MCA"
                                                className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Branch</label>
                                            <Input
                                                value={profile?.branch || ''}
                                                onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
                                                placeholder="e.g., Computer Science, Electronics"
                                                className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Graduation Year</label>
                                            <Input
                                                type="number"
                                                value={profile?.graduation_year || ''}
                                                onChange={(e) => setProfile({ ...profile, graduation_year: parseInt(e.target.value) })}
                                                placeholder="e.g., 2025"
                                                className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Button 
                                            type="submit" 
                                            disabled={saving}
                                            className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300"
                                        >
                                            <Save className="mr-2 h-5 w-5" />
                                            {saving ? <Loader size="sm" /> : 'Save Changes'}
                                        </Button>
                                    </motion.div>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>
        </DashboardLayout>
    )
}






