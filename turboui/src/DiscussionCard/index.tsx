import React from "react";

import { Avatar, AvatarPerson } from "../Avatar";
import { MentionedPersonLookupFn } from "../RichEditor";
import classNames from "../utils/classnames";
import { DivLink } from "../Link";
import { Summary } from "../RichContent";
import FormattedTime from "../FormattedTime";
import { CommentCountIndicator } from "../CommentCountIndicator";

namespace DiscussionCard {
  interface Discussion {
    id: string;
    title: string;
    author: AvatarPerson;
    date: Date;
    link: string;
    content: string;
    commentCount: number;
  }

  export interface Props {
    discussion: Discussion;
    mentionedPersonLookup: MentionedPersonLookupFn;
  }
}

export function DiscussionCard({ discussion, mentionedPersonLookup }: DiscussionCard.Props) {
  const className = classNames(
    "flex gap-4 items-center",
    "py-3 px-3",
    "last:border-b border-t border-stroke-base",
    "cursor-pointer hover:bg-surface-highlight",
  );

  return (
    <DivLink to={discussion.link} className={className}>
      <div className="flex gap-4 flex-1">
        <div className="shrink-0">
          <Avatar person={discussion.author} size="large" />
        </div>

        <div className="flex-1 h-full">
          <div className="font-semibold leading-none mb-1">{discussion.title}</div>
          <div className="break-words">
            <Summary content={discussion.content} characterCount={130} mentionedPersonLookup={mentionedPersonLookup} />
          </div>

          <div className="flex gap-1 mt-1 text-xs">
            <div className="text-sm text-content-dimmed">{discussion.author.fullName}</div>
            <div className="text-sm text-content-dimmed">·</div>
            <div className="text-sm text-content-dimmed">
              <FormattedTime time={discussion.date!} format="relative-weekday-or-date" />
            </div>
          </div>
        </div>
      </div>

      <CommentCountIndicator count={discussion.commentCount} size={28} />
    </DivLink>
  );
}
