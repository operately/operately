/*
 * Creates primitives for the communication flow in the application.
 * The supported primitives are:
 *
 * - messages
 * - comments
 * - acknowledgements
 * - reactions
 */

import React from "react";
import Avatar, { AvatarSize } from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import Icon from "@/components/Icon";
import RichContent from "@/components/RichContent";

function Container({ children }) {
  return <div className="bg-dark-2 pt-1">{children}</div>;
}

function AckBadge({ person }): JSX.Element {
  return (
    <div
      className="bg-success-2 border border-success-1 flex items-center"
      style={{
        gap: "4px",
        borderRadius: "20px",
      }}
    >
      <div className="ml-[12px] mr-[3px]">
        <svg
          width="18"
          height="19"
          viewBox="0 0 18 19"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.25 9.31836L9 13.0684L16.5 5.56836M1.5 9.31836L5.25 13.0684M9 9.31836L12.75 5.56836"
            stroke="#548B53"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      <div className="border border-success-1 rounded-full overflow-hidden -m-[1px]">
        <Avatar person={person} size={AvatarSize.Small} />
      </div>
    </div>
  );
}

function Header({ author, acknowledgingPerson, time }) {
  return (
    <div className="flex items-center justify-between m-[20px] pb-[19px] border-b border-shade-1">
      <div className="flex items-center gap-[10px]">
        <Avatar person={author} size={AvatarSize.Small} />
        <div className="flex items-center gap-[4px]">
          <div className="font-bold">{author.fullName}</div>
          <span className="">
            posted an update on{" "}
            <FormattedTime time={time} format="short-date" />
          </span>
        </div>
      </div>

      <div className="flex items-center gap-[10px]">
        {acknowledgingPerson && <AckBadge person={acknowledgingPerson} />}
        <Icon name="menu dots" size="base" />
      </div>
    </div>
  );
}

function Message({ children }) {
  return (
    <div className="px-[20px]">
      <div className="text-sm tracking-[0.3px] upercase mt-[20px]">
        PROGRESS
      </div>

      <div className="font-bold mt-[5px] mb-[6px]">
        What has the team accomplished since the last update?
      </div>

      <div className="leading-[24px]">{children}</div>
    </div>
  );
}

function groupReactionsByType(reactions) {
  return reactions.reduce((acc, reaction) => {
    if (!acc[reaction.reactionType]) {
      acc[reaction.reactionType] = [];
    }

    acc[reaction.reactionType].push(reaction);

    return acc;
  }, {});
}

function ReactionIcon({ reactionType }): JSX.Element {
  switch (reactionType) {
    case "thumbs_up":
      return <Icon name="like" size="base" />;
    case "celebration":
      return <Icon name="celebrate" size="base" />;
    case "heart":
      return <Icon name="heart" size="base" />;
    default:
      throw "Unknown reaction type " + reactionType;
  }
}

function Reactions({ reactions }) {
  const reactionsByType = groupReactionsByType(reactions);

  return (
    <>
      {Object.keys(reactionsByType).map((reactionType, index) => (
        <div className="flex items-center bg-light-2 rounded-[20px] pr-[4px] pl-[6px] gap-[4px]">
          <ReactionIcon reactionType={reactionType} />

          {reactionsByType[reactionType].map((reaction, index) => (
            <div
              className="border-[2px] border-light-2 rounded-full overflow-hidden flex items-center"
              style={{
                marginLeft: index === 0 ? "-2px" : "-12px",
                marginTop: index === 0 ? "0px" : "-2px",
                marginBottom: index === 0 ? "0px" : "-2px",
                marginRight: index === 0 ? "0px" : "-2px",
              }}
            >
              <Avatar
                key={index}
                person={reaction.person}
                size={AvatarSize.Tiny}
              />
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

function PostReactions({ reactions }) {
  return (
    <div className="mx-[20px] mt-[21px] flex gap-[3px] h-[32px]">
      <Reactions reactions={reactions} />
    </div>
  );
}

function CommentReactions({ reactions }) {
  return (
    <div className="ml-[40px] mr-[20px] mt-[8px] flex gap-[3px] h-[32px]">
      <Reactions reactions={reactions} />
    </div>
  );
}

function splitCommentsBeforeAndAfterAck(update) {
  const allComments = update.comments;
  const ackTime = update.acknowledgedAt;

  if (update.acknowledged) {
    return {
      beforeAck: allComments.filter((c) => c.insertedAt < ackTime),
      afterAck: allComments.filter((c) => c.insertedAt >= ackTime),
    };
  } else {
    return { beforeAck: update.comments, afterAck: [] };
  }
}

function Comments({ children }) {
  return (
    <div className="border-t border-shade-1 mx-[20px] mt-[20px] pb-[20px]  relative">
      <div className="relative z-20">{children}</div>

      <div className="absolute border-l border-shade-1 top-0 bottom-0 left-[14px]"></div>
    </div>
  );
}

function Comment({ author, time, children, reactions }) {
  return (
    <div className="my-[20px] mb-[0px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[11px]">
          <Avatar person={author} size={AvatarSize.Small} />

          <div className="flex items-center gap-[5px]">
            <div className="font-bold">{author.fullName}</div>
            <span className="">
              posted a comment <FormattedTime time={time} format="relative" />
            </span>
          </div>
        </div>
        <div>
          <Icon name="menu dots" size="base" />
        </div>
      </div>

      <div className="ml-[41px] mt-[8px]">{children}</div>

      <CommentReactions reactions={reactions} />
    </div>
  );
}

function LeaveComment({ currentUser }) {
  return (
    <div className="px-[20px] py-[16px] rounded-b-[10px] mb-[0px] border-t border-shade-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[11px]">
          <Avatar person={currentUser} size={AvatarSize.Small} />
          <span className="">Leave a comment</span>
        </div>
      </div>
    </div>
  );
}

function splitCommentsBeforeAndAfterAck(update) {
  const allComments = update.comments;
  const ackTime = update.acknowledgedAt;

  if (update.acknowledged) {
    return {
      beforeAck: allComments.filter((c) => c.insertedAt < ackTime),
      afterAck: allComments.filter((c) => c.insertedAt >= ackTime),
    };
  } else {
    return { beforeAck: update.comments, afterAck: [] };
  }
}

function Ack({ author, time }) {
  return (
    <div className="my-[20px] bg-success-2 p-[20px] -mx-[20px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[11px]">
          <Avatar person={author} size={AvatarSize.Small} />
          <span className="text-success-1 font-bold">
            {author.fullName} has acknowledged this update.
          </span>
        </div>
        <div className="flex items-center gap-[6px]">
          <span className="text-success-1">
            <FormattedTime time={time} format="relative" />
          </span>
          <IconAck />
        </div>
      </div>
    </div>
  );
}

function IconAck() {
  return (
    <svg
      width="30"
      height="31"
      viewBox="0 0 30 31"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.75 15.3184L15 21.5684L27.5 9.06836M2.5 15.3184L8.75 21.5684M15 15.3184L21.25 9.06836"
        stroke="#548B53"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}

function Post({ update, currentUser }): JSX.Element {
  const comments = splitCommentsBeforeAndAfterAck(update);

  return (
    <Container>
      <Header
        author={update.author}
        acknowledgingPerson={update.acknowledgingPerson}
        time={update.insertedAt}
      />

      <Message>
        <RichContent jsonContent={update.message} />
      </Message>

      <PostReactions reactions={update.reactions} />

      <Comments>
        {comments.beforeAck.map((c, i) => (
          <Comment
            key={i}
            author={c.author}
            time={c.insertedAt}
            reactions={c.reactions}
          >
            <RichContent jsonContent={c.message} />
          </Comment>
        ))}
        <Ack author={update.acknowledgingPerson} time={update.acknowledgedAt} />
        chat
        {comments.afterAck.map((c, i) => (
          <Comment
            key={i}
            author={c.author}
            time={c.insertedAt}
            reactions={c.reactions}
          >
            <RichContent jsonContent={c.message} />
          </Comment>
        ))}
      </Comments>

      <LeaveComment currentUser={currentUser} />
    </Container>
  );
}

export { Post };
