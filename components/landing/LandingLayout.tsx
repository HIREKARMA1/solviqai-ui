'use client';

import React, { useState } from 'react';
import { LandingNavbar } from './LandingNavbar';
import { LandingSidebar } from './LandingSidebar';
import { MobileNavbar } from './MobileNavbar';
import { MobileTopNavbar } from './MobileTopNavbar';
import { MobileSidebar } from './MobileSidebar';
import { Footer } from './Footer';
import { cn } from '@/lib/utils';

interface LandingLayoutProps {
  children: React.ReactNode;
  activeFeature?: string | null;
  onFeatureChange?: (featureId: string | null) => void;
}

export function LandingLayout({ children, activeFeature, onFeatureChange }: LandingLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Landing Navbar - Only visible on desktop (lg and above), completely removed on small screens */}
      <div className="hidden lg:block">
        <LandingNavbar
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isSidebarCollapsed={isSidebarCollapsed}
        />
      </div>

      {/* Mobile Top Navbar - Only visible on small screens */}
      <MobileTopNavbar
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isSidebarOpen={isMobileSidebarOpen}
      />

      {/* Mobile Sidebar - Slides from right on small screens */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        activeFeature={activeFeature}
        onFeatureChange={onFeatureChange}
      />

      {/* Mobile Navigation Bar - Hidden on small screens (replaced by sidebar) */}
      {/* <MobileNavbar
        activeFeature={activeFeature}
        onFeatureChange={onFeatureChange}
      /> */}

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 flex-col">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <LandingSidebar
            isCollapsed={isSidebarCollapsed}
            activeFeature={activeFeature}
            onFeatureChange={onFeatureChange}
          />
        </div>

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 transition-all duration-300",
            isSidebarCollapsed ? "lg:ml-[80px]" : "lg:ml-[280px]"
          )}
        >
          {children}
        </main>

        {/* Footer - Only show when not viewing a feature */}
        {!activeFeature && (
          <div
            className={cn(
              "transition-all duration-300",
              isSidebarCollapsed ? "lg:ml-[80px]" : "lg:ml-[280px]"
            )}
          >
            <Footer />
          </div>
        )}
      </div>
    </div>
  );
}

