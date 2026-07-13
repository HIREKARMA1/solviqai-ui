const STORAGE_KEY = 'guest_readiness_token';

export function getGuestSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setGuestSessionToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearGuestSessionToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}
