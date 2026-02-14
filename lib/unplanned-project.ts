export const UNPLANNED_REASONS = [
  'Urgent bug',
  'Support request',
  'Meeting',
  'Other'
] as const;

export type UnplannedReason = typeof UNPLANNED_REASONS[number];

export const UNPLANNED_PROJECT_ID = '__unplanned__';
