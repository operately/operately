import React from "react";

import { Space } from "@/models/spaces";
import { Discussion } from "@/models/discussions";
import { Title } from "../components";
import { CommentsCountIndicator } from "@/features/Comments";

import { assertPresent } from "@/utils/assertions";
import { richContentToString } from "@/components/RichContent";

import Avatar from "@/components/Avatar";
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
  assertPresent(discussion.author, "author must be present in discussion");
  assertPresent(discussion.commentsCount, "commentsCount must be present in discussion");

  const className = classNames(
    // 2rem is the size of <Avatar size="normal" />
    discussion.commentsCount > 0 ? "grid-cols-[2rem_1fr_20px]" : "grid-cols-[2rem_1fr]",
    "grid items-center gap-1",
    "py-2 px-2",
    "border-b border-stroke-base last:border-b-0",
  );

  return (
    <div className={className}>
      <Avatar person={discussion.author} size={30} />
      <DiscussionTitle title={discussion.title!} body={discussion.body!} />
      <CommentsCountIndicator count={discussion.commentsCount} />
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
