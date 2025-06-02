import React from "react";
import toast from "react-hot-toast";

export const showErrorToast = (title: string, description: string) => {
  toast.error(
    <div>
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-xs text-content-dimmed mt-1">{description}</div>
    </div>,
  );
};
