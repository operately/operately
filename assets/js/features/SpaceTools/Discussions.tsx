import React from "react";

import { Discussion } from "@/models/discussions";

import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { DivLink } from "@/components/Link";
import { richContentToString } from "@/components/RichContent";
import Avatar from "@/components/Avatar";

import { Title, Container } from "./components";

export function Discussions({ discussions }: { discussions: Discussion[] }) {
  return (
    <Container>
      <Title title="Discussions" />
      <DiscussionList discussions={discussions.slice(0, 4)} />
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
      <DiscussionTitle title={discussion.title!} body={discussion.body!} />
      <CommnetsCount count={discussion.commentsCount} />
    </DivLink>
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
    <div ref={textRef} className="text-sm font-bold overflow-hidden">
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