"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function Navbar() {
    const { theme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Close mobile menu when clicking outside or on a link
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [mobileMenuOpen])

    return (
        <header className="border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
            <div className="container mx-auto px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo Section */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative h-12 w-40 transition-transform group-hover:scale-105">
                            {mounted ? (
                                <Image
                                    src={theme === 'dark' ? '/images/solviqdark.png' : '/images/solviqligt.png'}
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
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link href="/auth/login">
                            <Button
                                variant="ghost"
                                className="font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                Login
                            </Button>
                        </Link>
                        <Link href="/auth/register">
                            <Button
                                className="font-medium bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
                            >
                                Get Started
                            </Button>
                        </Link>
                        <ThemeToggle />
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden items-center gap-2">
                        <ThemeToggle />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="h-9 w-9"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                    <div className="container mx-auto px-6 py-4 space-y-3">
                        <Link
                            href="/auth/login"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block"
                        >
                            <Button
                                variant="ghost"
                                className="w-full justify-start font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                Login
                            </Button>
                        </Link>
                        <Link
                            href="/auth/register"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block"
                        >
                            <Button
                                className="w-full font-medium bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
                            >
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </header>
    )
}

