import { useState } from "react";

import type { ScheduleFlowState } from "./ScheduleFlowControls";

interface UseScheduleFlowStateOptions {
  initialScheduledAt?: string | Date | null;
}

export interface ScheduleFlowStateWithIso extends ScheduleFlowState {
  scheduledAtIso: string | null;
}

function parseScheduledAt(value?: string | Date | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function useScheduleFlowState({
  initialScheduledAt = null,
}: UseScheduleFlowStateOptions = {}): ScheduleFlowStateWithIso {
  const initialDate = parseScheduledAt(initialScheduledAt);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(initialDate);
  const [isScheduledLocally, setIsScheduledLocally] = useState(initialDate !== null);

  return {
    isModalOpen,
    setIsModalOpen,
    isScheduledLocally,
    scheduledAt,
    scheduledAtIso: scheduledAt ? scheduledAt.toISOString() : null,
    openScheduleModal: () => setIsModalOpen(true),
    confirmSchedule: (date: Date) => {
      setScheduledAt(date);
      setIsScheduledLocally(true);
      setIsModalOpen(false);
    },
    cancelSchedule: () => setIsModalOpen(false),
    primaryButtonLabel: (immediateLabel: string) => (isScheduledLocally ? "Confirm" : immediateLabel),
  };
}
