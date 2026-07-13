'use client';

import { createContext, useContext } from 'react';

export type DashboardShellState = {
  /** App nav sidebar is collapsed (narrow icon rail) */
  isNavSidebarCollapsed: boolean;
  /** Mobile nav drawer is open */
  isMobileNavOpen: boolean;
};

const DashboardShellContext = createContext<DashboardShellState>({
  isNavSidebarCollapsed: true,
  isMobileNavOpen: false,
});

export function useDashboardShell() {
  return useContext(DashboardShellContext);
}

export { DashboardShellContext };
