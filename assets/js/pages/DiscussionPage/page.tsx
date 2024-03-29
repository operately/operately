import React from "react";

import FormattedTime from "@/components/FormattedTime";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as PageOptions from "@/components/PaperContainer/PageOptions";

import Avatar from "@/components/Avatar";
import RichContent from "@/components/RichContent";

import { TextSeparator } from "@/components/TextSeparator";
import { Spacer } from "@/components/Spacer";
import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { CommentSection, useForDiscussion } from "@/features/CommentSection";

import { useRefresh, useLoadedData } from "./loader";

export function Page() {
  const { discussion, me } = useLoadedData();

  const refresh = useRefresh();
  const commentsForm = useForDiscussion(discussion);

  return (
    <Pages.Page title={discussion.title}>
      <Paper.Root size="large">
        <Navigation space={discussion.space} />

        <Paper.Body>
          <div className="px-16">
            {me.id === discussion.author.id && <Options />}
            <Title discussion={discussion} />

            <Spacer size={4} />
            <RichContent jsonContent={discussion.body} className="text-lg" />

            <Spacer size={2} />
            <Reactions />

            <Spacer size={4} />
            <div className="border-t border-stroke-base mt-8" />
            <CommentSection form={commentsForm} me={me} refresh={refresh} />
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Reactions() {
  const { discussion, me } = useLoadedData();
  const reactions = discussion.reactions!.map((r) => r!);
  const entity = { id: discussion.id, type: "update" };
  const addReactionForm = useReactionsForm(entity, reactions, me);

  return <ReactionList size={24} form={addReactionForm} />;
}

function Title({ discussion }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-content-accent text-3xl font-extrabold text-center">{discussion.title}</div>
      <div className="flex gap-0.5 flex-row items-center mt-1 text-content-accent font-medium">
        <div className="flex items-center gap-2">
          <Avatar person={discussion.author} size="tiny" /> {discussion.author.fullName}
        </div>
        <TextSeparator />
        <span>
          Posted on <FormattedTime time={discussion.insertedAt} format="short-date" />
        </span>
      </div>
    </div>
  );
}

function Navigation({ space }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={`/spaces/${space.id}/discussions`}>
        {React.createElement(Icons[space.icon], { size: 16, className: space.color })}
        {space.name}
      </Paper.NavItem>
    </Paper.Navigation>
  );
}

function Options() {
  const { discussion } = useLoadedData();

  return (
    <PageOptions.Root position="top-right" testId="options-button">
      <PageOptions.Link
        icon={Icons.IconEdit}
        title="Edit Post"
        to={`/spaces/${discussion.space.id}/discussions/${discussion.id}/edit`}
        dataTestId="edit-discussion"
      />
    </PageOptions.Root>
  );
}
