import React from "react";
import { expect, within } from "storybook/test";
import { dismissToast, showErrorToast, showSuccessToast, showInfoToast, ToasterBar } from ".";
import { SecondaryButton } from "../Button";

export default {
  title: "Components/Toasts",
  component: ToasterBar,
  decorators: [
    (Story) => (
      <div className="bg-surface-base dark:bg-surface-dark h-96 max-w-2xl mx-auto p-12 my-8 rounded-lg shadow">
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

export const PersistentWithAction = {
  render: () => {
    React.useEffect(() => {
      const id = showErrorToast("Couldn't load options for adding goals and projects.", "Try loading them again.", {
        id: "persistent-action-example",
        duration: Infinity,
        action: {
          label: "Try again",
          onClick: () => {
            showSuccessToast("Options loaded", "You can now add goals and projects.");
          },
        },
      });
      return () => dismissToast(id);
    }, []);
    return null;
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Close notification" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Try again" })).toBeVisible();
  },
};
