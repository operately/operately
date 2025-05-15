import React from "react";
import { Avatar } from "../Avatar";
import { SecondaryButton } from "../Button";
import { Link } from "../Link";
import { truncate } from "../utils/strings";
import { GoalPage } from ".";
import { SectionHeader } from "./SectionHeader";

export function Messages(props: GoalPage.Props) {
  if (props.messages.length === 0 && !props.canEdit) return null;

  return (
    <div>
      <SectionHeader
        title="Messages"
        showButtons={props.canEdit}
        buttons={<SecondaryButton size="xxs">Write message</SecondaryButton>}
      />

      {props.messages.length === 0 ? <MessagesZeroState /> : <MessageList {...props} />}
    </div>
  );
}

function MessagesZeroState() {
  return (
    <div className="mt-1">
      <div className="text-content-dimmed text-sm">
        Share announcements, decisions, and important information with your team.
      </div>
    </div>
  );
}

function MessageList(props: GoalPage.Props) {
  return (
    <div className="space-y-4 mt-4">
      {props.messages.map((message) => (
        <div key={message.id} className="flex flex-row items-start gap-3">
          <Avatar person={message.author} size={36} />
          <div className="flex-1">
            <div className="text-sm -mt-px">
              <Link to={message.link} className="hover:underline font-semibold">
                {message.title}
              </Link>
              {" — "}
              {truncate(message.content, 150)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
