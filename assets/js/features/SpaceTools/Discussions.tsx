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
  toolsCount: number;
}

export function Discussions({ space, discussions, toolsCount }: DiscussionsProps) {
  const path = Paths.discussionsPath(space.id!);

  return (
    <Container path={path} toolsCount={toolsCount}>
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

  const className = classNames(
    // 2rem is the size of <Avatar size="normal" />
    discussion.commentsCount > 0 ? "grid-cols-[2rem_1fr_20px]" : "grid-cols-[2rem_1fr]",
    "grid items-center gap-2",
    "py-3 px-2",
    "border-b border-stroke-base last:border-b-0",
  );

  return (
    <div className={className}>
      <Avatar person={discussion.author} size="normal" />
      <DiscussionTitle title={discussion.title!} body={discussion.body!} />
      <CommnetsCount count={discussion.commentsCount} />
    </div>
  );
}

function DiscussionTitle({ title, body }: { title: string; body: string }) {
  const [subtitle, setSubtitle] = React.useState<string>();
  const textRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (textRef.current) {
      const computedStyle = window.getComputedStyle(textRef.current);
      const lineHeight = parseFloat(computedStyle.lineHeight);
      const height = textRef.current.clientHeight;

      const lines = Math.round(height / lineHeight);

      if (lines <= 1) {
        setSubtitle(richContentToString(JSON.parse(body)));
      }
    }
  }, [setSubtitle]);

  return (
    <div ref={textRef} className="font-bold overflow-hidden">
      {title}

      {subtitle && <div className="font-normal truncate pr-2">{subtitle}</div>}
    </div>
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
