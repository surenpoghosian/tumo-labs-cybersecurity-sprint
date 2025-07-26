import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Mobile detection utilities
export function isMobileDevice(userAgent?: string): boolean {
  if (typeof window === 'undefined' && !userAgent) return false;
  
  const agent = userAgent || (typeof window !== 'undefined' ? window.navigator.userAgent : '');
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(agent);
}

export function getViewportWidth(): number {
  if (typeof window === 'undefined') return 1024; // Default to desktop width on server
  return window.innerWidth;
}

export function isMobileViewport(): boolean {
  return getViewportWidth() < 768; // Tailwind's md breakpoint
}

export function shouldRestrictMobile(): boolean {
  return isMobileDevice() || isMobileViewport();
} 