import { WorkLogItem } from "@/app/actions/day-plan";

const FOCUS_STORAGE_KEY = 'medialuna_focus_projects';
const WORK_LOG_STORAGE_KEY = 'medialuna_work_log';
const DAY_PLAN_STORAGE_KEY = 'medialuna_day_plan';

export type FocusSession = {
  projectIds: string[];
  timestamp: number;
};

export type WorkLogSession = {
  items: WorkLogItem[];
  timestamp: number;
};

export type DaySummaryStatistics = {
  totalTasks: number;
  totalMinutes: number;
  projectBreakdown: {
    projectId: string;
    projectName: string;
    count: number;
    minutes: number;
  }[];
  unplannedCount: number;
};

export type DaySummary = {
  date: string; // ISO date
  timestamp: number;
  reflection: string;
  workItems: WorkLogItem[];
  statistics: DaySummaryStatistics;
};

export type DayPlanSession = {
  dayPlanId: string;
  planDate: string;
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

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function generateFallbackUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const rand = Math.floor(Math.random() * 16);
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
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
export function getDayWorkSession(): FocusSession | null {
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

export function saveDayPlanSession(dayPlanId: string, planDate: string): void {
  if (typeof window === 'undefined') return;

  const session: DayPlanSession = {
    dayPlanId,
    planDate,
    timestamp: Date.now(),
  };

  sessionStorage.setItem(DAY_PLAN_STORAGE_KEY, JSON.stringify(session));
}

export function getDayPlanSession(): DayPlanSession | null {
  if (typeof window === 'undefined') return null;

  const stored = sessionStorage.getItem(DAY_PLAN_STORAGE_KEY);
  if (!stored) return null;

  try {
    const session: DayPlanSession = JSON.parse(stored);
    const today = getTodayDateString();

    if (session.planDate !== today) {
      clearDayPlanSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Failed to parse day plan session:', error);
    clearDayPlanSession();
    return null;
  }
}

export function clearDayPlanSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(DAY_PLAN_STORAGE_KEY);
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

export function setWorkLogItems(items: WorkLogItem[]): void {
  if (typeof window === 'undefined') return;
  saveWorkLogSession({
    items,
    timestamp: Date.now(),
  });
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

  const generatedId = globalThis.crypto?.randomUUID?.() ?? generateFallbackUuid();

  const newItem: WorkLogItem = {
    ...item,
    id: generatedId,
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

// ============================================================================
// Day Summary Functions
// ============================================================================

const DAY_HISTORY_STORAGE_KEY = 'medialuna_day_history';

/**
 * Save a day summary to history
 */
export function saveDaySummary(reflection: string, items: WorkLogItem[], statistics: DaySummaryStatistics): DaySummary {
  if (typeof window === 'undefined') {
    throw new Error('Cannot save day summary on server side');
  }

  const summary: DaySummary = {
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    timestamp: Date.now(),
    reflection,
    workItems: items,
    statistics,
  };

  // Get existing history
  const history = getDayHistory();
  
  // Add new summary
  history.push(summary);
  
  // Save to localStorage
  localStorage.setItem(DAY_HISTORY_STORAGE_KEY, JSON.stringify(history));
  
  return summary;
}

/**
 * Get all day summaries from history
 */
export function getDayHistory(): DaySummary[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(DAY_HISTORY_STORAGE_KEY);
  if (!stored) return [];
  
  try {
    const history: DaySummary[] = JSON.parse(stored);
    return Array.isArray(history) ? history : [];
  } catch (error) {
    console.error('Failed to parse day history:', error);
    return [];
  }
}

/**
 * Clear the current day (focus session and work log)
 */
export function clearCurrentDay(): void {
  if (typeof window === 'undefined') return;
  clearFocusSession();
  clearWorkLog();
  clearDayPlanSession();
}
