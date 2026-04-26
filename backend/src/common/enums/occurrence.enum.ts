export enum OccurrenceStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  WAITING_RESIDENT = 'waiting_resident',
  WAITING_INTERNAL = 'waiting_internal',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REOPENED = 'reopened',
}

export enum OccurrencePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}
