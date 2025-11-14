'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { sidebarFeatures, SidebarItem } from './LandingSidebar';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface MobileNavbarProps {
  activeFeature?: string | null;
  onFeatureChange?: (featureId: string | null) => void;
}

export function MobileNavbar({ activeFeature, onFeatureChange }: MobileNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  // Map feature IDs to dashboard routes
  const getFeatureRoute = (featureId: string): string | null => {
    if (!user) return null;
    const baseRoute = `/dashboard/${user.user_type}`;
    const routeMap: Record<string, string> = {
      'resume': `${baseRoute}/resume`,
      'assessment': `${baseRoute}/assessment`,
      'jobs': `${baseRoute}/jobs`,
      'auto-apply': `${baseRoute}/auto-apply`,
      'electrical': `${baseRoute}/electrical`,
      'civil': `${baseRoute}/civil`,
    };
    return routeMap[featureId] || null;
  };

  // Check if we're in dashboard context
  const isDashboardContext = pathname?.startsWith('/dashboard');

  const features = sidebarFeatures.map(item => ({
    ...item,
    onClick: () => {
      // If user is logged in, always navigate to dashboard route (regardless of current page)
      if (user) {
        const route = getFeatureRoute(item.id);
        if (route) {
          router.push(route);
          return;
        }
      }
      
      // If in dashboard context but no user/route, do nothing
      if (isDashboardContext) {
        return;
      }
      
      // For dashboard link when logged out, redirect to login
      if (item.id === 'dashboard') {
        router.push('/auth/login');
        return;
      }
      
      // On homepage without user, use feature change callback (show inline preview)
      onFeatureChange?.(item.id);
    },
  }));

  return (
    <motion.nav
      className="lg:hidden fixed top-20 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-md"
    >
      <div 
        className="overflow-x-auto scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        <div className="flex items-center justify-start gap-3 px-4 py-3">
          {features.map((item, index) => {
            // Determine active state based on context
            let isActive = false;
            if (isDashboardContext) {
              // In dashboard, check if current path matches the feature route
              const route = getFeatureRoute(item.id);
              isActive = Boolean(route && pathname && (pathname === route || pathname.startsWith(route + '/')));
            } else {
              // On homepage, use activeFeature prop
              isActive = activeFeature === item.id;
            }
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={item.onClick}
                className={cn(
                  'flex flex-col items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg transition-all duration-200 flex-shrink-0',
                  'min-w-[90px] max-w-[100px]',
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-primary-400'
                )}
              >
                <div className={cn(
                  'transition-transform flex items-center justify-center',
                  isActive && 'scale-110'
                )}>
                  {item.icon}
                </div>
                <span className={cn(
                  'text-xs font-medium text-center leading-tight',
                  isActive && 'font-semibold'
                )}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
