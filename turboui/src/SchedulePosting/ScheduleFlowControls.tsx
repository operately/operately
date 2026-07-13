import React from "react";

import { OptionsButton } from "../Button";
import type { FormattedTimePreferences } from "../FormattedTime";
import { ScheduleModal } from "./ScheduleModal";
import { ScheduleNotice } from "./ScheduleNotice";

/**
 * UI state for the schedule flow. App bridges typically provide this from a
 * shared hook (e.g. useScheduleFlow) via structural typing.
 */
export interface ScheduleFlowState {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  isScheduledLocally: boolean;
  scheduledAt: Date | null;
  openScheduleModal: () => void;
  confirmSchedule: (date: Date) => void;
  cancelSchedule: () => void;
  primaryButtonLabel: (immediateLabel: string) => string;
}

export interface ScheduleFlowControlsProps {
  scheduleFlow: ScheduleFlowState;
  primaryLabel: string;
  onPrimaryClick: () => void;
  formattedTimePreferences: FormattedTimePreferences;
  loading?: boolean;
  disabled?: boolean;
  testId?: string;
  secondaryAction?: React.ReactNode;
}

export function ScheduleFlowControls({
  scheduleFlow,
  primaryLabel,
  onPrimaryClick,
  formattedTimePreferences,
  loading,
  disabled,
  testId,
  secondaryAction,
}: ScheduleFlowControlsProps) {
  return (
    <>
      {scheduleFlow.isScheduledLocally && scheduleFlow.scheduledAt && (
        <ScheduleNotice
          date={scheduleFlow.scheduledAt}
          onEdit={scheduleFlow.openScheduleModal}
          formattedTimePreferences={formattedTimePreferences}
          className="mb-3"
        />
      )}

      <div className="flex items-center gap-2">
        <OptionsButton
          onClick={onPrimaryClick}
          loading={loading}
          disabled={disabled}
          testId={testId}
          options={[{ label: "Schedule for later", action: scheduleFlow.openScheduleModal }]}
        >
          {scheduleFlow.primaryButtonLabel(primaryLabel)}
        </OptionsButton>

        {secondaryAction}
      </div>

      <ScheduleModal
        open={scheduleFlow.isModalOpen}
        onOpenChange={scheduleFlow.setIsModalOpen}
        onSchedule={scheduleFlow.confirmSchedule}
        onCancel={scheduleFlow.cancelSchedule}
      />
    </>
  );
}
