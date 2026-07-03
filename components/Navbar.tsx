"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import {
    Menu,
    X,
    User,
    Building2,
    GraduationCap,
    Shield,
    LogOut,
    HeartHandshake,
    PanelLeft
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { cn } from '@/lib/utils'

interface NavbarProps {
    variant?: 'default' | 'transparent' | 'solid'
    className?: string
    onToggleSidebar?: () => void
    isSidebarCollapsed?: boolean
    onToggleMobileSidebar?: () => void
    isMobileSidebarOpen?: boolean
}

export function Navbar({
    variant = 'default',
    className = "",
    onToggleSidebar,
    isSidebarCollapsed,
    onToggleMobileSidebar,
    isMobileSidebarOpen
}: NavbarProps) {
    const { user, loading: authLoading, logout } = useAuth()
    const isAuthenticated = !!user
    const { theme, resolvedTheme } = useTheme()
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [profile, setProfile] = useState<any>(null)
    const [profileLoading, setProfileLoading] = useState(true)

    // Helper function to get auth links with redirect
    const getAuthLink = (basePath: string) => {
        if (pathname?.startsWith('/auth/') || pathname === '/') {
            return basePath
        }
        return `${basePath}?redirect=${encodeURIComponent(pathname || '')}`
    }

    useEffect(() => {
        if (isAuthenticated && user?.user_type === 'college') {
            loadProfile()
        } else {
            setProfileLoading(false)
        }
    }, [isAuthenticated, user])

    const loadProfile = async () => {
        try {
            setProfileLoading(true)
            const profileData = await apiClient.getCollegeProfile()
            setProfile(profileData)
        } catch (apiError) {
            console.error('Failed to fetch college profile:', apiError)
        } finally {
            setProfileLoading(false)
        }
    }

    const handleLogout = () => {
        logout()
        setIsMobileMenuOpen(false)
    }

    const getDashboardPath = () => {
        if (!user) return '/dashboard'
        return `/dashboard/${user.user_type}`
    }

    const getUserTypeIcon = () => {
        switch (user?.user_type) {
            case 'student':
                return User
            case 'college':
                return GraduationCap
            case 'admin':
                return Shield
            default:
                return Shield
        }
    }

    const getNavbarClasses = () => {
        const baseClasses = "w-full z-50 transition-all duration-300 fixed top-0 left-0 right-0"

        switch (variant) {
            case 'transparent':
                return `${baseClasses} bg-brand-blue/[0.04] dark:bg-brand-blue/[0.12] backdrop-blur-md`
            case 'solid':
                return `${baseClasses} bg-brand-nav dark:bg-brand-nav-dark shadow-sm`
            default:
                return `${baseClasses} bg-brand-nav dark:bg-brand-nav-dark backdrop-blur-md`
        }
    }

    const getLogoSrc = () => {
        const isDark = resolvedTheme === 'dark' || (resolvedTheme === 'system' && theme === 'dark')
        return isDark ? '/images/solviqdark.png' : '/images/solviqligt.png'
    }

    return (
        <nav className={`main-navbar ${getNavbarClasses()} ${className}`}>
            <div className="container mx-auto px-4 max-w-7xl h-20 flex flex-col justify-center">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        {/* Logo */}
                        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                            <Link href={isAuthenticated ? getDashboardPath() : "/"} className="flex items-center">
                                <Image
                                    src={getLogoSrc()}
                                    alt="SolviQ AI Logo"
                                    width={150}
                                    height={50}
                                    className="h-8 w-auto sm:h-10 md:h-12 lg:h-11 object-contain"
                                    priority
                                />
                            </Link>
                            {user?.user_type === 'college' && (
                                <>
                                    <div className="hidden sm:block h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                                    <div className="flex items-center gap-2">
                                        <div className="relative h-8 w-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-white">
                                            {profile?.profile_picture ? (
                                                <Image
                                                    src={profile.profile_picture}
                                                    alt="College Logo"
                                                    fill
                                                    className="object-contain p-1"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <GraduationCap className="h-5 w-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400" />
                                            )}
                                        </div>
                                        <span className="text-sm font-medium hidden md:block max-w-[150px] truncate">
                                            {profile?.college_name || user?.name || 'College'}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Sidebar Toggle (Desktop) */}
                        {onToggleSidebar && isAuthenticated && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onToggleSidebar}
                                className="hidden lg:flex w-[35px] h-[35px] rounded-md border border-brand-blue/15 dark:border-brand-blue/25 hover:bg-brand-blue/5 dark:hover:bg-brand-blue/10 ml-2"
                            >
                                <PanelLeft className="h-5 w-5 text-brand-blue dark:text-brand-cyan" />
                            </Button>
                        )}

                        {/* Mobile Sidebar Toggle */}
                        {onToggleMobileSidebar && isAuthenticated && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onToggleMobileSidebar}
                                className="lg:hidden"
                            >
                                <PanelLeft className="h-6 w-6" />
                            </Button>
                        )}
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden xl:flex items-center space-x-4">
                        <ThemeToggle />

                        {/* Auth Buttons */}
                        {isAuthenticated && user ? (
                            <div className="flex items-center space-x-3">
                                <button
                                    className="w-[34px] h-[34px] bg-brand-blue rounded-lg flex items-center justify-center cursor-pointer hover:bg-brand-blue-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/50"
                                    onClick={handleLogout}
                                    title="Logout"
                                >
                                    <User className="h-5 w-5 text-white" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <Link href={getAuthLink('/auth/register')}>
                                    <Button variant="outline" className="border-brand-cyan text-brand-cyan hover:bg-brand-cyan hover:text-white">Sign Up</Button>
                                </Link>
                                <Link href={getAuthLink('/auth/login')}>
                                    <Button className="bg-brand-cyan hover:bg-brand-cyan-dark text-white">Sign In</Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button (Only if NOT authenticated) */}
                    {!isAuthenticated && (
                        <div className="xl:hidden flex items-center space-x-2">
                            <ThemeToggle />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="w-5 h-5" />
                                ) : (
                                    <Menu className="w-5 h-5" />
                                )}
                            </Button>
                        </div>
                    )}

                    {/* If authenticated, we show ThemeToggle but menu is handled by sidebar toggles on left */}
                    {isAuthenticated && (
                        <div className="xl:hidden flex items-center space-x-2">
                            <ThemeToggle />
                        </div>
                    )}
                </div>

                {/* Mobile Menu (Public) */}
                {isMobileMenuOpen && !isAuthenticated && (
                    <div className="xl:hidden absolute left-0 right-0 top-full bg-brand-nav dark:bg-brand-nav-dark backdrop-blur-md shadow-lg border-t border-brand-blue/10 dark:border-brand-blue/20">
                        <div className="flex flex-col space-y-3 p-4">
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-6">
                                <Link href={getAuthLink('/auth/register')} onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button variant="outline" className="w-full justify-start mb-4 border-brand-cyan text-brand-cyan hover:bg-brand-cyan hover:text-white">
                                        Sign Up
                                    </Button>
                                </Link>
                                <Link href={getAuthLink('/auth/login')} onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button className="w-full justify-start bg-brand-cyan hover:bg-brand-cyan-dark text-white">
                                        Sign In
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}
