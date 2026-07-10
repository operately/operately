import React from "react";
import { PageBanner } from ".";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Page } from "../Page";
import { Link } from "../Link";
import { SecondaryButton } from "../Button";

const meta: Meta<typeof PageBanner> = {
  title: "Components/PageBanner",
  component: PageBanner,
  decorators: [
    (Story) => (
      <div className="mt-12">
        <Page title="Banner Example" size="medium">
          <Story />

          <div className="p-8 flex items-center">Example Page</div>
        </Page>
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof PageBanner>;

export const Default: Story = {
  args: {
    children: "This is a page banner!",
  },
};

export const WithLinks: Story = {
  args: {
    children: (
      <p>
        This project was closed on 17th March. <Link to="#">Read the retrospective</Link>.
      </p>
    ),
  },
};

export const WithButtons: Story = {
  args: {
    children: (
      <p className="flex items-center gap-2">
        This project was paused on 17th March <SecondaryButton size="xxs">Resume the project</SecondaryButton>
      </p>
    ),
  },
};
