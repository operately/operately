import React from "react";
import { GhostButton } from "../Button";
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
  }
}

interface SetupItem {
  id: string;
  title: string;
  description: string;
  onClick?: () => void;
  buttonText: string;
  isCompleted: boolean;
  testId: string;
}

export function CompanySetupPage(props: CompanySetupPage.Props) {
  const { inviteTeamCompleted = false, spacesCompleted = false, projectsCompleted = false, onInviteTeam } = props;

  const setupItems: SetupItem[] = [
    {
      id: "invite-team",
      title: "Invite your team",
      description: "Get your colleagues onboard and start collaborating together.",
      onClick: onInviteTeam,
      buttonText: "Invite Team Members",
      isCompleted: inviteTeamCompleted,
      testId: "setup-invite-team",
    },
    {
      id: "create-spaces",
      title: "Set up Spaces",
      description: "Create organized spaces for different teams, departments, or initiatives.",
      onClick: onCreateSpaces,
      buttonText: "Create Spaces",
      isCompleted: spacesCompleted,
      testId: "setup-create-space",
    },
    {
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
    <div className="max-w-4xl mx-auto">
      <div className="p-6 border-b border-stroke-base">
        <h1 className="text-2xl font-bold text-content-accent mb-2">Let's set up your company!</h1>
        <p className="text-content-dimmed">Complete these steps to get your team organized and productive.</p>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {setupItems.map((item) => (
            <SetupItem key={item.id} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SetupItem({ title, description, onClick, buttonText, isCompleted, testId }: SetupItem) {
  return (
    <div
      className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
        isCompleted
          ? "border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20"
          : "border-stroke-base bg-surface-base"
      }`}
      data-test-id={testId}
    >
      <div className="flex items-start gap-3 flex-1">
        {isCompleted && (
          <div className="flex-shrink-0 mt-0.5">
            <IconCheck size={20} className="text-green-600" />
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
