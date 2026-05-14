import React from "react";

import { Space } from "@/models/spaces";
import { Discussion } from "@/models/discussions";
import { Title } from "../components";
import { CommentsCountIndicator } from "@/features/Comments";

import { assertPresent } from "@/utils/assertions";

import { Avatar, richContentToString } from "turboui";
import classNames from "classnames";

interface Props {
  space: Space;
  discussions: Discussion[];
}

export function RegularState(props: Props) {
  return (
    <div>
      <Title title="Discussions" />
      <DiscussionList discussions={props.discussions} />
    </div>
  );
}

function DiscussionList({ discussions }: { discussions: Discussion[] }) {
  return (
    <div className="bg-surface-dimmed rounded mx-2">
      {discussions.map((discussion) => (
        <DiscussionItem discussion={discussion} key={discussion.id} />
      ))}
    </div>
  );
}

function DiscussionItem({ discussion }: { discussion: Discussion }) {
  assertPresent(discussion.commentsCount, "commentsCount must be present in discussion");

  const hasAuthor = !!discussion.author;
  const hasComments = discussion.commentsCount > 0;
  const className = classNames(
    discussionItemGridColsClass(hasAuthor, hasComments),
    "grid items-center gap-1",
    "py-2 px-2",
    "border-b border-stroke-base last:border-b-0",
  );

  return (
    <div className={className}>
      {discussion.author && <Avatar person={discussion.author} size={30} />}
      <DiscussionTitle title={discussion.title!} body={discussion.body!} />
      <CommentsCountIndicator count={discussion.commentsCount} size={16} />
    </div>
  );
}

function DiscussionTitle({ title, body }: { title: string; body: string }) {
  return (
    <div className="font-bold overflow-hidden">
      <div className="truncate pr-2">{title}</div>
      <div className="font-normal truncate pr-2">{richContentToString(JSON.parse(body))}</div>
    </div>
  );
}

function discussionItemGridColsClass(hasAuthor: boolean, hasComments: boolean) {
  if (hasAuthor && hasComments) return "grid-cols-[2rem_1fr_20px]";
  if (hasAuthor) return "grid-cols-[2rem_1fr]";
  if (hasComments) return "grid-cols-[1fr_20px]";

  return "grid-cols-[1fr]";
}