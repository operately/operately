import { IconExclamationCircleFilled, IconCircleCheckFilled, IconInfoCircleFilled } from "../icons";
import React from "react";
import toast, { Toaster } from "react-hot-toast";

export function ToasterBar() {
  return <Toaster position="bottom-right" reverseOrder={true} />;
}

type ToastType = "error" | "success" | "info";

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
    iconColor: "text-callout-info-icon",
  },
};

const showToast = (type: ToastType, title: string, description: string) => {
  const config = toastConfigs[type];
  const IconComponent = config.icon;

  toast.custom(
    <div className="bg-surface-base p-2 rounded-lg shadow text-xs">
      <div className="flex gap-2">
        <IconComponent className={`${config.iconColor} mt-0.5`} size={18} />
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-content-dimmed">{description}</div>
        </div>
      </div>
    </div>,
  );
};

export const showErrorToast = (title: string, description: string) => {
  showToast("error", title, description);
};

export const showSuccessToast = (title: string, description: string) => {
  showToast("success", title, description);
};

export const showInfoToast = (title: string, description: string) => {
  showToast("info", title, description);
};
