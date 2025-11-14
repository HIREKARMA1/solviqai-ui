"use client"

import { useState, useRef } from 'react'
import { X, Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface BulkUploadModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (file: File) => Promise<void>
}

export function BulkUploadModal({
    isOpen,
    onClose,
    onSubmit
}: BulkUploadModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [dragActive, setDragActive] = useState(false)
    const [fileValidation, setFileValidation] = useState<{
        isValid: boolean;
        rowCount: number;
        missingColumns: string[];
        error?: string;
    } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!isOpen) return null

    const handleClose = () => {
        setSelectedFile(null)
        setError(null)
        setFileValidation(null)
        setDragActive(false)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
        onClose()
    }

    const validateCSVFile = (file: File): string | null => {
        if (!file.name.toLowerCase().endsWith('.csv')) {
            return 'Please select a CSV file (.csv extension required)'
        }

        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
            return `File size must be less than 5MB (current: ${(file.size / (1024 * 1024)).toFixed(2)}MB)`
        }

        if (file.size === 0) {
            return 'File is empty. Please select a valid CSV file'
        }

        return null
    }

    const parseCSVLine = (line: string): string[] => {
        const result = []
        let current = ''
        let inQuotes = false

        for (let i = 0; i < line.length; i++) {
            const char = line[i]

            if (char === '"') {
                inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim())
                current = ''
            } else {
                current += char
            }
        }

        result.push(current.trim())
        return result
    }

    const validateCSVContent = async (file: File): Promise<{
        isValid: boolean;
        rowCount: number;
        missingColumns: string[];
        error?: string;
    }> => {
        try {
            const text = await file.text()
            const lines = text.split('\n').filter(line => line.trim())

            if (lines.length === 0) {
                return {
                    isValid: false,
                    rowCount: 0,
                    missingColumns: [],
                    error: 'CSV file is empty'
                }
            }

            if (lines.length === 1) {
                return {
                    isValid: false,
                    rowCount: 0,
                    missingColumns: [],
                    error: 'CSV file contains only headers, no student data found'
                }
            }

            const header = parseCSVLine(lines[0]).map(col => col.trim().toLowerCase())
            const requiredColumns = ['name', 'email', 'phone']
            const missingColumns = requiredColumns.filter(col => !header.includes(col))

            return {
                isValid: missingColumns.length === 0,
                rowCount: lines.length - 1,
                missingColumns,
                error: missingColumns.length > 0 ? `Missing required columns: ${missingColumns.join(', ')}` : undefined
            }
        } catch (error) {
            return {
                isValid: false,
                rowCount: 0,
                missingColumns: [],
                error: 'Failed to parse CSV file'
            }
        }
    }

    const processFile = async (file: File) => {
        console.log('📄 Processing file:', file.name, 'Size:', (file.size / 1024).toFixed(2), 'KB')
        
        const fileValidationError = validateCSVFile(file)
        if (fileValidationError) {
            console.error('❌ File validation failed:', fileValidationError)
            setError(fileValidationError)
            setSelectedFile(null)
            setFileValidation(null)
            return
        }

        try {
            console.log('🔍 Validating CSV content...')
            const contentValidation = await validateCSVContent(file)
            console.log('✅ Content validation result:', contentValidation)
            setFileValidation(contentValidation)

            if (!contentValidation.isValid) {
                setError(contentValidation.error || 'CSV file validation failed')
                setSelectedFile(null)
            } else {
                console.log('✅ File is valid! Rows:', contentValidation.rowCount)
                setSelectedFile(file)
                setError(null)
            }
        } catch (error) {
            console.error('❌ Error validating CSV:', error)
            setError('Failed to validate CSV file content')
            setSelectedFile(null)
            setFileValidation(null)
        }
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            await processFile(file)
        }
    }

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await processFile(e.dataTransfer.files[0])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedFile) {
            setError('Please select a CSV file to upload')
            return
        }

        if (!fileValidation || !fileValidation.isValid) {
            setError('Please select a valid CSV file')
            return
        }

        console.log('🚀 Starting upload for:', selectedFile.name)
        setIsUploading(true)
        setError(null)
        
        try {
            await onSubmit(selectedFile)
            console.log('✅ Upload successful!')
            // Modal will be closed by parent component after successful upload
        } catch (error: any) {
            console.error('❌ Upload error:', error)
            const errorMessage = error.response?.data?.detail || error.message || 'Failed to upload students'
            setError(errorMessage)
            setIsUploading(false)
        }
    }

    const downloadTemplate = () => {
        const csvContent = 'name,email,phone,degree,branch,graduation_year,institution\nJohn Doe,john@example.com,+919876543210,B.Tech,Computer Science,2025,Main Campus\nJane Smith,jane@example.com,+919876543211,MCA,Information Technology,2024,North Campus\nMike Johnson,mike@example.com,+919876543212,B.Tech,Mechanical Engineering,2025,Engineering Block'
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'student_upload_template.csv'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Bulk Upload Students</CardTitle>
                            <CardDescription>Upload multiple students via CSV file</CardDescription>
                        </div>
                        <Button size="sm" variant="outline" onClick={handleClose} disabled={isUploading}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Instructions */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                                        Upload Instructions
                                    </h4>
                                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                        <li>• Use the CSV template provided below</li>
                                        <li>• <strong>Required columns:</strong> name, email, phone</li>
                                        <li>• <strong>Optional columns:</strong> degree, branch, graduation_year, institution</li>
                                        <li>• Maximum file size: 5MB</li>
                                        <li>• Students will receive welcome emails with temporary passwords</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Template Download */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-medium mb-1">Download Template</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Get the CSV template with sample data
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    onClick={downloadTemplate}
                                    size="sm"
                                    variant="outline"
                                    disabled={isUploading}
                                >
                                    <div className="flex items-center gap-2">
                                        <Download className="w-4 h-4" />
                                        <span>Download</span>
                                    </div>
                                </Button>
                            </div>
                        </div>

                        {/* File Upload with Drag & Drop */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Select CSV File <span className="text-red-500">*</span>
                            </label>
                            <div 
                                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors ${
                                    dragActive 
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <div className="space-y-1 text-center">
                                    <Upload className={`mx-auto h-12 w-12 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                        <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
                                            <span>Upload a file</span>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".csv"
                                                className="sr-only"
                                                onChange={handleFileSelect}
                                                disabled={isUploading}
                                            />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        CSV files only, up to 5MB
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* File Validation Success */}
                        {selectedFile && fileValidation && fileValidation.isValid && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                                            ✅ File Validated Successfully
                                        </p>
                                        <p className="text-sm text-green-800 dark:text-green-200">
                                            <FileText className="w-4 h-4 inline mr-1" />
                                            {selectedFile.name} • <strong>{fileValidation.rowCount}</strong> student(s) ready to upload
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                                            Upload Error
                                        </p>
                                        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 justify-end pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isUploading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={!selectedFile || isUploading || !fileValidation?.isValid}
                                className="min-w-[140px]"
                            >
                                {isUploading ? (
                                    <>
                                        <span className="animate-spin mr-2">⏳</span>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload Students
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Debug info in development */}
                        {process.env.NODE_ENV === 'development' && selectedFile && (
                            <div className="text-xs text-gray-500 border-t pt-2 mt-2">
                                <strong>Debug:</strong> File: {selectedFile.name}, Size: {(selectedFile.size / 1024).toFixed(2)}KB, 
                                Valid: {fileValidation?.isValid ? 'Yes' : 'No'}, 
                                Rows: {fileValidation?.rowCount || 0}
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
