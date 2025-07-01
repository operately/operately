import React from "react";
import { showErrorToast, showSuccessToast, showInfoToast, ToasterBar } from ".";
import { SecondaryButton } from "../Button";

export default {
  title: "Components/Toasts",
  component: ToasterBar,
  decorators: [
    (Story) => (
      <div className="bg-surface-base dark:bg-surface-dark h-96 max-w-2xl mx-auto p-12 my-8 rounded-lg shadow">
        <ToasterBar />
        <Story />
      </div>
    ),
  ],
};

export const Default = {
  render: () => (
    <div className="space-y-3">
      <SecondaryButton onClick={() => showErrorToast("Error title", "This is an error description")} size="sm">
        Show error toast
      </SecondaryButton>

      <SecondaryButton onClick={() => showSuccessToast("Success title", "This is a success message")} size="sm">
        Show success toast
      </SecondaryButton>

      <SecondaryButton onClick={() => showInfoToast("Info title", "This is an informational message")} size="sm">
        Show info toast
      </SecondaryButton>
    </div>
  ),
};
