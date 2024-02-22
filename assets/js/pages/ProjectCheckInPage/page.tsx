import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";
import * as PageOptions from "@/components/PaperContainer/PageOptions";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import RichContent from "@/components/RichContent";

import { TextSeparator } from "@/components/TextSeparator";
import { useLoadedData } from "./loader";
import { Paths } from "@/routes/paths";
import { AckCTA } from "./AckCTA";

import { Status } from "@/features/projectCheckIns/Status";

// import { Spacer } from "@/components/Spacer";
// import * as Feed from "@/features/feed";
// import { CommentSection, useForProjectCheckIn } from "@/features/CommentSection";
// import { useAddReaction } from "./useAddReaction";

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
          <DescriptionSection />
          <AckCTA />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

// <Spacer size={4} />
// <Feed.Reactions reactions={update.reactions} size={20} form={addReactionForm} />

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

function DescriptionSection() {
  const { checkIn } = useLoadedData();

  return (
    <div className="my-8">
      <div className="text-lg font-bold mx-auto">2. What's new since the last check-in?</div>

      <div className="mt-2 border border-stroke-base rounded p-4">
        <RichContent jsonContent={checkIn.description} className="text-lg" />
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
