/**
 * Application configuration loaded from environment variables
 */
export const config = {
  // API Configuration
  api: {
    baseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/+$/, ''),
    version: process.env.NEXT_PUBLIC_API_VERSION || 'v1',
    fullUrl: (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/+$/, ''),
  },
  // App Configuration
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Saksham',
    url: process.env.NEXT_PUBLIC_APP_URL || '',
  },

  // Feature Flags
  features: {
    analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    debugMode: process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE === 'true',
  },

  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const;

/**
 * Validate required environment variables
 * Only warns in development - production env vars are embedded at build time
 */
export function validateEnvironment() {
  // Don't show warnings in production (env vars are embedded at build time in Next.js)
  if (process.env.NODE_ENV === 'production') {
    return true;
  }

  const requiredVars = [
    'NEXT_PUBLIC_API_BASE_URL',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.warn('Missing environment variables:', missingVars);
    console.warn('Using default values. Check your .env.local file.');
  }

  return missingVars.length === 0;
}

// Validate environment on import
if (typeof window !== 'undefined') {
  validateEnvironment();
}
