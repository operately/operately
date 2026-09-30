import type { FormattedTimePreferences } from "../FormattedTime";

// View contracts until the time-tracking API exists. The bridge supplies only authorized data.
export interface TimeDestination {
  id: string;
  name: string;
  kind: "project" | "task" | "space-task";
  scopeId: string;
  scopeName: string;
  milestone?: { id: string; name: string } | null;
  enabled: boolean;
  canTrack: boolean;
  closed?: boolean;
}

export interface TimeEntry {
  id: string;
  person: { id: string; fullName: string; avatarUrl: string | null };
  destination: TimeDestination;
  date: string;
  timezone: string;
  durationSeconds: number;
  startedAt?: string | null;
  endedAt?: string | null;
  source: "manual" | "timer";
  notes: string;
  canEdit: boolean;
  canDelete: boolean;
}

export interface ActiveTimer {
  id: string;
  destination: TimeDestination;
  startedAt: string;
}

export interface TimeEntryInput {
  destinationId: string;
  date: string;
  timezone: string;
  durationSeconds: number;
  notes: string;
  startedAt: string | null;
  endedAt: string | null;
}

export type TimeActionResult = { ok: true } | { ok: false; error: string };
export interface TimeTrackingActions {
  onSaveEntry: (input: TimeEntryInput, entryId?: string) => Promise<TimeActionResult>;
  onDeleteEntry: (entryId: string) => Promise<TimeActionResult>;
  onStartTimer: (destinationId: string) => Promise<TimeActionResult>;
  // Switching is a single atomic operation in the future backend.
  onSwitchTimer: (timerId: string, destinationId: string) => Promise<TimeActionResult>;
  onStopTimer: (timerId: string) => Promise<TimeActionResult>;
  onDiscardTimer: (timerId: string) => Promise<TimeActionResult>;
}

export interface TimeTrackingData extends TimeTrackingActions {
  entries: TimeEntry[];
  destinations: TimeDestination[];
  currentPersonId: string;
  activeTimer: ActiveTimer | null;
  formattedTimePreferences: FormattedTimePreferences;
  today: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export interface ProjectTimeSectionProps extends TimeTrackingData {
  // Supply the complete authorized project history, including time on tasks.
  projectDestination: TimeDestination;
  canViewTeam: boolean;
  onOpenDestination?: (destination: TimeDestination) => void;
  onEnabledChange?: (enabled: boolean) => Promise<TimeActionResult>;
}

export interface TaskTimeSectionProps extends TimeTrackingData {
  destination: TimeDestination;
  canViewTeam: boolean;
  isTaskClosed?: boolean;
}

export interface TimeEntryEditorProps {
  entry?: TimeEntry;
  initial?: Partial<TimeEntryInput>;
  destinations: TimeDestination[];
  today: string;
  formattedTimePreferences: FormattedTimePreferences;
  title?: string;
  saveText?: string;
  // Other timestamped entries for this entry's owner, used only for overlap feedback.
  existingEntries?: TimeEntry[];
  onSave: (input: TimeEntryInput) => Promise<TimeActionResult>;
  onClose: () => void;
}
