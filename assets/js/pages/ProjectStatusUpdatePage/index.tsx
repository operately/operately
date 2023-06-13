import React from "react";

import { useParams, Link } from "react-router-dom";
import FormattedTime from "@/components/FormattedTime";

import * as Icons from "tabler-icons-react";
import * as ProjectQueries from "@/graphql/Projects";
import { useMe } from "@/graphql/Me";
import RichContent from "@/components/RichContent";
import Avatar, { AvatarSize } from "@/components/Avatar";

export function ProjectStatusUpdatePage() {
  const params = useParams();

  const projectId = params.project_id;
  const id = params.id || "";

  const meData = useMe();
  const updateData = ProjectQueries.useProjectStatusUpdate(id);

  if (meData.loading || updateData.loading)
    return <p className="mt-32">Loading...</p>;

  if (meData.error || updateData.error)
    return (
      <p className="mt-32">
        Error : {meData.error?.message} {updateData.error?.message}
      </p>
    );

  const update = updateData.data.update;
  const me = meData.data.me;

  return (
    <div className="mt-24">
      <div className="flex justify-between items-center mb-4 mx-auto max-w-4xl">
        <BackToProject linkTo={`/projects/${projectId}`} />
      </div>

      <div className="mx-auto max-w-4xl relative bg-dark-2 rounded-[20px]">
        <AckBanner
          me={me}
          owner={update.project.owner}
          update={update}
          reviewer={update.project.reviewer}
        />

        <div className="px-16 pb-16 pt-8 fadeIn">
          <Header update={update} />

          <div className="my-4 mb-8 text-lg">
            <RichContent jsonContent={update.message} />
          </div>

          <Reactions update={update} />
          <Comments update={update} />
        </div>
      </div>
    </div>
  );
}

function AckButton({ update }) {
  const [ack, status] = ProjectQueries.useAckMutation(update.id);

  return (
    <button
      className="text-yellow-400 font-bold uppercase border border-yellow-400 rounded-full hover:bg-yellow-400/10 px-3 py-1.5 text-sm flex items-center gap-2"
      onClick={() => ack()}
    >
      <Icons.Check size={20} />
      Acknowledge
    </button>
  );
}

function AckBanner({ me, reviewer, update, owner }) {
  if (update.acknowledged) return null;

  if (me.id === reviewer.id) {
    return (
      <div className="py-4 px-8 bg-shade-1 rounded-t-[20px] font-semibold text-yellow-400 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icons.Clock size={20} />
          {owner.fullName} is waiting for you to acknowledge this update
        </div>
        <AckButton update={update} />
      </div>
    );
  } else {
    return (
      <div className="py-4 px-8 bg-shade-1 rounded-t-[20px] font-semibold text-yellow-400 flex items-center justify-center gap-2">
        <Icons.Clock size={20} />
        Waiting for {reviewer.fullName} to acknowledge this update
      </div>
    );
  }
}

function BackToProject({ linkTo }) {
  return (
    <Link
      to={linkTo}
      className="text-pink-400 font-bold uppercase border border-pink-400 rounded-full hover:bg-pink-400/10 px-3 py-1.5 text-sm flex items-center gap-2 mt-4"
    >
      <Icons.ArrowLeft size={20} />
      Back To Project
    </Link>
  );
}

function Header({ update }) {
  return (
    <div>
      <div className="flex items-center mb-4 mt-2">
        <div className="flex items-center gap-2 py-4">
          <Avatar person={update.author} size={AvatarSize.Small} />
          <div className="font-bold">{update.author.fullName}</div>
          <div>
            <span>posted an update on</span>{" "}
            <FormattedTime time={update.insertedAt} format="short-date" />
          </div>
        </div>
      </div>

      <div className="text-3xl font-bold">Status Update</div>
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

function Reactions({ update }) {
  const [active, setActive] = React.useState(false);
  const [addReaction] = ProjectQueries.useReactMutation(update.id);

  const handleAddReaction = (type: string) => {
    setActive(false);
    addReaction(type);
  };

  const reactionsByType = groupReactionsByType(update.reactions);

  return (
    <div className="flex gap-2">
      <div className="rounded-[30px] bg-shade-1 p-2">
        <div className="flex items-center gap-3 transition-all">
          {!active && (
            <div
              className="text-white-1 cursor-pointer"
              onClick={() => setActive(true)}
            >
              <Icons.ThumbUp size={24} />
            </div>
          )}

          {active && (
            <>
              <div
                key="thumbs_up"
                className="hover:text-pink-400 cursor-pointer"
                onClick={() => handleAddReaction("thumbs_up")}
              >
                <Icons.ThumbUp size={24} />
              </div>
              <div
                key="heart"
                className="hover:text-pink-400 cursor-pointer"
                onClick={() => handleAddReaction("heart")}
              >
                <Icons.Heart size={24} />
              </div>
              <div
                key="thumbs_down"
                className="hover:text-pink-400 cursor-pointer"
                onClick={() => handleAddReaction("thumbs_down")}
              >
                <Icons.ThumbDown size={24} />
              </div>
              <div
                key="rocket"
                className="hover:text-pink-400 cursor-pointer"
                onClick={() => handleAddReaction("rocket")}
              >
                <Icons.Rocket size={24} />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {Object.keys(reactionsByType).map((reactionType) => (
          <div
            className="rounded-full bg-shade-1 p-2 flex items-center"
            key={reactionType}
          >
            <div className="flex items-center gap-2 mr-2">
              {reactionType === "thumbs_up" && <Icons.ThumbUp size={24} />}
              {reactionType === "heart" && <Icons.Heart size={24} />}
              {reactionType === "thumbs_down" && <Icons.ThumbDown size={24} />}
              {reactionType === "rocket" && <Icons.Rocket size={24} />}
            </div>

            <div className="flex gap-1 items-center">
              {reactionsByType[reactionType].map((reaction, index) => (
                <Avatar
                  key={index}
                  person={reaction.person}
                  size={AvatarSize.Tiny}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Comments({ update }) {
  const { data } = useMe();

  return (
    <div className="mt-8 flex flex-col gap-2">
      {update.acknowledged && <AckComment update={update} />}
      <AddComment me={data.me} />
    </div>
  );
}

function AckComment({ update }) {
  return (
    <div className="flex items-center justify-between p-4 bg-shade-1 font-medium text-green-400 rounded-lg">
      <div className="flex items-center gap-2">
        <Avatar person={update.acknowledgingPerson} size={AvatarSize.Normal} />
        <span>
          {update.acknowledgingPerson.fullName} has acknowledged this update
        </span>
      </div>
      <FormattedTime time={update.acknowledgedAt} format="short-date" />
    </div>
  );
}

function AddComment({ me }) {
  return (
    <div className="flex items-center gap-2 p-4 bg-shade-1 text-white-2 rounded-lg">
      <Avatar person={me} size={AvatarSize.Normal} />

      <div className="text-white-2">Leave a comment&hellip;</div>
    </div>
  );
}
