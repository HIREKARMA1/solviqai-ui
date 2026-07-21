/**
 * Single source of truth for dashboard sidebar / mobile nav feature → route mapping.
 */

export function getDashboardFeatureRoute(
  userType: string,
  featureId: string
): string | null {
  const baseRoute = `/dashboard/${userType}`;

  if (userType === 'student') {
    const routeMap: Record<string, string> = {
      dashboard: baseRoute,
      'career-guidance': `${baseRoute}/career-guidance`,
      resume: `${baseRoute}/resume`,
      assessment: `${baseRoute}/assessment`,
      'mock-tests': `${baseRoute}/mock-tests`,
      'placement-drives': `${baseRoute}/placement-drives`,
      simulations: `${baseRoute}/simulations`,
      'mock-interview': `${baseRoute}/mock-interview`,
      practice: `${baseRoute}/practice`,
      plans: `${baseRoute}/plans`,
      analytics: `${baseRoute}/analytics`,
      profile: `${baseRoute}/profile`,
    };
    return routeMap[featureId] ?? null;
  }

  if (userType === 'enterprise') {
    const routeMap: Record<string, string> = {
      dashboard: `/dashboard/enterprise`,
      campaigns: `/dashboard/enterprise/campaigns`,
    };
    return routeMap[featureId] ?? null;
  }

  if (userType === 'college') {
    const routeMap: Record<string, string> = {
      dashboard: `/dashboard/college`,
      students: `/dashboard/college/students`,
      analytics: `/dashboard/college/analytics`,
      'placement-hub': `/dashboard/college/placement-hub`,
      profile: `/dashboard/college/profile`,
    };
    return routeMap[featureId] ?? null;
  }

  if (userType === 'admin') {
    const routeMap: Record<string, string> = {
      dashboard: `/dashboard/admin`,
      colleges: `/dashboard/admin/colleges`,
      students: `/dashboard/admin/students`,
      analytics: `/dashboard/admin/analytics`,
      disha: `/dashboard/admin/disha`,
      'question-bank': `/dashboard/admin/question-bank`,
      'mock-tests-admin': `/dashboard/admin/mock-tests`,
      'placement-drives-admin': `/dashboard/admin/placement-drives`,
      'simulation-pipelines-admin': `/dashboard/admin/simulation-pipelines`,
      enterprises: `/dashboard/admin/enterprises`,
      coupons: `/dashboard/admin/coupons`,
      'guest-inquiries': `/dashboard/admin/guest-inquiries`,
      profile: `/dashboard/admin/profile`,
    };
    return routeMap[featureId] ?? null;
  }

  return null;
}

/** Public marketing routes (landing navbar, footer, hero). */
export const PUBLIC_SIMULATIONS_PATH = '/simulations';

export function getSimulationsPathForUser(userType?: string | null): string {
  if (userType === 'student') return '/dashboard/student/simulations';
  if (userType === 'admin') return '/dashboard/admin/simulation-pipelines';
  return PUBLIC_SIMULATIONS_PATH;
}
