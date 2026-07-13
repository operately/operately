import React from "react";

import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import type { ScheduleFlow } from "@/hooks/useScheduleFlow";
import { OptionsButton, ScheduleModal, ScheduleNotice } from "turboui";

interface Props {
  scheduleFlow: ScheduleFlow;
  primaryLabel: string;
  onPrimaryClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  testId?: string;
  secondaryAction?: React.ReactNode;
}

export function ScheduleFlowControls({
  scheduleFlow,
  primaryLabel,
  onPrimaryClick,
  loading,
  disabled,
  testId,
  secondaryAction,
}: Props) {
  const formattedTimePreferences = useFormattedTimePreferences();

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
