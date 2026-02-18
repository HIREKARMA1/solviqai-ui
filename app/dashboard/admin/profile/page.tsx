"use client"

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import { User, Shield, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminProfile() {
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            // TODO: Implement admin profile API endpoint
            // const data = await apiClient.getAdminProfile()
            // For now, use current user data
            const user = await apiClient.getCurrentUser()
            setProfile({
                name: user.name,
                email: user.email,
                phone: user.phone || '',
                role: user.role || 'admin',
            })
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
            // TODO: Implement admin profile update API endpoint
            // await apiClient.updateAdminProfile(profile)
            toast.success('Profile updated successfully')
        } catch (error) {
            console.error('Error updating profile:', error)
            toast.error('Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    return (
        <DashboardLayout requiredUserType="admin">
            <div className="space-y-6 pt-1 sm:pt-4 pb-8">
                {/* Header - matches Figma Admin Profile banner */}
                <div className="rounded-[16px] border border-[#E5E7EB] bg-[#F6FBFF] dark:bg-[#1C2938] dark:border-[#797979] px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
                    <div>
                        <h1 className="text-[28px] sm:text-[32px] font-bold leading-[40px] bg-gradient-to-r from-[#0068FC] to-[#8D5AFF] bg-clip-text text-transparent dark:bg-gradient-to-r from-[#1C6FE6] to-[#8C59FF]">
                            Admin Profile
                        </h1>
                        <p className="mt-1 text-sm sm:text-base text-[#4B5563] dark:text-[#FFFFFF]">
                            Manage your institution information
                        </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-3">
                        <button
                            type="button"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#111827] dark:border-[#3d4f5f] dark:bg-[#2A2C38] dark:text-[#FFFFFF]"
                            aria-label="Toggle theme"
                        >
                            <Shield className="h-5 w-5" />
                        </button>
              
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader size="lg" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <Card className="rounded-[16px] border border-[#E5E7EB] shadow-sm dark:border-[#3d4f5f] dark:bg-[#2A2C38]">
                            <CardHeader className="pb-3 flex flex-row items-start gap-3">
                                <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-[16px] bg-white border border-[#E5E7EB] dark:bg-[#1C2938] dark:border-[#BFBEBE]">
                                    <Building2 className="h-5 w-5 text-[#111827] dark:text-[#FFFFFF]" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg sm:text-xl font-bold text-[#111827] dark:text-[#FFFFFF]">
                                        Basic Information
                                    </CardTitle>
                                    <CardDescription className="text-sm text-[#6B7280] dark:text-[#FFFFFF]">
                                        Manage your account information
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-0 pb-5 px-4 sm:px-6">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-[#111827] dark:text-[#FFFFFF]">Full Name</label>
                                        <Input
                                            value={profile?.name || ''}
                                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                            placeholder="Admin Name"
                                            className="h-[50px] rounded-[8px] border border-[#939393] dark:border-[#BFBEBE] dark:bg-[#1C2938] dark:text-[#FFFFFF] dark:placeholder:text-[#FFFFFF]/70"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-[#111827] dark:text-[#FFFFFF]">Email</label>
                                        <Input
                                            value={profile?.email || ''}
                                            disabled
                                            className="h-[50px] rounded-[8px] border border-[#939393] dark:border-[#BFBEBE] bg-gray-100 dark:bg-[#1C2938] dark:text-[#FFFFFF]"
                                        />
                                        <p className="text-xs text-[#6B7280] dark:text-[#FFFFFF]">Primary email cannot be changed</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-[#111827] dark:text-[#FFFFFF]">Phone</label>
                                        <Input
                                            value={profile?.phone || ''}
                                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                            placeholder="292382339"
                                            className="h-[50px] rounded-[8px] border border-[#939393] dark:border-[#BFBEBE] dark:bg-[#1C2938] dark:text-[#FFFFFF] dark:placeholder:text-[#FFFFFF]/70"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-[#111827] dark:text-[#FFFFFF]">Role</label>
                                        <Input
                                            value={profile?.role || 'admin'}
                                            disabled
                                            className="h-[50px] rounded-[8px] border border-[#939393] dark:border-[#BFBEBE] bg-gray-100 dark:bg-[#1C2938] dark:text-[#FFFFFF]"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Account Status */}
                        <Card className="rounded-[16px] border border-[#AAAAAA] dark:border-[#3d4f5f] dark:bg-[#2A2C38] shadow-sm">
                            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-[24px] font-semibold text-[#000000] dark:text-[#FFFFFF]">
                                        Account Status
                                    </CardTitle>
                                    <CardDescription className="text-sm text-[#6B7280] dark:text-[#FFFFFF]">
                                        Account verification and information
                                    </CardDescription>
                                </div>
                                <div className="inline-flex h-[50px] w-[126px] items-center justify-center rounded-[43px] border border-[#16A34A] bg-[#0FDC00] px-3 text-sm font-semibold text-white">
                                    Active
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0 pb-3 px-4 sm:px-6" />
                        </Card>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-[30px] pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fetchProfile()}
                                disabled={saving}
                                className="h-[50px] px-[13px] rounded-[8px] border border-[#1E7BFF] dark:border-[#FFFFFF] text-sm font-medium bg-white dark:bg-[#2A2C38] text-[#1E7BFF] dark:text-[#FFFFFF] hover:dark:bg-[#3d4f5f]"
                            >
                                Reset Changes
                            </Button>
                            <Button
                                type="submit"
                                disabled={saving}
                                className="h-[50px] px-6 rounded-[8px] bg-[#1E7BFF] hover:bg-[#1863CC] text-white text-sm font-semibold border border-[#1E7BFF]"
                            >
                                {saving ? <Loader size="sm" /> : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </DashboardLayout>
    )
}

