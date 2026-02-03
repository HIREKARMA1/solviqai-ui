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
import SubscriptionRequiredModal from '@/components/subscription/SubscriptionRequiredModal'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'

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
    const { theme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])
    const [showEntitlementModal, setShowEntitlementModal] = useState(false)
    const [entitlementMessage, setEntitlementMessage] = useState<string | undefined>(undefined)
    const [entitlementTitle, setEntitlementTitle] = useState<string | undefined>(undefined)

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login')
        }

        if (!loading && user && requiredUserType && user.user_type !== requiredUserType) {
            router.push(`/dashboard/${user.user_type}`)
        }
    }, [user, loading, router, requiredUserType])

    useEffect(() => {
        const handler = (evt: Event) => {
            try {
                const e = evt as CustomEvent<{ message?: string }>
                const msg = e.detail?.message
                if (msg && typeof msg === 'string') {
                    const lower = msg.toLowerCase()
                    if (lower.includes('license') && lower.includes('expired')) {
                        setEntitlementTitle('License Expired')
                    } else if (lower.includes('subscription') && lower.includes('expired')) {
                        setEntitlementTitle('Subscription Expired')
                    } else {
                        setEntitlementTitle('Subscription Required')
                    }
                    setEntitlementMessage(msg)
                } else {
                    setEntitlementTitle('Subscription Required')
                    setEntitlementMessage(undefined)
                }
                setShowEntitlementModal(true)
            } catch {
                // ignore
            }
        }

        window.addEventListener('subscription-required', handler as EventListener)
        return () => {
            window.removeEventListener('subscription-required', handler as EventListener)
        }
    }, [])

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
            {/* Minimal Header - Visible only when navigation is hidden (e.g. Exam Mode) */}
            {hideNavigation && mounted && (
                <header className="px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center h-20 flex-shrink-0 z-50 relative">
                    <Link href="/" className="relative w-[120px] h-12 sm:w-[160px] sm:h-[64px] block">
                        {theme === 'dark' ? (
                            <Image
                                src="/images/solviqdark.png"
                                alt="SolviQ AI Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        ) : (
                            <Image
                                src="/images/solviqligt.png"
                                alt="SolviQ AI Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        )}
                    </Link>
                </header>
            )}

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
            <div className="flex flex-1 flex-col min-h-0">
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
                        "flex-1 transition-all duration-300 overflow-y-auto min-h-0",
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

            <SubscriptionRequiredModal
                isOpen={showEntitlementModal}
                onClose={() => setShowEntitlementModal(false)}
                feature="this feature"
                title={entitlementTitle}
                message={entitlementMessage}
            />
        </div>
    )
}
