"use client"

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StartAssessmentPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get('token')

    const [status, setStatus] = useState<'validating' | 'redirecting' | 'error'>('validating')
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(() => {
        if (!token) {
            setStatus('error')
            setErrorMsg('No token provided')
            return
        }

        const validateAndRedirect = async () => {
            try {
                // Validate token and get session
                const data = await api.validateDishaToken(token)

                if (data.valid && data.access_token) {
                    setStatus('redirecting')

                    // Set auth tokens
                    // Note: We might want a dedicated setAuth method if the user is not a regular user
                    // But standard approach is to use the same token mechanism
                    localStorage.setItem('access_token', data.access_token)

                    if (data.student?.id) {
                        localStorage.setItem('disha_student_id', data.student.id)
                    }

                    // We might not have refresh token if backend didn't send one, but that's fine for one-time session
                    if (data.refresh_token) {
                        localStorage.setItem('refresh_token', data.refresh_token)
                    }

                    toast.success(`Welcome, ${data.student.name}! Starting assessment...`)

                    // Redirect to assessment exam page
                    // Use the Solviq ID returned by backend
                    const packageId = data.assessment.solviq_id
                    const targetUrl = `/dashboard/student/disha/${packageId}/exam`
                    console.log('Redirecting to:', targetUrl)

                    setTimeout(() => {
                        window.location.href = targetUrl
                    }, 1000)
                } else {
                    throw new Error("Invalid response from validation server")
                }
            } catch (err: any) {
                console.error("SSO Validation Error", err)
                setStatus('error')
                setErrorMsg(err.response?.data?.detail || err.message || "Failed to validate session")
            }
        }

        validateAndRedirect()
    }, [token, router])

    if (status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
                    <p className="text-gray-600 mb-6">{errorMsg}</p>
                    <button
                        onClick={() => window.close()}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
                    >
                        Close Window
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center">
                <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
                <h1 className="text-xl font-semibold text-gray-900 mb-2">
                    {status === 'validating' ? 'Verifying Assessment Session...' : 'Redirecting to Exam...'}
                </h1>
                <p className="text-gray-500">Please wait while we set up your secure environment</p>
            </div>
        </div>
    )
}
