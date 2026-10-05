import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BillingDangerBanner } from ".";
import { paymentBanner, limitBanner } from "./mockData";
import { defaultFormattedTimePreferences } from "../FormattedTime";

const meta = {
  title: "Components/BillingDangerBanner",
  component: BillingDangerBanner,
  parameters: { layout: "fullscreen" },
  args: { formattedTimePreferences: defaultFormattedTimePreferences },
  decorators: [
    (Story) => (
      <div style={{ minHeight: 500 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BillingDangerBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PaymentGrace: Story = { args: { banner: paymentBanner } };

export const ReadOnly: Story = {
  args: { banner: { ...paymentBanner, mode: "read_only", shouldContactAdmin: true, cta: null } },
};

export const OverLimit: Story = { args: { banner: limitBanner } };

export const SupportSession: Story = { args: { banner: limitBanner, hasSupportSession: true } };
