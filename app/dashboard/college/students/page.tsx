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
        // Load existing subscription data including expiry date
        const existingExpiry = student.subscription_expiry
            ? new Date(student.subscription_expiry).toISOString().split('T')[0]
            : ''
        setSubscriptionData({
            subscription_type: student.subscription_type || 'free',
            subscription_expiry: existingExpiry
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
            <div className="space-y-8 max-w-[1250px] mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center bg-[#DBEAFF]/30 dark:bg-[#2A2C38] border border-[#989898] dark:border-[#5B5B5B] rounded-[16px] p-6 md:p-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Students Management</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Manage your students</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => setShowBulkUploadModal(true)}
                            variant="outline"
                            className="h-[34px] border-[#AEAEAE] dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-[8px] px-4 font-medium"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Bulk Upload
                        </Button>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="h-[34px] bg-[#1E7BFF] hover:bg-[#1E7BFF]/90 text-white rounded-[8px] px-4 font-medium"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Student
                        </Button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white dark:bg-[#2A2C38] border border-[#989898] dark:border-[#5B5B5B] rounded-[16px] p-[10px] flex flex-col gap-[20px]">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center px-2">
                        <div className="flex items-center gap-2">
                            <Search className="w-5 h-5 text-gray-900 dark:text-white" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Search & Filter Students</h2>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <span className="text-[#00C853]">{activeCount} Active</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-900 dark:text-gray-400">{inactiveCount} Inactive</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-[20px]">
                        <div className="relative">
                            <Input
                                type="text"
                                placeholder="Search by name, email, or phone.."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-4 h-[50px] rounded-[16px] border-[#B7B7B7] dark:border-gray-600 bg-white dark:bg-gray-800 text-base shadow-none focus-visible:ring-1 focus-visible:ring-gray-400"
                            />
                        </div>
                        <div className="flex items-center gap-2 px-2">
                            <input
                                type="checkbox"
                                id="showInactive"
                                checked={showInactive}
                                onChange={(e) => setShowInactive(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <label htmlFor="showInactive" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                                Show inactive students
                            </label>
                        </div>
                    </div>
                </div>

                {/* Students List */}
                <div className="px-2 mb-2">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Students ({filteredStudents.length})</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">All students in your college</p>
                </div>
                <div className="bg-white dark:bg-[#090C0C] border border-[#989898] dark:border-[#5B5B5B] rounded-[16px] overflow-hidden px-[8px] py-[16px] flex flex-col gap-[24px]">

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-[#5B5B5B] bg-white dark:bg-[#090C0C]">
                                    <th className="text-left py-4 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Name</th>
                                    <th className="text-left py-4 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Email</th>
                                    <th className="text-left py-4 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Phone</th>
                                    <th className="text-left py-4 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Degree</th>
                                    <th className="text-left py-4 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Branch</th>
                                    <th className="text-left py-4 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Year</th>
                                    <th className="text-left py-4 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Status</th>
                                    <th className="text-left py-4 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Subscription</th>
                                    <th className="text-left py-4 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={10} className="py-12 text-center">
                                            <div className="flex justify-center">
                                                <Loader />
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-12 text-center text-gray-500 dark:text-gray-400">
                                            No students found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student) => (
                                        <tr key={student.id} className="border-b border-gray-50 dark:border-[#5B5B5B] dark:bg-[#090C0C] hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">

                                            <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">{student.name}</td>
                                            <td className="py-4 px-4 text-gray-600 dark:text-gray-400 text-sm">{student.email}</td>
                                            <td className="py-4 px-4 text-gray-600 dark:text-gray-400 text-sm">{student.phone}</td>
                                            <td className="py-4 px-4 text-gray-600 dark:text-gray-400 text-sm">{student.degree || '-'}</td>
                                            <td className="py-4 px-4 text-gray-600 dark:text-gray-400 text-sm">{student.branch || '-'}</td>
                                            <td className="py-4 px-4 text-gray-600 dark:text-gray-400 text-sm">{student.graduation_year || '-'}</td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${student.status?.toUpperCase() === 'ACTIVE' ? 'bg-[#00C951]' : 'bg-gray-400'}`} />
                                                    <span className={`text-sm font-medium ${student.status?.toUpperCase() === 'ACTIVE' ? 'text-[#00C951]' : 'text-gray-500'}`}>
                                                        {student.status?.toUpperCase() === 'ACTIVE' ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="bg-[#00C951] text-white text-xs px-3 py-1 rounded-full font-medium">
                                                    {student.subscription_type || 'college_license'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => window.location.href = `/dashboard/college/students/${student.id}/analytics`}
                                                        className="bg-[#6F30FD] hover:bg-[#6F30FD]/90 text-white h-8 px-4 text-xs font-medium rounded-[6px]"
                                                    >
                                                        Analytics
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleEditStudent(student)}
                                                        className="bg-[#0065F4] hover:bg-[#0065F4]/90 text-white h-8 px-4 text-xs font-medium rounded-[6px]"
                                                    >
                                                        edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleOpenSubscriptionModal(student)}
                                                        className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white h-8 px-4 text-xs font-medium rounded-[6px]"
                                                    >
                                                        Subscription
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
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
                                        {selectedStudent.subscription_expiry && (
                                            <p className="mt-1">
                                                <strong><Calendar className="h-3 w-3 inline mr-1" />Current Expiry:</strong>
                                                <span className="text-blue-600 dark:text-blue-400 ml-1">
                                                    {new Date(selectedStudent.subscription_expiry).toLocaleDateString()}
                                                </span>
                                            </p>
                                        )}
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
