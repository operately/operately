import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Reactions from "@/models/reactions";
import * as React from "react";

import FormattedTime from "@/components/FormattedTime";
import { Avatar, IconEdit, IconSquareCheckFilled, CurrentSubscriptions } from "turboui";

import { TextSeparator } from "@/components/TextSeparator";
import { compareIds } from "@/routes/paths";
import { AckCTA } from "./AckCTA";

import { Spacer } from "@/components/Spacer";
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

import { usePaths } from "@/routes/paths";
export function Page() {
  const { checkIn } = useLoadedData();

  assertPresent(checkIn.notifications, "Check-in notifications must be defined");
  assertPresent(checkIn.project, "Check-in project must be defined");

  useClearNotificationsOnLoad(checkIn.notifications);

  return (
    <Pages.Page title={["Check-In", checkIn.project!.name!]} testId="project-check-in-page">
      <Paper.Root>
        <Navigation project={checkIn.project} />

        <Paper.Body className="p-4 md:p-8 lg:px-28 lg:pt-8" noPadding banner={banner(checkIn.project)}>
          <Options />
          <Title />
          <StatusSection checkIn={checkIn} reviewer={checkIn.project!.reviewer} />
          <DescriptionSection checkIn={checkIn} />
          <AckCTA />

          <Spacer size={4} />
          <CheckInReactions />

          <div className="border-t border-stroke-base mt-8" />
          <Comments />

          <div className="border-t border-stroke-base mt-16 mb-8" />

          <SubscriptionsSection />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Comments() {
  const { checkIn } = useLoadedData();
  const commentsForm = useForProjectCheckIn(checkIn);

  assertPresent(checkIn.project?.permissions?.canCommentOnCheckIn, "permissions must be present in project checkIn");

  return (
    <CommentSection
      form={commentsForm}
      commentParentType="project_check_in"
      canComment={checkIn.project.permissions.canCommentOnCheckIn}
    />
  );
}

function CheckInReactions() {
  const { checkIn } = useLoadedData();
  const reactions = checkIn.reactions!.map((r) => r!);
  const entity = Reactions.entity(checkIn.id!, "project_check_in");
  const form = useReactionsForm(entity, reactions);

  assertPresent(checkIn.project?.permissions?.canCommentOnCheckIn, "permissions must be present in project checkIn");

  return <ReactionList form={form} size={24} canAddReaction={checkIn.project.permissions.canCommentOnCheckIn} />;
}

function SubscriptionsSection() {
  const { checkIn } = useLoadedData();
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

  return <CurrentSubscriptions {...subscriptionsState} />;
}

function Title() {
  const { checkIn } = useLoadedData();

  return (
    <div className="flex flex-col items-center">
      <div className="text-content-accent text-2xl font-extrabold">
        Check-In from <FormattedTime time={checkIn.insertedAt!} format="long-date" />
      </div>
      <div className="flex gap-0.5 flex-row items-center mt-1 text-content-accent font-medium">
        <div className="flex items-center gap-2">
          <Avatar person={checkIn.author!} size="tiny" /> {checkIn.author!.fullName}
        </div>
        <TextSeparator />
        <Acknowledgement />
      </div>
    </div>
  );
}

function Navigation({ project }) {
  const paths = usePaths();
  assertPresent(project.space, "space must be present on project");

  return (
    <Paper.Navigation
      items={[
        { to: paths.spacePath(project.space.id), label: project.space.name },
        { to: paths.spaceWorkMapPath(project.space.id, "projects" as const), label: "Work Map" },
        { to: paths.projectPath(project.id), label: project.name },
        { to: paths.projectCheckInsPath(project.id), label: "Check-Ins" },
      ]}
    />
  );
}

function Acknowledgement() {
  const { checkIn } = useLoadedData();

  if (checkIn.acknowledgedAt) {
    return (
      <span className="flex items-center gap-1">
        <IconSquareCheckFilled size={16} className="text-accent-1" />
        Acknowledged by {checkIn.acknowledgedBy!.fullName}
      </span>
    );
  } else {
    return <span className="flex items-center gap-1">Not yet acknowledged</span>;
  }
}

function Options() {
  const paths = usePaths();
  const { checkIn } = useLoadedData();
  const me = useMe()!;

  if (!compareIds(me.id!, checkIn.author!.id!)) return null;

  return (
    <PageOptions.Root testId="options-button">
      <PageOptions.Link
        icon={IconEdit}
        title="Edit check-in"
        to={paths.projectCheckInEditPath(checkIn.id!)}
        testId="edit-check-in"
      />
    </PageOptions.Root>
  );
}
