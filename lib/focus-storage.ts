const FOCUS_STORAGE_KEY = 'medialuna_focus_projects';
const WORK_LOG_STORAGE_KEY = 'medialuna_work_log';

export type FocusSession = {
  projectIds: string[];
  timestamp: number;
};

export type WorkLogItem = {
  id: string;
  description: string;
  timestamp: number;
  projectId: string | null; // null for unplanned work
  unplannedReason?: string;
};

export type WorkLogSession = {
  items: WorkLogItem[];
  timestamp: number;
};

export const UNPLANNED_REASONS = [
  'Urgent bug',
  'Support request',
  'Meeting',
  'Other'
] as const;

export type UnplannedReason = typeof UNPLANNED_REASONS[number];

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

// ============================================================================
// Work Log Functions
// ============================================================================

/**
 * Save work log session to local storage
 */
function saveWorkLogSession(session: WorkLogSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WORK_LOG_STORAGE_KEY, JSON.stringify(session));
}

/**
 * Get the current work log session from local storage
 * Returns null if no session exists or if expired
 */
export function getWorkLogSession(): WorkLogSession | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(WORK_LOG_STORAGE_KEY);
  if (!stored) return null;
  
  try {
    const session: WorkLogSession = JSON.parse(stored);
    
    // Check if expired (past midnight from when it was created)
    if (isFocusExpired(session.timestamp)) {
      clearWorkLog();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Failed to parse work log session:', error);
    clearWorkLog();
    return null;
  }
}

/**
 * Get all work log items for today
 */
export function getWorkLog(): WorkLogItem[] {
  const session = getWorkLogSession();
  return session?.items ?? [];
}

/**
 * Add a new work log item
 */
export function addWorkLogItem(item: Omit<WorkLogItem, 'id' | 'timestamp'>): WorkLogItem {
  if (typeof window === 'undefined') {
    throw new Error('Cannot add work log item on server side');
  }
  
  const newItem: WorkLogItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };
  
  let session = getWorkLogSession();
  
  if (!session) {
    // Create new session
    session = {
      items: [newItem],
      timestamp: Date.now(),
    };
  } else {
    // Add to existing session
    session.items.push(newItem);
  }
  
  saveWorkLogSession(session);
  return newItem;
}

/**
 * Remove a work log item by ID
 */
export function removeWorkLogItem(id: string): void {
  if (typeof window === 'undefined') return;
  
  const session = getWorkLogSession();
  if (!session) return;
  
  session.items = session.items.filter(item => item.id !== id);
  saveWorkLogSession(session);
}

/**
 * Clear the work log from storage
 */
export function clearWorkLog(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(WORK_LOG_STORAGE_KEY);
}
