import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { I18nProvider } from '@/components/providers/I18nProvider'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Solviq AI - The Engine That Defines Readiness',
    description: 'Get interview ready with Solviq AI - an AI Employability Engine that pushes you through real simulations, decodes your strengths, and builds your personalized skill path. AI precision, human ambition.',
    keywords: 'AI interview preparation, employability engine, mock interview, resume builder, job search, career readiness, interview copilot',
    authors: [{ name: 'HireKarma' }],
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
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem
                    disableTransitionOnChange
                >
                    <I18nProvider>
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
                    </I18nProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}
