import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";
import * as Projects from "@/models/projects";
import * as ProjectContributors from "@/models/projectContributors";

import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";
import { ProjectContributor } from "@/models/projectContributors";

import { ContributorAvatar, ReviewerPlaceholderAvatar } from "@/components/ContributorAvatar";
import { Menu, MenuActionItem, MenuLinkItem } from "@/components/Menu";
import { createTestId } from "@/utils/testid";
import { Paths } from "@/routes/paths";
import { ProjectAccessLevelBadge } from "@/components/Badges/AccessLevelBadges";
import { PermissionLevels } from "@/features/Permissions";

interface LoaderData {
  project: Projects.Project;
}

export async function loader({ params }): Promise<LoaderData> {
  return {
    project: await Projects.getProject({
      id: params.projectID,
      includePermissions: true,
      includeContributorsAccessLevels: true,
    }).then((data) => data.project!),
  };
}

export function Page() {
  const { project } = Pages.useLoadedData() as LoaderData;

  return (
    <Pages.Page title={["Team & Access", project.name!]} testId="project-contributors-page">
      <Paper.Root>
        <ProjectPageNavigation project={project} />

        <Paper.Body>
          <Title />
          <Champion />
          <Reviewer />
          <Contributors />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Title() {
  return (
    <div className="rounded-t-[20px] pb-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold ">Team &amp; Access</div>
          <div className="text-medium">Manage the team and access to this project</div>
        </div>

        <AddContribButton />
      </div>
    </div>
  );
}

function AddContribButton() {
  const { project } = Pages.useLoadedData() as LoaderData;

  if (!project.permissions?.canEditContributors) return null;
  const path = Paths.projectContributorsAddPath(project.id!, { type: "contributor" });

  return (
    <PrimaryButton linkTo={path} testId="add-contributor-button" size="sm">
      Add Contributor
    </PrimaryButton>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h2 className="font-bold text-lg">{title}</h2>
    </div>
  );
}

function Champion() {
  const { project } = Pages.useLoadedData() as LoaderData;
  const { champion } = ProjectContributors.splitByRole(project.contributors!);

  if (!champion) return <ChampionPlaceholder />;

  return (
    <div>
      <SectionTitle title="Champion" />
      <div className="flex items-center justify-between py-2 border-y border-stroke-dimmed">
        <div className="flex items-center gap-2">
          <ContributorAvatar contributor={champion} />

          <div className="flex flex-col flex-1">
            <div className="font-bold flex items-center gap-2">{champion!.person!.fullName}</div>

            <div className="text-sm font-medium flex items-center">
              Responsible for the overall success of the project
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ProjectAccessLevelBadge accessLevel={champion.accessLevel!} />
          <ContributorMenu contributor={champion} />
        </div>
      </div>
    </div>
  );
}

function Reviewer() {
  const { project } = Pages.useLoadedData() as LoaderData;
  const { reviewer } = ProjectContributors.splitByRole(project.contributors!);

  if (!reviewer) return <ReviewerPlaceholder />;

  return (
    <div className="mt-8">
      <SectionTitle title="Reviewer" />

      <div className="flex items-center justify-between py-2 border-y border-stroke-dimmed">
        <div className="flex items-center gap-2">
          <ContributorAvatar contributor={reviewer} />

          <div className="flex flex-col flex-1">
            <div className="font-bold flex items-center gap-2">{reviewer!.person!.fullName}</div>

            <div className="text-sm font-medium flex items-center">
              Responsible for reviewing updates and providing feedback
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ProjectAccessLevelBadge accessLevel={reviewer.accessLevel!} />
          <ContributorMenu contributor={reviewer} />
        </div>
      </div>
    </div>
  );
}

function ReviewerPlaceholder() {
  const path = Paths.projectContributorsAddPath(Pages.useLoadedData().project.id!, { type: "reviewer" });

  return (
    <div className="mt-8">
      <SectionTitle title="Reviewer" />

      <div className="flex items-center justify-between py-2 border-y border-stroke-dimmed">
        <div className="flex items-center gap-2">
          <ReviewerPlaceholderAvatar />

          <div className="flex flex-col flex-1">
            <div className="font-bold flex items-center gap-2">No Reviewer</div>
            <div className="text-sm font-medium flex items-center">
              Select a reviewer to get feedback and keep things moving smoothly
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <SecondaryButton linkTo={path} testId="add-reviewer-button" size="sm">
            Add reviewer
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}

function ChampionPlaceholder() {
  const path = Paths.projectContributorsAddPath(Pages.useLoadedData().project.id!, { type: "champion" });

  return (
    <div className="">
      <SectionTitle title="Champion" />

      <div className="flex items-center justify-between py-2 border-y border-stroke-dimmed">
        <div className="flex items-center gap-2">
          <ReviewerPlaceholderAvatar />

          <div className="flex flex-col flex-1">
            <div className="font-bold flex items-center gap-2">No Champion</div>
            <div className="text-sm font-medium flex items-center">
              Select a champion to lead the project and ensure its success
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <SecondaryButton linkTo={path} testId="add-champion-button" size="sm">
            Add champion
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}

function Contributors() {
  const { project } = Pages.useLoadedData() as LoaderData;
  const { contributors } = ProjectContributors.splitByRole(project.contributors!);

  if (contributors.length === 0) return null;

  return (
    <div className="mt-8">
      <SectionTitle title="Contributors" />

      {contributors.map((contrib) => (
        <Contributor contributor={contrib} key={contrib.id} />
      ))}
    </div>
  );
}

function Contributor({ contributor }: { contributor: ProjectContributor }) {
  return (
    <div className="flex items-center justify-between py-2 border-t border-stroke-dimmed last:border-b">
      <div className="flex items-center gap-2">
        <ContributorAvatar contributor={contributor} />
        <ContributotNameAndResponsibility contributor={contributor} />
      </div>
      <div className="flex items-center gap-4">
        <ProjectAccessLevelBadge accessLevel={contributor.accessLevel!} />
        <ContributorMenu contributor={contributor} />
      </div>
    </div>
  );
}

function ContributorMenu({ contributor }: { contributor: ProjectContributor }) {
  return (
    <Menu testId={createTestId("contributor-menu", contributor.person!.fullName!)} size="large">
      <EditMenuItem contributor={contributor} />
      <ConvertToContributorMenuItem contributor={contributor} />
      <RemoveContributorMenuItem contributor={contributor} />
    </Menu>
  );
}

function ContributotNameAndResponsibility({ contributor }: { contributor: ProjectContributor }) {
  return (
    <div className="flex flex-col flex-1">
      <div className="font-bold flex items-center gap-2">{contributor!.person!.fullName}</div>
      <div className="text-sm font-medium flex items-center">{contributor.responsibility}</div>
    </div>
  );
}

function ConvertToContributorMenuItem({ contributor }: { contributor: ProjectContributor }) {
  if (contributor.role === "contributor") return null;

  const path = Paths.projectContributorsEditPath(contributor.id!, { convertTo: "contributor" });

  return (
    <MenuLinkItem icon={Icons.IconTransfer} to={path} testId="convert-to-contributor">
      Convert to contributor
    </MenuLinkItem>
  );
}

function EditMenuItem({ contributor }: { contributor: ProjectContributor }) {
  if (contributor.role !== "contributor") return null;

  const path = Paths.projectContributorsEditPath(contributor.id!);

  return (
    <MenuLinkItem icon={Icons.IconEdit} to={path} testId="edit-contributor">
      Edit
    </MenuLinkItem>
  );
}

function RemoveContributorMenuItem({ contributor }: { contributor: ProjectContributor }) {
  const refresh = Pages.useRefresh();
  const [remove] = Projects.useRemoveProjectContributor();

  const handleClick = async () => {
    await remove({ contribId: contributor.id });
    refresh();
  };

  return (
    <MenuActionItem icon={Icons.IconTrash} danger={true} onClick={handleClick} testId="remove-contributor">
      Remove from project
    </MenuActionItem>
  );
}
