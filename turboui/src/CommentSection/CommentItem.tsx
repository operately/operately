import React from "react";
import { Avatar } from "../Avatar";
import { shortName } from "../Avatar/AvatarWithName";
import { Menu, MenuActionItem } from "../Menu";
import { BlackLink } from "../Link";
import FormattedTime from "../FormattedTime";
import RichContent from "../RichContent";
import * as Icons from "@tabler/icons-react";
import { CommentItemProps } from "./types";

export function CommentItem({
  comment,
  onEdit,
  canComment,
  currentUserId,
}: CommentItemProps & { currentUserId?: string }) {
  const content = JSON.parse(comment.content)["message"];
  const isOwnComment = currentUserId === comment.author.id;

  return (
    <div
      className="flex items-start gap-3 py-4 not-first:border-t border-stroke-base text-content-accent relative bg-surface-dimmed rounded-lg px-4 my-2"
      id={comment.id}
    >
      <div className="shrink-0">
        <Avatar person={comment.author} size="normal" />
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="font-bold -mt-0.5">
            {comment.author.profileLink ? (
              <BlackLink to={comment.author.profileLink} underline="hover">
                {shortName(comment.author.fullName)}
              </BlackLink>
            ) : (
              shortName(comment.author.fullName)
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-content-dimmed text-sm">
              <FormattedTime time={comment.insertedAt} format="relative" />
            </span>

            {isOwnComment && onEdit && (
              <Menu size="small">
                <MenuActionItem onClick={onEdit} icon={Icons.IconEdit}>
                  Edit
                </MenuActionItem>
              </Menu>
            )}
          </div>
        </div>

        <div className="mb-2">
          <RichContent
            content={content}
            mentionedPersonLookup={async () => ({
              id: "",
              fullName: "",
              avatarUrl: null,
              title: "",
              profileLink: "",
            })}
          />
        </div>

        {canComment && <ReactionList reactions={comment.reactions} />}
      </div>
    </div>
  );
}

function ReactionList({ reactions }: { reactions: any[] }) {
  // This should integrate with the actual reaction system
  return <div>Reactions: {reactions.length}</div>;
}
