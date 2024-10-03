import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";
import * as ProjectContributors from "@/models/projectContributors";

import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";
import { ProjectContributor } from "@/models/projectContributors";

import { ContributorAvatar, PlaceholderAvatar } from "@/components/ContributorAvatar";
import { Menu, MenuActionItem, MenuLinkItem } from "@/components/Menu";
import { createTestId } from "@/utils/testid";
import { Paths } from "@/routes/paths";
import { ProjectAccessLevelBadge } from "@/components/Badges/AccessLevelBadges";
import { AccessLevel } from "@/features/projects/AccessLevel";
import { match } from "ts-pattern";

import { OtherPeople } from "./OtherPeople";
import { useLoadedData } from "./loader";
import { Section } from "./Section";
import { BorderedRow } from "./BorderedRow";
export { loader } from "./loader";

export function Page() {
  const { project } = useLoadedData();

  return (
    <Pages.Page title={["Team & Access", project.name!]} testId="project-contributors-page">
      <Paper.Root>
        <ProjectPageNavigation project={project} />

        <Paper.Body>
          <Title />
          <GeneralAccess />
          <Champion />
          <Reviewer />
          <Contributors />
          <OtherPeople />
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

        <AddContribsButton />
      </div>
    </div>
  );
}

function AddContribsButton() {
  const { project } = useLoadedData();

  if (!project.permissions?.canEditContributors) return null;
  const path = Paths.projectContributorsAddPath(project.id!, { type: "contributor" });

  return (
    <PrimaryButton linkTo={path} testId="add-contributors-button" size="sm">
      Add Contributors
    </PrimaryButton>
  );
}

function GeneralAccess() {
  const { project } = useLoadedData();
  const editPath = Paths.projectEditPermissionsPath(project.id!);

  return (
    <Section title="General Access">
      <BorderedRow>
        <AccessLevel
          anonymous={project.accessLevels?.public!}
          company={project.accessLevels?.company!}
          space={project.accessLevels?.space!}
          tense="present"
        />

        <SecondaryButton linkTo={editPath} size="xs">
          Edit
        </SecondaryButton>
      </BorderedRow>
    </Section>
  );
}

function Champion() {
  const { champion } = useLoadedData();

  if (!champion) return <ChampionPlaceholder />;

  return (
    <Section title="Champion">
      <div className="flex items-center justify-between py-2 border-y border-stroke-dimmed">
        <div className="flex items-center gap-2">
          <ContributorAvatar contributor={champion} />
          <ContributorNameAndResponsibility contributor={champion} />
        </div>

        <div className="flex items-center gap-4">
          <ProjectAccessLevelBadge accessLevel={champion.accessLevel!} />
          <ContributorMenu contributor={champion} />
        </div>
      </div>
    </Section>
  );
}

function Reviewer() {
  const { reviewer } = useLoadedData();

  if (!reviewer) return <ReviewerPlaceholder />;

  return (
    <Section title="Reviewer">
      <div className="flex items-center justify-between py-2 border-y border-stroke-dimmed">
        <div className="flex items-center gap-2">
          <ContributorAvatar contributor={reviewer} />
          <ContributorNameAndResponsibility contributor={reviewer} />
        </div>

        <div className="flex items-center gap-4">
          <ProjectAccessLevelBadge accessLevel={reviewer.accessLevel!} />
          <ContributorMenu contributor={reviewer} />
        </div>
      </div>
    </Section>
  );
}

function ContributorNameAndResponsibility({ contributor }: { contributor: ProjectContributor }) {
  const name = contributor.person!.fullName;
  const responsibility = match(contributor.role)
    .with("champion", () => "Responsible for the overall success of the project")
    .with("reviewer", () => "Responsible for reviewing updates and providing feedback")
    .otherwise(() => contributor.responsibility);

  return (
    <div className="flex flex-col flex-1">
      <div className="font-bold flex items-center gap-2">{name}</div>
      <div className="text-sm font-medium flex items-center">{responsibility}</div>
    </div>
  );
}

function ReviewerPlaceholder() {
  const { project } = useLoadedData();
  const path = Paths.projectContributorsAddPath(project.id!, { type: "reviewer" });

  return (
    <Section title="Reviewer">
      <BorderedRow>
        <div className="flex items-center gap-2">
          <PlaceholderAvatar size="lg" />
          <PlaceholderTitleAndDescription
            title="No Reviewer"
            description="Select a reviewer to get feedback and keep things moving smoothly"
          />
        </div>

        <div className="flex items-center gap-4">
          <SecondaryButton linkTo={path} testId="add-reviewer-button" size="sm">
            Add reviewer
          </SecondaryButton>
        </div>
      </BorderedRow>
    </Section>
  );
}

function PlaceholderTitleAndDescription({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col flex-1">
      <div className="font-bold flex items-center gap-2">{title}</div>
      <div className="text-sm font-medium flex items-center">{description}</div>
    </div>
  );
}

function ChampionPlaceholder() {
  const { project } = useLoadedData();
  const path = Paths.projectContributorsAddPath(project.id!, { type: "champion" });

  return (
    <Section title="Champion">
      <div className="flex items-center justify-between py-2 border-y border-stroke-dimmed">
        <div className="flex items-center gap-2">
          <PlaceholderAvatar size="lg" />
          <PlaceholderTitleAndDescription title="No Champion" description="Select a champion to lead the project" />
        </div>

        <div className="flex items-center gap-4">
          <SecondaryButton linkTo={path} testId="add-champion-button" size="sm">
            Add champion
          </SecondaryButton>
        </div>
      </div>
    </Section>
  );
}

function Contributors() {
  const { contributors } = useLoadedData();

  if (contributors.length === 0) return null;

  return (
    <Section title="Contributors">
      {contributors.map((contrib) => (
        <Contributor contributor={contrib} key={contrib.id} />
      ))}
    </Section>
  );
}

function Contributor({ contributor }: { contributor: ProjectContributor }) {
  return (
    <BorderedRow>
      <div className="flex items-center gap-2">
        <ContributorAvatar contributor={contributor} />
        <ContributotNameAndResponsibility contributor={contributor} />
      </div>
      <div className="flex items-center gap-4">
        <ProjectAccessLevelBadge accessLevel={contributor.accessLevel!} />
        <ContributorMenu contributor={contributor} />
      </div>
    </BorderedRow>
  );
}

function ContributorMenu({ contributor }: { contributor: ProjectContributor }) {
  return (
    <Menu testId={createTestId("contributor-menu", contributor.person!.fullName!)} size="medium">
      {match(contributor.role)
        .with("champion", () => (
          <>
            <ChangeProjectChampionMenuItem contributor={contributor} />
            <ReassignAsContributorMenuItem contributor={contributor} />
            <RemoveContributorMenuItem contributor={contributor} />
          </>
        ))
        .with("reviewer", () => (
          <>
            <ChangeProjectReviewerMenuItem contributor={contributor} />
            <ReassignAsContributorMenuItem contributor={contributor} />
            <RemoveContributorMenuItem contributor={contributor} />
          </>
        ))
        .otherwise(() => (
          <>
            <EditMenuItem contributor={contributor} />
            <PromoteToChampionMenuItem contributor={contributor} />
            <PromoteToReviewerMenuItem contributor={contributor} />
            <RemoveContributorMenuItem contributor={contributor} />
          </>
        ))}
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

function ReassignAsContributorMenuItem({ contributor }: { contributor: ProjectContributor }) {
  const path = Paths.projectContributorsEditPath(contributor.id!, { action: "reassign-as-contributor" });

  return (
    <MenuLinkItem to={path} testId="convert-to-contributor">
      Reassign as contributor
    </MenuLinkItem>
  );
}

function ChangeProjectChampionMenuItem({ contributor }: { contributor: ProjectContributor }) {
  const path = Paths.projectContributorsEditPath(contributor.id!, { action: "change-champion" });

  return (
    <MenuLinkItem to={path} testId="choose-new-champion">
      Edit champion
    </MenuLinkItem>
  );
}

function ChangeProjectReviewerMenuItem({ contributor }: { contributor: ProjectContributor }) {
  const path = Paths.projectContributorsEditPath(contributor.id!, { action: "change-reviewer" });

  return (
    <MenuLinkItem to={path} testId="choose-new-reviewer">
      Edit reviewer
    </MenuLinkItem>
  );
}

function EditMenuItem({ contributor }: { contributor: ProjectContributor }) {
  const path = Paths.projectContributorsEditPath(contributor.id!, { action: "edit-contributor" });

  return (
    <MenuLinkItem to={path} testId="edit-contributor">
      Edit contributor
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
    <MenuActionItem danger={true} onClick={handleClick} testId="remove-contributor">
      Remove from project
    </MenuActionItem>
  );
}

function PromoteToChampionMenuItem({ contributor }: { contributor: ProjectContributor }) {
  const refresh = Pages.useRefresh();
  const [update] = ProjectContributors.useUpdateContributor();
  const { champion } = useLoadedData();

  if (!champion) return null;

  const handleClick = async () => {
    await update({ contribId: champion!.id, role: "champion", personId: contributor.person!.id });
    refresh();
  };

  return (
    <MenuActionItem danger={true} onClick={handleClick} testId="promote-to-champion">
      Assign as champion
    </MenuActionItem>
  );
}

function PromoteToReviewerMenuItem({ contributor }: { contributor: ProjectContributor }) {
  const refresh = Pages.useRefresh();
  const [update] = ProjectContributors.useUpdateContributor();
  const { reviewer } = useLoadedData();

  if (!reviewer) return null;

  const handleClick = async () => {
    await update({ contribId: reviewer!.id, role: "reviewer", personId: contributor.person!.id });
    refresh();
  };

  return (
    <MenuActionItem danger={true} onClick={handleClick} testId="promote-to-reviewer">
      Assign as reviewer
    </MenuActionItem>
  );
}
