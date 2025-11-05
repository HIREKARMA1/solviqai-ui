"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { LandingNavbar } from '@/components/landing/LandingNavbar'
import { LandingSidebar } from '@/components/landing/LandingSidebar'
import { MobileNavbar } from '@/components/landing/MobileNavbar'
import { Loader } from '@/components/ui/loader'
import { DropdownMenuProvider } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
    children: React.ReactNode
    requiredUserType?: 'student' | 'college' | 'admin'
}

export function DashboardLayout({ children, requiredUserType }: DashboardLayoutProps) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login')
        }

        if (!loading && user && requiredUserType && user.user_type !== requiredUserType) {
            router.push(`/dashboard/${user.user_type}`)
        }
    }, [user, loading, router, requiredUserType])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader size="lg" />
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Landing Page Navbar */}
            <LandingNavbar
                onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                isSidebarCollapsed={isSidebarCollapsed}
            />

            {/* Mobile Navigation Bar - Only visible on mobile */}
            <MobileNavbar />

            {/* Main Content Area with Sidebar */}
            <div className="flex flex-1 flex-col">
                {/* Sidebar - Hidden on mobile */}
                <div className="hidden lg:block">
                    <LandingSidebar
                        isCollapsed={isSidebarCollapsed}
                    />
                </div>

                {/* Main Content */}
                <main
                    className={cn(
                        "flex-1 transition-all duration-300 p-6 overflow-y-auto",
                        "pt-20 lg:pt-24", // Add top padding on mobile for mobile navbar
                        isSidebarCollapsed ? "lg:ml-[80px]" : "lg:ml-[280px]"
                    )}
                >
                    {children}
                </main>
            </div>
        </div>
    )
}
