import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
  // At least 8 characters with uppercase, lowercase, digit, and special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

export function validatePhone(phone: string): boolean {
  // Basic phone validation - can be customized based on requirements
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Extract error message from API error response
 * Handles various error response formats from the backend
 */
export function getErrorMessage(error: any, defaultMessage: string = 'An error occurred'): string {
  // Check if error has a response with data
  if (error?.response?.data) {
    const data = error.response.data;

    // Check for detail field (FastAPI standard). NOTE: on 422 validation errors
    // `detail` is an ARRAY of objects like { type, loc, msg, input, ctx } — those
    // must never be returned/rendered directly (causes "Objects are not valid as a
    // React child"). Normalize everything down to a string.
    const detail = data.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
    if (Array.isArray(detail)) {
      const msgs = detail
        .map((d: any) => (typeof d === 'string' ? d : d?.msg))
        .filter((m: any) => typeof m === 'string' && m.trim());
      if (msgs.length) return msgs.join(', ');
    }
    if (detail && typeof detail === 'object') {
      if (typeof detail.message === 'string') return detail.message;
      if (typeof detail.msg === 'string') return detail.msg;
    }

    // Check for message field
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }

    // Check for error field
    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error;
    }

    // If data is a string, return it
    if (typeof data === 'string') {
      return data;
    }
  }

  // Check if error has a message property
  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  // Return default message
  return defaultMessage;
}






