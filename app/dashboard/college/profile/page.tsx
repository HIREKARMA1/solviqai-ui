"use client"

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import { Sparkles, Save, User, Building2, GraduationCap, ShieldCheck, Mail, Phone, Globe, MapPin, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CollegeProfile() {
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const data = await apiClient.getCollegeProfile()
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
            await apiClient.updateCollegeProfile(profile)
            toast.success('Profile updated successfully')
        } catch (error) {
            console.error('Error updating profile:', error)
            toast.error('Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    return (
        <DashboardLayout requiredUserType="college">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div
                    className="rounded-[16px] py-[14px] px-[10px] bg-[#F6FBFF] dark:bg-blue-900/10 shadow-[inset_0px_1px_1.5px_rgba(0,0,0,0.25),0px_1px_4px_rgba(0,0,0,0.25)]"
                >
                    <div className="flex items-start gap-[15px]">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                                College Profile
                            </h1>
                            <p className="mt-1 text-gray-600 dark:text-gray-400">
                                Manage your institution information
                            </p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader size="lg" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Information Section */}
                        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 md:p-8">
                            <div className="flex items-center gap-4 mb-8">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Basic Information</h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">College identification and contact details</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Full Name</label>
                                    <Input
                                        value={profile?.college_name || ''}
                                        disabled
                                        className="h-[50px] rounded-[8px] border border-[#939393] p-[10px] bg-white dark:bg-gray-800 font-medium text-gray-500 dark:text-gray-400"
                                    />
                                    <p className="text-[10px] text-gray-400 text-right">Contact admin to change</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email</label>
                                    <Input
                                        value={profile?.email || ''}
                                        disabled
                                        className="h-[50px] rounded-[8px] border border-[#939393] p-[10px] bg-white dark:bg-gray-800 font-medium text-gray-500 dark:text-gray-400"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Phone</label>
                                    <Input
                                        value={profile?.phone || ''}
                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                        placeholder="+91 1234567890"
                                        className="h-[50px] rounded-[8px] border border-[#939393] p-[10px] focus:border-indigo-500 transition-colors bg-white dark:bg-gray-800 dark:border-gray-700"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Website URL</label>
                                    <Input
                                        value={profile?.website_url || ''}
                                        onChange={(e) => setProfile({ ...profile, website_url: e.target.value })}
                                        placeholder="https://your-college.edu"
                                        className="h-[50px] rounded-[8px] border border-[#939393] p-[10px] focus:border-indigo-500 transition-colors bg-white dark:bg-gray-800 dark:border-gray-700"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Institute Type</label>
                                    <Input
                                        value={profile?.institute_type || ''}
                                        onChange={(e) => setProfile({ ...profile, institute_type: e.target.value })}
                                        placeholder="e.g., Computer Science, Electronics"
                                        className="h-[50px] rounded-[8px] border border-[#939393] p-[10px] focus:border-indigo-500 transition-colors bg-white dark:bg-gray-800 dark:border-gray-700"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Established Year</label>
                                    <Input
                                        type="number"
                                        value={profile?.established_year || ''}
                                        onChange={(e) => setProfile({ ...profile, established_year: parseInt(e.target.value) })}
                                        placeholder="e.g., 2025"
                                        className="h-[50px] rounded-[8px] border border-[#939393] p-[10px] focus:border-indigo-500 transition-colors bg-white dark:bg-gray-800 dark:border-gray-700"
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Address</label>
                                    <Textarea
                                        value={profile?.address || ''}
                                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                        placeholder="Full institutional address"
                                        rows={3}
                                        className="min-h-[100px] rounded-[8px] border border-[#939393] p-[10px] focus:border-indigo-500 transition-colors resize-none bg-white dark:bg-gray-800 dark:border-gray-700"
                                    />
                                </div>

                                <div className="md:col-span-2 pt-4">
                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="h-11 bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg shadow-sm shadow-blue-200 dark:shadow-none transition-all"
                                    >
                                        {saving ? <Loader size="sm" className="mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </section>

                        {/* Contact Person Section */}
                        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 md:p-8">
                            <div className="mb-6">
                                <h2 className="text-[22px] font-bold text-black dark:text-white">Contact Person Details</h2>
                                <p className="text-[#5F6D7E] dark:text-gray-400 text-sm mt-1">Primary point of contact for placement activities</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contact Person Name</label>
                                    <Input
                                        value={profile?.contact_person_name || ''}
                                        onChange={(e) => setProfile({ ...profile, contact_person_name: e.target.value })}
                                        placeholder="e.g., Dr. John Smith"
                                        className="h-[50px] rounded-[8px] border border-[#939393] p-[10px] focus:border-indigo-500 transition-colors bg-white dark:bg-gray-800 dark:border-gray-700"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Designation</label>
                                    <Input
                                        value={profile?.contact_designation || ''}
                                        onChange={(e) => setProfile({ ...profile, contact_designation: e.target.value })}
                                        placeholder="e.g., Placement Officer"
                                        className="h-[50px] rounded-[8px] border border-[#939393] p-[10px] focus:border-indigo-500 transition-colors bg-white dark:bg-gray-800 dark:border-gray-700"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Academic Information Section */}
                        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 md:p-8">
                            <div className="mb-6">
                                <h2 className="text-[22px] font-bold text-black dark:text-white">Academic Information</h2>
                                <p className="text-[#5F6D7E] dark:text-gray-400 text-sm mt-1">Courses and programs offered</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Courses Offered</label>
                                    <Textarea
                                        value={profile?.courses_offered || ''}
                                        onChange={(e) => setProfile({ ...profile, courses_offered: e.target.value })}
                                        placeholder="e.g., B.Tech, M.Tech, MBA, B.Sc"
                                        rows={3}
                                        className="min-h-[100px] rounded-[8px] border border-[#939393] p-[10px] focus:border-indigo-500 transition-colors resize-none bg-white dark:bg-gray-800 dark:border-gray-700"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Branches/Departments</label>
                                    <Textarea
                                        value={profile?.branch || ''}
                                        onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
                                        placeholder="e.g., Computer Science, Mechanical, Civil"
                                        rows={3}
                                        className="min-h-[100px] rounded-[8px] border border-[#939393] p-[10px] focus:border-indigo-500 transition-colors resize-none bg-white dark:bg-gray-800 dark:border-gray-700"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Status Information Section */}
                        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 md:p-8">
                            <div className="flex items-center gap-4 mb-8">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Account Status</h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Verification and account information</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Verification Status</label>
                                    <div className="flex items-center gap-3 h-11">
                                        {profile?.verified ? (
                                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
                                                <ShieldCheck className="w-4 h-4" /> Verified
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800">
                                                <Sparkles className="w-4 h-4" /> Pending Verification
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-400">Contact admin for updates</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Account Created</label>
                                    <Input
                                        value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        }) : ''}
                                        disabled
                                        className="h-[50px] rounded-[8px] border border-[#939393] p-[10px] bg-white dark:bg-gray-800 font-medium text-gray-500 dark:text-gray-400"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Global Save (Optional/Backup) */}
                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                disabled={saving}
                                className="h-12 bg-gray-900 hover:bg-black text-white px-8 rounded-xl shadow-lg shadow-gray-200 dark:shadow-none transition-all dark:bg-white dark:text-gray-900"
                            >
                                {saving ? <Loader size="sm" className="mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Save All Changes
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </DashboardLayout>
    )
}
