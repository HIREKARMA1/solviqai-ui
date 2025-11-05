"use client"

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import { User, Shield } from 'lucide-react'
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
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Admin Profile</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage your account information</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader size="lg" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                                <CardDescription>Account identification and contact details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Name</label>
                                        <Input
                                            value={profile?.name || ''}
                                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                            placeholder="Admin Name"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email</label>
                                        <Input
                                            value={profile?.email || ''}
                                            disabled
                                            className="bg-gray-100 dark:bg-gray-800"
                                        />
                                        <p className="text-xs text-gray-500">Primary email cannot be changed</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Phone Number</label>
                                        <Input
                                            value={profile?.phone || ''}
                                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                            placeholder="+91 1234567890"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Role</label>
                                        <Input
                                            value={profile?.role || 'admin'}
                                            disabled
                                            className="bg-gray-100 dark:bg-gray-800"
                                        />
                                        <p className="text-xs text-gray-500">Administrator role</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Account Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Account Status</CardTitle>
                                <CardDescription>Account verification and information</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Account Status</label>
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                <Shield className="w-4 h-4 mr-1" />
                                                Active
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">Administrator account</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fetchProfile()}
                                disabled={saving}
                            >
                                Reset Changes
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving ? <Loader size="sm" /> : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </DashboardLayout>
    )
}

