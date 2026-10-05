import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { PeoplePage } from ".";

const meta = { title: "Pages/PeoplePage", component: PeoplePage, parameters: { layout: "fullscreen" } } satisfies Meta<
  typeof PeoplePage
>;
export default meta;
type Story = StoryObj<typeof meta>;

const args: PeoplePage.Props = {
  companyName: "Acme",
  people: [
    {
      __typename: "person",
      id: "ana",
      fullName: "Ana Silva",
      title: "Designer",
      email: "ana@example.com",
      avatarUrl: null,
      type: "member",
    },
  ],
  profileHref: (id) => `/people/${id}`,
};
export const Default: Story = { args };
export const Empty: Story = { args: { ...args, people: [] } };

const expanded = createInstance();
void expanded.init({
  lng: "en",
  keySeparator: false,
  interpolation: { escapeValue: false },
  resources: {
    en: { translation: { "Members of {{company}}": "All of the colleagues and team members working at {{company}}" } },
  },
});
export const ExpandedText: Story = {
  args,
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
