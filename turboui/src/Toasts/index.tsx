import { IconExclamationCircleFilled, IconCircleCheckFilled, IconInfoCircleFilled, IconX } from "../icons";
import React from "react";
import toast, { Toaster } from "react-hot-toast";
import { SecondaryButton } from "../Button";
import { UnstyledButton } from "../Button/UnstalyedButton";

export function ToasterBar() {
  return <Toaster position="bottom-right" reverseOrder={true} />;
}

type ToastType = "error" | "success" | "info";

export interface ToastOptions {
  id?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastConfig {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  iconColor: string;
}

const toastConfigs: Record<ToastType, ToastConfig> = {
  error: {
    icon: IconExclamationCircleFilled,
    iconColor: "text-callout-error-content",
  },
  success: {
    icon: IconCircleCheckFilled,
    iconColor: "text-callout-success-content",
  },
  info: {
    icon: IconInfoCircleFilled,
    iconColor: "text-callout-info-content",
  },
};

const showToast = (type: ToastType, title: string, description: string, options: ToastOptions = {}) => {
  const config = toastConfigs[type];
  const IconComponent = config.icon;

  return toast.custom(
    (notification) =>
      notification.visible ? (
        <div
          className={`relative bg-surface-base p-2 rounded-lg shadow text-xs ${options.duration === Infinity ? "pr-8" : ""}`}
          {...notification.ariaProps}
        >
          <div className="flex gap-2">
            <IconComponent className={`${config.iconColor} mt-0.5`} size={18} />
            <div>
              <div className="font-semibold">{title}</div>
              <div className="text-content-dimmed">{description}</div>
              {options.action && (
                <SecondaryButton
                  size="xxs"
                  className="mt-2"
                  onClick={() => {
                    toast.dismiss(notification.id);
                    options.action?.onClick();
                  }}
                >
                  {options.action.label}
                </SecondaryButton>
              )}
            </div>
          </div>
          {options.duration === Infinity && (
            <UnstyledButton
              ariaLabel="Close notification"
              className="absolute right-1 top-1 rounded p-1 text-content-subtle hover:text-content-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-1"
              onClick={() => toast.dismiss(notification.id)}
            >
              <IconX size={14} />
            </UnstyledButton>
          )}
        </div>
      ) : null,
    { id: options.id, duration: options.duration },
  );
};

export const showErrorToast = (title: string, description: string, options?: ToastOptions) => {
  return showToast("error", title, description, options);
};

export const showSuccessToast = (title: string, description: string, options?: ToastOptions) => {
  return showToast("success", title, description, options);
};

export const showInfoToast = (title: string, description: string, options?: ToastOptions) => {
  return showToast("info", title, description, options);
};

export const dismissToast = (id: string) => toast.dismiss(id);
