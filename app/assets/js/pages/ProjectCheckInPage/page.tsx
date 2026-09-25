import { canEditProjectCheckIn } from "@/models/projectCheckIns";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import { CheckInReactions } from "./CheckInReactions";
import * as React from "react";

import { useNavigate } from "react-router";
import { useBoolState } from "@/hooks/useBoolState";
import { useDeleteProjectCheckIn } from "@/models/projectCheckIns";

import {
  CheckInMetadata,
  CheckInTitle,
  Forms,
  IconEdit,
  IconTrash,
  CurrentSubscriptions,
  Modal,
  Spacer,
  showSuccessToast,
  displayDate,
} from "turboui";
import { AckCTA } from "./AckCTA";
import { DescriptionSection } from "@/features/projectCheckIns/DescriptionSection";
import { StatusSection } from "@/features/projectCheckIns/StatusSection";

import { Comments } from "./Comments";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { useCurrentSubscriptionsQueryAdapter } from "@/models/subscriptions/useCurrentSubscriptionsQueryAdapter";
import { useReadNotificationsOnLoad } from "@/models/notifications/notificationLifecycle";
import { invalidateProjectInteractionQueries } from "@/models/projects/projectInteractionQueries";
import { assertPresent } from "@/utils/assertions";
import { banner } from "./Banner";
import { useLoadedData, useRefresh } from "./loader";

import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { usePaths } from "@/routes/paths";

export function Page() {
  const { checkIn } = useLoadedData();
  const [showDeleteConfirmModal, toggleDeleteConfirmModal] = useBoolState(false);

  assertPresent(checkIn.project, "Check-in project must be defined");

  const project = checkIn.project;
  useReadNotificationsOnLoad(checkIn.notifications ?? [], (client) =>
    invalidateProjectInteractionQueries(
      client,
      { projectId: project.id, spaceId: checkIn.space?.id, resourceId: checkIn.id, resourceType: "project_check_in" },
      "none",
    ),
  );

  return (
    <Pages.Page title={["Check-In", checkIn.project.name]} testId="project-check-in-page">
      <Paper.Root>
        <Navigation />

        <Paper.Body className="p-4 md:p-8 lg:px-28 lg:pt-8" noPadding banner={banner(checkIn.project)}>
          <Options showDeleteModal={toggleDeleteConfirmModal} />
          <Title />
          <StatusSection checkIn={checkIn} reviewer={checkIn.project!.reviewer} />
          <DescriptionSection checkIn={checkIn} />

          {checkIn.state === "published" && (
            <>
              <AckCTA />

              <Spacer size={4} />
              <CheckInReactions />

              <div className="border-t border-stroke-base mt-8" />
              <Comments />

              <div className="border-t border-stroke-base mt-16 mb-8" />
              <SubscriptionsSection />
            </>
          )}

          <DeleteCheckInModal isOpen={showDeleteConfirmModal} toggleModal={toggleDeleteConfirmModal} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function SubscriptionsSection() {
  const { checkIn, isCurrentUserSubscribed } = useLoadedData();
  const refresh = useRefresh();

  const subscriptionsState = useCurrentSubscriptionsQueryAdapter({
    potentialSubscribers: checkIn.potentialSubscribers ?? [],
    subscriptionList: checkIn.subscriptionList,
    resourceName: "check-in",
    type: "project_check_in",
    onRefresh: refresh,
  });

  if (!checkIn.potentialSubscribers || !checkIn.subscriptionList) {
    return null;
  }

  return (
    <CurrentSubscriptions
      {...subscriptionsState}
      isCurrentUserSubscribed={isCurrentUserSubscribed}
      canEditSubscribers={checkIn.project?.permissions?.canEdit || false}
    />
  );
}

function Title() {
  const { checkIn } = useLoadedData();
  const formattedTimePreferences = useFormattedTimePreferences();

  const checkInDate = displayDate(checkIn);

  return (
    <div className="flex flex-col items-center">
      <CheckInTitle state={checkIn.state} timestamp={checkInDate} formattedTimePreferences={formattedTimePreferences} />
      <CheckInMetadata
        resourceType="project"
        author={checkIn.author}
        acknowledgedBy={checkIn.acknowledgedBy}
        state={checkIn.state}
        postedAt={checkInDate}
        scheduledAt={checkIn.scheduledAt}
        formattedTimePreferences={formattedTimePreferences}
      />
    </div>
  );
}

function Navigation() {
  const { checkIn } = useLoadedData();
  const paths = usePaths();
  const items: Paper.NavigationItem[] = [];

  if (checkIn.space) {
    items.push({ to: paths.spacePath(checkIn.space.id), label: checkIn.space.name });
    items.push({ to: paths.spaceWorkMapPath(checkIn.space.id, "projects" as const), label: "Work Map" });
  } else {
    items.push({ to: paths.workMapPath("projects"), label: "Work Map" });
  }

  if (checkIn.project) {
    items.push({ to: paths.projectPath(checkIn.project.id), label: checkIn.project.name });
    items.push({ to: paths.projectCheckInsPath(checkIn.project.id), label: "Check-Ins" });
  }

  return <Paper.Navigation items={items} />;
}

function Options({ showDeleteModal }: { showDeleteModal: () => void }) {
  const paths = usePaths();
  const { checkIn } = useLoadedData();
  const me = useMe()!;

  const isUnpublished = checkIn.state === "draft" || checkIn.state === "scheduled";
  const canEdit = canEditProjectCheckIn(checkIn, me?.id);
  const canDelete = isUnpublished || checkIn.project?.permissions?.hasFullAccess || false;

  if (!canEdit && !canDelete) return null;

  return (
    <PageOptions.Root testId="options-button">
      {canEdit && (
        <PageOptions.Link
          icon={IconEdit}
          title={"Edit"}
          to={paths.projectCheckInEditPath(checkIn.id!)}
          testId="edit-check-in"
          keepOutsideOnBigScreen
        />
      )}
      {canDelete && (
        <PageOptions.Action
          icon={IconTrash}
          title={isUnpublished ? "Discard draft" : "Delete check-in"}
          onClick={showDeleteModal}
          testId="delete-check-in"
        />
      )}
    </PageOptions.Root>
  );
}

interface DeleteCheckInModalProps {
  isOpen: boolean;
  toggleModal: () => void;
}

function DeleteCheckInModal({ isOpen, toggleModal }: DeleteCheckInModalProps) {
  const navigate = useNavigate();
  const { checkIn } = useLoadedData();
  const remove = useDeleteProjectCheckIn();
  const paths = usePaths();

  assertPresent(checkIn.project, "Check-in project must be defined");

  const form = Forms.useForm({
    fields: {},
    cancel: toggleModal,
    submit: async () => {
      await remove.mutateAsync({ checkInId: checkIn.id });
      if (checkIn.state === "draft" || checkIn.state === "scheduled") {
        showSuccessToast("Draft discarded", "The draft has been discarded.");
      } else {
        showSuccessToast("Check-in deleted", "The check-in has been successfully deleted.");
      }
      navigate(paths.projectCheckInsPath(checkIn.project?.id!));
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={toggleModal}>
      <Forms.Form form={form}>
        <p>
          {checkIn.state === "draft" || checkIn.state === "scheduled"
            ? "Are you sure you want to discard this draft?"
            : "Are you sure you want to delete this check-in?"}
        </p>
        <Forms.Submit
          saveText={checkIn.state === "draft" || checkIn.state === "scheduled" ? "Discard draft" : "Delete"}
          cancelText="Cancel"
        />
      </Forms.Form>
    </Modal>
  );
}
