import { IconExclamationCircleFilled } from "../icons";
import React from "react";
import toast, { Toaster } from "react-hot-toast";

export function ToasterBar() {
  return <Toaster position="bottom-right" reverseOrder={true} />;
}

export const showErrorToast = (title: string, description: string) => {
  toast.custom(
    <div className="bg-surface-base p-2 rounded-lg shadow text-xs">
      <div className="flex gap-2">
        <IconExclamationCircleFilled className="text-red-500 mt-0.5" size={18} />
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-content-dimmed">{description}</div>
        </div>
      </div>
    </div>,
  );
};
