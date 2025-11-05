"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LucideIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface SidebarItem {
  name: string
  href: string
  icon: LucideIcon
}

export interface SidebarProps {
  items: SidebarItem[]
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ items, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname() ?? ''

  return (
    <>
      {/* Backdrop - Only visible on mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'w-64 border-r bg-white dark:bg-gray-800 h-[calc(100vh-73px)] overflow-y-auto transition-transform duration-300 ease-in-out',
          // Desktop: always visible
          'lg:block lg:translate-x-0',
          // Mobile: hidden by default, slide in when open
          'fixed lg:relative z-50',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Close button - Only visible on mobile when sidebar is open */}
        <div className="lg:hidden flex justify-end p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-2">
          {items.map((item: SidebarItem) => {
            const Icon = item.icon as React.ComponentType<any>
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
