import React from "react";

import { Space } from "@/models/spaces";
import { Discussion } from "@/models/discussions";

import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { richContentToString } from "@/components/RichContent";
import { CommentsCountIndicator } from "@/features/Comments";
import Avatar from "@/components/Avatar";
import classNames from "classnames";

import { Title, Container, ZeroResourcesContainer } from "./components";
import { GhostButton } from "@/components/Buttons";
import * as Icons from "@tabler/icons-react";

interface DiscussionsProps {
  space: Space;
  discussions: Discussion[];
}

export function Discussions({ space, discussions }: DiscussionsProps) {
  const path = Paths.discussionsPath(space.id!);

  return (
    <Container path={path} testId="messages-tool">
      <div className="group">
        <div className="relative w-full h-[170px] mt-10 opacity-75 px-[65px] flex flex-col gap-3">
          <DiscussionsExample
            icon={Icons.IconSpeakerphone}
            title="Post Announcements"
            body="We have a new team member..."
          />
          <DiscussionsExample icon={Icons.IconBulb} title="Pitch Ideas" body="I have an idea to expand..." />
          <DiscussionsExample icon={Icons.IconMessage} title="Discuss ideas" body="We need to make a decision..." />
        </div>

        <div className="flex flex-col justify-center items-center group">
          <div className="text-base font-bold">Discussions</div>

          <div className="flex gap-2 mt-1 mb-4 text-center px-6 text-sm">
            Post announcements, pitch ideas, and discuss ideas with your team.
          </div>

          <GhostButton size="sm" linkTo={Paths.spaceGoalsPath(space.id!)} testId="edit-space">
            Write a new post
          </GhostButton>
        </div>
      </div>
    </Container>
  );
}

function DiscussionsExample({ icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="flex items-center gap-2 group-hover:gap-3 transition-all shadow-sm pb-2">
      <div className="bg-stone-300 dark:bg-stone-600 group-hover:bg-yellow-300 group-hover:dark:bg-yellow-500 group-hover:text-stone-900 rounded-full p-1.5 transition-all">
        {React.createElement(icon, { size: 22, stroke: 1.5 })}
      </div>
      <div>
        <div className="font-bold text-[10px] leading-none">{title}</div>
        <div className="text-[10px]">{body}</div>
      </div>
    </div>
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
