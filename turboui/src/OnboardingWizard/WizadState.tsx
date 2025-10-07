import { useCallback, useState } from "react";

export interface WizardState<T> {
  currentStep: T;
  steps: T[];
  next: () => void;
  back: () => void;
  dismiss: () => void;
}

export function useWizardState<T>(initialStep: T, steps: T[], onDismiss: () => void): WizardState<T> {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const next = useCallback(() => {
    setCurrentStep((prev) => {
      const currentIndex = steps.indexOf(prev);
      if (currentIndex === -1) throw new Error(`Current step "${prev}" not found in steps array.`);

      const nextIndex = Math.min(currentIndex + 1, steps.length - 1);
      if (nextIndex === currentIndex) return prev; // Already at the last step

      return steps[nextIndex]!;
    });
  }, [steps]);

  const back = useCallback(() => {
    setCurrentStep((prev) => {
      const currentIndex = steps.indexOf(prev);
      if (currentIndex === -1) throw new Error(`Current step "${prev}" not found in steps array.`);

      const backIndex = Math.max(currentIndex - 1, 0);
      if (backIndex === currentIndex) return prev; // Already at the first step

      return steps[backIndex]!;
    });
  }, [steps]);

  return {
    currentStep,
    steps,
    next,
    back,
    dismiss: onDismiss,
  };
}
