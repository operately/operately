import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";
import * as Projects from "@/models/projects";
import * as ProjectContributors from "@/models/projectContributors";

import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";
import { ProjectContributor } from "@/models/projectContributors";

import { ContributorAvatar, PlaceholderAvatar } from "@/components/ContributorAvatar";
import { Menu, MenuActionItem, MenuLinkItem } from "@/components/Menu";
import { createTestId } from "@/utils/testid";
import { Paths, compareIds } from "@/routes/paths";
import { ProjectAccessLevelBadge } from "@/components/Badges/AccessLevelBadges";
import { AccessLevel } from "@/features/projects/AccessLevel";
import { useGetBindedPeople } from "@/api";
import Avatar from "@/components/Avatar";
import { PermissionLevels } from "@/features/Permissions";
import { ActionLink } from "@/components/Link";

interface LoaderData {
  project: Projects.Project;
}

export async function loader({ params }): Promise<LoaderData> {
  return {
    project: await Projects.getProject({
      id: params.projectID,
      includePermissions: true,
      includeContributors: true,
      includeAccessLevels: true,
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

function GeneralAccess() {
  const { project } = Pages.useLoadedData() as LoaderData;

  return (
    <div className="mb-10">
      <SectionTitle title="General Access" />
      <div className="border-y border-stroke-dimmed flex items-center justify-between py-2">
        <AccessLevel
          annonymous={project.accessLevels?.public!}
          company={project.accessLevels?.company!}
          space={project.accessLevels?.space!}
          tense="present"
        />

        <SecondaryButton linkTo={Paths.projectEditPermissionsPath(project.id!)} size="xs">
          Edit
        </SecondaryButton>
      </div>
    </div>
  );
}

function OtherPeople() {
  const [show, setShow] = React.useState(false);

  const project = Pages.useLoadedData().project;
  const { data, loading } = useGetBindedPeople({ resourseType: "project", resourseId: project.id! });

  if (loading) return <div>Loading...</div>;

  const people = data?.people!.filter(
    (person) => !project.contributors!.some((contrib) => compareIds(contrib.person.id, person.id)),
  );

  const groups = Object.groupBy(people, (person) => person!.accessLevel!);

  if (people.length === 0) return null;

  if (!show) {
    return (
      <div className="mt-12 text-center">
        <div className="text-sm mb-2">
          {people?.length} other people have access to this project (
          <ActionLink onClick={() => setShow(true)}>show all</ActionLink>)
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="font-bold mt-10 text-lg">Other People with Access</div>
      <div className="text-medium text-sm max-w-lg mb-6">
        People who have access to the project based on their company or space membership but are not directly assigned
        to the project.
      </div>

      {groups[PermissionLevels.FULL_ACCESS] && (
        <div className="flex items-start gap-10 border-t border-stroke-dimmed py-3">
          <p className="shrink-0 w-36">
            <ProjectAccessLevelBadge accessLevel={PermissionLevels.FULL_ACCESS} />
          </p>

          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            {groups[PermissionLevels.FULL_ACCESS].map((person) => (
              <div className="flex items-center gap-2">
                <Avatar person={person} size={20} />
                <div className="font-medium flex items-center gap-2">{person!.fullName}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {groups[PermissionLevels.EDIT_ACCESS] && (
        <div className="flex items-start gap-10 border-t border-stroke-dimmed py-3">
          <p className="shrink-0 w-36">
            <ProjectAccessLevelBadge accessLevel={PermissionLevels.EDIT_ACCESS} />
          </p>

          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            {groups[PermissionLevels.EDIT_ACCESS].map((person) => (
              <div className="flex items-center gap-2">
                <Avatar person={person} size={20} />
                <div className="font-medium flex items-center gap-2">{person!.fullName}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {groups[PermissionLevels.COMMENT_ACCESS] && (
        <div className="flex items-start gap-10 border-t border-stroke-dimmed py-3">
          <p className="shrink-0 w-36">
            <ProjectAccessLevelBadge accessLevel={PermissionLevels.COMMENT_ACCESS} />
          </p>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            {groups[PermissionLevels.COMMENT_ACCESS].map((person) => (
              <div className="flex items-center gap-2">
                <Avatar person={person} size={20} />
                <div className="font-medium flex items-center gap-2">{person!.fullName}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {groups[PermissionLevels.VIEW_ACCESS] && (
        <div className="flex items-start gap-10 border-t border-stroke-dimmed py-3">
          <p className="shrink-0 w-36">
            <ProjectAccessLevelBadge accessLevel={PermissionLevels.VIEW_ACCESS} />
          </p>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            {groups[PermissionLevels.VIEW_ACCESS].map((person) => (
              <div className="flex items-center gap-2">
                <Avatar person={person} size={20} />
                <div className="font-medium flex items-center gap-2">{person!.fullName}</div>
              </div>
            ))}
          </div>
        </div>
      )}
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
          <PlaceholderAvatar size="lg" />

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
          <PlaceholderAvatar size="lg" />

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
