import React from "react";

import FormattedTime from "@/components/FormattedTime";

import * as Icons from "@tabler/icons-react";

import Avatar, { AvatarSize } from "@/components/Avatar";
import Button from "@/components/Button";
import * as TipTapEditor from "@/components/Editor";
import * as Paper from "@/components/PaperContainer";
import RichContent from "@/components/RichContent";
import { useMe } from "@/graphql/Me";

import { usePostCommentMutation } from "@/graphql/Projects";

import Reactions from "./Reactions";

import * as Me from "@/graphql/Me";
import * as Projects from "@/graphql/Projects";
import * as Updates from "@/graphql/Projects/updates";
import client from "@/graphql/client";

interface LoaderData {
  update: any;
  me: any;
}

export async function loader({ params }): Promise<LoaderData> {
  let updateData = await client.query({
    query: Updates.GET_STATUS_UPDATE,
    variables: { id: params.id },
    fetchPolicy: "network-only",
  });

  let meData = await client.query({
    query: Me.GET_ME,
  });

  return {
    update: updateData.data.update,
    me: meData.data.me,
  };
}

export function Page() {
  const [{ update, me }, refetch] = Paper.useLoadedData() as [LoaderData, () => void];

  const addReactionMutation = Projects.useReactMutation("update", update.id);

  return (
    <Paper.Root>
      <Navigation project={update.project} />

      <Paper.Body>
        <AckBanner me={me} update={update} champion={update.project.champion} reviewer={update.project.reviewer} />

        <div className="fadeIn">
          <Header update={update} />

          <div className="my-4 mb-8 text-lg">
            <RichContent jsonContent={update.message} />
          </div>

          <Reactions
            addReactionMutation={addReactionMutation}
            size={20}
            reactions={update.reactions}
            onNewReaction={() => refetch()}
          />

          <Comments update={update} onNewReaction={() => refetch()} />
        </div>
      </Paper.Body>
    </Paper.Root>
  );
}

function Navigation({ project }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={`/projects/${project.id}`}>
        <Icons.IconClipboardList size={16} />
        {project.name}
      </Paper.NavItem>

      <Paper.NavSeparator />

      <Paper.NavItem linkTo={`/projects/${project.id}/updates`}> Message Board</Paper.NavItem>
    </Paper.Navigation>
  );
}

function AckButton({ update }) {
  const [ack, _status] = Projects.useAckMutation(update.id);

  return (
    <Button variant="attention" onClick={() => ack()}>
      <Icons.IconCheck size={20} />
      Acknowledge
    </Button>
  );
}

function AckBanner({ me, reviewer, update, champion }) {
  if (update.acknowledged) return null;
  if (!reviewer) return null;

  let content = <></>;

  if (me.id === reviewer.id) {
    content = (
      <>
        <div className="flex items-center gap-2">
          <Icons.IconClock size={20} />
          {champion.fullName} is waiting for you to acknowledge this update
        </div>
        <AckButton update={update} />
      </>
    );
  } else {
    content = (
      <>
        <Icons.IconClock size={20} />
        Waiting for {reviewer.fullName} to acknowledge this update
      </>
    );
  }

  return (
    <div className="-mx-12 -mt-10 py-4 px-8 bg-shade-1 rounded-t font-semibold text-yellow-400 flex items-center justify-center gap-2">
      {content}
    </div>
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
            <span>posted an update on</span> <FormattedTime time={update.insertedAt} format="short-date" />
          </div>
        </div>
      </div>

      <div className="text-3xl font-bold">Status Update</div>
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

function Comments({ update, onNewReaction }) {
  const { data } = useMe();
  const { beforeAck, afterAck } = splitCommentsBeforeAndAfterAck(update);

  return (
    <div className="mt-8 flex flex-col">
      {beforeAck.map((c) => (
        <Comment key={c.id} comment={c} onNewReaction={onNewReaction} />
      ))}

      {update.acknowledged && <AckComment update={update} />}

      {afterAck.map((c) => (
        <Comment key={c.id} comment={c} onNewReaction={onNewReaction} />
      ))}

      <AddComment me={data.me} update={update} />
    </div>
  );
}

function Comment({ comment, onNewReaction }) {
  const addReactionMutation = Projects.useReactMutation("comment", comment.id);

  return (
    <div className="flex items-start justify-between gap-3 py-4 border-t border-shade-2 text-white-1">
      <div className="shrink-0">
        <Avatar person={comment.author} size={AvatarSize.Normal} />
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="font-bold">{comment.author.fullName}</div>
          <FormattedTime time={comment.insertedAt} format="short-date" />
        </div>

        <RichContent jsonContent={JSON.parse(comment.message)} />

        <div className="mt-2">
          <Reactions
            reactions={comment.reactions}
            size={20}
            addReactionMutation={addReactionMutation}
            onNewReaction={onNewReaction}
          />
        </div>
      </div>
    </div>
  );
}

function AckComment({ update }) {
  console.log(update);
  return (
    <div className="flex items-center justify-between py-4 border-t border-shade-2 font-bold relative">
      <div className="flex items-center gap-3">
        <Avatar person={update.acknowledgingPerson} size={AvatarSize.Normal} />
        <span>{update.acknowledgingPerson.fullName} has acknowledged this update</span>
        <Icons.IconCircleCheckFilled size={24} className="text-green-400" />
      </div>
      <FormattedTime time={update.acknowledgedAt} format="short-date" />
    </div>
  );
}

function AddComment({ me, update }) {
  const [active, setActive] = React.useState(false);

  const activate = () => setActive(true);
  const deactivate = () => setActive(false);

  if (active) {
    return <AddCommentActive onBlur={deactivate} onPost={deactivate} update={update} />;
  } else {
    return <AddCommentNonActive me={me} onClick={activate} />;
  }
}

function AddCommentNonActive({ me, onClick }) {
  return (
    <div className="flex items-center gap-3 py-4 border-t border-shade-2 text-white-2 cursor-pointer" onClick={onClick}>
      <Avatar person={me} size={AvatarSize.Normal} />

      <div className="text-white-2">Leave a comment&hellip;</div>
    </div>
  );
}

function AddCommentActive({ update, onBlur, onPost }) {
  const editor = TipTapEditor.useEditor({
    placeholder: "Write your comment here...",
  });

  const [postComment, { loading }] = usePostCommentMutation(update.id);

  const handlePost = async () => {
    if (!editor) return;
    if (loading) return;

    await postComment(editor.getJSON());

    onPost();
  };

  return (
    <div>
      <div className="bg-shade-1 text-white-1 rounded-lg">
        <div className="flex items-center gap-1 border-b border-shade-2 px-4 py-1">
          <TipTapEditor.Toolbar editor={editor} />
        </div>

        <div
          className="mb-4 py-2 text-white-1 px-4"
          style={{
            minHeight: "200px",
          }}
        >
          <TipTapEditor.EditorContent editor={editor} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <PostButton onClick={handlePost} />
        <CancelButton onClick={onBlur} />
      </div>
    </div>
  );
}

function PostButton({ onClick }) {
  return (
    <Button onClick={onClick} variant="success">
      <Icons.IconMail size={20} />
      Post Comment
    </Button>
  );
}

function CancelButton({ onClick }) {
  return (
    <Button variant="secondary" onClick={onClick}>
      Cancel
    </Button>
  );
}
