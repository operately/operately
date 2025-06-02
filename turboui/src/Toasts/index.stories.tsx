import React from "react";
import { showErrorToast, ToasterBar } from ".";
import { SecondaryButton } from "../Button";

export default {
  title: "Components/Tosts",
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
    <div>
      <SecondaryButton onClick={() => showErrorToast("Error Title", "This is an error description")} size="sm">
        Click me
      </SecondaryButton>
    </div>
  ),
};
