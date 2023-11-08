import React from "react";

import FormattedTime from "@/components/FormattedTime";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";

import Avatar from "@/components/Avatar";
import RichContent from "@/components/RichContent";

import * as Updates from "@/graphql/Projects/updates";

import { TextSeparator } from "@/components/TextSeparator";
import { Spacer } from "@/components/Spacer";
import { useAddReaction } from "./useAddReaction";
import * as Feed from "@/features/feed";
import { CommentSection } from "./CommentSection";
import * as UpdateContent from "@/graphql/Projects/update_content";
import * as ProjectIcons from "@/components/ProjectIcons";

import { Accordion } from "@/components/Accordion";
import { Indicator } from "@/components/ProjectHealthIndicators";

import { useLoadedData, usePageRefetch } from "./loader";
import { useDocumentTitle } from "@/layouts/header";
import { AckCTA } from "./AckCTA";

export function Page() {
  const { project, update, me } = useLoadedData();
  const refetch = usePageRefetch();

  const addReactionForm = useAddReaction(update.id, "update", refetch);
  const content = update.content as UpdateContent.StatusUpdate;

  useDocumentTitle(["Check-In", project.name]);

  return (
    <Paper.Root>
      <Navigation project={project} />

      <Paper.Body>
        <div className="flex flex-col items-center">
          <div className="text-white-1 text-2xl font-extrabold">
            Check-In from <FormattedTime time={update.insertedAt} format="long-date" />
          </div>
          <div className="flex gap-0.5 flex-row items-center mt-1 text-white-1 font-medium">
            <div className="flex items-center gap-2">
              <Avatar person={update.author} size="tiny" /> {update.author.fullName}
            </div>
            <TextSeparator />
            <Acknowledgement update={update} />
          </div>
        </div>

        <Spacer size={4} />
        <RichContent jsonContent={update.message} className="text-lg" />
        <Spacer size={4} />
        <Health health={content.health} />

        <Spacer size={4} />
        <Feed.Reactions reactions={update.reactions} size={20} form={addReactionForm} />

        <AckCTA project={project} update={update} refetch={refetch} me={me} />
        <Spacer size={4} />
        <CommentSection update={update} refetch={refetch} me={me} />
      </Paper.Body>
    </Paper.Root>
  );
}

function Navigation({ project }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={`/projects/${project.id}`}>
        <Icons.IconClipboardList size={16} />
        {project.name}
      </Paper.NavItem>

      <Paper.NavSeparator />

      <Paper.NavItem linkTo={`/projects/${project.id}/status_updates`}>Check-Ins</Paper.NavItem>
    </Paper.Navigation>
  );
}

function Acknowledgement({ update }: { update: Updates.Update }) {
  if (update.acknowledgedAt) {
    return (
      <span className="flex items-center gap-1">
        <Icons.IconCircleCheck size={16} className="text-green-400" />
        Acknowledged by {update.acknowledgingPerson.fullName}
      </span>
    );
  } else {
    return <span className="flex items-center gap-1">Not yet acknowledged</span>;
  }
}

function Details({ update }) {
  const content = update.content as UpdateContent.StatusUpdate;

  return (
    <div className="border border-dark-5 rounded">
      {content.newHealth && (
        <div className="flex items-center gap-1 border-b border-dark-5 p-2">
          <span className="font-medium w-40">Health</span> <ProjectIcons.IconForHealth health={content.newHealth} />{" "}
          <span className="capitalize">
            {content.newHealth
              .split("_")
              .map((s) => s[0].toUpperCase() + s.slice(1))
              .join(" ")}
          </span>
        </div>
      )}

      {content.phase && (
        <div className="flex items-center gap-1 border-b border-dark-5 p-2">
          <span className="font-medium w-40">Current Phase</span> <ProjectIcons.IconForPhase phase={content.phase} />{" "}
          {content.phase[0].toUpperCase() + content.phase.slice(1)}
        </div>
      )}

      {content.nextMilestoneTitle && (
        <div className="flex items-center gap-1 border-b border-dark-5 p-2">
          <span className="font-medium w-40">Next Milestone</span>
          <Icons.IconMapPinFilled size={20} className="text-white-1/60 inline-block" /> {content.nextMilestoneTitle}
        </div>
      )}

      {content.projectEndTime && (
        <div className="flex items-center gap-1 not-last:border-b border-dark-5 p-2">
          <span className="font-medium w-40">Project Due Date</span>{" "}
          <Icons.IconCalendarFilled size={20} className="text-white-1/60 inline-block" />{" "}
          <FormattedTime time={content.projectEndTime} format="short-date" />
        </div>
      )}
    </div>
  );
}

function Health({ health }: { health: UpdateContent.ProjectHealth }) {
  return (
    <div className="flex flex-col gap-3">
      <Accordion title={<Indicator type="status" value={health.status} />} testId="status">
        <div className="p-4 bg-dark-3">
          <RichContent jsonContent={health.statusComments} />
        </div>
      </Accordion>

      <Accordion
        title={<Indicator type="schedule" value={health.schedule} />}
        showStatusWhenOpen
        testId="schedule-accordion"
      >
        <div className="p-4 bg-dark-3">
          <RichContent jsonContent={health.scheduleComments} />
        </div>
      </Accordion>

      <Accordion title={<Indicator type="budget" value={health.budget} />} testId="budget-accordion">
        <div className="p-4 bg-dark-3">
          <RichContent jsonContent={health.budgetComments} />
        </div>
      </Accordion>

      <Accordion title={<Indicator type="team" value={health.team} />} testId="team-accordion">
        <div className="p-4 bg-dark-3">
          <RichContent jsonContent={health.teamComments} />
        </div>
      </Accordion>

      <Accordion title={<Indicator type="risks" value={health.risks} />} testId="risks-accordion">
        <div className="p-4 bg-dark-3">
          <RichContent jsonContent={health.risksComments} />
        </div>
      </Accordion>
    </div>
  );
}
