import React from "react";

import { Discussion } from "@/models/discussions";

import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { DivLink } from "@/components/Link";
import Avatar from "@/components/Avatar";

import { Title, Container } from "./components";

export function Discussions({ discussions }: { discussions: Discussion[] }) {
  return (
    <Container>
      <Title title="Discussions" />
      <DiscussionList discussions={discussions} />
    </Container>
  );
}

function DiscussionList({ discussions }: { discussions: Discussion[] }) {
  return (
    <div>
      {discussions.map((discussion) => (
        <DiscussionItem discussion={discussion} key={discussion.id} />
      ))}
    </div>
  );
}

function DiscussionItem({ discussion }: { discussion: Discussion }) {
  assertPresent(discussion.author, "author must be present in discussion");
  assertPresent(discussion.commentsCount, "commentsCount must be present in discussion");

  const path = Paths.discussionPath(discussion.id!);

  return (
    <DivLink to={path} className="flex items-center gap-2 py-3 px-2 border-b border-stroke-base last:border-b-0">
      <Avatar person={discussion.author} size="normal" />
      <div className="text-sm font-bold">{discussion.title}</div>
      <CommnetsCount count={discussion.commentsCount} />
    </DivLink>
  );
}

function CommnetsCount({ count }: { count: number }) {
  if (count < 1) return <></>;

  return (
    <div>
      <div className="w-[20px] h-[20px] text-xs bg-blue-500 text-white-1 flex items-center justify-center rounded-full">
        {count}
      </div>
    </div>
  );
}
