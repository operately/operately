import React from "react";

import { Space } from "@/models/spaces";
import { Discussion, useGetDiscussions } from "@/models/discussions";
import { assertPresent } from "@/utils/assertions";
import Avatar from "@/components/Avatar";

import { Title, Container } from "./components";

export function Discussions({ space }: { space: Space }) {
  const { data } = useGetDiscussions({ spaceId: space.id, includeAuthor: true, includeCommentsCount: true });

  if (!data?.discussions) return <></>;

  return (
    <Container>
      <Title title="Discussions" />
      <DiscussionList discussions={data.discussions} />
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

  return (
    <div className="flex items-center gap-2 py-3 px-2 border-b border-stroke-base">
      <Avatar person={discussion.author} size="normal" />
      <div className="text-sm font-bold">{discussion.title}</div>

      {discussion.commentsCount > 0 && (
        <div>
          <div className="w-[20px] h-[20px] text-xs bg-surface-outline flex items-center justify-center rounded-full">
            {discussion.commentsCount}
          </div>
        </div>
      )}
    </div>
  );
}
