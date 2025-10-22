import React, { useEffect, useRef } from "react";

export interface WizardModalProps {
  children: React.ReactNode;
  labelledBy: string;
  testId?: string;
}

export function WizardModal(props: WizardModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const { body } = document;
    const originalOverflow = body.style.overflow;
    const originalPaddingRight = body.style.paddingRight;
    const scrollBarCompensation =
      typeof window !== "undefined" ? window.innerWidth - document.documentElement.clientWidth : 0;

    body.style.overflow = "hidden";
    if (scrollBarCompensation > 0) {
      body.style.paddingRight = `${scrollBarCompensation}px`;
    }

    return () => {
      body.style.overflow = originalOverflow;
      body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto overscroll-contain px-4 py-4 sm:py-8 sm:items-center bg-black/50 backdrop-blur-sm"
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-2xl max-h-[calc(100vh-2rem)] sm:max-h-[90vh] bg-surface-base border border-stroke-base rounded-2xl shadow-2xl focus:outline-none flex flex-col overflow-y-auto sm:overflow-hidden"
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
    <div className="flex flex-col flex-1 max-h-full" data-test-id={props.testId}>
      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto sm:overflow-y-visible px-6 pt-6 pb-24 sm:px-8 sm:pt-8 sm:pb-12">
        {props.children}
      </div>
      {props.footer && (
        <div className="flex flex-col sm:flex-row gap-3 border-t border-stroke-base py-4 px-6 w-full sm:justify-end">
          {props.footer}
        </div>
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
