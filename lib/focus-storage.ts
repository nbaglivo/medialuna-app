const FOCUS_STORAGE_KEY = 'medialuna_focus_projects';

export type FocusSession = {
  projectIds: string[];
  timestamp: number;
};

/**
 * Get the midnight timestamp for today (00:00:00)
 */
function getTodayMidnight(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}

/**
 * Check if the focus session has expired (past midnight from when it was set)
 */
export function isFocusExpired(timestamp: number): boolean {
  const focusDate = new Date(timestamp);
  focusDate.setHours(0, 0, 0, 0);
  const focusMidnight = focusDate.getTime();
  
  const todayMidnight = getTodayMidnight();
  
  return todayMidnight > focusMidnight;
}

/**
 * Save focused project IDs to session storage
 */
export function saveFocusSession(projectIds: string[]): void {
  if (typeof window === 'undefined') return;
  
  const session: FocusSession = {
    projectIds,
    timestamp: Date.now(),
  };
  
  sessionStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(session));
}

/**
 * Get the current focus session from session storage
 * Returns null if no session exists or if expired
 */
export function getFocusSession(): FocusSession | null {
  if (typeof window === 'undefined') return null;
  
  const stored = sessionStorage.getItem(FOCUS_STORAGE_KEY);
  if (!stored) return null;
  
  try {
    const session: FocusSession = JSON.parse(stored);
    
    // Check if expired
    if (isFocusExpired(session.timestamp)) {
      clearFocusSession();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Failed to parse focus session:', error);
    clearFocusSession();
    return null;
  }
}

/**
 * Clear the focus session from storage
 */
export function clearFocusSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(FOCUS_STORAGE_KEY);
}

/**
 * Get the time remaining until midnight (in milliseconds)
 */
export function getTimeUntilMidnight(): number {
  const now = Date.now();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  return tomorrow.getTime() - now;
}

/**
 * Format time remaining until midnight
 */
export function formatTimeUntilMidnight(): string {
  const ms = getTimeUntilMidnight();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
