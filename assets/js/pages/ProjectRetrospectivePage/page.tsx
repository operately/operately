import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as PageOptions from "@/components/PaperContainer/PageOptions";

import { Paths } from "@/routes/paths";
import { IconEdit } from "@tabler/icons-react";
import { useForProjectRetrospective } from "@/features/CommentSection/useForProjectRetrospective";
import { CommentSection } from "@/features/CommentSection";
import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";
import { AvatarWithName } from "@/components/Avatar/AvatarWithName";
import { Spacer } from "@/components/Spacer";
import RichContent from "@/components/RichContent";
import FormattedTime from "@/components/FormattedTime";
import { CurrentSubscriptions } from "@/features/Subscriptions";

import { useLoadedData, useRefresh } from "./loader";

export function Page() {
  const { retrospective } = useLoadedData();

  return (
    <Pages.Page title={["Retrospective", retrospective.project!.name!]}>
      <Paper.Root size="medium">
        <ProjectPageNavigation project={retrospective.project!} />

        <Paper.Body minHeight="none">
          <Options />

          <Header />
          <Content />

          <Spacer size={2} />
          <Reactions />

          <Spacer size={4} />
          <Comments />

          <Subscriptions />
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

      <div className="flex items-center gap-1.5 font-medium justify-center mt-2">
        {retrospective.author && <AvatarWithName person={retrospective.author!} size={20} />}
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
    <div className="mb-8">
      <QuestionTitle title="What went well?" />
      <RichContent jsonContent={JSON.stringify(retro.whatWentWell)} />

      <QuestionTitle title="What could've gone better?" />
      <RichContent jsonContent={JSON.stringify(retro.whatCouldHaveGoneBetter)} />

      <QuestionTitle title="What did you learn?" />
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

function Comments() {
  const { retrospective, comments } = useLoadedData();
  const refresh = useRefresh();

  const commentsForm = useForProjectRetrospective(retrospective, comments);

  return (
    <>
      <div className="border-t border-stroke-base mt-8" />
      <CommentSection form={commentsForm} refresh={refresh} commentParentType="project_retrospective" />
    </>
  );
}

function Subscriptions() {
  const { retrospective } = useLoadedData();
  const refresh = useRefresh();

  return (
    <>
      <div className="border-t border-stroke-base mt-16 mb-8" />

      <CurrentSubscriptions
        potentialSubscribers={retrospective.potentialSubscribers!}
        subscriptionList={retrospective.subscriptionList!}
        name="project retrospective"
        type="project_retrospective"
        callback={refresh}
      />
    </>
  );
}

function QuestionTitle({ title }: { title: string }) {
  return <div className="text-content-accent font-extrabold mb-2 mt-8 text-xl">{title}</div>;
}
