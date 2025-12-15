"use client"

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader } from '@/components/ui/loader'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'
import { Home, Users, GraduationCap, BarChart3, Plus, Search, Pencil, Trash2, Upload, X, UserX, CreditCard, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { BulkUploadModal } from '@/components/BulkUploadModal'


export default function CollegeStudents() {
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showInactive, setShowInactive] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<any>(null)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        degree: '',
        branch: '',
        graduation_year: '',
        institution: '',
        subscription_type: 'free',
        subscription_expiry: '',
    })
    const [subscriptionData, setSubscriptionData] = useState({
        subscription_type: 'free' as 'free' | 'premium' | 'college_license',
        subscription_expiry: ''
    })
    const [editFormData, setEditFormData] = useState({
        name: '',
        email: '',
        phone: '',
        degree: '',
        branch: '',
        graduation_year: '',
        institution: '',
    })
    const [creating, setCreating] = useState(false)
    const [updating, setUpdating] = useState(false)
    const [updatingSubscription, setUpdatingSubscription] = useState(false)

    useEffect(() => {
        fetchStudents()
    }, [])

    const fetchStudents = async () => {
        try {
            setLoading(true)
            const data = await apiClient.getCollegeStudents()
            setStudents(data.students || [])
        } catch (error) {
            console.error('Error fetching students:', error)
            toast.error('Failed to load students')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateStudent = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)

        try {
            await apiClient.createCollegeStudent(formData)
            toast.success('Student created successfully!')
            setShowCreateModal(false)
            setFormData({
                name: '',
                email: '',
                phone: '',
                degree: '',
                branch: '',
                graduation_year: '',
                institution: '',
                subscription_type: 'free',
                subscription_expiry: '',
            })
            fetchStudents()
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

    const handleEditStudent = (student: any) => {
        setSelectedStudent(student)
        setEditFormData({
            name: student.name || '',
            email: student.email || '',
            phone: student.phone || '',
            degree: student.degree || '',
            branch: student.branch || '',
            graduation_year: student.graduation_year || '',
            institution: student.institution || '',
        })
        setShowEditModal(true)
    }

    const handleUpdateStudent = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedStudent) return

        setUpdating(true)

        try {
            await apiClient.updateCollegeStudent(selectedStudent.id, editFormData)
            toast.success('Student updated successfully!')
            setShowEditModal(false)
            setSelectedStudent(null)
            fetchStudents()
        } catch (error: any) {
            console.error('Error updating student:', error)
            const errorDetail = error.response?.data?.detail
            let errorMessage = 'Failed to update student'
            
            if (typeof errorDetail === 'string') {
                errorMessage = errorDetail
            } else if (Array.isArray(errorDetail)) {
                errorMessage = errorDetail.map((err: any) => err.msg || JSON.stringify(err)).join(', ')
            } else if (typeof errorDetail === 'object' && errorDetail !== null) {
                errorMessage = errorDetail.msg || JSON.stringify(errorDetail)
            }
            
            toast.error(errorMessage)
        } finally {
            setUpdating(false)
        }
    }

    const handleDeleteStudent = async (studentId: string) => {
        if (!confirm('Are you sure you want to mark this student as inactive? The student will not be permanently deleted.')) return

        try {
            await apiClient.deleteCollegeStudent(studentId)
            toast.success('Student marked as inactive successfully!')
            fetchStudents()
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

    const handleActivateStudent = async (studentId: string) => {
        if (!confirm('Are you sure you want to activate this student? The student will be able to access their account.')) return

        try {
            await apiClient.activateCollegeStudent(studentId)
            toast.success('Student activated successfully!')
            fetchStudents()
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

    const handleBulkUpload = async (file: File) => {
        try {
            const result = await apiClient.uploadCollegeStudentsCSV(file)
            toast.success(result.message || `${result.successful} students uploaded successfully!`)
            setShowBulkUploadModal(false)
            fetchStudents()
            return result
        } catch (error: any) {
            console.error('Error uploading CSV:', error)
            const errorMessage = error.response?.data?.detail || 'Failed to upload CSV file'
            toast.error(errorMessage)
            throw error
        }
    }

    const handleOpenSubscriptionModal = (student: any) => {
        setSelectedStudent(student)
        setSubscriptionData({
            subscription_type: student.subscription_type || 'free',
            subscription_expiry: ''
        })
        setShowSubscriptionModal(true)
    }

    const handleUpdateSubscription = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedStudent) return

        setUpdatingSubscription(true)
        try {
            const payload: any = {
                subscription_type: subscriptionData.subscription_type
            }
            
            // Only include expiry date if it's set
            if (subscriptionData.subscription_expiry) {
                payload.subscription_expiry = new Date(subscriptionData.subscription_expiry).toISOString()
            }

            const response = await apiClient.updateCollegeStudentSubscription(selectedStudent.id, payload)
            
            // Refresh the student list to show updated data
            await fetchStudents()
            
            toast.success(`Subscription updated! ${selectedStudent.name} is now on ${response.new_subscription} plan`)
            setShowSubscriptionModal(false)
            setSelectedStudent(null)
        } catch (error: any) {
            console.error('Error updating subscription:', error)
            const errorDetail = error.response?.data?.detail
            let errorMessage = 'Failed to update subscription'
            
            if (typeof errorDetail === 'string') {
                errorMessage = errorDetail
            } else if (Array.isArray(errorDetail)) {
                errorMessage = errorDetail.map((err: any) => err.msg || JSON.stringify(err)).join(', ')
            } else if (typeof errorDetail === 'object' && errorDetail !== null) {
                errorMessage = errorDetail.msg || JSON.stringify(errorDetail)
            }
            
            toast.error(errorMessage)
        } finally {
            setUpdatingSubscription(false)
        }
    }

    const filteredStudents = students.filter(student => {
        // Filter by search term
        const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.phone?.includes(searchTerm)
        
        // Filter by status
        const matchesStatus = showInactive || student.status?.toUpperCase() === 'ACTIVE'
        
        return matchesSearch && matchesStatus
    })
    
    const activeCount = students.filter(s => s.status?.toUpperCase() === 'ACTIVE').length
    const inactiveCount = students.filter(s => s.status?.toUpperCase() === 'INACTIVE').length

    return (
        <DashboardLayout requiredUserType="college">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Students Management</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your students</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => setShowBulkUploadModal(true)} variant="outline">
                            <Upload className="w-4 h-4 mr-2" />
                            Bulk Upload
                        </Button>
                        <Button onClick={() => setShowCreateModal(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Student
                        </Button>
                    </div>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Search & Filter Students</CardTitle>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium text-green-600">{activeCount} Active</span>
                                <span>•</span>
                                <span className="font-medium text-gray-500">{inactiveCount} Inactive</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                type="text"
                                placeholder="Search by name, email, or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="showInactive"
                                checked={showInactive}
                                onChange={(e) => setShowInactive(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="showInactive" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                Show inactive students
                            </label>
                        </div>
                    </CardContent>
                </Card>

                {/* Students List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Students ({filteredStudents.length})</CardTitle>
                        <CardDescription>All students in your college</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader />
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 dark:text-gray-400">No students found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b dark:border-gray-700">
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Name</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Email</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Phone</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Degree</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Branch</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Year</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Subscription</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.map((student) => (
                                            <tr key={student.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                                <td className="py-3 px-4">
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{student.email}</td>
                                                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{student.phone}</td>
                                                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{student.degree || '-'}</td>
                                                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{student.branch || '-'}</td>
                                                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{student.graduation_year || '-'}</td>
                                                <td className="py-3 px-4">
                                                    <Badge 
                                                        variant={
                                                            student.subscription_type === 'premium' ? 'default' :
                                                            student.subscription_type === 'college_license' ? 'success' :
                                                            'outline'
                                                        }
                                                        className="capitalize"
                                                    >
                                                        {student.subscription_type || 'free'}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge 
                                                        variant={student.status?.toUpperCase() === 'ACTIVE' ? 'default' : 'secondary'}
                                                        className={
                                                            student.status?.toUpperCase() === 'INACTIVE' 
                                                                ? 'bg-gray-500 hover:bg-gray-600' 
                                                                : student.status?.toUpperCase() === 'SUSPENDED' 
                                                                ? 'bg-red-500 hover:bg-red-600'
                                                                : ''
                                                        }
                                                    >
                                                        {student.status?.toUpperCase() || 'ACTIVE'}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => window.location.href = `/dashboard/college/students/${student.id}/analytics`}
                                                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                                            title="View student analytics"
                                                        >
                                                            <BarChart3 className="w-4 h-4 mr-1" />
                                                            Analytics
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEditStudent(student)}
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            title="Edit student details"
                                                        >
                                                            <Pencil className="w-4 h-4 mr-1" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleOpenSubscriptionModal(student)}
                                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            title="Manage subscription plan"
                                                        >
                                                            <CreditCard className="w-4 h-4 mr-1" />
                                                            Subscription
                                                        </Button>
                                                        {student.status?.toUpperCase() === 'ACTIVE' ? (
                                                        <Button
                                                                variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteStudent(student.id)}
                                                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                                title="Mark student as inactive"
                                                            >
                                                                <UserX className="w-4 h-4 mr-1" />
                                                                Deactivate
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleActivateStudent(student.id)}
                                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                title="Activate student"
                                                            >
                                                                <Users className="w-4 h-4 mr-1" />
                                                                Activate
                                                        </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Create Student Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Student Account</h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <form onSubmit={handleCreateStudent} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Name *</label>
                                    <Input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email *</label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Phone *</label>
                                    <Input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Degree</label>
                                        <Input
                                            type="text"
                                            value={formData.degree}
                                            onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Branch</label>
                                        <Input
                                            type="text"
                                            value={formData.branch}
                                            onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Graduation Year</label>
                                        <Input
                                            type="number"
                                            value={formData.graduation_year}
                                            onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Institution</label>
                                        <Input
                                            type="text"
                                            value={formData.institution}
                                            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Subscription Type */}
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                        Subscription Plan *
                                    </label>
                                    <select
                                        value={formData.subscription_type}
                                        onChange={(e) => setFormData({ ...formData, subscription_type: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                                        required
                                    >
                                        <option value="free">Free - Limited (1 assessment, 30% career guidance)</option>
                                        <option value="premium">Premium - Unlimited access</option>
                                        <option value="college_license">College License - Unlimited access</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Select the subscription plan for this student
                                    </p>
                                </div>

                                {/* Subscription Expiry (Optional) */}
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                        <Calendar className="h-4 w-4 inline mr-1" />
                                        Subscription Expiry (Optional)
                                    </label>
                                    <Input
                                        type="date"
                                        value={formData.subscription_expiry}
                                        onChange={(e) => setFormData({ ...formData, subscription_expiry: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                        placeholder="Leave empty for no expiry"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Leave empty for lifetime access
                                    </p>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
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
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Student Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Student</h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowEditModal(false)}
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <form onSubmit={handleUpdateStudent} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Name *</label>
                                    <Input
                                        type="text"
                                        value={editFormData.name}
                                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email *</label>
                                    <Input
                                        type="email"
                                        value={editFormData.email}
                                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Phone *</label>
                                    <Input
                                        type="tel"
                                        value={editFormData.phone}
                                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Degree</label>
                                        <Input
                                            type="text"
                                            value={editFormData.degree}
                                            onChange={(e) => setEditFormData({ ...editFormData, degree: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Branch</label>
                                        <Input
                                            type="text"
                                            value={editFormData.branch}
                                            onChange={(e) => setEditFormData({ ...editFormData, branch: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Graduation Year</label>
                                        <Input
                                            type="number"
                                            value={editFormData.graduation_year}
                                            onChange={(e) => setEditFormData({ ...editFormData, graduation_year: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Institution</label>
                                        <Input
                                            type="text"
                                            value={editFormData.institution}
                                            onChange={(e) => setEditFormData({ ...editFormData, institution: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowEditModal(false)}
                                        disabled={updating}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={updating}>
                                        {updating ? 'Updating...' : 'Update Student'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Subscription Management Modal */}
            {showSubscriptionModal && selectedStudent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <CardHeader>
                            <CardTitle>Manage Subscription</CardTitle>
                            <CardDescription>
                                Update subscription plan for {selectedStudent.name}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdateSubscription} className="space-y-4">
                                {/* Current Plan Info */}
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Current Plan:</span>
                                        <Badge 
                                            variant={
                                                selectedStudent.subscription_type === 'premium' ? 'default' :
                                                selectedStudent.subscription_type === 'college_license' ? 'success' :
                                                'outline'
                                            }
                                            className="capitalize"
                                        >
                                            {selectedStudent.subscription_type || 'free'}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                        <p><strong>Email:</strong> {selectedStudent.email}</p>
                                    </div>
                                </div>

                                {/* New Subscription Type */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        New Subscription Plan <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={subscriptionData.subscription_type}
                                        onChange={(e) => setSubscriptionData({
                                            ...subscriptionData,
                                            subscription_type: e.target.value as 'free' | 'premium' | 'college_license'
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                                    >
                                        <option value="free">Free - Limited (1 assessment, 30% career guidance)</option>
                                        <option value="premium">Premium - Unlimited access</option>
                                        <option value="college_license">College License - Unlimited access</option>
                                    </select>
                                </div>

                                {/* Expiry Date (Optional) */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        <Calendar className="h-4 w-4 inline mr-1" />
                                        Subscription Expiry Date (Optional)
                                    </label>
                                    <Input
                                        type="date"
                                        value={subscriptionData.subscription_expiry}
                                        onChange={(e) => setSubscriptionData({
                                            ...subscriptionData,
                                            subscription_expiry: e.target.value
                                        })}
                                        min={new Date().toISOString().split('T')[0]}
                                        placeholder="Leave empty for no expiry"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Leave empty for lifetime access. Recommended for premium plans.
                                    </p>
                                </div>

                                {/* Plan Features Info */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
                                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                        {subscriptionData.subscription_type === 'free' && '📋 Free Plan Features:'}
                                        {subscriptionData.subscription_type === 'premium' && '⭐ Premium Plan Features:'}
                                        {subscriptionData.subscription_type === 'college_license' && '🎓 College License Features:'}
                                    </p>
                                    <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 ml-4 list-disc">
                                        {subscriptionData.subscription_type === 'free' && (
                                            <>
                                                <li>1 assessment only</li>
                                                <li>Career guidance up to 30%</li>
                                                <li>Basic features</li>
                                            </>
                                        )}
                                        {(subscriptionData.subscription_type === 'premium' || subscriptionData.subscription_type === 'college_license') && (
                                            <>
                                                <li>Unlimited assessments</li>
                                                <li>Full career guidance (100%)</li>
                                                <li>All platform features</li>
                                            </>
                                        )}
                                    </ul>
                                </div>

                                {/* Important Note */}
                                {selectedStudent.subscription_type === 'free' && 
                                 (subscriptionData.subscription_type === 'premium' || subscriptionData.subscription_type === 'college_license') && (
                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                        <p className="text-sm text-green-700 dark:text-green-300">
                                            <strong>✓ Upgrading:</strong> This will grant the student immediate unlimited access.
                                        </p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2 justify-end pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setShowSubscriptionModal(false)
                                            setSelectedStudent(null)
                                        }}
                                        disabled={updatingSubscription}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={updatingSubscription}>
                                        {updatingSubscription ? 'Updating...' : 'Update Subscription'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Bulk Upload Modal */}
            {showBulkUploadModal && (
                <BulkUploadModal
                    isOpen={showBulkUploadModal}
                    onClose={() => setShowBulkUploadModal(false)}
                    onSubmit={handleBulkUpload}
                />
            )}
        </DashboardLayout>
    )
}

