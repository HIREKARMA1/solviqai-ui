'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Briefcase,
  ClipboardList,
  Zap,
  LayoutGrid,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export interface SidebarItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

interface LandingSidebarProps {
  className?: string;
  isCollapsed: boolean;
  activeFeature?: string | null;
  onFeatureChange?: (featureId: string | null) => void;
}

// Export features array so it can be reused in mobile nav
export const sidebarFeatures: SidebarItem[] = [
  {
    id: 'dashboard',
    icon: <LayoutGrid className="w-5 h-5" />,
    label: 'Dashboard',
    onClick: undefined, // Will be set by component
  },
  {
    id: 'resume',
    icon: <FileText className="w-5 h-5" />,
    label: 'Resume Analysis',
    onClick: undefined, // Will be set by component
  },
  {
    id: 'assessment',
    icon: <ClipboardList className="w-5 h-5" />,
    label: 'Mock Assessment',
    onClick: undefined,
  },
  {
    id: 'jobs',
    icon: <Briefcase className="w-5 h-5" />,
    label: 'Job Recommendations',
    onClick: undefined,
  },
  {
    id: 'auto-apply',
    icon: <Zap className="w-5 h-5" />,
    label: 'Auto Job Apply',
    onClick: undefined,
  },
  {
    id: 'electrical',
    icon: <ClipboardList className="w-5 h-5" />,
    label: 'Electrical',
    onClick: undefined,
  },
];

export function LandingSidebar({ className, isCollapsed, activeFeature, onFeatureChange }: LandingSidebarProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  // Map feature IDs to dashboard routes
  const getFeatureRoute = (featureId: string): string | null => {
    if (!user) return null;
    const baseRoute = `/dashboard/${user.user_type}`;
    const routeMap: Record<string, string> = {
      'dashboard': baseRoute,
      'resume': `${baseRoute}/resume`,
      'assessment': `${baseRoute}/assessment`,
      'jobs': `${baseRoute}/jobs`,
      'auto-apply': `${baseRoute}/auto-apply`,
      'electrical': `${baseRoute}/electrical`,
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
    <motion.aside
      animate={{
        width: isCollapsed ? 80 : 280
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'fixed left-0 top-20 z-30 overflow-hidden', // top-20 = 80px (navbar height)
        'h-[calc(100vh-5rem)]', // Full height minus navbar
        'bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg',
        'border-r border-gray-200/50 dark:border-gray-800/50',
        'shadow-lg',
        'hidden lg:block', // Hide on mobile, show on desktop
        className
      )}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <AnimatedBackground variant="subtle" showGrid={true} showLines={false} />
      </div>

      <div className="flex flex-col h-full relative z-10">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-8">
          {/* Features Section */}
          <div>
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-3 mb-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Features
                </motion.h3>
              )}
            </AnimatePresence>
            <nav className="space-y-1">
              {features.map((item) => {
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
                  <SidebarButton
                    key={item.id}
                    item={item}
                    isCollapsed={isCollapsed}
                    isActive={isActive}
                  />
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

interface SidebarButtonProps {
  item: SidebarItem;
  isCollapsed: boolean;
  isActive?: boolean;
}

function SidebarButton({ item, isCollapsed, isActive }: SidebarButtonProps) {
  const content = (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
        'text-gray-700 dark:text-gray-300',
        'hover:bg-primary-50 dark:hover:bg-primary-900/20',
        'hover:text-primary-600 dark:hover:text-primary-400',
        'cursor-pointer group',
        isCollapsed && 'justify-center',
        isActive && 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
      )}
    >
      <div className="flex-shrink-0 transition-transform group-hover:scale-110">
        {item.icon}
      </div>
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="truncate font-medium"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <button
      onClick={item.onClick}
      className="w-full"
    >
      {content}
    </button>
  );
}

