import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Spaces from "@/models/spaces";

import { Feed, useItemsQuery } from "@/features/Feed";
import {
  AvatarList,
  DangerButton,
  IconPencil,
  IconSettings,
  IconTrash,
  Modal,
  PrimaryButton,
  SecondaryButton,
  showErrorToast,
  showSuccessToast,
  WarningCallout,
} from "turboui";

import { useClearNotificationsOnLoad } from "@/features/notifications";
import { PrivacyIndicator } from "@/features/spaces/PrivacyIndicator";
import { ToolsSection } from "@/features/SpaceTools";
import { useJoinSpace } from "@/models/spaces";
import { assertPresent } from "@/utils/assertions";

import { usePaths } from "@/routes/paths";
import { useNavigate } from "react-router-dom";
import { match } from "ts-pattern";
import { useLoadedData, useRefresh } from "./loader";

export function Page() {
  const { space, tools } = useLoadedData();

  useClearNotificationsOnLoad(space.notifications || []);

  return (
    <Pages.Page title={space.name!} testId="space-page">
      <Paper.Root size="xlarge">
        <Paper.Body>
          <SpaceOptions />
          <SpaceHeader space={space} />
          <SpaceMembers space={space} />
          <JoinButton space={space} />
          <ToolsSection space={space} tools={tools} />
          <SpaceFooter space={space} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function SpaceHeader({ space }: { space: Spaces.Space }) {
  return (
    <div className="mt-2">
      <SpaceName space={space} />
      <SpaceMission space={space} />
    </div>
  );
}

function SpaceName({ space }: { space: Spaces.Space }) {
  return (
    <div className="flex items-center gap-2 justify-center">
      <PrivacyIndicator space={space} size={30} />
      <div className="font-bold text-4xl text-center">{space.name}</div>
    </div>
  );
}

function SpaceMission({ space }: { space: Spaces.Space }) {
  return (
    <div className="text-center mt-1">
      <div className="">{space.mission}</div>
    </div>
  );
}

function SpaceMembers({ space }: { space: Spaces.Space }) {
  const size = Pages.useWindowSizeBreakpoints();

  const peopleToShow = match(size)
    .with("xs", () => 5)
    .with("sm", () => 10)
    .with("md", () => 15)
    .otherwise(() => 20);

  return (
    <div className="font-medium flex items-center gap-2 w-full justify-center mt-2" data-test-id="space-members">
      <AvatarList people={space.members!} stacked size="small" maxElements={peopleToShow} />
      <ManageAccessButton space={space} />
    </div>
  );
}

function SpaceFooter({ space }: { space: Spaces.Space }) {
  return (
    <Paper.DimmedSection>
      <div className="uppercase text-xs font-semibold mb-2">Activity</div>
      <SpaceActivity space={space} />
    </Paper.DimmedSection>
  );
}

function SpaceActivity({ space }: { space: Spaces.Space }) {
  const { data, loading, error } = useItemsQuery("space", space.id!);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return <Feed items={data?.activities || []} testId="space-feed" page="space" />;
}

function JoinButton({ space }) {
  const refresh = useRefresh();
  const [join] = useJoinSpace();

  if (space.isMember) return null;

  const handleClick = async () => {
    await join({ spaceId: space.id });
    refresh();
  };

  return (
    <div className="flex justify-center mb-8 mt-6">
      <PrimaryButton size="sm" onClick={handleClick} testId="join-space-button">
        Join this Space
      </PrimaryButton>
    </div>
  );
}

function ManageAccessButton({ space }: { space: Spaces.Space }) {
  const paths = usePaths();
  const path = paths.spaceAccessManagementPath(space.id!);

  assertPresent(space.permissions, "permissions must be present in space");
  if (!space.permissions.hasFullAccess) return null;

  return (
    <SecondaryButton linkTo={path} size="xs" testId="access-management">
      Manage access
    </SecondaryButton>
  );
}

function SpaceOptions() {
  const { space, tools } = useLoadedData();
  const navigate = useNavigate();
  const [deleteSpace, { loading: isDeleting }] = Spaces.useDeleteSpace();
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const resourceCounts = React.useMemo(() => {
    const projectCount = tools.projects?.length ?? 0;
    const goalCount = tools.goals?.length ?? 0;
    const messageCount = (tools.messagesBoards ?? []).reduce((sum, board) => sum + (board.messages?.length ?? 0), 0);

    return { projectCount, goalCount, messageCount };
  }, [tools]);

  const hasSubresources = React.useMemo(() => {
    return Object.values(resourceCounts).some((count) => count > 0);
  }, [resourceCounts]);

  const paths = usePaths();

  const performDelete = React.useCallback(async () => {
    try {
      await deleteSpace({ spaceId: space.id });
      showSuccessToast("Space deleted", "The space and its content were deleted.");
      navigate(paths.homePath());
    } catch (error) {
      console.error("Failed to delete space", error);
      showErrorToast("Failed to delete space", "Please try again.");
      throw error;
    }
  }, [deleteSpace, navigate, paths, space.id]);

  const handleDelete = React.useCallback(() => {
    if (isDeleting) return;

    if (hasSubresources) {
      setIsModalOpen(true);
      return;
    }

    performDelete();
  }, [hasSubresources, isDeleting, performDelete]);

  const handleConfirmDelete = React.useCallback(async () => {
    try {
      await performDelete();
      setIsModalOpen(false);
    } catch (error) {
      // Error toast already shown in performDelete; keep modal open for another attempt.
    }
  }, [performDelete]);

  const handleCloseModal = React.useCallback(() => {
    if (!isDeleting) {
      setIsModalOpen(false);
    }
  }, [isDeleting]);

  const editLink = paths.spaceEditPath(space.id!);
  const toolsConfigLink = paths.spaceToolsConfigPath(space.id!);

  return (
    <>
      <PageOptions.Root testId="options-button">
        {space.permissions?.canEdit && (
          <PageOptions.Link keepOutsideOnBigScreen icon={IconPencil} to={editLink} title="Edit" testId="edit-space" />
        )}
        {space.permissions?.canEdit && (
          <PageOptions.Link icon={IconSettings} to={toolsConfigLink} title="Configure tools" testId="configure-tools" />
        )}
        {space.permissions?.hasFullAccess && !space.isCompanySpace && (
          <PageOptions.Action icon={IconTrash} title="Delete" onClick={handleDelete} testId="delete-space" />
        )}
      </PageOptions.Root>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Delete space"
        size="large"
        contentPadding="p-6"
        closeOnBackdropClick={!isDeleting}
      >
        <div className="space-y-4">
          <WarningCallout
            message="This action cannot be undone."
            description="Deleting this space will permanently remove everything in it. This includes all projects, goals, and discussions."
          />

          <div className="flex justify-end gap-3">
            <SecondaryButton size="sm" onClick={handleCloseModal} disabled={isDeleting}>
              Cancel
            </SecondaryButton>
            <DangerButton size="sm" onClick={handleConfirmDelete} loading={isDeleting} testId="confirm-delete-space">
              Delete everything
            </DangerButton>
          </div>
        </div>
      </Modal>
    </>
  );
}
