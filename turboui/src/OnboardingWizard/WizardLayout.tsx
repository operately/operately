import React, { useRef } from "react";

export interface WizardModalProps {
  children: React.ReactNode;
  labelledBy: string;
  testId?: string;
}

export function WizardModal(props: WizardModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-8 bg-black/50 backdrop-blur-sm"
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-2xl bg-surface-base border border-surface-outline/60 rounded-2xl shadow-2xl focus:outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={props.labelledBy}
        data-test-id={props.testId}
      >
        {props.children}
      </div>
    </div>
  );
}

export function WizardStep(props: { children: React.ReactNode; footer?: React.ReactNode; testId?: string }) {
  return (
    <div className="flex flex-col" data-test-id={props.testId}>
      <div className="p-6 sm:p-8">{props.children}</div>
      {props.footer && (
        <div className="flex flex-col sm:flex-row gap-3 border-t py-4 px-6 w-full sm:justify-end">{props.footer}</div>
      )}
    </div>
  );
}

export interface WizardHeadingProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  subtitle?: React.ReactNode;
  id?: string;
}

export function WizardHeading(props: WizardHeadingProps) {
  return (
    <div className="max-w-2xl">
      <div className="uppercase text-xs mb-4 text-content-dimmed">
        Step {props.stepNumber} of {props.totalSteps}
      </div>
      <h1 className="text-2xl font-semibold text-content-accent focus:outline-none" tabIndex={-1} id={props.id}>
        {props.title}
      </h1>
      {props.subtitle && <p className="mt-2 text-content-dimmed">{props.subtitle}</p>}
    </div>
  );
}
