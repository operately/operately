import React from "react";

import * as Icons from "@tabler/icons-react";
import * as ProjectQueries from "@/graphql/Projects";

import Avatar, { AvatarSize } from "@/components/Avatar";

const PossibleReactionTypes = ["thumbs_up", "thumbs_down", "heart", "rocket"];

export default function Reactions({ update, size }) {
  const [addReaction] = ProjectQueries.useReactMutation(update.id);

  return (
    <div className="flex items-start gap-2 flex-wrap">
      {update.reactions.map((reaction, index) => (
        <Reaction key={index} reaction={reaction} size={size} />
      ))}

      <AddReaction size={size} addReaction={addReaction} />
    </div>
  );
}

function Reaction({ reaction, size }) {
  return (
    <div className="flex items-center gap-1.5 transition-all bg-shade-2 rounded-lg p-1">
      <Avatar person={reaction.person} size={AvatarSize.Tiny} />
      <ReactionIcon size={size} type={reaction.reactionType} />
    </div>
  );
}

function AddReaction({ size, addReaction }) {
  const [active, setActive] = React.useState(false);

  const handleAddReaction = (type: string) => {
    setActive(false);
    addReaction(type);
  };

  return (
    <div className="rounded-lg bg-shade-2 p-1">
      <div className="flex items-center gap-3 transition-all">
        {active ? (
          <ReactionPallete size={size} handleAddReaction={handleAddReaction} />
        ) : (
          <AddReactionZeroState size={size} onClick={() => setActive(true)} />
        )}
      </div>
    </div>
  );
}

function AddReactionZeroState({ size, onClick }) {
  return (
    <div className="text-white-1 cursor-pointer" onClick={onClick}>
      <Icons.IconMoodPlus size={size} />
    </div>
  );
}

function ReactionPallete({ size, handleAddReaction }) {
  return (
    <div className="flex gap-2 items-center">
      {PossibleReactionTypes.map((type) => (
        <div
          key={type}
          className="hover:text-pink-400 cursor-pointer"
          onClick={() => handleAddReaction(type)}
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
      return <Icons.IconThumbUpFilled size={size} className="text-blue-500" />;
    case "heart":
      return <Icons.IconHeartFilled size={size} className="text-red-500" />;
    case "thumbs_down":
      return (
        <Icons.IconThumbDownFilled size={size} className="text-blue-500" />
      );
    case "rocket":
      return <Icons.IconRocket size={size} className="text-pink-400" />;
    default:
      return null;
  }
}
