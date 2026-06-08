import React from "react";

import { PrimaryButton, SecondaryButton } from "../Button";
import type { CompanyAdminAddPeoplePage } from "../CompanyAdminAddPeoplePage";
import { IconAlertTriangleFilled } from "../icons";
import { Modal } from "../Modal";

export interface BillingLimitGuidanceNoticeProps {
  isOpen: boolean;
  onClose: () => void;
  guidance: CompanyAdminAddPeoplePage.BillingLimitGuidance;
}

export function BillingLimitGuidanceNotice({
  isOpen,
  onClose,
  guidance,
}: BillingLimitGuidanceNoticeProps) {
  const nextStepValue = guidance.recommendedPlanLabel
    ? guidance.recommendedPlanLabel
    : guidance.cta
      ? "Choose a plan with more member capacity."
      : "An admin or owner needs to choose a plan with more member capacity.";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="medium" contentPadding="p-0">
      <div className="overflow-hidden rounded-lg bg-surface-base" data-test-id="billing-limit-guidance">
        <div className="border-b border-stroke-base bg-callout-warning-bg px-5 py-5 sm:px-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-stroke-base bg-surface-base text-callout-warning-content shadow-sm">
              <IconAlertTriangleFilled size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="inline-flex rounded-full border border-stroke-base bg-surface-base px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-content-dimmed">
                Plan limit reached
              </div>
              <h3 className="mt-3 text-lg font-semibold leading-7 text-content-accent">{guidance.title}</h3>
              <p className="mt-2 text-sm leading-6 text-content-dimmed">{guidance.description}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 sm:px-6">
          <InfoTile label="Usage" value={guidance.usageSummary} />
          <InfoTile
            label={guidance.recommendedPlanLabel ? "Recommended plan" : "Next step"}
            value={nextStepValue}
            emphasized={!!guidance.recommendedPlanLabel}
          />
        </div>

        <div className="border-t border-stroke-base px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {guidance.cta && (
              <PrimaryButton linkTo={guidance.cta.to} testId="billing-limit-guidance-cta">
                {guidance.cta.label}
              </PrimaryButton>
            )}
            <SecondaryButton onClick={onClose} testId="billing-limit-guidance-close">
              Close
            </SecondaryButton>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function InfoTile({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-stroke-base bg-surface-dimmed px-4 py-4">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-content-dimmed">{label}</div>
      <div className={`mt-2 text-sm leading-6 ${emphasized ? "font-semibold text-content-accent" : "text-content-dimmed"}`}>{value}</div>
    </div>
  );
}
