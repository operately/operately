import type { Meta, StoryObj } from "@storybook/react";
import React, { useEffect, useState } from "react";

import { OnboardingWizard } from ".";

const STORAGE_KEY = "operately:company-onboarding-wizard:v1";

const meta = {
  title: "Components/Onboarding/CompanyCreatorWizard",
  component: OnboardingWizard,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    invitationLink: {
      control: "text",
    },
  },
  args: {
    invitationLink: "https://operately.com/invite/sample-onboarding",
    onComplete: () => {},
    onDismiss: () => {},
  },
} satisfies Meta<typeof OnboardingWizard>;

export default meta;

type Story = StoryObj<typeof meta>;

type WizardView = "open" | "completed" | "dismissed";

type StepForStory = "welcome" | "spaces" | "invite" | "project";

interface WizardStoryShellProps {
  initialStep: StepForStory;
  spacesInput?: string;
  initialView?: WizardView;
  invitationLink: string;
}

const WizardStoryShell: React.FC<WizardStoryShellProps> = ({
  initialStep,
  spacesInput = "",
  initialView = "open",
  invitationLink,
}) => {
  const [view, setView] = useState<WizardView>(initialView);
  const [result, setResult] = useState<OnboardingWizard.OnCompleteData | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (initialView === "open") {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ currentStep: initialStep, spacesInput }),
      );
    }

    return () => {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    };
  }, [initialStep, spacesInput, initialView]);

  if (view === "completed") {
    return (
      <StoryBackdrop>
        <div className="absolute inset-0 z-[80] flex items-center justify-center px-6">
          <div className="max-w-md space-y-4 rounded-2xl border border-surface-outline/70 bg-surface-base/90 p-8 text-center shadow-2xl">
            <h2 className="text-2xl font-semibold text-content-accent">Onboarding complete</h2>
            <p className="text-content-base">
              Wizard finished with the following spaces: {" "}
              {result && result.spaces.length > 0 ? result.spaces.join(", ") : "no spaces provided"}.
            </p>
          </div>
        </div>
      </StoryBackdrop>
    );
  }

  if (view === "dismissed") {
    return (
      <StoryBackdrop>
        <div className="absolute inset-0 z-[80] flex items-center justify-center px-6">
          <div className="max-w-md space-y-4 rounded-2xl border border-surface-outline/70 bg-surface-base/90 p-8 text-center shadow-2xl">
            <h2 className="text-2xl font-semibold text-content-accent">Wizard dismissed</h2>
            <p className="text-content-base">The onboarding wizard was closed. Progress remains saved locally.</p>
          </div>
        </div>
      </StoryBackdrop>
    );
  }

  return (
    <StoryBackdrop>
      <OnboardingWizard
        invitationLink={invitationLink}
        onComplete={(data) => {
          setResult(data);
          setView("completed");
        }}
        onDismiss={() => setView("dismissed")}
      />
    </StoryBackdrop>
  );
};

function StoryBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-surface-subtle via-surface-base to-surface-subtle text-content-base">
      <MockWorkspacePage />
      {children}
    </div>
  );
}

function MockWorkspacePage() {
  return (
    <div className="pointer-events-none">
      <div className="max-w-6xl mx-auto px-6 py-16 space-y-12">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.4em] text-content-subtle">Workspace overview</p>
          <h1 className="text-3xl font-semibold text-content-accent">Q1 Strategic Initiatives</h1>
          <p className="max-w-2xl text-content-dimmed">
            Track your most impactful workstreams and keep every team aligned. This dashboard highlights the key projects
            driving momentum across your company.
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
                    <p className="font-semibold">{index === 0 ? "Beta access announcement" : index === 1 ? "Revenue sync workshop" : "Customer advisory board"}</p>
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

export const Welcome: Story = {
  render: ({ invitationLink }) => <WizardStoryShell invitationLink={invitationLink} initialStep="welcome" />,
  args: {
    invitationLink: "https://operately.com/invite/sample-onboarding",
  },
};

export const SpacesStep: Story = {
  render: ({ invitationLink }) => (
    <WizardStoryShell
      invitationLink={invitationLink}
      initialStep="spaces"
      spacesInput="Engineering, Product, Marketing, Design"
    />
  ),
  args: {
    invitationLink: "https://operately.com/invite/sample-onboarding",
  },
};

export const InviteStep: Story = {
  render: ({ invitationLink }) => (
    <WizardStoryShell invitationLink={invitationLink} initialStep="invite" spacesInput="Engineering,Product" />
  ),
  args: {
    invitationLink: "https://operately.com/invite/team-setup",
  },
};

export const ProjectStep: Story = {
  render: ({ invitationLink }) => (
    <WizardStoryShell invitationLink={invitationLink} initialStep="project" spacesInput="Operations, Growth" />
  ),
  args: {
    invitationLink: "https://operately.com/invite/product-launch",
  },
};

export const CompletedState: Story = {
  render: ({ invitationLink }) => (
    <WizardStoryShell
      invitationLink={invitationLink}
      initialStep="project"
      spacesInput="Sales, Marketing"
      initialView="completed"
    />
  ),
  args: {
    invitationLink: "https://operately.com/invite/product-launch",
  },
};
