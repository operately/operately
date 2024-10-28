import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Reactions from "@/models/reactions";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";

import { TextSeparator } from "@/components/TextSeparator";
import { Paths, compareIds } from "@/routes/paths";
import { AckCTA } from "./AckCTA";

import { Spacer } from "@/components/Spacer";
import { StatusSection } from "@/features/projectCheckIns/StatusSection";
import { DescriptionSection } from "@/features/projectCheckIns/DescriptionSection";

import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { CommentSection, useForProjectCheckIn } from "@/features/CommentSection";

import { useLoadedData, useRefresh } from "./loader";
import { useMe } from "@/contexts/CurrentUserContext";
import { CurrentSubscriptions } from "@/features/Subscriptions";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { assertPresent } from "@/utils/assertions";

export function Page() {
  const { checkIn } = useLoadedData();
  const refresh = useRefresh();

  assertPresent(checkIn.notifications, "Check-in notifications must be defined");
  assertPresent(checkIn.project, "Check-in project must be defined");

  useClearNotificationsOnLoad(checkIn.notifications);

  return (
    <Pages.Page title={["Check-In", checkIn.project!.name!]} testId="project-check-in-page">
      <Paper.Root>
        <Navigation project={checkIn.project} />

        <Paper.Body>
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

          <CurrentSubscriptions
            potentialSubscribers={checkIn.potentialSubscribers!}
            subscriptionList={checkIn.subscriptionList!}
            name="check-in"
            type="project_check_in"
            callback={refresh}
          />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Comments() {
  const { checkIn } = useLoadedData();
  const refresh = useRefresh();
  const commentsForm = useForProjectCheckIn(checkIn);

  assertPresent(checkIn.project?.permissions?.canCommentOnCheckIn, "permissions must be present in project checkIn");

  return (
    <CommentSection
      form={commentsForm}
      refresh={refresh}
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
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.projectPath(project.id)}>
        <Icons.IconClipboardList size={16} />
        {project.name}
      </Paper.NavItem>

      <Paper.NavSeparator />

      <Paper.NavItem linkTo={Paths.projectCheckInsPath(project.id)}>Check-Ins</Paper.NavItem>
    </Paper.Navigation>
  );
}

function Acknowledgement() {
  const { checkIn } = useLoadedData();

  if (checkIn.acknowledgedAt) {
    return (
      <span className="flex items-center gap-1">
        <Icons.IconSquareCheckFilled size={16} className="text-accent-1" />
        Acknowledged by {checkIn.acknowledgedBy!.fullName}
      </span>
    );
  } else {
    return <span className="flex items-center gap-1">Not yet acknowledged</span>;
  }
}

function Options() {
  const { checkIn } = useLoadedData();
  const me = useMe()!;

  if (!compareIds(me.id!, checkIn.author!.id!)) return null;

  return (
    <PageOptions.Root position="top-right" testId="options-button">
      <PageOptions.Link
        icon={Icons.IconEdit}
        title="Edit check-in"
        to={Paths.projectCheckInEditPath(checkIn.id!)}
        testId="edit-check-in"
      />
    </PageOptions.Root>
  );
}
