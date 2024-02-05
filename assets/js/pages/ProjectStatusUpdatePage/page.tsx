import React from "react";

import { Accordion } from "@/components/Accordion";
import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import { Indicator } from "@/components/ProjectHealthIndicators";
import RichContent from "@/components/RichContent";
import { Spacer } from "@/components/Spacer";
import { TextSeparator } from "@/components/TextSeparator";
import * as Feed from "@/features/feed";
import * as UpdateContent from "@/graphql/Projects/update_content";
import * as Updates from "@/graphql/Projects/updates";
import * as Icons from "@tabler/icons-react";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import { AckCTA } from "./AckCTA";
import { CommentSection } from "@/features/CommentSection";
import { useLoadedData, usePageRefetch } from "./loader";
import { useAddReaction } from "./useAddReaction";

export function Page() {
  const { project, update, me } = useLoadedData();
  const refetch = usePageRefetch();

  const addReactionForm = useAddReaction(update.id, "update", refetch);
  const content = update.content as UpdateContent.StatusUpdate;

  return (
    <Pages.Page title={["Check-In", project.name]}>
      <Paper.Root>
        <Navigation project={project} />

        <Paper.Body>
          {me.id === update.author.id && <Options />}
          <Title update={update} />

          <Spacer size={4} />
          <RichContent jsonContent={update.message} className="text-lg" />
          <Spacer size={4} />
          <Health health={content.health} />
          <Spacer size={4} />
          <Feed.Reactions reactions={update.reactions} size={20} form={addReactionForm} />

          <AckCTA />
          <Spacer size={4} />
          <CommentSection update={update} me={me} refresh={refetch} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Title({ update }: { update: Updates.Update }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-content-accent text-2xl font-extrabold">
        Check-In from <FormattedTime time={update.insertedAt} format="long-date" />
      </div>
      <div className="flex gap-0.5 flex-row items-center mt-1 text-content-accent font-medium">
        <div className="flex items-center gap-2">
          <Avatar person={update.author} size="tiny" /> {update.author.fullName}
        </div>
        <TextSeparator />
        <Acknowledgement update={update} />
      </div>
    </div>
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
        <Icons.IconSquareCheckFilled size={16} className="text-accent-1" />
        Acknowledged by {update.acknowledgingPerson.fullName}
      </span>
    );
  } else {
    return <span className="flex items-center gap-1">Not yet acknowledged</span>;
  }
}

function Health({ health }: { health: UpdateContent.ProjectHealth }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Accordion
        title={<AccordionTitle indicatorType="schedule" indicatorValue={health.schedule} title="Schedule" />}
        testId="schedule-accordion"
        initialOpen={!empty(health.scheduleComments)}
        openable={!empty(health.scheduleComments)}
        nonOpenableMessage="No comments"
      >
        <div className="p-4 bg-surface-dimmed">
          <RichContent jsonContent={health.scheduleComments} />
        </div>
      </Accordion>

      <Accordion
        title={<AccordionTitle indicatorType="budget" indicatorValue={health.budget} title="Budget" />}
        testId="budget-accordion"
        initialOpen={!empty(health.budgetComments)}
        openable={!empty(health.budgetComments)}
        nonOpenableMessage="No comments"
      >
        <div className="p-4 bg-surface-dimmed">
          <RichContent jsonContent={health.budgetComments} />
        </div>
      </Accordion>

      <Accordion
        title={<AccordionTitle indicatorType="team" indicatorValue={health.team} title="Team" />}
        testId="team-accordion"
        initialOpen={!empty(health.teamComments)}
        openable={!empty(health.teamComments)}
        nonOpenableMessage="No comments"
      >
        <div className="p-4 bg-surface-dimmed">
          <RichContent jsonContent={health.teamComments} />
        </div>
      </Accordion>

      <Accordion
        title={<AccordionTitle indicatorType="risks" indicatorValue={health.risks} title="Risks" />}
        testId="risks-accordion"
        initialOpen={!empty(health.risksComments)}
        openable={!empty(health.risksComments)}
        nonOpenableMessage="No comments"
      >
        <div className="p-4 bg-surface-dimmed">
          <RichContent jsonContent={health.risksComments} />
        </div>
      </Accordion>

      <Accordion
        title={<AccordionTitle indicatorType="status" indicatorValue={health.status} title="Overall Project Status" />}
        testId="status"
        initialOpen={!empty(health.statusComments)}
        openable={!empty(health.statusComments)}
        nonOpenableMessage="No comments"
      >
        <div className="p-4 bg-surface-dimmed">
          <RichContent jsonContent={health.statusComments} />
        </div>
      </Accordion>
    </div>
  );
}

function AccordionTitle({
  indicatorType,
  indicatorValue,
  title,
}: {
  indicatorType: string;
  indicatorValue: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-content-accent font-semibold">{title}</div>
      <Icons.IconArrowRight size={16} />
      <Indicator type={indicatorType} value={indicatorValue} />
    </div>
  );
}

function empty(json: any) {
  const cannonicalJSON = JSON.stringify(JSON.parse(json));
  return cannonicalJSON === `{"content":[{"type":"paragraph"}],"type":"doc"}`;
}

function Options() {
  const { project, update } = useLoadedData();

  return (
    <PageOptions.Root position="top-right" testId="options-button">
      <PageOptions.Link
        icon={Icons.IconEdit}
        title="Edit check-in"
        to={`/projects/${project.id}/status_updates/${update.id}/edit`}
        dataTestId="edit-check-in"
      />
    </PageOptions.Root>
  );
}
