import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";
import * as Projects from "@/models/projects";
import * as ProjectContributors from "@/models/projectContributors";

import { useLoadedData } from "./loader";
import { usePageState, PageState } from "./usePageState";
import { AddContribView } from "./AddContributorForm";
import { EditContribView } from "./EditContribView";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";
import { ProjectContributor } from "@/models/projectContributors";

import { ContributorAvatar, ReviewerPlaceholderAvatar } from "@/components/ContributorAvatar";
import { Menu, MenuActionItem, MenuLinkItem } from "@/components/Menu";
import { match } from "ts-pattern";
import { createTestId } from "@/utils/testid";

export function Page() {
  const { project } = useLoadedData();
  const state = usePageState();

  return (
    <Pages.Page title={["Team & Access", project.name!]}>
      {match(state.view)
        .with("list", () => <ListView pageState={state} />)
        .with("add", () => <AddContribView state={state} />)
        .with("edit", () => <EditContribView state={state} />)
        .exhaustive()}
    </Pages.Page>
  );
}

function ListView({ pageState }: { pageState: PageState }) {
  const { project } = useLoadedData();

  return (
    <Paper.Root>
      <ProjectPageNavigation project={project} />
      <Paper.Body>
        <Title state={pageState} />
        <Champion state={pageState} />
        <Reviewer state={pageState} />
        <Contributors state={pageState} />
      </Paper.Body>
    </Paper.Root>
  );
}

function Title({ state }: { state: PageState }) {
  return (
    <div className="rounded-t-[20px] pb-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold ">Team &amp; Access</div>
          <div className="text-medium">Manage the team and access to this project</div>
        </div>

        <AddContribButton state={state} />
      </div>
    </div>
  );
}

function AddContribButton({ state }: { state: PageState }) {
  const { project } = useLoadedData();

  if (!project.permissions?.canEditContributors) return null;

  return (
    <PrimaryButton onClick={state.goToAddView} testId="add-contributor-button" size="sm">
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

function Champion({ state }: { state: PageState }) {
  const { project } = useLoadedData();
  const { champion } = ProjectContributors.splitByRole(project.contributors!);

  if (!champion) return <ChampionPlaceholder state={state} />;

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
          <AccessLevelBadge level="full" />

          <Menu>
            <MenuLinkItem to="" icon={Icons.IconEdit}>
              Edit
            </MenuLinkItem>
            <RemoveContributorMenuItem contributor={champion} />
          </Menu>
        </div>
      </div>
    </div>
  );
}

function Reviewer({ state }: { state: PageState }) {
  const { project } = useLoadedData();
  const { reviewer } = ProjectContributors.splitByRole(project.contributors!);

  if (!reviewer) return <ReviewerPlaceholder state={state} />;

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
          <AccessLevelBadge level="full" />

          <Menu>
            <MenuLinkItem to="" icon={Icons.IconEdit}>
              Edit
            </MenuLinkItem>
            <RemoveContributorMenuItem contributor={reviewer} />
          </Menu>
        </div>
      </div>
    </div>
  );
}

function ReviewerPlaceholder({ state }: { state: PageState }) {
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
          <SecondaryButton onClick={state.goToAddView} testId="add-contributor-button" size="sm">
            Add Reviewer
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}

function ChampionPlaceholder({ state }: { state: PageState }) {
  return (
    <div className="">
      <SectionTitle title="Champion" />

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
          <SecondaryButton onClick={state.goToAddView} testId="add-contributor-button" size="sm">
            Add Champion
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}

function Contributors({ state }: { state: PageState }) {
  const { project } = useLoadedData();
  const { contributors } = ProjectContributors.splitByRole(project.contributors!);

  if (contributors.length === 0) return null;

  return (
    <div className="mt-8">
      <SectionTitle title="Contributors" />

      {contributors.map((contrib) => (
        <Contributor state={state} contributor={contrib} key={contrib.id} />
      ))}
    </div>
  );
}

function Contributor({ state, contributor }: { state: PageState; contributor: ProjectContributor }) {
  return (
    <div className="flex items-center justify-between py-2 border-t border-stroke-dimmed last:border-b">
      <div className="flex items-center gap-2">
        <ContributorAvatar contributor={contributor} />
        <ContributotNameAndResponsibility contributor={contributor} />
      </div>
      <div className="flex items-center gap-4">
        <AccessLevelBadge level="edit" />
        <ContributorMenu state={state} contributor={contributor} />
      </div>
    </div>
  );
}

function ContributorMenu({ state, contributor }: { state: PageState; contributor: ProjectContributor }) {
  return (
    <Menu testId={createTestId("contributor-menu", contributor.person!.fullName!)}>
      <EditResponsibilityMenuItem state={state} contributor={contributor} />
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

function EditResponsibilityMenuItem(props: { state: PageState; contributor: ProjectContributor }) {
  const handleClick = () => props.state.goToEditView(props.contributor);

  return (
    <MenuActionItem icon={Icons.IconEdit} onClick={handleClick} testId="edit-responsibility">
      Edit responsibility
    </MenuActionItem>
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

function AccessLevelBadge({ level }: { level: "full" | "edit" }) {
  return match(level)
    .with("full", () => <FullAccessBadge />)
    .with("edit", () => <EditAccessBadge />)
    .exhaustive();
}

function FullAccessBadge() {
  return (
    <div className="text-xs font-semibold bg-callout-warning text-callout-warning-message rounded-full px-2.5 py-1.5 uppercase">
      Full Access
    </div>
  );
}

function EditAccessBadge() {
  return (
    <div className="text-xs font-semibold bg-callout-info text-callout-info-message rounded-full px-2.5 py-1.5 uppercase">
      Edit Access
    </div>
  );
}
