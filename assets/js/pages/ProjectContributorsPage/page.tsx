import React from "react";

import * as ProjectContributors from "@/models/projectContributors";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";

import { useLoadedData } from "./loader";
import { usePageState, PageState } from "./usePageState";
import { AddContributorForm } from "./AddContributorForm";
import { PrimaryButton } from "@/components/Buttons";
import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";

import { ContributorAvatar } from "@/components/ContributorAvatar";
import { Menu, MenuLinkItem } from "@/components/Menu";
import { match } from "ts-pattern";

export function Page() {
  const { project } = useLoadedData();
  const pageState = usePageState(project);

  return (
    <Pages.Page title={["Team & Access", project.name!]}>
      <Paper.Root>
        <ProjectPageNavigation project={project} />

        <Paper.Body>
          <Title state={pageState} />
          <AddContributorForm state={pageState} />

          <Champion state={pageState} />
          <Reviewer state={pageState} />
          <Contributors state={pageState} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
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
  if (state.editing) return null;

  return (
    <PrimaryButton onClick={state.showAddContribForm} testId="add-contributor-button" size="sm">
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

          {!state.editing && (
            <Menu>
              <MenuLinkItem to="" icon={Icons.IconEdit}>
                Edit
              </MenuLinkItem>
              <MenuLinkItem to="" icon={Icons.IconCopy}>
                Copy
              </MenuLinkItem>
            </Menu>
          )}
        </div>
      </div>
    </div>
  );
}

function Reviewer({ state }: { state: PageState }) {
  const { project } = useLoadedData();
  const { reviewer } = ProjectContributors.splitByRole(project.contributors!);

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

          {!state.editing && (
            <Menu>
              <MenuLinkItem to="" icon={Icons.IconEdit}>
                Edit
              </MenuLinkItem>
              <MenuLinkItem to="" icon={Icons.IconCopy}>
                Copy
              </MenuLinkItem>
            </Menu>
          )}
        </div>
      </div>
    </div>
  );
}

function Contributors({ state }: { state: PageState }) {
  const { project } = useLoadedData();
  const { contributors } = ProjectContributors.splitByRole(project.contributors!);

  return (
    <div className="mt-8">
      <SectionTitle title="Contributors" />

      {contributors.map((contrib) => (
        <div className="flex items-center justify-between py-2 border-t border-stroke-dimmed last:border-b">
          <div className="flex items-center gap-2">
            <ContributorAvatar contributor={contrib} />

            <div className="flex flex-col flex-1">
              <div className="font-bold flex items-center gap-2">{contrib!.person!.fullName}</div>

              <div className="text-sm font-medium flex items-center">{contrib.responsibility}</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <AccessLevelBadge level="edit" />

            {!state.editing && (
              <Menu>
                <MenuLinkItem to="" icon={Icons.IconEdit}>
                  Edit
                </MenuLinkItem>
                <MenuLinkItem to="" icon={Icons.IconCopy}>
                  Copy
                </MenuLinkItem>
              </Menu>
            )}
          </div>
        </div>
      ))}
    </div>
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
