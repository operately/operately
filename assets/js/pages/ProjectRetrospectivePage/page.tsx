import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as PageOptions from "@/components/PaperContainer/PageOptions";

import { Paths } from "@/routes/paths";
import { IconEdit } from "@tabler/icons-react";
import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";
import { AvatarWithName } from "@/components/Avatar/AvatarWithName";
import { Spacer } from "@/components/Spacer";
import RichContent from "@/components/RichContent";
import FormattedTime from "@/components/FormattedTime";

import { useLoadedData } from "./loader";

export function Page() {
  const { retrospective } = useLoadedData();

  return (
    <Pages.Page title={["Retrospective", retrospective.project!.name!]}>
      <Paper.Root size="small">
        <ProjectPageNavigation project={retrospective.project!} />

        <Paper.Body minHeight="none">
          <Options />

          <Header />
          <Content />

          <Spacer size={3} />
          <Reactions />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Options() {
  const { retrospective } = useLoadedData();

  return (
    <PageOptions.Root testId="project-options-button" position="top-right">
      {retrospective.permissions?.canEditRetrospective && (
        <PageOptions.Link
          icon={IconEdit}
          title="Edit retrospective"
          to={Paths.projectRetrospectiveEditPath(retrospective.project!.id!)}
          testId="edit-retrospective"
        />
      )}
    </PageOptions.Root>
  );
}

function Header() {
  const { retrospective } = useLoadedData();

  return (
    <>
      <div className="text-center text-content-accent text-3xl font-extrabold">Project Retrospective</div>

      <div className="flex items-center gap-2 font-medium justify-center mt-2">
        {retrospective.author && <AvatarWithName person={retrospective.author} size={16} />}
        {retrospective.author && <span>&middot;</span>}
        <FormattedTime time={retrospective.closedAt!} format="long-date" />
      </div>
    </>
  );
}

function Content() {
  const { retrospective } = useLoadedData();
  const retro = JSON.parse(retrospective.content!);

  return (
    <div className="mt-8">
      <div className="text-content-accent font-bold mt-4 pt-4 border-t border-stroke-base">What went well?</div>
      <RichContent jsonContent={JSON.stringify(retro.whatWentWell)} />

      <div className="text-content-accent font-bold mt-4 pt-4 border-t border-stroke-base">
        What could've gone better?
      </div>
      <RichContent jsonContent={JSON.stringify(retro.whatCouldHaveGoneBetter)} />

      <div className="text-content-accent font-bold mt-4 pt-4 border-t border-stroke-base">What did you learn?</div>
      <RichContent jsonContent={JSON.stringify(retro.whatDidYouLearn)} />
    </div>
  );
}

function Reactions() {
  const { retrospective } = useLoadedData();
  const reactions = retrospective.reactions!.map((r) => r!);
  const entity = { id: retrospective.id!, type: "project_retrospective" };
  const addReactionForm = useReactionsForm(entity, reactions);

  return <ReactionList size={24} form={addReactionForm} />;
}
