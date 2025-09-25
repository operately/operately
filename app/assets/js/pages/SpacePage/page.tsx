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
  IconTrash,
  Modal,
  PrimaryButton,
  SecondaryButton,
  showErrorToast,
  showSuccessToast,
} from "turboui";

import { useClearNotificationsOnLoad } from "@/features/notifications";
import { PrivacyIndicator } from "@/features/spaces/PrivacyIndicator";
import { ToolsSection } from "@/features/SpaceTools";
import { useJoinSpace } from "@/models/spaces";
import { assertPresent } from "@/utils/assertions";

import { usePaths } from "@/routes/paths";
import { match } from "ts-pattern";
import { useLoadedData, useRefresh } from "./loader";
import { useNavigate } from "react-router-dom";

export function Page() {
  const { space, tools } = useLoadedData();

  assertPresent(space.notifications, "notifications must be present in space");
  useClearNotificationsOnLoad(space.notifications);

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

  return <Feed items={data!.activities!} testId="space-feed" page="space" />;
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
  if (!space.permissions.canAddMembers) return null;

  return (
    <SecondaryButton linkTo={path} size="xs" testId="access-management">
      Manage access
    </SecondaryButton>
  );
}

function SpaceOptions() {
  const { space, tools } = useLoadedData();

  assertPresent(space.permissions, "permissions must be present in space");
  if (!space.permissions.canDelete || !space.permissions.canEdit) return null;

  const navigate = useNavigate();
  const [deleteSpace, { loading: isDeleting }] = Spaces.useDeleteSpace();
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const resourceCounts = React.useMemo(() => {
    const projectCount = tools.projects?.length ?? 0;
    const goalCount = tools.goals?.length ?? 0;
    const messageCount = (tools.messagesBoards ?? []).reduce(
      (sum, board) => sum + (board.messages?.length ?? 0),
      0,
    );
    const resourceHubItemCount = (tools.resourceHubs ?? []).reduce(
      (sum, hub) => sum + (hub.nodes?.length ?? 0),
      0,
    );

    return { projectCount, goalCount, messageCount, resourceHubItemCount };
  }, [tools]);

  const hasSubresources = React.useMemo(() => {
    return Object.values(resourceCounts).some((count) => count > 0);
  }, [resourceCounts]);

  const subresourceSummaries = React.useMemo(() => {
    const entries = [
      { label: "Projects", count: resourceCounts.projectCount },
      { label: "Goals", count: resourceCounts.goalCount },
      { label: "Discussions", count: resourceCounts.messageCount },
      { label: "Resource hub items", count: resourceCounts.resourceHubItemCount },
    ];

    return entries.filter((entry) => entry.count > 0);
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

    void performDelete();
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

  return (
    <>
      <PageOptions.Root testId="options-button">
        {space.permissions.canEdit && (
          <PageOptions.Link keepOutsideOnBigScreen icon={IconPencil} to={editLink} title="Edit" testId="edit-space" />
        )}
        {space.permissions.canDelete && (
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
          <p className="text-content-base font-medium">
            This space contains work. Deleting it will permanently remove everything listed below and cannot be
            undone.
          </p>

          {subresourceSummaries.length > 0 && (
            <ul className="list-disc pl-5 text-sm text-content-dimmed space-y-1">
              {subresourceSummaries.map(({ label, count }) => (
                <li key={label}>
                  <span className="font-semibold text-content-base">{count}</span> {label.toLowerCase()}
                </li>
              ))}
            </ul>
          )}

          <p className="text-content-dimmed text-sm">
            Please confirm you still want to delete this space and all of its subresources. This action cannot be
            reverted.
          </p>

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
