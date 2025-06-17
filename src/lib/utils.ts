import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for combining Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency from cents to dollar string
 */
export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Format currency for display (no decimals for whole dollars)
 */
export function formatCurrencyDisplay(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0 ? `$${dollars.toFixed(0)}` : `$${dollars.toFixed(2)}`;
}

/**
 * Calculate platform fee
 */
export function calculatePlatformFee(amount: number, feeRate: number = 0.05): number {
  return Math.round(amount * feeRate);
}

/**
 * Calculate referral bonus for a given level
 * Level 1: 10%, Level 2: 1%, Level 3: 0.1%, etc.
 */
export function calculateReferralBonus(grossAmount: number, level: number): number {
  if (level < 1 || level > 10) return 0;
  const bonusRate = 0.10 * Math.pow(0.10, level - 1);
  return Math.round(grossAmount * bonusRate);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate slug from string (for URLs)
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
}

/**
 * Check if a session is upcoming (within next 24 hours)
 */
export function isUpcomingSession(scheduledAt: Date): boolean {
  const now = new Date();
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return scheduledAt >= now && scheduledAt <= twentyFourHoursFromNow;
}

/**
 * Generate time slots for scheduling
 */
export function generateTimeSlots(
  startDate: Date,
  endDate: Date,
  durationMinutes: number = 30,
  businessHoursStart: number = 9, // 9 AM
  businessHoursEnd: number = 17 // 5 PM
): Date[] {
  const slots: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const hour = current.getHours();
    
    // Only include business hours
    if (hour >= businessHoursStart && hour < businessHoursEnd) {
      slots.push(new Date(current));
    }

    // Move to next slot
    current.setMinutes(current.getMinutes() + durationMinutes);
    
    // If we've moved to the next day, reset to start of business hours
    if (current.getHours() >= businessHoursEnd) {
      current.setDate(current.getDate() + 1);
      current.setHours(businessHoursStart, 0, 0, 0);
    }
  }

  return slots;
}

// Add these to existing src/lib/utils.ts around line 150

/**
 * Format date for display in components (replaces duplicate formatDate functions)
 */
export function formatDate(dateString: string, includeTime = true): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = includeTime 
    ? { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
    : { month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format time only from date string
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

/**
 * Format long date for detailed displays
 */
export function formatLongDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

/**
 * Get status badge classes for sessions
 */
export function getStatusBadgeClasses(status: string): string {
  const badges: Record<string, string> = {
    requested: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800'
  };
  
  return badges[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Generate consistent gradient classes for user avatars
 */
export function getAvatarGradient(index: number = 0): string {
  const gradients = [
    'from-indigo-500 to-purple-600',
    'from-green-500 to-emerald-600',
    'from-blue-500 to-cyan-600',
    'from-purple-500 to-pink-600',
    'from-yellow-500 to-orange-600',
    'from-red-500 to-pink-600'
  ];
  
  return `bg-gradient-to-br ${gradients[index % gradients.length]}`;
}

/**
 * Debounced search function for real-time search
 */
export function createDebouncedSearch<T>(
  searchFunction: (query: string) => Promise<T[]>,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout;
  
  return (query: string): Promise<T[]> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          const results = await searchFunction(query);
          resolve(results);
        } catch (error) {
          console.error('Search error:', error);
          resolve([]);
        }
      }, delay);
    });
  };
}

/**
 * Common API fetch wrapper with error handling
 */
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      cache: 'no-store',
      ...options,
    });

    const data = await response.json();


    if (!response.ok) {
      return {
        success: false,
        error: data?.error || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    // Some API routes return nested { success, data } structures
    let nested = data;
    while (
      nested &&
      typeof nested === 'object' &&
      'success' in nested &&
      'data' in nested
    ) {
      if (!nested.success) {
        return { success: false, error: (nested as { error: string }).error };
      }
      nested = (nested as { data: unknown }).data;
    }

    return { success: true, data: nested as T };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Validate session timing (must be at least 2 hours in future)
 */
export function isValidSessionTime(scheduledAt: Date): boolean {
  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  return scheduledAt >= twoHoursFromNow;
}

/**
 * Get user's display name (fallback to email if no name)
 */
export function getDisplayName(user: { name?: string; email: string }): string {
  return user.name || user.email.split('@')[0];
}

/**
 * Generate avatar URL from user initials
 */
export function generateAvatarUrl(name: string): string {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
  
  // Use a service like UI Avatars or generate locally
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=128&background=4f46e5&color=ffffff`;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (Array.isArray(obj)) return obj.map(item => deepClone(item)) as unknown as T;
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * Debounce function to limit rapid API calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
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
 * Check if current time is within business hours
 */
export function isBusinessHours(
  date: Date = new Date(),
  startHour: number = 9,
  endHour: number = 17
): boolean {
  const hour = date.getHours();
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Check if it's a weekday and within business hours
  return dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= startHour && hour < endHour;
}

/**
 * Calculate session completion rate for a professional
 */
export function calculateCompletionRate(completedSessions: number, totalSessions: number): number {
  if (totalSessions === 0) return 0;
  return Math.round((completedSessions / totalSessions) * 100);
}

/**
 * Get professional's expertise tags as a formatted string
 */
export function formatExpertise(expertise: string[], maxTags: number = 3): string {
  if (expertise.length <= maxTags) {
    return expertise.join(', ');
  }
  
  const displayed = expertise.slice(0, maxTags);
  const remaining = expertise.length - maxTags;
  return `${displayed.join(', ')} +${remaining} more`;
}