import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Reactions from "@/models/reactions";
import * as React from "react";

import { useNavigate } from "react-router";
import { useBoolState } from "@/hooks/useBoolState";
import { useDeleteProjectCheckIn } from "@/models/projectCheckIns";

import Modal from "@/components/Modal";
import {
  CheckInMetadata,
  CheckInTitle,
  Forms,
  IconEdit,
  IconTrash,
  CurrentSubscriptions,
  Spacer,
  showSuccessToast,
  displayDate,
} from "turboui";
import { compareIds } from "@/routes/paths";
import { AckCTA } from "./AckCTA";
import { DescriptionSection } from "@/features/projectCheckIns/DescriptionSection";
import { StatusSection } from "@/features/projectCheckIns/StatusSection";

import { CommentSection, useForProjectCheckIn } from "@/features/CommentSection";
import { ReactionList, useReactionsForm } from "@/features/Reactions";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { useCurrentSubscriptionsAdapter } from "@/models/subscriptions";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { assertPresent } from "@/utils/assertions";
import { banner } from "./Banner";
import { useLoadedData, useRefresh } from "./loader";

import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { usePaths } from "@/routes/paths";

export function Page() {
  const { checkIn } = useLoadedData();
  const [showDeleteConfirmModal, toggleDeleteConfirmModal] = useBoolState(false);

  assertPresent(checkIn.project, "Check-in project must be defined");

  useClearNotificationsOnLoad(checkIn.notifications || []);

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

function Comments() {
  const { checkIn } = useLoadedData();
  const commentsForm = useForProjectCheckIn(checkIn);

  return (
    <CommentSection
      form={commentsForm}
      commentParentType="project_check_in"
      canComment={checkIn.project?.permissions?.canComment || false}
    />
  );
}

function CheckInReactions() {
  const { checkIn } = useLoadedData();
  const reactions = checkIn.reactions!.map((r) => r!);
  const entity = Reactions.entity(checkIn.id!, "project_check_in");
  const form = useReactionsForm(entity, reactions);

  return <ReactionList form={form} size={24} canAddReaction={checkIn.project?.permissions?.canComment || false} />;
}

function SubscriptionsSection() {
  const { checkIn, isCurrentUserSubscribed } = useLoadedData();
  const refresh = useRefresh();

  if (!checkIn.potentialSubscribers || !checkIn.subscriptionList) {
    return null;
  }

  const subscriptionsState = useCurrentSubscriptionsAdapter({
    potentialSubscribers: checkIn.potentialSubscribers,
    subscriptionList: checkIn.subscriptionList,
    resourceName: "check-in",
    type: "project_check_in",
    onRefresh: refresh,
  });

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

  const isAuthor = compareIds(me.id, checkIn.author?.id);
  const isUnpublished = checkIn.state === "draft" || checkIn.state === "scheduled";
  const canEdit = isAuthor;
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
  const [remove] = useDeleteProjectCheckIn();
  const paths = usePaths();

  assertPresent(checkIn.project, "Check-in project must be defined");

  const form = Forms.useForm({
    fields: {},
    cancel: toggleModal,
    submit: async () => {
      await remove({ checkInId: checkIn.id });
      if (checkIn.state === "draft" || checkIn.state === "scheduled") {
        showSuccessToast("Draft discarded", "The draft has been discarded.");
      } else {
        showSuccessToast("Check-in deleted", "The check-in has been successfully deleted.");
      }
      navigate(paths.projectCheckInsPath(checkIn.project?.id!));
    },
  });

  return (
    <Modal isOpen={isOpen} hideModal={toggleModal}>
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
