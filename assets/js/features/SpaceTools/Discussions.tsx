import React from "react";

import { Space } from "@/models/spaces";
import { Discussion } from "@/models/discussions";

import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { richContentToString } from "@/components/RichContent";
import Avatar from "@/components/Avatar";
import classNames from "classnames";

import { Title, Container, ZeroResourcesContainer } from "./components";

interface DiscussionsProps {
  space: Space;
  discussions: Discussion[];
}

export function Discussions({ space, discussions }: DiscussionsProps) {
  const path = Paths.discussionsPath(space.id!);

  return (
    <Container path={path} testId="messages-tool">
      <Title title="Discussions" />
      {discussions.length < 1 ? <ZeroDiscussions /> : <DiscussionList discussions={discussions} />}
    </Container>
  );
}

function ZeroDiscussions() {
  return <ZeroResourcesContainer>Post announcements, pitch ideas, and start discussions.</ZeroResourcesContainer>;
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
      <CommnetsCount count={discussion.commentsCount} />
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

function CommnetsCount({ count }: { count: number }) {
  if (count < 1) return <></>;

  return (
    <div>
      <div className="w-[16px] h-[16px] bg-blue-500 text-white-1 flex items-center justify-center rounded-full text-[9px] font-bold">
        {count}
      </div>
    </div>
  );
}
