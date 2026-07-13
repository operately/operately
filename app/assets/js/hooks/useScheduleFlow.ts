import { useState } from "react";

export interface UseScheduleFlowOptions {
  initialScheduledAt?: string | Date | null;
}

export interface ScheduleFlow {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  isScheduledLocally: boolean;
  scheduledAt: Date | null;
  scheduledAtIso: string | null;
  openScheduleModal: () => void;
  closeScheduleModal: () => void;
  confirmSchedule: (date: Date) => void;
  cancelSchedule: () => void;
  clearSchedule: () => void;
  primaryButtonLabel: (immediateLabel: string) => string;
}

function parseScheduledAt(value?: string | Date | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function useScheduleFlow({ initialScheduledAt = null }: UseScheduleFlowOptions = {}): ScheduleFlow {
  const initialDate = parseScheduledAt(initialScheduledAt);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(initialDate);
  const [isScheduledLocally, setIsScheduledLocally] = useState(initialDate !== null);

  const openScheduleModal = () => setIsModalOpen(true);
  const closeScheduleModal = () => setIsModalOpen(false);

  const confirmSchedule = (date: Date) => {
    setScheduledAt(date);
    setIsScheduledLocally(true);
    setIsModalOpen(false);
  };

  const cancelSchedule = () => {
    setIsModalOpen(false);
  };

  const clearSchedule = () => {
    setScheduledAt(null);
    setIsScheduledLocally(false);
    setIsModalOpen(false);
  };

  return {
    isModalOpen,
    setIsModalOpen,
    isScheduledLocally,
    scheduledAt,
    scheduledAtIso: scheduledAt ? scheduledAt.toISOString() : null,
    openScheduleModal,
    closeScheduleModal,
    confirmSchedule,
    cancelSchedule,
    clearSchedule,
    primaryButtonLabel: (immediateLabel: string) => (isScheduledLocally ? "Confirm" : immediateLabel),
  };
}
