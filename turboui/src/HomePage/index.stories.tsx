import React from "react";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HomePage } from "./index";
import { defaultProps } from "./mockData";

const meta = {
  title: "Pages/HomePage",
  component: HomePage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof HomePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: defaultProps,
};

export const EmptySpaces: Story = {
  args: {
    ...defaultProps,
    spaces: [],
  },
};

export const RestrictedPermissions: Story = {
  args: {
    ...defaultProps,
    canCreateSpace: false,
    canInviteMembers: false,
  },
};

export const EveningGreeting: Story = {
  args: {
    ...defaultProps,
    now: new Date("2026-08-21T20:00:00"),
  },
};

const expanded = createInstance();
void expanded.init({
  lng: "en",
  keySeparator: false,
  interpolation: { escapeValue: false },
  resources: {
    en: {
      translation: {
        "Good morning, {{name}}!": "Wishing you a very good morning, {{name}}!",
        "Your Operately Spaces": "All of your team's spaces in Operately",
        "Add Space": "Add a new team space",
        "Invite People": "Invite new people to your team",
      },
    },
  },
});
export const ExpandedText: Story = {
  args: { ...defaultProps, spaces: [] },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={expanded}>
        <div style={{ width: 375 }}>
          <Story />
        </div>
      </I18nextProvider>
    ),
  ],
};
