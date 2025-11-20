"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { LandingNavbar } from '@/components/landing/LandingNavbar'
import { LandingSidebar } from '@/components/landing/LandingSidebar'
import { MobileTopNavbar } from '@/components/landing/MobileTopNavbar'
import { MobileSidebar } from '@/components/landing/MobileSidebar'
import { Loader } from '@/components/ui/loader'
import { DropdownMenuProvider } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
    children: React.ReactNode
    requiredUserType?: 'student' | 'college' | 'admin'
    hideNavigation?: boolean  // Hide navbar and sidebar when true (e.g., in fullscreen mode)
}

export function DashboardLayout({ children, requiredUserType, hideNavigation = false }: DashboardLayoutProps) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

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
        <div className={cn("min-h-screen flex flex-col", hideNavigation && "fixed inset-0 w-full h-full")}>
            {/* Landing Page Navbar - Only visible on desktop (lg and above), completely removed on small screens */}
            {!hideNavigation && (
                <div className="hidden lg:block">
                    <LandingNavbar
                        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        isSidebarCollapsed={isSidebarCollapsed}
                        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                        isMobileSidebarOpen={isMobileSidebarOpen}
                    />
                </div>
            )}

            {/* Mobile Top Navbar - Only visible on small screens and when not hidden */}
            <div 
                className={cn(hideNavigation && "hidden")}
                style={hideNavigation ? { display: 'none' } : undefined}
            >
                <MobileTopNavbar
                    onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                    isSidebarOpen={isMobileSidebarOpen}
                />
            </div>

            {/* Mobile Sidebar - Slides from right on small screens */}
            <div 
                className={cn(hideNavigation && "hidden")}
                style={hideNavigation ? { display: 'none' } : undefined}
            >
                <MobileSidebar
                    isOpen={isMobileSidebarOpen}
                    onClose={() => setIsMobileSidebarOpen(false)}
                />
            </div>

            {/* Mobile Navigation Bar - Hidden on small screens (replaced by sidebar) */}
            {/* <div 
                className={cn(hideNavigation && "hidden")}
                style={hideNavigation ? { display: 'none' } : undefined}
            >
                <MobileNavbar />
            </div> */}

            {/* Main Content Area with Sidebar */}
            <div className="flex flex-1 flex-col">
                {/* Sidebar - Hidden on mobile and when hideNavigation is true */}
                <div 
                    className={cn("hidden lg:block", hideNavigation && "hidden")}
                    style={hideNavigation ? { display: 'none' } : undefined}
                >
                    <LandingSidebar
                        isCollapsed={isSidebarCollapsed}
                    />
                </div>

                {/* Main Content */}
                <main
                    className={cn(
                        "flex-1 transition-all duration-300 overflow-y-auto",
                        hideNavigation 
                            ? "p-0" // No padding in fullscreen
                            : "p-6 pt-20 lg:pt-24", // Add top padding on mobile for mobile top navbar
                        hideNavigation 
                            ? "" // No margin in fullscreen
                            : isSidebarCollapsed ? "lg:ml-[80px]" : "lg:ml-[280px]"
                    )}
                >
                    {children}
                </main>
            </div>
        </div>
    )
}
