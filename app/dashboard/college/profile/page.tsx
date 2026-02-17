"use client"

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import { Home, Users, GraduationCap, BarChart3, Calendar } from 'lucide-react'
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
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">College Profile</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage your institution information</p>
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
                                <CardDescription>College identification and contact details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">College Name</label>
                                        <Input
                                            value={profile?.college_name || ''}
                                            disabled
                                            className="bg-gray-100 dark:bg-gray-800"
                                        />
                                        <p className="text-xs text-gray-500">Contact admin to change college name</p>
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
                                        <label className="text-sm font-medium">Website URL</label>
                                        <Input
                                            value={profile?.website_url || ''}
                                            onChange={(e) => setProfile({ ...profile, website_url: e.target.value })}
                                            placeholder="https://your-college.edu"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Institute Type</label>
                                        <Input
                                            value={profile?.institute_type || ''}
                                            onChange={(e) => setProfile({ ...profile, institute_type: e.target.value })}
                                            placeholder="e.g., Engineering, Arts & Science"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Established Year</label>
                                        <Input
                                            type="number"
                                            value={profile?.established_year || ''}
                                            onChange={(e) => setProfile({ ...profile, established_year: parseInt(e.target.value) })}
                                            placeholder="e.g., 1995"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Address</label>
                                    <Textarea
                                        value={profile?.address || ''}
                                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                        placeholder="Full institutional address"
                                        rows={3}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contact Person */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Contact Person Details</CardTitle>
                                <CardDescription>Primary point of contact for placement activities</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Contact Person Name</label>
                                        <Input
                                            value={profile?.contact_person_name || ''}
                                            onChange={(e) => setProfile({ ...profile, contact_person_name: e.target.value })}
                                            placeholder="e.g., Dr. John Smith"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Designation</label>
                                        <Input
                                            value={profile?.contact_designation || ''}
                                            onChange={(e) => setProfile({ ...profile, contact_designation: e.target.value })}
                                            placeholder="e.g., Placement Officer"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Academic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Academic Information</CardTitle>
                                <CardDescription>Courses and programs offered</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Courses Offered</label>
                                        <Textarea
                                            value={profile?.courses_offered || ''}
                                            onChange={(e) => setProfile({ ...profile, courses_offered: e.target.value })}
                                            placeholder="e.g., B.Tech, M.Tech, MBA, B.Sc"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Branches/Departments</label>
                                        <Textarea
                                            value={profile?.branch || ''}
                                            onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
                                            placeholder="e.g., Computer Science, Mechanical, Civil"
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Status Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Account Status</CardTitle>
                                <CardDescription>Verification and account information</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Verification Status</label>
                                        <div className="flex items-center gap-2">
                                            {profile?.verified ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                    ✓ Verified
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                    ⏳ Pending Verification
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">Contact admin for verification</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Account Created</label>
                                        <Input
                                            value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            }) : ''}
                                            disabled
                                            className="bg-gray-100 dark:bg-gray-800"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">License Plan</label>
                                        <div>
                                            <Badge
                                                variant={
                                                    profile?.license_type === 'premium' ? 'default' :
                                                        profile?.license_type === 'enterprise' ? 'success' :
                                                            'outline'
                                                }
                                                className="capitalize mb-2"
                                            >
                                                {profile?.license_type || 'free'}
                                            </Badge>
                                            {profile?.license_expiry && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    Expires: {new Date(profile.license_expiry).toLocaleDateString('en-IN', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            )}
                                        </div>
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

