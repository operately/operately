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

import { useLoadedData, useRefresh } from "./loader";
import { useDiscussionCommentsChangeSignal } from "@/models/comments";
import { useMe } from "@/contexts/CurrentUserContext";
import { Paths, compareIds } from "@/routes/paths";
import { findSpaceNotifiablePeople } from "@/features/Subscriptions/utils";
import { CurrentSubscriptions } from "@/features/Subscriptions";

export function Page() {
  const me = useMe()!;
  const { discussion } = useLoadedData();
  const refresh = useRefresh();

  const people = findSpaceNotifiablePeople(discussion.space!);
  const commentsForm = useForDiscussion(discussion);
  useDiscussionCommentsChangeSignal(commentsForm.refetch!, { discussionId: discussion.id! });

  return (
    <Pages.Page title={discussion.title!}>
      <Paper.Root size="large">
        <Navigation space={discussion.space} />

        <Paper.Body>
          <div className="px-16">
            {compareIds(me.id, discussion.author!.id) && <Options />}
            <Title discussion={discussion} />

            <Spacer size={4} />
            <RichContent jsonContent={discussion.body!} className="text-lg" />

            <Spacer size={2} />
            <Reactions />

            <Spacer size={4} />
            <div className="border-t border-stroke-base mt-8" />
            <CommentSection form={commentsForm} refresh={() => {}} commentParentType="message" />

            <div className="border-t border-stroke-base mt-16 mb-8" />

            <CurrentSubscriptions
              people={people}
              subscriptionList={discussion.subscriptionList!}
              name="discussion"
              type="message"
              callback={refresh}
            />
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Reactions() {
  const { discussion } = useLoadedData();
  const reactions = discussion.reactions!.map((r) => r!);
  const entity = { id: discussion.id!, type: "message" };
  const addReactionForm = useReactionsForm(entity, reactions);

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
      <Paper.NavItem linkTo={Paths.spaceDiscussionsPath(space.id)}>
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
        to={Paths.discussionEditPath(discussion.id!)}
        testId="edit-discussion"
      />
    </PageOptions.Root>
  );
}
