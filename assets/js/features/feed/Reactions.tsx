import React from "react";

import { useBoolState } from "@/utils/useBoolState";

import Avatar, { AvatarSize } from "@/components/Avatar";
import * as Icons from "@tabler/icons-react";

import * as Updates from "@/graphql/Projects/updates";

const PossibleReactionTypes = ["thumbs_up", "thumbs_down", "heart", "rocket"];

interface ReactionsProps {
  reactions: Updates.Reaction[];
  size: number;
  form: any;
}

export function Reactions({ reactions, form, size }: ReactionsProps): JSX.Element {
  return (
    <div className="flex items-start gap-2 flex-wrap">
      {reactions.map((reaction, index) => (
        <Reaction key={index} reaction={reaction} size={size} />
      ))}

      <AddReaction size={size} form={form} />
    </div>
  );
}

function Reaction({ reaction, size }) {
  const testId = `reaction-${reaction.reactionType}`;
  return (
    <div
      className="flex items-center gap-1.5 transition-all bg-surface-accent rounded-full p-1 pr-1.5"
      data-test-id={testId}
    >
      <Avatar person={reaction.person} size={AvatarSize.Tiny} />
      <ReactionIcon size={size} type={reaction.reactionType} />
    </div>
  );
}

function AddReaction({ size, form }) {
  const [active, _, activate, deactivate] = useBoolState(false);

  const handleAddReaction = (type: string) => {
    deactivate();
    form.submit(type);
  };

  return (
    <div className="rounded-full bg-surface-dimmed p-1 hover:scale-105" data-test-id="reactions-button">
      <div className="flex items-center gap-3 transition-all">
        {active ? (
          <ReactionPallete size={size} handleAddReaction={handleAddReaction} />
        ) : (
          <AddReactionZeroState size={size} onClick={activate} />
        )}
      </div>
    </div>
  );
}

function AddReactionZeroState({ size, onClick }) {
  return (
    <div className="text-content-accent cursor-pointer" onClick={onClick}>
      <Icons.IconMoodPlus size={size} />
    </div>
  );
}

function ReactionPallete({ size, handleAddReaction }) {
  return (
    <div className="flex gap-2 items-center px-1">
      {PossibleReactionTypes.map((type) => (
        <div
          key={type}
          className="hover:text-pink-400 cursor-pointer"
          onClick={() => handleAddReaction(type)}
          data-test-id={`reaction-${type}-button`}
        >
          <ReactionIcon size={size} type={type} />
        </div>
      ))}
    </div>
  );
}

function ReactionIcon({ size, type }) {
  switch (type) {
    case "thumbs_up":
      return <Icons.IconThumbUpFilled size={size} className="text-yellow-500" />;
    case "heart":
      return <Icons.IconHeartFilled size={size} className="text-red-500" />;
    case "thumbs_down":
      return <Icons.IconThumbDownFilled size={size} className="text-yellow-500" />;
    case "rocket":
      return <Icons.IconRocket size={size} className="text-green-500" />;
    default:
      return null;
  }
}
