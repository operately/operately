import React from "react";
import { GhostButton, PrimaryButton } from "../Button";
import { IconCheck } from "../icons";

export namespace CompanySetupPage {
  export interface Props {
    // Completion status for each hardcoded item
    inviteTeamCompleted?: boolean;
    spacesCompleted?: boolean;
    projectsCompleted?: boolean;

    // Navigation functions for each action
    onInviteTeam?: () => void;
    onCreateSpaces?: () => void;
    onAddProject?: () => void;

    // User personalization
    name: string;
    bookDemoUrl: string;
    discordUrl: string;
  }
}

interface SetupItem {
  index: number;
  id: string;
  title: string;
  description: string;
  onClick?: () => void;
  buttonText: string;
  isCompleted: boolean;
  testId: string;
}

export function CompanySetupPage(props: CompanySetupPage.Props) {
  const {
    inviteTeamCompleted = false,
    spacesCompleted = false,
    projectsCompleted = false,
    onInviteTeam,
    name,
    bookDemoUrl,
    discordUrl,
  } = props;

  const setupItems: SetupItem[] = [
    {
      index: 1,
      id: "invite-team",
      title: "Invite your team",
      description: "Get your colleagues onboard and start collaborating together.",
      onClick: onInviteTeam,
      buttonText: "Invite Team Members",
      isCompleted: inviteTeamCompleted,
      testId: "setup-invite-team",
    },
    {
      index: 2,
      id: "create-spaces",
      title: "Set up Spaces",
      description: "Create organized spaces for different teams, departments, or initiatives.",
      onClick: onCreateSpaces,
      buttonText: "Create Spaces",
      isCompleted: spacesCompleted,
      testId: "setup-create-space",
    },
    {
      index: 3,
      id: "add-projects",
      title: "Add your first project",
      description: "Start tracking progress on your most important work.",
      onClick: onAddProject,
      buttonText: "Add First Project",
      isCompleted: projectsCompleted,
      testId: "setup-add-project",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 mt-16">
      <div>
        <h1 className="text-2xl font-bold text-content-accent mb-2">Welcome to Operately, {name}!</h1>
        <p className="text-content-dimmed">Let's set up your company to get your team organized and productive.</p>
      </div>

      <div className="mt-6">
        <div className="space-y-4">
          {setupItems.map((item) => (
            <SetupItem key={item.id} {...item} />
          ))}
        </div>
      </div>

      <div className="mt-16">
        <h3 className="font-semibold mb-4">Need Help Getting Started?</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-base border border-stroke-base rounded-lg p-4 shadow">
            <h4 className="font-semibold mb-1">Quick Product Tour</h4>
            <p className="text-xs mb-3">Get most out of Operately. Schedule a personalized onboarding session.</p>
            <GhostButton size="xs" linkTo={bookDemoUrl} linkTarget="_blank">
              Book a demo
            </GhostButton>
          </div>

          <div className="bg-surface-base border border-stroke-base rounded-lg p-4 shadow">
            <h4 className="font-semibold mb-1">Help Center</h4>
            <p className="text-xs mb-3">Visit our Help Center for guides, tips, and tutorials.</p>
            <GhostButton size="xs" linkTo="https://operately.com/help" linkTarget="_blank">
              Visit Help Center
            </GhostButton>
          </div>

          <div className="bg-surface-base border border-stroke-base rounded-lg p-4 shadow">
            <h4 className="font-semibold mb-1">Discord Community</h4>
            <p className="text-xs mb-3">Join our Discord server to connect with us and other users.</p>
            <GhostButton size="xs" linkTo={discordUrl} linkTarget="_blank">
              Join Discord
            </GhostButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function SetupItem({ index, title, description, onClick, buttonText, isCompleted, testId }: SetupItem) {
  return (
    <div
      className={`flex items-center justify-between p-4 border rounded-lg shadow transition-all ${
        isCompleted
          ? "border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20"
          : "border-stroke-base bg-surface-base"
      }`}
      data-test-id={testId}
    >
      <div className="flex items-start gap-3 flex-1">
        {isCompleted ? (
          <div className="flex-shrink-0 mt-0.5">
            <IconCheck size={20} className="text-green-600" />
          </div>
        ) : (
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-[20px] h-[20px] border-2 border-surface-outline rounded-full flex items-center justify-center text-xs">
              {index}
            </div>
          </div>
        )}
        <div className="flex-1">
          <h3
            className={`font-semibold mb-1 ${
              isCompleted ? "text-green-800 dark:text-green-200" : "text-content-accent"
            }`}
          >
            {title}
          </h3>
          <p className={`text-sm ${isCompleted ? "text-green-600 dark:text-green-300" : "text-content-dimmed"}`}>
            {description}
          </p>
        </div>
      </div>
      {!isCompleted && (
        <GhostButton onClick={onClick} testId={testId} size="sm">
          {buttonText}
        </GhostButton>
      )}
    </div>
  );
}
function onCreateSpaces(): void {
  throw new Error("Function not implemented.");
}

function onAddProject(): void {
  throw new Error("Function not implemented.");
}

interface CompanySetupStepsReminderProps {
  hasTeamMembers: boolean;
  hasSpaces: boolean;
  hasProjects: boolean;
  continuePath: string;
}

export function CompanySetupStepsReminder({
  hasTeamMembers,
  hasSpaces,
  hasProjects,
  continuePath,
}: CompanySetupStepsReminderProps) {
  // Determine the next step to show
  let nextAction = "";
  if (!hasTeamMembers) {
    nextAction = "Invite team members";
  } else if (!hasSpaces) {
    nextAction = "Create spaces";
  } else if (!hasProjects) {
    nextAction = "Start projects";
  }

  return (
    <div className="-mb-8">
      <div className="p-8 rounded-2xl border overflow-hidden backdrop-blur border-indigo-200 bg-gradient-to-br from-indigo-50/90 to-indigo-100/50 shadow-[0_4px_24px_rgba(129,140,248,0.15)]">
        <h3 className="font-semibold text-lg">Let's finish setting up your company</h3>
        <p className="text-content-dimmed mb-4">Next: {nextAction}</p>

        <PrimaryButton linkTo={continuePath} size="sm" testId="complete-setup-button">
          Continue Setup
        </PrimaryButton>
      </div>
    </div>
  );
}
