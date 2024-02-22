import React from "react";

import { Accordion } from "@/components/Accordion";
import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import { Indicator } from "@/components/ProjectHealthIndicators";
import RichContent from "@/components/RichContent";
// import { Spacer } from "@/components/Spacer";
import { TextSeparator } from "@/components/TextSeparator";
// import * as Feed from "@/features/feed";
import * as UpdateContent from "@/graphql/Projects/update_content";
import * as Updates from "@/graphql/Projects/updates";
import * as Icons from "@tabler/icons-react";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
// import { AckCTA } from "./AckCTA";
// import { CommentSection, useForProjectCheckIn } from "@/features/CommentSection";
import { useLoadedData } from "./loader";
// import { useAddReaction } from "./useAddReaction";
import { Paths } from "@/routes/paths";

import { Status } from "@/features/projectCheckIns/Status";

export function Page() {
  const { checkIn, me } = useLoadedData();

  // const commentsForm = useForProjectCheckIn(update);
  // const addReactionForm = useAddReaction(update.id, "update", refetch);
  // const content = update.content as UpdateContent.StatusUpdate;

  return (
    <Pages.Page title={["Check-In", checkIn.project.name]}>
      <Paper.Root>
        <Navigation project={checkIn.project} />

        <Paper.Body>
          <Options />
          <Title />
          <StatusSection />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

// <Spacer size={4} />
// <RichContent jsonContent={update.message} className="text-lg" />
// <Spacer size={4} />
// <Health health={content.health} />
// <Spacer size={4} />
// <Feed.Reactions reactions={update.reactions} size={20} form={addReactionForm} />

// <AckCTA />
// <Spacer size={4} />
// <CommentSection form={commentsForm} me={me} refresh={refetch} />

function Title() {
  const { checkIn } = useLoadedData();

  return (
    <div className="flex flex-col items-center">
      <div className="text-content-accent text-2xl font-extrabold">
        Check-In from <FormattedTime time={checkIn.insertedAt} format="long-date" />
      </div>
      <div className="flex gap-0.5 flex-row items-center mt-1 text-content-accent font-medium">
        <div className="flex items-center gap-2">
          <Avatar person={checkIn.author} size="tiny" /> {checkIn.author.fullName}
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

function StatusSection() {
  const { checkIn } = useLoadedData();

  return (
    <div className="my-8">
      <div className="text-lg font-bold mx-auto">1. How's the project going?</div>

      <div className="flex flex-col gap-2 mt-2 border border-stroke-base rounded-lg p-2">
        <Status status={checkIn.status} reviewer={checkIn.project.reviewer!} />
      </div>
    </div>
  );
}

function Options() {
  const { checkIn, me } = useLoadedData();

  if (me.id !== checkIn.author.id) return null;

  return (
    <PageOptions.Root position="top-right" testId="options-button">
      <PageOptions.Link
        icon={Icons.IconEdit}
        title="Edit check-in"
        to={Paths.projectCheckInEditPath(checkIn.project.id, checkIn.id)}
        dataTestId="edit-check-in"
      />
    </PageOptions.Root>
  );
}
