"use client"

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader } from '@/components/ui/loader'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'
import { Home, Users, Building2, BarChart3, Plus, Search, Pencil, Trash2, Upload, UserX, UserPlus, CreditCard, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { BulkUploadModal } from '@/components/BulkUploadModal'


export default function AdminColleges() {
    const [colleges, setColleges] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditCollegeModal, setShowEditCollegeModal] = useState(false)
    const [showStudentsModal, setShowStudentsModal] = useState(false)
    const [showCreateStudentModal, setShowCreateStudentModal] = useState(false)
    const [showEditStudentModal, setShowEditStudentModal] = useState(false)
    const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
    const [selectedCollege, setSelectedCollege] = useState<any>(null)
    const [selectedStudent, setSelectedStudent] = useState<any>(null)
    const [collegeStudents, setCollegeStudents] = useState<any[]>([])
    const [loadingStudents, setLoadingStudents] = useState(false)
    
    // License management state
    const [showLicenseModal, setShowLicenseModal] = useState(false)
    const [licenseData, setLicenseData] = useState({
        license_type: 'premium',
        license_expiry: '',
        total_students: 500
    })
    const [updatingLicense, setUpdatingLicense] = useState(false)
    const [formData, setFormData] = useState({
        college_name: '',
        email: '',
        phone: '',
        contact_person_name: '',
        contact_designation: '',
        website_url: '',
        institute_type: '',
        established_year: '',
        address: '',
        courses_offered: '',
        branch: '',
        total_students: 100,
    })
    const [studentFormData, setStudentFormData] = useState({
        name: '',
        email: '',
        phone: '',
        degree: '',
        branch: '',
        graduation_year: '',
    })
    const [editStudentFormData, setEditStudentFormData] = useState({
        name: '',
        email: '',
        phone: '',
        degree: '',
        branch: '',
        graduation_year: '',
    })
    const [editCollegeFormData, setEditCollegeFormData] = useState({
        phone: '',
        contact_person_name: '',
        contact_designation: '',
        website_url: '',
        institute_type: '',
        established_year: '',
        address: '',
        courses_offered: '',
        branch: '',
        total_students: 100,
    })
    const [creating, setCreating] = useState(false)
    const [updating, setUpdating] = useState(false)
    const [creatingStudent, setCreatingStudent] = useState(false)
    const [updatingStudent, setUpdatingStudent] = useState(false)

    useEffect(() => {
        fetchColleges()
    }, [])

    const fetchColleges = async () => {
        try {
            const data = await apiClient.getColleges()
            setColleges(data.colleges || [])
        } catch (error) {
            console.error('Error fetching colleges:', error)
            toast.error('Failed to load colleges')
        } finally {
            setLoading(false)
        }
    }

    const handleViewStudents = async (college: any) => {
        setSelectedCollege(college)
        setShowStudentsModal(true)
        setLoadingStudents(true)
        
        try {
            const data = await apiClient.getStudents({ college_id: college.id })
            setCollegeStudents(data.students || [])
        } catch (error) {
            console.error('Error fetching students:', error)
            toast.error('Failed to load students')
        } finally {
            setLoadingStudents(false)
        }
    }

    const handleCreateStudentInCollege = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreatingStudent(true)

        try {
            const response = await apiClient.createStudent({
                ...studentFormData,
                graduation_year: studentFormData.graduation_year ? parseInt(studentFormData.graduation_year) : null,
                college_id: selectedCollege?.id,
            })

            toast.success(`Student created! Temporary password: ${response.temporary_password}`)
            setShowCreateStudentModal(false)
            setStudentFormData({
                name: '',
                email: '',
                phone: '',
                degree: '',
                branch: '',
                graduation_year: '',
            })
            
            // Refresh the student list
            if (selectedCollege) {
                const data = await apiClient.getStudents({ college_id: selectedCollege.id })
                setCollegeStudents(data.students || [])
            }
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
            setCreatingStudent(false)
        }
    }

    const handleEditStudent = (student: any) => {
        setSelectedStudent(student)
        setEditStudentFormData({
            name: student.name || '',
            email: student.email || '',
            phone: student.phone || '',
            degree: student.degree || '',
            branch: student.branch || '',
            graduation_year: student.graduation_year ? String(student.graduation_year) : '',
        })
        setShowEditStudentModal(true)
    }

    const handleUpdateStudent = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedStudent) return

        setUpdatingStudent(true)

        try {
            await apiClient.updateStudent(selectedStudent.id, {
                ...editStudentFormData,
                graduation_year: editStudentFormData.graduation_year ? parseInt(editStudentFormData.graduation_year) : null,
            })

            toast.success('Student updated successfully!')
            setShowEditStudentModal(false)
            setSelectedStudent(null)
            
            // Refresh the student list
            if (selectedCollege) {
                const data = await apiClient.getStudents({ college_id: selectedCollege.id })
                setCollegeStudents(data.students || [])
            }
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
            setUpdatingStudent(false)
        }
    }

    const handleDeactivateStudent = async (studentId: string, studentName: string) => {
        if (!confirm(`Are you sure you want to mark "${studentName}" as inactive?\n\nThis will:\n- Keep the student data in the system\n- Change status to INACTIVE\n- Student can be reactivated later`)) {
            return
        }

        try {
            await apiClient.deactivateStudent(studentId)
            toast.success('Student marked as inactive successfully!')
            
            // Refresh the student list
            if (selectedCollege) {
                const data = await apiClient.getStudents({ college_id: selectedCollege.id })
                setCollegeStudents(data.students || [])
            }
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

    const handleOpenLicenseModal = (college: any) => {
        setSelectedCollege(college)
        setLicenseData({
            license_type: college.license_type || 'premium',
            license_expiry: '',
            total_students: college.total_students || 500
        })
        setShowLicenseModal(true)
    }

    const handleUpdateLicense = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedCollege) return

        setUpdatingLicense(true)
        try {
            const payload: any = {
                license_type: licenseData.license_type,
                total_students: licenseData.total_students
            }
            
            // Only include expiry date if it's set
            if (licenseData.license_expiry) {
                payload.license_expiry = new Date(licenseData.license_expiry).toISOString()
            }

            const response = await apiClient.updateCollegeLicense(selectedCollege.id, payload)
            
            // Refresh the college list to show updated data
            await fetchColleges()
            
            toast.success(`License updated! ${selectedCollege.college_name} is now on ${response.new_license} plan`)
            setShowLicenseModal(false)
            setSelectedCollege(null)
        } catch (error: any) {
            console.error('Error updating license:', error)
            const errorDetail = error.response?.data?.detail
            let errorMessage = 'Failed to update license'
            
            if (typeof errorDetail === 'string') {
                errorMessage = errorDetail
            } else if (Array.isArray(errorDetail)) {
                errorMessage = errorDetail.map((err: any) => err.msg || JSON.stringify(err)).join(', ')
            } else if (typeof errorDetail === 'object' && errorDetail !== null) {
                errorMessage = errorDetail.msg || JSON.stringify(errorDetail)
            }
            
            toast.error(errorMessage)
        } finally {
            setUpdatingLicense(false)
        }
    }

    const handleActivateStudent = async (studentId: string, studentName: string) => {
        if (!confirm(`Are you sure you want to activate "${studentName}"?\n\nThis will:\n- Mark the student as ACTIVE\n- Allow student to access their account\n- Re-enable all student features`)) {
            return
        }

        try {
            await apiClient.activateStudent(studentId)
            toast.success('Student activated successfully!')
            
            // Refresh the student list
            if (selectedCollege) {
                const data = await apiClient.getStudents({ college_id: selectedCollege.id })
                setCollegeStudents(data.students || [])
            }
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

    const handleDeleteStudentPermanent = async (studentId: string, studentName: string) => {
        if (!confirm(`⚠️ PERMANENT DELETE WARNING ⚠️\n\nAre you sure you want to PERMANENTLY delete "${studentName}"?\n\nThis will:\n- Remove ALL student data from the database\n- Delete ALL associated records (assessments, reports, etc.)\n- CANNOT be undone\n\nType 'DELETE' to confirm this action.`)) {
            return
        }

        // Additional confirmation for permanent delete
        const confirmText = prompt('Type DELETE (in capital letters) to confirm permanent deletion:')
        if (confirmText !== 'DELETE') {
            toast.error('Deletion cancelled - confirmation text did not match')
            return
        }

        try {
            await apiClient.deleteStudent(studentId)
            toast.success('Student permanently deleted!')
            
            // Refresh the student list
            if (selectedCollege) {
                const data = await apiClient.getStudents({ college_id: selectedCollege.id })
                setCollegeStudents(data.students || [])
            }
        } catch (error: any) {
            console.error('Error deleting student:', error)
            const errorDetail = error.response?.data?.detail
            let errorMessage = 'Failed to delete student'
            
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

    const handleDeactivateCollege = async (collegeId: string, collegeName: string) => {
        if (!confirm(`Are you sure you want to mark "${collegeName}" as inactive?\n\nThis will:\n- Keep the college data in the system\n- Change status to INACTIVE\n- College can be reactivated later\n- Students will remain associated`)) {
            return
        }

        try {
            await apiClient.deactivateCollege(collegeId)
            toast.success('College marked as inactive successfully!')
            await fetchColleges()  // Await to ensure list refreshes
        } catch (error: any) {
            console.error('Error deactivating college:', error)
            const errorDetail = error.response?.data?.detail
            let errorMessage = 'Failed to deactivate college'
            
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

    const handleActivateCollege = async (collegeId: string, collegeName: string) => {
        if (!confirm(`Are you sure you want to activate "${collegeName}"?\n\nThis will:\n- Mark the college as ACTIVE\n- Allow students to access their accounts\n- Re-enable all college features`)) {
            return
        }

        try {
            await apiClient.activateCollege(collegeId)
            toast.success('College activated successfully!')
            await fetchColleges()  // Await to ensure list refreshes
        } catch (error: any) {
            console.error('Error activating college:', error)
            const errorDetail = error.response?.data?.detail
            let errorMessage = 'Failed to activate college'
            
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

    const handleDeleteCollegePermanent = async (collegeId: string, collegeName: string) => {
        if (!confirm(`⚠️ PERMANENT DELETE WARNING ⚠️\n\nAre you sure you want to PERMANENTLY delete "${collegeName}"?\n\nThis will:\n- Remove ALL college data from the database\n- College must have NO students\n- CANNOT be undone\n\nType 'DELETE' to confirm this action.`)) {
            return
        }

        // Additional confirmation for permanent delete
        const confirmText = prompt('Type DELETE (in capital letters) to confirm permanent deletion:')
        if (confirmText !== 'DELETE') {
            toast.error('Deletion cancelled - confirmation text did not match')
            return
        }

        try {
            const result = await apiClient.deleteCollege(collegeId)
            console.log('✅ Delete result:', result)
            toast.success('College permanently deleted!')
            
            // Force refresh the list
            await fetchColleges()
            
            console.log('✅ List refreshed after deletion')
        } catch (error: any) {
            console.error('❌ Error deleting college:', error)
            const errorDetail = error.response?.data?.detail
            let errorMessage = 'Failed to delete college'
            
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

    const handleEditCollege = (college: any) => {
        setSelectedCollege(college)
        setEditCollegeFormData({
            phone: college.phone || '',
            contact_person_name: college.contact_person_name || '',
            contact_designation: college.contact_designation || '',
            website_url: college.website_url || '',
            institute_type: college.institute_type || '',
            established_year: college.established_year ? String(college.established_year) : '',
            address: college.address || '',
            courses_offered: college.courses_offered || '',
            branch: college.branch || '',
            total_students: college.total_students || 100,
        })
        setShowEditCollegeModal(true)
    }

    const handleUpdateCollege = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedCollege) return

        setUpdating(true)

        try {
            await apiClient.updateCollege(selectedCollege.id, {
                ...editCollegeFormData,
                established_year: editCollegeFormData.established_year ? parseInt(editCollegeFormData.established_year) : null,
            })

            toast.success('College updated successfully!')
            setShowEditCollegeModal(false)
            setSelectedCollege(null)
            fetchColleges()
        } catch (error: any) {
            console.error('Error updating college:', error)
            const errorDetail = error.response?.data?.detail
            let errorMessage = 'Failed to update college'
            
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

    const handleBulkUpload = async (file: File) => {
        if (!selectedCollege) {
            toast.error('No college selected')
            throw new Error('No college selected')
        }

        try {
            console.log('🏫 Bulk uploading students to college:', selectedCollege.college_name, 'ID:', selectedCollege.id)
            const result = await apiClient.uploadStudentsCSV(file, selectedCollege.id)
            
            console.log('✅ Upload result:', result)
            
            // Show success message with details
            const successMessage = result.successful 
                ? `✅ Success! ${result.successful} student${result.successful > 1 ? 's' : ''} created for ${selectedCollege.college_name}`
                : 'Upload completed'
            
            if (result.failed && result.failed > 0) {
                toast.error(`⚠️ ${result.failed} student${result.failed > 1 ? 's' : ''} failed to upload. Check the errors.`)
            } else {
                toast.success(successMessage)
            }
            
            // Close modal
            setShowBulkUploadModal(false)
            
            // Refresh the student list
            const data = await apiClient.getStudents({ college_id: selectedCollege.id })
            setCollegeStudents(data.students || [])
            
        } catch (error: any) {
            console.error('❌ Error uploading CSV:', error)
            const errorMessage = error.response?.data?.detail || error.message || 'Failed to upload students'
            toast.error(errorMessage)
            // Re-throw to let the modal handle it
            throw error
        }
    }

    const handleCreateCollege = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)

        try {
            const response = await apiClient.createCollege({
                ...formData,
                established_year: formData.established_year ? parseInt(formData.established_year) : null,
                total_students: formData.total_students || 100,
            })

            toast.success(`College created! Temporary password: ${response.temporary_password}`)
            setShowCreateModal(false)
            setFormData({
                college_name: '',
                email: '',
                phone: '',
                contact_person_name: '',
                contact_designation: '',
                website_url: '',
                institute_type: '',
                established_year: '',
                address: '',
                courses_offered: '',
                branch: '',
                total_students: 100,
            })
            fetchColleges()
        } catch (error: any) {
            console.error('Error creating college:', error)
            const errorDetail = error.response?.data?.detail
            let errorMessage = 'Failed to create college'
            
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

    const filteredColleges = colleges.filter(college =>
        college.college_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        college.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <DashboardLayout requiredUserType="admin">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Colleges</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage college accounts</p>
                    </div>
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create College
                    </Button>
                </div>

                {/* Search */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search colleges..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Colleges List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader size="lg" />
                    </div>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>All Colleges ({filteredColleges.length})</CardTitle>
                            <CardDescription>View and manage college accounts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {filteredColleges.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No colleges found</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredColleges.map((college) => (
                                        <div
                                            key={college.id}
                                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <div className="flex-1">
                                                <h3 className="font-medium">{college.college_name}</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{college.email}</p>
                                                {college.phone && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{college.phone}</p>
                                                )}
                                                {college.institute_type && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        Type: {college.institute_type}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant={college.status === 'active' ? 'success' : 'secondary'}>
                                                        {college.status?.toUpperCase() || 'ACTIVE'}
                                                    </Badge>
                                                    <Badge 
                                                        variant={
                                                            college.license_type === 'premium' ? 'default' :
                                                            college.license_type === 'enterprise' ? 'success' :
                                                            'outline'
                                                        }
                                                        className="capitalize text-xs"
                                                    >
                                                        {college.license_type || 'free'} ({college.total_students || 100} students)
                                                    </Badge>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleOpenLicenseModal(college)}
                                                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                                    title="Manage license plan"
                                                >
                                                    <CreditCard className="h-4 w-4 mr-1" />
                                                    License
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => handleViewStudents(college)}
                                                >
                                                    <Users className="h-4 w-4 mr-2" />
                                                    Students
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEditCollege(college)}
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    title="Edit college details"
                                                >
                                                    <Pencil className="h-4 w-4 mr-1" />
                                                    Edit
                                                </Button>
                                                {/* <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedCollege(college)
                                                        setShowCreateStudentModal(true)
                                                    }}
                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    title="Add student to college"
                                                >
                                                    <Plus className="h-4 w-4 mr-1" />
                                                    Add Student
                                                </Button> */}
                                                {college.status === 'active' ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDeactivateCollege(college.id, college.college_name)}
                                                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                        title="Mark college as inactive"
                                                    >
                                                        <UserX className="h-4 w-4 mr-1" />
                                                        Deactivate
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleActivateCollege(college.id, college.college_name)}
                                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        title="Activate college"
                                                    >
                                                        <Users className="h-4 w-4 mr-1" />
                                                        Activate
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDeleteCollegePermanent(college.id, college.college_name)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    title="Permanently delete college"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Students List Modal */}
                {showStudentsModal && selectedCollege && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>Students - {selectedCollege.college_name}</CardTitle>
                                        <CardDescription>
                                            Manage students for this college
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button 
                                            size="sm"
                                            onClick={() => setShowCreateStudentModal(true)}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Student
                                        </Button>
                                        <Button 
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setShowBulkUploadModal(true)}
                                        >
                                            <Upload className="h-4 w-4 mr-2" />
                                            Bulk Upload
                                        </Button>
                                        <Button 
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setShowStudentsModal(false)
                                                setSelectedCollege(null)
                                                setCollegeStudents([])
                                            }}
                                        >
                                            Close
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loadingStudents ? (
                                    <div className="flex justify-center py-12">
                                        <Loader size="lg" />
                                    </div>
                                ) : collegeStudents.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No students found in this college</p>
                                        <Button 
                                            className="mt-4"
                                            onClick={() => setShowCreateStudentModal(true)}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create First Student
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                            Total Students: {collegeStudents.length}
                                        </div>
                                        {collegeStudents.map((student) => (
                                            <div
                                                key={student.id}
                                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                                            >
                                                <div className="flex-1">
                                                    <h3 className="font-medium">{student.name}</h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{student.email}</p>
                                                    {student.phone && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">{student.phone}</p>
                                                    )}
                                                    <div className="flex gap-4 mt-2">
                                                        {student.degree && (
                                                            <span className="text-xs text-gray-500">
                                                                {student.degree}
                                                                {student.branch && ` - ${student.branch}`}
                                                            </span>
                                                        )}
                                                        {student.graduation_year && (
                                                            <span className="text-xs text-gray-500">
                                                                Grad: {student.graduation_year}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <Badge variant={student.status?.toUpperCase() === 'ACTIVE' ? 'success' : 'secondary'}>
                                                        {student.status?.toUpperCase() || 'ACTIVE'}
                                                    </Badge>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEditStudent(student)}
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            title="Edit student details"
                                                        >
                                                            <Pencil className="h-4 w-4 mr-1" />
                                                            Edit
                                                        </Button>
                                                        {student.status?.toUpperCase() === 'ACTIVE' ? (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleDeactivateStudent(student.id, student.name)}
                                                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                                title="Mark student as inactive"
                                                            >
                                                                <UserX className="h-4 w-4 mr-1" />
                                                                Deactivate
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleActivateStudent(student.id, student.name)}
                                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                title="Activate student"
                                                            >
                                                                <Users className="h-4 w-4 mr-1" />
                                                                Activate
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDeleteStudentPermanent(student.id, student.name)}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            title="Permanently delete student"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-1" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Create Student Modal (nested) */}
                {showCreateStudentModal && selectedCollege && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
                        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <CardHeader>
                                <CardTitle>Create Student in {selectedCollege.college_name}</CardTitle>
                                <CardDescription>
                                    Add a new student to this college
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreateStudentInCollege} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                Full Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                required
                                                value={studentFormData.name}
                                                onChange={(e) => setStudentFormData({ ...studentFormData, name: e.target.value })}
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                Email <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                required
                                                type="email"
                                                value={studentFormData.email}
                                                onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                                                placeholder="student@example.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Phone</label>
                                            <Input
                                                value={studentFormData.phone}
                                                onChange={(e) => setStudentFormData({ ...studentFormData, phone: e.target.value })}
                                                placeholder="+919876543210"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Degree</label>
                                            <Input
                                                value={studentFormData.degree}
                                                onChange={(e) => setStudentFormData({ ...studentFormData, degree: e.target.value })}
                                                placeholder="B.Tech"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Branch</label>
                                            <Input
                                                value={studentFormData.branch}
                                                onChange={(e) => setStudentFormData({ ...studentFormData, branch: e.target.value })}
                                                placeholder="Computer Science"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Graduation Year</label>
                                            <Input
                                                type="number"
                                                value={studentFormData.graduation_year}
                                                onChange={(e) => setStudentFormData({ ...studentFormData, graduation_year: e.target.value })}
                                                placeholder="2025"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                        <p className="text-sm text-blue-600 dark:text-blue-400">
                                            <strong>College:</strong> {selectedCollege.college_name}
                                        </p>
                                        <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                                            This student will be automatically assigned to this college
                                        </p>
                                    </div>

                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setShowCreateStudentModal(false)}
                                            disabled={creatingStudent}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={creatingStudent}>
                                            {creatingStudent ? 'Creating...' : 'Create Student'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Edit Student Modal */}
                {showEditStudentModal && selectedStudent && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
                        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <CardHeader>
                                <CardTitle>Edit Student - {selectedStudent.name}</CardTitle>
                                <CardDescription>
                                    Update student information
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUpdateStudent} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                Full Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                required
                                                value={editStudentFormData.name}
                                                onChange={(e) => setEditStudentFormData({ ...editStudentFormData, name: e.target.value })}
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                Email <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                required
                                                type="email"
                                                value={editStudentFormData.email}
                                                onChange={(e) => setEditStudentFormData({ ...editStudentFormData, email: e.target.value })}
                                                placeholder="student@example.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Phone</label>
                                            <Input
                                                value={editStudentFormData.phone}
                                                onChange={(e) => setEditStudentFormData({ ...editStudentFormData, phone: e.target.value })}
                                                placeholder="+919876543210"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Degree</label>
                                            <Input
                                                value={editStudentFormData.degree}
                                                onChange={(e) => setEditStudentFormData({ ...editStudentFormData, degree: e.target.value })}
                                                placeholder="B.Tech"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Branch</label>
                                            <Input
                                                value={editStudentFormData.branch}
                                                onChange={(e) => setEditStudentFormData({ ...editStudentFormData, branch: e.target.value })}
                                                placeholder="Computer Science"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Graduation Year</label>
                                            <Input
                                                type="number"
                                                value={editStudentFormData.graduation_year}
                                                onChange={(e) => setEditStudentFormData({ ...editStudentFormData, graduation_year: e.target.value })}
                                                placeholder="2025"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setShowEditStudentModal(false)
                                                setSelectedStudent(null)
                                            }}
                                            disabled={updatingStudent}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={updatingStudent}>
                                            {updatingStudent ? 'Updating...' : 'Update Student'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Bulk Upload Modal */}
                <BulkUploadModal
                    isOpen={showBulkUploadModal}
                    onClose={() => setShowBulkUploadModal(false)}
                    onSubmit={handleBulkUpload}
                />

                {/* Create College Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <CardHeader>
                                <CardTitle>Create College Account</CardTitle>
                                <CardDescription>Add a new college to the platform</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreateCollege} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                College Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                required
                                                value={formData.college_name}
                                                onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                                                placeholder="ABC Engineering College"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                Email <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                required
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="admin@college.edu"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Phone</label>
                                            <Input
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="+919876543210"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                Contact Person Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                required
                                                value={formData.contact_person_name}
                                                onChange={(e) => setFormData({ ...formData, contact_person_name: e.target.value })}
                                                placeholder="Dr. John Smith"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Contact Designation</label>
                                            <Input
                                                value={formData.contact_designation}
                                                onChange={(e) => setFormData({ ...formData, contact_designation: e.target.value })}
                                                placeholder="Placement Officer"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Website URL</label>
                                            <Input
                                                value={formData.website_url}
                                                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                                                placeholder="https://college.edu"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Institute Type</label>
                                            <Input
                                                value={formData.institute_type}
                                                onChange={(e) => setFormData({ ...formData, institute_type: e.target.value })}
                                                placeholder="Engineering, Arts, etc."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Established Year</label>
                                            <Input
                                                type="number"
                                                value={formData.established_year}
                                                onChange={(e) => setFormData({ ...formData, established_year: e.target.value })}
                                                placeholder="1990"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Branch</label>
                                            <Input
                                                value={formData.branch}
                                                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                                placeholder="Main Campus"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                Total Students <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                required
                                                type="number"
                                                min="1"
                                                max="10000"
                                                value={formData.total_students}
                                                onChange={(e) => setFormData({ ...formData, total_students: parseInt(e.target.value) || 100 })}
                                                placeholder="100"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Maximum students allowed for this college</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Address</label>
                                        <Input
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="123 Main Street, City, State"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Courses Offered</label>
                                        <Input
                                            value={formData.courses_offered}
                                            onChange={(e) => setFormData({ ...formData, courses_offered: e.target.value })}
                                            placeholder="B.Tech, M.Tech, MBA"
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setShowCreateModal(false)}
                                            disabled={creating}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={creating}>
                                            {creating ? 'Creating...' : 'Create College'}
                                </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Edit College Modal */}
                {showEditCollegeModal && selectedCollege && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>Edit College</CardTitle>
                                        <CardDescription>
                                            Update college details (Name and Email cannot be changed)
                                        </CardDescription>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setShowEditCollegeModal(false)
                                            setSelectedCollege(null)
                                        }}
                                        disabled={updating}
                                    >
                                        ✕
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUpdateCollege} className="space-y-4">
                                    {/* Display-only fields */}
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-500">
                                                College Name (Cannot be changed)
                                            </label>
                                            <p className="text-sm font-medium">{selectedCollege.college_name}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-500">
                                                Email (Cannot be changed)
                                            </label>
                                            <p className="text-sm font-medium">{selectedCollege.email}</p>
                                        </div>
                                    </div>

                                    {/* Editable fields */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Phone</label>
                                            <Input
                                                value={editCollegeFormData.phone}
                                                onChange={(e) => setEditCollegeFormData({ ...editCollegeFormData, phone: e.target.value })}
                                                placeholder="+919876543210"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Contact Person Name</label>
                                            <Input
                                                value={editCollegeFormData.contact_person_name}
                                                onChange={(e) => setEditCollegeFormData({ ...editCollegeFormData, contact_person_name: e.target.value })}
                                                placeholder="Dr. John Smith"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Contact Designation</label>
                                            <Input
                                                value={editCollegeFormData.contact_designation}
                                                onChange={(e) => setEditCollegeFormData({ ...editCollegeFormData, contact_designation: e.target.value })}
                                                placeholder="Placement Officer"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Website URL</label>
                                            <Input
                                                value={editCollegeFormData.website_url}
                                                onChange={(e) => setEditCollegeFormData({ ...editCollegeFormData, website_url: e.target.value })}
                                                placeholder="https://college.edu"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Institute Type</label>
                                            <Input
                                                value={editCollegeFormData.institute_type}
                                                onChange={(e) => setEditCollegeFormData({ ...editCollegeFormData, institute_type: e.target.value })}
                                                placeholder="Engineering, Arts, etc."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Established Year</label>
                                            <Input
                                                type="number"
                                                value={editCollegeFormData.established_year}
                                                onChange={(e) => setEditCollegeFormData({ ...editCollegeFormData, established_year: e.target.value })}
                                                placeholder="1990"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Branch</label>
                                            <Input
                                                value={editCollegeFormData.branch}
                                                onChange={(e) => setEditCollegeFormData({ ...editCollegeFormData, branch: e.target.value })}
                                                placeholder="Main Campus"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Total Students</label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="10000"
                                                value={editCollegeFormData.total_students}
                                                onChange={(e) => setEditCollegeFormData({ ...editCollegeFormData, total_students: parseInt(e.target.value) || 100 })}
                                                placeholder="100"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Maximum students allowed</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Address</label>
                                        <Input
                                            value={editCollegeFormData.address}
                                            onChange={(e) => setEditCollegeFormData({ ...editCollegeFormData, address: e.target.value })}
                                            placeholder="123 Main Street, City, State"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Courses Offered</label>
                                        <Input
                                            value={editCollegeFormData.courses_offered}
                                            onChange={(e) => setEditCollegeFormData({ ...editCollegeFormData, courses_offered: e.target.value })}
                                            placeholder="B.Tech, M.Tech, MBA"
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setShowEditCollegeModal(false)
                                                setSelectedCollege(null)
                                            }}
                                            disabled={updating}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={updating}>
                                            {updating ? 'Updating...' : 'Update College'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* License Management Modal */}
                {showLicenseModal && selectedCollege && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-lg">
                            <CardHeader>
                                <CardTitle>Manage College License</CardTitle>
                                <CardDescription>
                                    Update license plan for {selectedCollege.college_name}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUpdateLicense} className="space-y-4">
                                    {/* Current License Info */}
                                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium">Current License:</span>
                                            <Badge 
                                                variant={
                                                    selectedCollege.license_type === 'premium' ? 'default' :
                                                    selectedCollege.license_type === 'enterprise' ? 'success' :
                                                    'outline'
                                                }
                                                className="capitalize"
                                            >
                                                {selectedCollege.license_type || 'free'}
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                            <p><strong>Email:</strong> {selectedCollege.email}</p>
                                            <p><strong>Current Capacity:</strong> {selectedCollege.total_students || 100} students</p>
                                        </div>
                                    </div>

                                    {/* New License Type */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            New License Plan <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            required
                                            value={licenseData.license_type}
                                            onChange={(e) => setLicenseData({
                                                ...licenseData,
                                                license_type: e.target.value
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                                        >
                                            <option value="free">Free - Basic features (100 students)</option>
                                            <option value="premium">Premium - Enhanced features (500-1000 students)</option>
                                            <option value="enterprise">Enterprise - Full features (unlimited students)</option>
                                        </select>
                                    </div>

                                    {/* Student Capacity */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Maximum Students Allowed <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            type="number"
                                            required
                                            min={1}
                                            max={100000}
                                            value={licenseData.total_students}
                                            onChange={(e) => setLicenseData({
                                                ...licenseData,
                                                total_students: parseInt(e.target.value) || 100
                                            })}
                                            placeholder="500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Recommended: Free (100), Premium (500-1000), Enterprise (unlimited)
                                        </p>
                                    </div>

                                    {/* Expiry Date (Optional) */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            <Calendar className="h-4 w-4 inline mr-1" />
                                            License Expiry Date (Optional)
                                        </label>
                                        <Input
                                            type="date"
                                            value={licenseData.license_expiry}
                                            onChange={(e) => setLicenseData({
                                                ...licenseData,
                                                license_expiry: e.target.value
                                            })}
                                            min={new Date().toISOString().split('T')[0]}
                                            placeholder="Leave empty for no expiry"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Leave empty for lifetime access. Recommended for paid plans.
                                        </p>
                                    </div>

                                    {/* Plan Features Info */}
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
                                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                            {licenseData.license_type === 'free' && '📋 Free Plan Features:'}
                                            {licenseData.license_type === 'premium' && '⭐ Premium Plan Features:'}
                                            {licenseData.license_type === 'enterprise' && '🏢 Enterprise Plan Features:'}
                                        </p>
                                        <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 ml-4 list-disc">
                                            {licenseData.license_type === 'free' && (
                                                <>
                                                    <li>Up to 100 students</li>
                                                    <li>Basic features</li>
                                                    <li>Standard support</li>
                                                </>
                                            )}
                                            {licenseData.license_type === 'premium' && (
                                                <>
                                                    <li>Up to 1000 students</li>
                                                    <li>Advanced analytics</li>
                                                    <li>Priority support</li>
                                                    <li>Custom branding</li>
                                                </>
                                            )}
                                            {licenseData.license_type === 'enterprise' && (
                                                <>
                                                    <li>Unlimited students</li>
                                                    <li>All premium features</li>
                                                    <li>Dedicated support</li>
                                                    <li>Custom integrations</li>
                                                    <li>SLA guarantees</li>
                                                </>
                                            )}
                                        </ul>
                                    </div>

                                    {/* Upgrade Notice */}
                                    {selectedCollege.license_type === 'free' && 
                                     licenseData.license_type !== 'free' && (
                                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                            <p className="text-sm text-green-700 dark:text-green-300">
                                                <strong>✓ Upgrading:</strong> This will increase the college's capacity and unlock additional features immediately.
                                            </p>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 justify-end pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setShowLicenseModal(false)
                                                setSelectedCollege(null)
                                            }}
                                            disabled={updatingLicense}
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            disabled={updatingLicense}
                                            className="bg-purple-600 hover:bg-purple-700"
                                        >
                                            {updatingLicense ? (
                                                <>
                                                    <Loader size="sm" className="mr-2" />
                                                    Updating...
                                                </>
                                            ) : (
                                                'Update License'
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
