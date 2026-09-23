import type { CSSProperties } from 'react'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { I18nProvider } from '@/components/providers/I18nProvider'
import { AuthProvider } from '@/hooks/useAuth'
import { Toaster } from 'react-hot-toast'

const fontVars = {
    '--font-poppins': 'Poppins, sans-serif',
    '--font-jakarta': '"Plus Jakarta Sans", sans-serif',
} as CSSProperties

export const metadata: Metadata = {
    title: 'Solviq AI - The Engine That Defines Readiness',
    description: 'Get interview ready with Solviq AI - an AI Employability Engine that pushes you through real simulations, decodes your strengths, and builds your personalized skill path. AI precision, human ambition.',
    keywords: 'AI interview preparation, employability engine, mock interview, resume builder, job search, career readiness, interview copilot',
    authors: [{ name: 'HireKarma' }],
    icons: {
        icon: [
            { url: '/favicon.ico', type: 'image/x-icon' },
            { url: '/icon.png', type: 'image/png' },
        ],
        shortcut: '/favicon.ico',
        apple: '/icon.png',
    },
    openGraph: {
        title: 'Solviq AI - The Engine That Defines Readiness',
        description: 'You\'ve got potential. Solviq AI makes sure the world sees it. AI precision, human ambition.',
        type: 'website',
    },
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover'
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning style={fontVars}>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Poppins:wght@600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="font-sans" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem
                    disableTransitionOnChange
                >
                    <I18nProvider>
                        <AuthProvider>
                        {children}
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                duration: 4000,
                                style: {
                                    background: 'var(--toast-bg)',
                                    color: 'var(--toast-color)',
                                    border: '1px solid var(--toast-border)',
                                },
                            }}
                        />
                        </AuthProvider>
                    </I18nProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}
