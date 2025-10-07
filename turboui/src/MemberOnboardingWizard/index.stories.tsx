import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { MemberOnboardingWizard } from ".";

const meta = {
  title: "Components/Onboarding/MemberOnboardingWizard",
  component: MemberOnboardingWizard,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    onComplete: () => {},
    onDismiss: () => {},
    defaultRole: "Product Manager",
    welcomeImageUrl: "https://pbs.twimg.com/profile_images/1631277097246179330/IpGRsar1_400x400.jpg",
    welcomeImageAlt: "Marko Anastasov profile photo",
  },
  decorators: [
    (Story) => (
      <div>
        <MockWorkspacePage />
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MemberOnboardingWizard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Welcome: Story = {
  args: {
    __initialStep: "welcome",
  },
};

export const Role: Story = {
  args: {
    __initialStep: "role",
    defaultRole: "",
  },
};

export const AvatarEmpty: Story = {
  args: {
    __initialStep: "avatar",
    defaultRole: "Design Lead",
  },
};

export const AvatarPrefilled: Story = {
  args: {
    __initialStep: "avatar",
    defaultRole: "Design Lead",
    initialAvatarUrl: "https://i.pravatar.cc/300?img=5",
  },
};

function MockWorkspacePage() {
  return (
    <div className="pointer-events-none">
      <div className="max-w-6xl mx-auto px-6 py-16 space-y-12">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.4em] text-content-subtle">Workspace overview</p>
          <h1 className="text-3xl font-semibold text-content-accent">Q1 Strategic Initiatives</h1>
          <p className="max-w-2xl text-content-dimmed">
            Track your most impactful workstreams and keep every team aligned. This dashboard highlights the key
            projects driving momentum across your company.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Product Launch",
              metric: "82%",
              description: "Feature freeze complete, polishing release narrative.",
            },
            {
              title: "Revenue Engine",
              metric: "68%",
              description: "Pipeline reviews happening twice a week with marketing syncs.",
            },
            {
              title: "Customer Experience",
              metric: "45%",
              description: "Rolling out unified support playbooks across regions.",
            },
          ].map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-surface-outline/50 bg-surface-base/80 p-6 backdrop-blur-sm shadow-lg"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-content-accent">{card.title}</h2>
                <span className="text-2xl font-bold text-brand-1">{card.metric}</span>
              </div>
              <p className="mt-3 text-sm text-content-dimmed">{card.description}</p>
              <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-surface-dimmed">
                <div className="h-full rounded-full bg-brand-1/80" style={{ width: card.metric }} />
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-surface-outline/50 bg-surface-base/80 p-6 backdrop-blur-sm shadow-lg">
            <h2 className="text-lg font-semibold text-content-accent">Leadership Updates</h2>
            <ul className="mt-4 space-y-3 text-sm text-content-base">
              <li className="rounded-lg bg-surface-highlight/60 px-4 py-3">
                Weekly company newsletter drafted and scheduled for Monday.
              </li>
              <li className="rounded-lg bg-surface-highlight/60 px-4 py-3">
                Ops dry run for all-hands complete — slides ready for review.
              </li>
              <li className="rounded-lg bg-surface-highlight/60 px-4 py-3">
                Security tabletop exercise report delivered to compliance team.
              </li>
            </ul>
          </article>

          <article className="rounded-2xl border border-surface-outline/50 bg-surface-base/80 p-6 backdrop-blur-sm shadow-lg">
            <h2 className="text-lg font-semibold text-content-accent">Upcoming Milestones</h2>
            <div className="mt-4 space-y-4 text-sm text-content-base">
              {["Jan 28", "Feb 05", "Feb 14"].map((date, index) => (
                <div key={date} className="flex items-start gap-4 rounded-lg bg-surface-highlight/60 px-4 py-3">
                  <div className="rounded-md bg-brand-1/15 px-3 py-1 text-xs font-semibold text-brand-1">{date}</div>
                  <div>
                    <p className="font-semibold">
                      {index === 0
                        ? "Beta access announcement"
                        : index === 1
                        ? "Revenue sync workshop"
                        : "Customer advisory board"}
                    </p>
                    <p className="text-content-dimmed">
                      {index === 0
                        ? "Prep the comms plan and align marketing with product leads."
                        : index === 1
                        ? "Align GTM and product leadership on the updated funnel."
                        : "Share roadmap learnings and collect feedback from top accounts."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
