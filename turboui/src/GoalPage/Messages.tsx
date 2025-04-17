import { Avatar } from "../Avatar";
import { SecondaryButton } from "../Button";
import { Link } from "../Link";
import { truncate } from "../utils/strings";
import { GoalPage } from ".";
import { SectionHeader } from "./SectionHeader";

export function Messages(props: GoalPage.Props) {
  return (
    <div>
      <SectionHeader
        title="Messages"
        showButtons={props.canEdit && props.messages.length > 0}
        buttons={<SecondaryButton size="xxs">Write message</SecondaryButton>}
      />

      {props.messages.length === 0 ? <MessagesZeroState {...props} /> : <MessageList {...props} />}
    </div>
  );
}

function MessagesZeroState(props: GoalPage.Props) {
  return (
    <div className="mt-1">
      <div className="text-content-dimmed text-sm">
        {props.canEdit
          ? "Share announcements, decisions, and important information with your team."
          : "Announcements, decisions, and important information will be shared here."}
      </div>

      {props.canEdit && (
        <div className="mt-2">
          <SecondaryButton size="xs">Write message</SecondaryButton>
        </div>
      )}
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
